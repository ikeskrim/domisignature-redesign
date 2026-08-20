"use client";

import { useRef, useState, useLayoutEffect, useEffect } from "react";
import Image from "next/image";

import { venues } from "@content/venues";
import { journey } from "@content/journey";
import { RuleDraw, TextReveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The arrival scene — second beat of the voyage, and one of the two pinned
 * scenes in the build.
 *
 * The giant single-word moment, kept below the fold so the first screen stays
 * Domisignature and "Where Every Moment Is Signed". Beneath it, facts set as
 * the luxury: every figure is derived from the content, never authored here, so
 * the scene cannot drift out of step with the venues or the journey.
 *
 * Phase 6 §5 — the pin. The section holds for roughly one extra viewport while
 * the island behind it drifts and lifts out of the dark, and the facts arrive
 * underneath. The choreography rule is that nothing moves while someone is
 * reading: the word CRETE and the paragraph are already set and still by the
 * time the pin engages, and only the backdrop and the not-yet-read stats move
 * during it. The scene releases as soon as the last figure lands.
 */
/**
 * The arrival sequence — five real photographs, scrubbed.
 *
 * Not a video and not a frame-dump: an ordered set of the client's own stills
 * that reads as a journey onto the island. Mountains, then the olive terraces,
 * then the sea at dusk, then the coast from the air, then the last light on the
 * water. Every one is already published elsewhere on the site.
 *
 * Five is the whole budget. A true image sequence means sixty frames and
 * several megabytes; this gets the same "motion from photography" for the cost
 * of four extra lazy images, on desktop only.
 */
const ARRIVAL_FRAMES = [
  { src: "/media/mdGEOR3108.jpg", note: "the mountains" },
  { src: "/media/xDJI_20260207131326_0065_D.jpg", note: "the olive terraces" },
  { src: "/media/th3-DSC_5495.jpg", note: "the sea at dusk" },
  { src: "/media/paDJI_2289.JPG", note: "the coast from the air" },
  /* A pure seascape, and the only frame here that is not also a card further
     down the page — the sequence should not end on something the visitor is
     about to meet again. Small graffiti on a rock at mid-right sits inside the
     gradient's 70% ink band at <=46% plate opacity, so it never resolves. */
  { src: "/media/stDSC_5339.jpg", note: "the last light" },
] as const;

export function Arrival() {
  const root = useRef<HTMLElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const facts = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);

  /**
   * The sequence is a desktop affordance and it stays that way.
   *
   * The scene only pins at >=1024px and >=700px tall, so below that there is
   * nothing to scrub against and four extra full-bleed images would be pure
   * cost on exactly the devices with the least headroom — the mobile
   * performance floor is the tightest number on this project. Server render is
   * one frame, which is also the reduced-motion state, so there is no hydration
   * mismatch and no flash.
   */
  const [sequence, setSequence] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    setSequence(window.matchMedia("(min-width: 1024px) and (min-height: 700px)").matches);
  }, []);

  const frames = sequence ? ARRIVAL_FRAMES : ARRIVAL_FRAMES.slice(0, 1);

  const capacities = venues
    .map((v) => v.capacity.replace(/\D+/g, " ").trim().split(/\s+/).map(Number))
    .flat();

  /*
   * The guest figure is the MAXIMUM, not the range.
   *
   * It used to render the full span. With the only 20-guest venue gone that
   * span became "200–300", and a range opening at 200 reads as a *minimum* —
   * it would quietly turn away every couple planning something intimate, which
   * is the opposite of what this site is for. The maximum says what the largest
   * setting can hold and implies no floor at all.
   *
   * Still derived from the real capacities, never typed. Owner decision.
   */
  const stats = [
    { value: String(venues.length).padStart(2, "0"), label: "Private venues" },
    {
      value: String(Math.max(...capacities)),
      label: "Guests at the largest setting",
    },
    { value: String(journey.length).padStart(2, "0"), label: "Steps from enquiry to ceremony" },
  ];

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      /* Pinning is a desktop affordance. On a short screen it eats the whole
         viewport for a scene that reads perfectly well scrolling normally. */
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px) and (min-height: 700px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            /* Longer than before: five frames need room to breathe, or the
               sequence reads as a flicker rather than a journey. */
            end: "+=180%",
            pin: true,
            pinSpacing: true,
            scrub: 0.6,
            anticipatePin: 1,
          },
        });

        tl.to(backdrop.current, { opacity: 0.46, scale: 1.06, ease: "none" }, 0).from(
          facts.current,
          { y: 60, opacity: 0, ease: "none" },
          0.15,
        );

        /*
         * Each frame fades in ON TOP of the one before, and the earlier frames
         * are never faded out. That is what makes a slow network harmless: an
         * image that has not decoded yet simply leaves the previous photograph
         * on screen. There is no state in which this scene is blank.
         */
        const stack = layers.current.filter(Boolean).slice(1);
        stack.forEach((layer, i) => {
          tl.fromTo(
            layer,
            { opacity: 0 },
            { opacity: 1, ease: "none", duration: 0.18 },
            0.1 + (i / stack.length) * 0.72,
          );
        });
      });

      /* Below that, the facts simply reveal on arrival — no pin. */
      mm.add("(max-width: 1023px), (max-height: 699px)", () => {
        gsap.from(facts.current, {
          y: 40,
          opacity: 0,
          duration: 0.95,
          ease: EASE,
          scrollTrigger: { trigger: facts.current, start: "top 88%", once: true },
        });
      });

      return () => mm.revert();
    }, el);

    return () => ctx.revert();
    /* Re-runs once `sequence` flips, because that is when the extra layers
       exist to be animated. */
  }, [sequence]);

  return (
    <section
      ref={root}
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden bg-ink"
    >
      {/* The island itself, held far back so the word carries the scene */}
      {/*
        Quality 50, not 75. These plates sit at 30–46% opacity under a
        full-height gradient and never resolve as detail — the first one was
        shipping 333 KB to be the largest paint on the homepage. At 50 they are
        visually identical through the scrim and a fraction of the bytes.
      */}
      <div ref={backdrop} className="absolute inset-0 opacity-30">
        {frames.map((frame, i) => (
          <div
            key={frame.src}
            ref={(el) => {
              layers.current[i] = el;
            }}
            className="absolute inset-0"
            /* Frame 0 is the base and is always visible; the rest are brought
               up by the scrub. Inline so there is no first-paint flash. */
            style={i === 0 ? undefined : { opacity: 0 }}
            aria-hidden
          >
            <Image
              src={frame.src}
              alt=""
              fill
              sizes="100vw"
              quality={50}
              loading="lazy"
              className="grade-hero object-cover"
            />
          </div>
        ))}
      </div>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/85"
      />

      <div className="relative mx-auto w-full max-w-[104rem] px-gutter pt-28 lg:pt-36">
        <div className="flex items-center gap-6">
          <span className="eyebrow text-muted">Arrival</span>
          <RuleDraw className="w-20" />
        </div>
      </div>

      {/* The giant single word */}
      <div className="relative mx-auto w-full max-w-[104rem] px-gutter">
        <TextReveal
          text="Crete"
          className="font-display text-[clamp(5rem,21vw,19rem)] font-light leading-[0.82] tracking-[-0.045em] text-bone"
        />
        <p className="prose-editorial mt-10 max-w-lg">
          One island, three private settings, and a small team who will be there on the day.
        </p>
      </div>

      {/* Facts as the luxury */}
      <div
        ref={facts}
        className="relative mx-auto w-full max-w-[104rem] px-gutter pb-20 lg:pb-24"
      >
        <RuleDraw className="mb-12" />
        <dl className="grid gap-12 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <CountUp
                  value={stat.value}
                  className="block font-display text-[clamp(3rem,7vw,7rem)] font-light leading-[0.85] tracking-[-0.04em] text-bone tabular-nums"
                />
                <span aria-hidden className="eyebrow mt-5 block text-muted">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
