"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { contact, hero } from "@content/site";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";
import { introDone } from "@/lib/intro";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const CROSSFADE_MS = 6500;

type Mode = "video" | "stills";

/**
 * The opening scene: a muted, looping aerial with the wordmark set oversized
 * over it.
 *
 * Performance contract — the poster photograph is a `next/image` with
 * `priority`, so it is the LCP element and paints immediately. The <video> is
 * mounted underneath at opacity 0 and only fades in once it fires `canplay`.
 * If the video never loads, or the visitor is on reduced motion, Save-Data or a
 * small screen, the hero falls back to a slow cross-fade of three stills and no
 * video bytes are requested at all.
 *
 * Phase 6 §5: the entrance is a single GSAP timeline that waits on the intro
 * gate, so the headline lifts as the preloader clears rather than behind it.
 * Parallax is a scrubbed ScrollTrigger sharing Lenis's clock.
 */
export function Hero() {
  const [mode, setMode] = useState<Mode>("stills");
  const [videoReady, setVideoReady] = useState(false);
  const [still, setStill] = useState(0);
  /** Highest still index reached; -1 means none have been shown yet. */
  const [maxStill, setMaxStill] = useState(-1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const root = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const stillLayers = useRef<(HTMLDivElement | null)[]>([]);

  /* Decide once, on the client, whether this visitor gets the film. */
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData) return;

    // Below 768px the video is mostly cropped away and costs more than it gives.
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    setMode("video");
  }, []);

  /* Cross-fade the stills whenever the film is not playing. */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (mode === "video" && videoReady) return;

    const id = setInterval(() => setStill((i) => (i + 1) % hero.images.length), CROSSFADE_MS);
    return () => clearInterval(id);
  }, [mode, videoReady]);

  /* Mount the layer we are about to show, then fade it up on the next pass. */
  useEffect(() => {
    setMaxStill((m) => (still > m ? still : m));
  }, [still]);

  /* Fade the active still layer up. Earlier layers stay opaque underneath —
     they are fully covered, and fading them out would show the poster through
     the gap mid-transition. */
  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    stillLayers.current.forEach((el, i) => {
      if (!el || i > maxStill) return;
      gsap.to(el, { opacity: i <= still ? 1 : 0, duration: 1.8, ease: "power1.inOut" });
    });
  }, [still, maxStill]);

  /* Some browsers reject autoplay even when muted; treat that as a failure. */
  useEffect(() => {
    if (mode !== "video") return;
    const video = videoRef.current;
    if (!video) return;

    const play = video.play();
    if (play) play.catch(() => setMode("stills"));
  }, [mode]);

  /* Entrance, once the intro gate opens. */
  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;

    let ctx: gsap.Context | undefined;
    let cancelled = false;

    /* Hold the entrance state immediately so nothing flashes in unanimated. */
    const held = gsap.context(() => {
      gsap.set("[data-hero-line]", { yPercent: 112 });
      gsap.set("[data-hero-fade]", { opacity: 0, y: 14 });
      gsap.set("[data-hero-cue]", { opacity: 0 });
    }, el);

    void introDone.then(() => {
      if (cancelled) return;
      held.revert();
      ctx = gsap.context(() => {
        const tl = gsap.timeline();
        tl.from("[data-hero-line]", {
          yPercent: 112,
          duration: 1.3,
          ease: EASE,
          stagger: 0.2,
        })
          .from("[data-hero-fade]", { opacity: 0, y: 14, duration: 1, ease: EASE, stagger: 0.15 }, 0.5)
          .from("[data-hero-cue]", { opacity: 0, duration: 1.2 }, 1.1);
      }, el);
    });

    return () => {
      cancelled = true;
      held.revert();
      ctx?.revert();
    };
  }, []);

  /* Parallax: media drifts down, copy lifts and fades as the page leaves. */
  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const scrub = {
        trigger: el,
        start: "top top",
        end: "bottom top",
        scrub: true,
      } as const;

      gsap.to(media.current, { y: 120, ease: "none", scrollTrigger: scrub });
      gsap.to(copy.current, { y: -70, opacity: 0, ease: "none", scrollTrigger: scrub });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative h-[100svh] min-h-[36rem] w-full overflow-hidden bg-ink"
    >
      <div ref={media} className="absolute inset-0">
        {/* LCP: the poster photograph, painted immediately. */}
        <Image
          src={hero.video.poster}
          alt={hero.video.posterAlt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={75}
          className="grade object-cover"
        />

        {/*
          Stills cross-fade — the fallback, and what shows before the film is
          ready.

          Only layers that have actually been reached are mounted. Rendering all
          three up front cost three extra full-bleed downloads on first paint,
          on exactly the devices that fall back to stills because they cannot
          afford the film — mobile LCP went to ~20s. `maxStill` starts at -1, so
          the first paint is the priority poster and nothing else.
        */}
        {!(mode === "video" && videoReady) &&
          hero.images.map((image, i) =>
            i > maxStill ? null : (
              <div
                key={image.src}
                ref={(el) => {
                  stillLayers.current[i] = el;
                }}
                className="absolute inset-0 opacity-0"
                aria-hidden
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="100vw"
                  quality={75}
                  loading="lazy"
                  className="grade ken object-cover"
                />
              </div>
            ),
          )}

        {/* The film. */}
        {mode === "video" && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
            tabIndex={-1}
            onCanPlay={() => setVideoReady(true)}
            /*
             * Only give up when the browser has genuinely exhausted every
             * source. A per-source failure also bubbles here, and treating that
             * as fatal is what sent Safari to the stills fallback: WebKit tried
             * the WebM, failed on the codec, and this handler unmounted the
             * whole element before it ever reached the MP4.
             */
            onError={(e) => {
              const el = e.currentTarget;
              if (el.networkState === el.NETWORK_NO_SOURCE) setMode("stills");
            }}
            className={`grade absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
          >
            {/*
              MP4 first. H.264 plays everywhere, and for this clip it is also
              the SMALLER file (2.92 MB against 4.35 MB), so putting the WebM
              first cost compatibility and bytes at the same time.
            */}
            <source src={hero.video.mp4} type="video/mp4" />
            <source src={hero.video.webm} type="video/webm" />
          </video>
        )}
      </div>

      {/* Scrim — gradient, never a box. */}
      <div aria-hidden className="scrim-full absolute inset-0" />

      {/* Copy */}
      <div ref={copy} className="relative flex h-full flex-col justify-end pb-20 lg:pb-24">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <p data-hero-fade className="eyebrow text-bone/75">
            {hero.eyebrow}
          </p>

          <h1 className="mt-8 text-bone">
            <span className="block overflow-hidden">
              <span
                data-hero-line
                className="block font-display text-hero font-light uppercase leading-[0.9] tracking-[-0.03em]"
              >
                {hero.heading}
              </span>
            </span>
            <span className="mt-4 block overflow-hidden lg:mt-6">
              <span
                data-hero-line
                className="block font-display text-[clamp(1.5rem,3.4vw,3rem)] font-light italic leading-[1.05] text-bone/85"
              >
                {hero.tagline}
              </span>
            </span>
          </h1>

          <div data-hero-fade className="mt-14 flex items-end justify-between gap-8">
            <p className="max-w-sm text-[0.95rem] leading-relaxed text-bone/80">{hero.subtitle}</p>

            {/* Two persistent CTAs: Enquire primary, Wedding Brochure secondary. */}
            <div className="hidden shrink-0 items-center gap-8 pb-1 sm:flex">
              <Link
                href={hero.cta.href}
                data-magnetic
                className="group flex items-center gap-4 text-bone"
              >
                <span className="eyebrow">{hero.cta.label}</span>
                <span className="relative block h-px w-14 bg-bone/45 sm:w-20">
                  <span className="absolute inset-0 origin-left scale-x-0 bg-bone transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
                </span>
              </Link>

              <a
                href={contact.brochure.href}
                target="_blank"
                rel="noopener noreferrer"
                className="eyebrow text-bone/60 transition-colors duration-[450ms] hover:text-bone"
              >
                {contact.brochure.label}
              </a>
            </div>
          </div>
        </div>
      </div>

      <ScrollCue />
    </section>
  );
}

function ScrollCue() {
  const tick = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = tick.current;
    if (!el || prefersReducedMotion()) return;

    const tween = gsap.fromTo(
      el,
      { yPercent: -100 },
      { yPercent: 380, duration: 2.6, repeat: -1, ease: "power3.inOut" },
    );
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div
      data-hero-cue
      className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 lg:block"
      aria-hidden
    >
      <span className="relative block h-14 w-px overflow-hidden bg-bone/25">
        <span ref={tick} className="absolute inset-x-0 top-0 block h-5 bg-bone/80" />
      </span>
    </div>
  );
}
