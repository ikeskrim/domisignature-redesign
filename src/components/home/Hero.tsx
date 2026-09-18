"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { contact, hero } from "@content/site";
import { Chapter } from "@/components/layout/Chapter";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";
import { booted, introDone, introWillShow } from "@/lib/intro";
import { isDropped } from "@/lib/motion-tier";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const CROSSFADE_MS = 6500;

/* The sheets that cover a page: the preloader on a hard load, the page
   curtain on a client navigation. */
const SHEETS = ["[data-preloader]", "[data-curtain]"] as const;

/**
 * True when an opaque sheet lies over every part of `el` that is on screen.
 * Style is read first, so a sheet at rest (transparent, or hidden) costs no
 * layout.
 */
function coveredBySheet(el: Element): boolean {
  for (const selector of SHEETS) {
    const sheet = document.querySelector(selector);
    if (!sheet) continue;
    const style = getComputedStyle(sheet);
    if (style.visibility === "hidden" || Number(style.opacity) < 0.99) continue;

    const box = el.getBoundingClientRect();
    const top = Math.max(box.top, 0);
    const bottom = Math.min(box.bottom, window.innerHeight);
    const left = Math.max(box.left, 0);
    const right = Math.min(box.right, window.innerWidth);
    /* Off screen, nothing of it can flash; leave it as painted. */
    if (bottom <= top || right <= left) return false;

    const s = sheet.getBoundingClientRect();
    if (s.top <= top + 1 && s.bottom >= bottom - 1 && s.left <= left + 1 && s.right >= right - 1) return true;
  }
  return false;
}

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
 *
 * Stage 6: the entrance is held only while something covers the hero — the
 * preloader's sheet on this hard load, or the page curtain on a client
 * navigation — and only once that sheet is actually on screen. Otherwise the
 * server-painted headline is already correct and is left exactly as painted:
 * hiding it to replay it would be a flash on the first screen. The parallax
 * is the owner's second drop, so a phone that drops it gets the hero at rest;
 * a focused CTA inside the scrubbed copy is shown at full ink; the stills
 * pause while the hero is off-screen, and the scroll cue runs at `lg` only,
 * where it is shown.
 */
