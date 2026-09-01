"use client";

import { useRef, useLayoutEffect, useEffect } from "react";

import { journey } from "@content/journey";
import { Reveal, RuleDraw } from "@/components/motion/Reveal";
import { ScrollImage } from "@/components/motion/ScrollImage";
import { pad2 } from "@/lib/utils";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The wedding journey as a numbered chapter sequence — the one place on the
 * site where numbering is unquestionably earned, because the steps are ordered.
 *
 * Each chapter alternates sides, with the number set oversized behind the
 * heading and the image bleeding to the viewport edge.
 *
 * Phase 6 §5 — the second scrubbed scene. A chapter rail holds at the left edge
 * for the length of the sequence: six numerals, a hairline track, and a fill
 * that scrubs with scroll position so you can always see how far through a
 * six-step process you are. The active numeral lifts from faint to bone as its
 * chapter arrives.
 *
 * Held with CSS `position: sticky` rather than a GSAP pin, deliberately. A pin
 * injects a pin-spacer into the flow, and these chapters bleed their images
 * past the container with negative margins — the spacer fights that layout for
 * no visual difference, since a pin and a sticky element look identical here.
 * The *scrubbing* is still GSAP, sharing Lenis's clock with everything else.
 *
 * The rail is `aria-hidden`: it is a decorative restatement of the ordered list
 * beside it, and a screen reader already gets "1 of 6" from the <ol>.
 */
export function JourneyChapters() {
  const root = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const numerals = useRef<(HTMLSpanElement | null)[]>([]);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        /* The fill tracks scroll position across the whole sequence. */
        gsap.fromTo(
          fill.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 42%",
              end: "bottom 72%",
              scrub: 0.5,
            },
          },
        );

        /* Each chapter lights its own numeral as it takes the screen. */
        const chapters = gsap.utils.toArray<HTMLElement>("[data-chapter]", el);
        chapters.forEach((chapter, i) => {
          const numeral = numerals.current[i];
          if (!numeral) return;

          gsap.to(numeral, {
            color: "var(--color-bone)",
            ease: "none",
            scrollTrigger: {
              trigger: chapter,
              start: "top 62%",
              end: "bottom 42%",
              toggleActions: "play reverse play reverse",
            },
          });
        });
      });

      return () => mm.revert();
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="relative">
      {/* The chapter rail */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-2 top-0 hidden h-full xl:block"
      >
        <div className="sticky top-1/2 flex -translate-y-1/2 items-center gap-4">
          <span className="relative block h-40 w-px bg-hair">
            <span
              ref={fill}
              className="absolute inset-x-0 top-0 block h-full origin-top bg-bone/70"
            />
          </span>
          <span className="flex flex-col gap-2.5">
            {journey.map((step, i) => (
              <span
                key={step.number}
                ref={(node) => {
                  numerals.current[i] = node;
                }}
                className="block font-sans text-[0.6rem] uppercase tracking-[0.18em] text-faint"
              >
                {pad2(step.number)}
              </span>
            ))}
          </span>
        </div>
      </div>

      <ol className="space-y-24 lg:space-y-40">
        {journey.map((step, i) => {
          const flipped = i % 2 === 1;
          // "Step 3 — Define Guests & Budget" -> "Define Guests & Budget"
          const title = step.title.replace(/^Step \d+\s*[—-]\s*/, "");

          return (
            <li
              key={step.number}
              data-chapter
              className="lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-14"
            >
              <div
                className={
                  flipped
                    ? "lg:order-2 lg:col-span-7 lg:col-start-6 lg:-mr-gutter"
                    : "lg:col-span-7 lg:-ml-gutter"
                }
              >
                <ScrollImage
                  src={step.image}
                  alt={step.imageAlt}
                  sizes="(max-width: 1024px) 100vw, 62vw"
                  className="aspect-[4/3] w-full lg:aspect-auto lg:h-[72vh] lg:min-h-[28rem]"
                />
              </div>

              <div
                className={
                  flipped
                    ? "lg:order-1 lg:col-span-4 lg:col-start-1"
                    : "lg:col-span-4 lg:col-start-9"
                }
              >
                <div className="relative mt-10 lg:mt-0">
                  {/* The chapter number, set large and quiet above the heading */}
                  <Reveal>
                    <span
                      aria-hidden
                      className="block font-display text-[clamp(3.5rem,6vw,5.5rem)] font-light leading-[0.8] text-faint"
                    >
                      {pad2(step.number)}
                    </span>
                  </Reveal>

                  <Reveal delay={0.06}>
                    <h3 className="mt-7 font-display text-[clamp(2rem,3.3vw,3.25rem)] font-light leading-[1.0] text-bone">
                      <span className="sr-only">Step {step.number} — </span>
                      {title}
                    </h3>
                  </Reveal>

                  <RuleDraw className="mt-8 w-20" />

                  {step.body.length > 0 && (
                    <Reveal delay={0.12}>
                      <div className="prose-editorial mt-7">
                        {step.body.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    </Reveal>
                  )}

                  {step.bullets && (
                    <Reveal delay={0.18}>
                      <ul className="mt-6 space-y-3">
                        {step.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-4 leading-relaxed text-bone/85">
                            <span aria-hidden className="mt-3.5 h-px w-4 shrink-0 bg-muted" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </Reveal>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
