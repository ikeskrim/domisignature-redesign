import type { Metadata } from "next";

import { StickySteps } from "@/components/study/StickySteps";
import { TooltipGrid } from "@/components/study/TooltipGrid";
import { VelocityMarquee } from "@/components/study/VelocityMarquee";
import { services } from "@content/services";

/**
 * STUDY — the three interactions the site does not already have.
 *
 * Of the five things asked for, four already ship in some form: a preloader, a
 * page transition, a marquee, and a hero with a real fallback chain. Rebuilding
 * those would replace working, verified components rather than improve them, so
 * this route holds only what is genuinely new:
 *
 *   1. a marquee that answers the scroll wheel
 *   2. a broken grid with a label that follows the cursor
 *   3. the six steps with the title held and the steps moving past it
 *
 * Built on the shipped stack — GSAP, ScrollTrigger, Lenis — and on the semantic
 * ground tokens from stage 1, so nothing here names a palette literal. Every
 * word is existing site copy; every figure derives from content/.
 */
export const metadata: Metadata = {
  title: "Study — motion",
  robots: { index: false, follow: false, nocache: true },
};

export default function MotionStudy() {
  /* The marquee carries the real service names, not a written-for-the-demo list. */
  const words = services.map((s) => s.title);

  return (
    <div data-ground="light" className="min-h-dvh bg-[var(--surface)]">
      <main>
        <section className="px-gutter pb-20 pt-32 lg:pt-40">
          <div className="mx-auto w-full max-w-[104rem]">
            <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Study — not part of the site
            </p>
            <h1 className="mt-7 max-w-4xl font-display text-[clamp(2.25rem,5vw,4.25rem)] font-light leading-[1.02] text-[var(--text-primary)]">
              Three interactions the site does not have yet
            </h1>
            <p className="mt-8 max-w-2xl text-[1.0625rem] leading-relaxed text-[var(--text-secondary)]">
              The preloader, the page transition, the marquee and the hero
              fallback already ship. These three are the genuinely new ones,
              built on the existing GSAP and Lenis stack rather than a second
              animation library.
            </p>
          </div>
        </section>

        {/* 1 — the marquee that answers the wheel */}
        <section className="border-y border-[var(--rule)] py-14">
          <p className="mx-auto mb-8 w-full max-w-[104rem] px-gutter text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            01 — scroll, and the marquee answers
          </p>
          <VelocityMarquee>
            {words.map((w) => (
              <span
                key={w}
                className="flex items-center font-display text-[clamp(2rem,5vw,4.5rem)] font-light leading-none text-[var(--text-primary)]"
              >
                <span className="px-8 lg:px-14">{w}</span>
                <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              </span>
            ))}
          </VelocityMarquee>
        </section>

        {/* 2 — the broken grid with a cursor label */}
        <section className="py-24 lg:py-32">
          <p className="mx-auto mb-12 w-full max-w-[104rem] px-gutter text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            02 — hover a plate on a desktop pointer
          </p>
          <TooltipGrid />
        </section>

        {/* 3 — the six steps, held and moving */}
        <section className="border-t border-[var(--rule)] py-24 lg:py-32">
          <p className="mx-auto mb-12 w-full max-w-[104rem] px-gutter text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            03 — the title is held; the steps move past it
          </p>
          <StickySteps />
        </section>
      </main>
    </div>
  );
}