export function Hero() {
  const [mode, setMode] = useState<Mode>("stills");
  const [videoReady, setVideoReady] = useState(false);
  const [still, setStill] = useState(0);
  /** Highest still index reached; -1 means none have been shown yet. */
  const [maxStill, setMaxStill] = useState(-1);
  const videoRef = useRef<HTMLVideoElement>(null);
  /** The media layer. Its parent is the chapter element the scoped effects bind to. */
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

  /* Cross-fade the stills whenever the film is not playing — and only while
     the hero is on screen. Off-screen the interval stops, so no layer mounts
     and no photograph downloads behind the reader; it starts again, from a
     full interval, when the hero returns. */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (mode === "video" && videoReady) return;

    let id: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (id === undefined) id = setInterval(() => setStill((i) => (i + 1) % hero.images.length), CROSSFADE_MS);
    };
    const stop = () => {
      if (id !== undefined) clearInterval(id);
      id = undefined;
    };

    const el = media.current?.parentElement;
    if (!el || typeof IntersectionObserver === "undefined") {
      start();
      return stop;
    }

    /* The observer reports the current state on observe, so an on-screen hero
       starts at once. A batch can carry several records for this one target,
       oldest first; only the last is the hero's state now. */
    const io = new IntersectionObserver((entries) =>
      entries[entries.length - 1]?.isIntersecting ? start() : stop(),
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
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
    const ctx = gsap.context(() => {
      stillLayers.current.forEach((el, i) => {
        if (!el || i > maxStill) return;
        gsap.to(el, { opacity: i <= still ? 1 : 0, duration: 1.8, ease: "power1.inOut" });
      });
    });
    /* Killed, not reverted: each pass hands its opacities on to the next, and a
       revert would drop every layer back to transparent between passes. A pass
       has finished long before the next still (1.8s against 6.5s); on unmount
       the layers go with it. */
    return () => ctx.kill();
  }, [still, maxStill]);

  /* Some browsers reject autoplay even when muted; treat that as a failure. */
  useEffect(() => {
    if (mode !== "video") return;
    const video = videoRef.current;
    if (!video) return;

    const play = video.play();
    if (play) play.catch(() => setMode("stills"));
  }, [mode]);

  /* Entrance, once the intro gate opens — and only while something covers the
     hero until then. */
  useIsomorphicLayoutEffect(() => {
    const el = media.current?.parentElement;
    if (!el || prefersReducedMotion()) return;

    /*
     * Nothing can cover this page: no preloader on this hard load, and no page
     * curtain, because this is the hard load (`booted()` is false until the
     * first commit's passive effects). The server painted the headline in its
     * final place; leave it there — no hide, no replay.
     */
    if (!introWillShow() && !booted()) return;

    let held: gsap.Context | undefined;
    let ctx: gsap.Context | undefined;
    let tl: gsap.core.Timeline | undefined;
    let gateOpen = false;
    let cancelled = false;

    const hold = () => {
      held = gsap.context(() => {
        gsap.set("[data-hero-line]", { yPercent: 112 });
        gsap.set("[data-hero-fade]", { opacity: 0, y: 14 });
        gsap.set("[data-hero-cue]", { opacity: 0 });
      }, el);
    };

    const play = () => {
      held?.revert();
      held = undefined;
      ctx = gsap.context(() => {
        tl = gsap.timeline();
        tl.from("[data-hero-line]", {
          yPercent: 112,
          duration: 1.3,
          ease: EASE,
          stagger: 0.2,
        })
          .from("[data-hero-fade]", { opacity: 0, y: 14, duration: 1, ease: EASE, stagger: 0.15 }, 0.5)
          .from("[data-hero-cue]", { opacity: 0, duration: 1.2 }, 1.1);
      }, el);
    };

    /*
     * A preloader or a curtain may still not come: the preloader's sheet
     * commits a render after hydration, and the curtain sits out a keyboard or
     * a venue navigation. So the hold waits for the sheet itself, read on each
     * GSAP tick. The root timeline renders first in a tick, so a curtain set in
     * this same commit is already drawn when this runs, and a tick lands before
     * the frame paints: the headline is held under a sheet that is on screen,
     * never on a bare page. If the gate opens while nothing covers the hero,
     * the watch ends and the headline stays as painted.
     */
    const watch = () => {
      if (coveredBySheet(el)) {
        gsap.ticker.remove(watch);
        if (gateOpen) play();
        else hold();
      } else if (gateOpen) {
        gsap.ticker.remove(watch);
      }
    };

    /*
     * A focus arriving inside the hero finishes the entrance, the rule
     * `finishOnFocus` sets, extended to the hold: before the gate opens it
     * releases the held state (or ends the watch) and the entrance never
     * plays; once it is playing it jumps to the end. A CTA is never focused
     * while transparent or below its line.
     */
    const finish = () => {
      if (tl) {
        if (tl.progress() < 1) tl.progress(1);
        return;
      }
      cancelled = true;
      gsap.ticker.remove(watch);
      held?.revert();
      held = undefined;
    };
    el.addEventListener("focusin", finish);

    void introDone.then(() => {
      gateOpen = true;
      if (held && !cancelled) play();
    });

    gsap.ticker.add(watch);

    return () => {
      cancelled = true;
      gsap.ticker.remove(watch);
      el.removeEventListener("focusin", finish);
      held?.revert();
      held = undefined;
      ctx?.revert();
    };
  }, []);

  /* Parallax: media drifts down, copy lifts and fades as the page leaves. A
     phone that drops parallax (src/lib/motion-tier.ts) keeps the hero at rest:
     no drift, no lift, no fade. */
  useIsomorphicLayoutEffect(() => {
    const el = media.current?.parentElement;
    if (!el || prefersReducedMotion() || isDropped("parallax")) return;

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

  /*
   * A designated dark chapter, and the page opener. <Chapter> is the section
   * element: it sets the ground, so every role below resolves to the night
   * ladder, and it draws the one defined boundary. No entry mask, because
   * there is nothing to arrive from; the exit mask is on, so the bottom edge
   * narrows back into the margins before the arrival's ivory resumes rather
   * than meeting it as a hard edge.
   *
   * Chapter owns its element and forwards no ref, so the effects above bind
   * to it as the media layer's parent — the same element and geometry, and
   * no second implementation of the join. Nothing here is pinned; the
   * parallax scrub and the chapter's exit scrub are independent triggers on
   * one element.
   */
  return (
    <Chapter ground="dark" enter={false} className="h-[100svh] min-h-[36rem] w-full overflow-hidden">
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

      {/* Wash — gradient, never a box; drawn in the chapter's own ground. */}
      <div aria-hidden className="wash-full absolute inset-0" />

      {/*
        Copy. The parallax scrubs its opacity toward 0 as the page leaves, and
        it holds both CTAs: a keyboard focus inside it would draw its ring at
        whatever ink the scroll had reached. While it contains a visible focus,
        an important opacity outranks the scrub's inline value, so the focused
        CTA and its ring are at full ink; on blur the scrub's value applies
        again. The lift is untouched, and nothing is focused in the hero-states
        measurement, so every copy sample re-measures identical.
      */}
      <div
        ref={copy}
        className="relative flex h-full flex-col justify-end pb-20 has-[:focus-visible]:!opacity-100 lg:pb-24"
      >
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <p data-hero-fade className="eyebrow">
            {hero.eyebrow}
          </p>

          <h1 className="mt-8 text-[var(--text-primary)]">
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
                className="block font-display text-[clamp(1.5rem,3.4vw,3rem)] font-light italic leading-[1.05] text-[var(--text-primary)]"
              >
                {hero.tagline}
              </span>
            </span>
          </h1>

          <div data-hero-fade className="mt-14 flex items-end justify-between gap-8">
            <p className="max-w-sm text-[0.95rem] leading-relaxed text-[var(--text-primary)]">{hero.subtitle}</p>

            {/* Two persistent CTAs: Enquire primary, Wedding Brochure secondary. */}
            <div className="hidden shrink-0 items-center gap-8 pb-1 sm:flex">
              <Link
                href={hero.cta.href}
                data-magnetic
                className="group flex items-center gap-4 text-[var(--text-primary)]"
              >
                <span className="eyebrow">{hero.cta.label}</span>
                <span className="relative block h-px w-14 bg-[var(--rule-strong)] sm:w-20">
                  <span className="absolute inset-0 origin-left scale-x-0 bg-[var(--text-primary)] transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
                </span>
              </Link>

              <a
                href={contact.brochure.href}
                target="_blank"
                rel="noopener noreferrer"
                className="eyebrow transition-colors duration-[450ms] hover:text-[var(--text-primary)]"
              >
                {contact.brochure.label}
              </a>
            </div>
          </div>
        </div>
      </div>

      <ScrollCue />
    </Chapter>
  );
}

function ScrollCue() {
  const tick = useRef<HTMLSpanElement>(null);

  /* The cue is shown at `lg` only, so its endless tween runs there only. Below
     `lg` it is simply at rest, and crossing the breakpoint reverts the tween
     rather than leaving it running on a hidden element. */
  useIsomorphicLayoutEffect(() => {
    const el = tick.current;
    if (!el || prefersReducedMotion()) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      gsap.fromTo(
        el,
        { yPercent: -100 },
        { yPercent: 380, duration: 2.6, repeat: -1, ease: "power3.inOut" },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <div
      data-hero-cue
      className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 lg:block"
      aria-hidden
    >
      <span className="relative block h-14 w-px overflow-hidden bg-[var(--rule)]">
        <span ref={tick} className="absolute inset-x-0 top-0 block h-5 bg-[var(--text-primary)]" />
      </span>
    </div>
  );
}
