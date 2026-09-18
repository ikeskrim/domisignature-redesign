"use client";

import { useRef, useLayoutEffect, useEffect } from "react";

import { journey, journeyIntro } from "@content/journey";
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The six steps, with the title held and the steps moving past it.
 *
 * CSS `position: sticky` holds the title, not a GSAP pin. That is a deliberate
 * repeat of the decision already made for the journey rail: a pin rewrites the
 * document with spacer elements, which fights a bleeding editorial layout and
 * makes every downstream ScrollTrigger recalculate. Sticky costs nothing, never
 * desynchronises, and degrades to a normal heading when it cannot apply.
 *
 * Each step resolves as it crosses the middle of the screen rather than on
 * entry, so the reader's attention and the animation agree about where the
 * centre of the page is. The trigger runs `top 72%` → `top 45%`, scrubbed, so
 * scrolling back up un-resolves it symmetrically instead of leaving a trail of
 * finished states.
 *
 * IT DOES NOT FADE, and the reason is measured. A scrubbed element RESTS in its
 * start state whenever it is not in the band, and axe evaluates that resting
 * state — so a fade from low opacity is 21 contrast failures sitting on the
 * page. Worse, the fix is not to start higher: on ivory, primary text needs
 * α ≥ 0.64 to hold AA and secondary needs α ≥ 0.79, which leaves no perceptible
 * range to animate through. An opacity fade is simply not available on a light
 * ground with text that must stay legible at rest.
 *
 * So the step arrives by moving and un-masking instead: a clip-path inset opens
 * from the bottom while the block lifts. No visible pixel ever has its contrast
 * reduced, the text is fully opaque at every moment, and clip-path does not
 * remove anything from the accessibility tree — a screen reader reads all six
 * steps whatever the scroll position.
 *
 * Every word is the shipped copy from content/journey.ts. Nothing is written
 * for the prototype, and the numbers derive from the array.
 */
export function StickySteps() {
  const root = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray<HTMLElement>("[data-step]");

      if (prefersReducedMotion()) {
        gsap.set(steps, { clipPath: "inset(0% 0% 0% 0%)", y: 0 });
        return;
      }

      steps.forEach((step) => {
        gsap.fromTo(
          step,
          { clipPath: "inset(0% 0% 28% 0%)", y: 26 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            y: 0,
            ease: EASE,
            scrollTrigger: {
              trigger: step,
              start: "top 72%",
              end: "top 45%",
              scrub: 0.6,
            },
          },
        );
      });

      ScrollTrigger.refresh();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="mx-auto w-full max-w-[104rem] px-gutter">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
        {/* held */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[18vh]">
            <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              {journeyIntro.heading}
            </p>
            <h2 className="mt-7 font-display text-[clamp(2.25rem,4.4vw,4rem)] font-light leading-[1.03] text-[var(--text-primary)]">
              {journeyIntro.subheading}
            </h2>
            <span aria-hidden className="mt-10 block h-px w-24 bg-[var(--accent)]" />
            <p className="mt-8 max-w-sm text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              {String(journey.length).padStart(2, "0")} steps
            </p>
          </div>
        </div>

        {/* moving */}
        <ol className="lg:col-span-6 lg:col-start-7">
          {journey.map((step, i) => (
            <li
              key={step.number}
              data-step
              className={`border-t border-[var(--rule)] py-14 lg:py-20 ${i === 0 ? "lg:border-t-0 lg:pt-0" : ""}`}
            >
              <p className="font-display text-[1.05rem] text-[var(--text-tertiary)]">
                {String(step.number).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-[clamp(1.6rem,2.6vw,2.4rem)] font-light leading-[1.1] text-[var(--text-primary)]">
                {step.title}
              </h3>
              {step.body.map((line) => (
                <p
                  key={line}
                  className="mt-5 max-w-lg text-[1.0625rem] leading-[1.75] text-[var(--text-secondary)]"
                >
                  {line}
                </p>
              ))}
              {step.bullets && (
                <ul className="mt-5 space-y-2">
                  {step.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-[1rem] text-[var(--text-secondary)]">
                      <span aria-hidden className="mt-3 h-px w-3 shrink-0 bg-[var(--rule)]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
