"use client";

import { useRef, useLayoutEffect, useEffect, createElement } from "react";

import { cn } from "@/lib/utils";
import {
  gsap,
  EASE,
  DUR,
  STAGGER,
  START,
  prefersReducedMotion,
  startsInViewport,
} from "@/lib/gsap";

/**
 * The reveal vocabulary, rebuilt on GSAP + ScrollTrigger in Phase 6 §5.
 *
 * The public API is deliberately unchanged from the Framer Motion version:
 * every call site across the ten consuming components keeps working, and the
 * engine swap is invisible from the outside. What changed underneath is that
 * these now share one timeline clock with Lenis and with the pinned scenes, so
 * a reveal firing next to a scrubbed scene stays in step with it.
 *
 * Every primitive renders its FINAL state under `prefers-reduced-motion` — no
 * half-animation, no leftover transform.
 */

/* `useLayoutEffect` is correct here (we set styles before paint) but warns
   during SSR, so fall back on the server where it never runs anyway. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Tag = "div" | "section" | "li" | "article" | "header" | "figure" | "ul" | "ol";

/* ---------------------------------------------------------------------------
   Reveal — the workhorse. Fades and lifts a block into view once.
--------------------------------------------------------------------------- */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  as = "div",
  amount = 0.3,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: Tag;
  /** Kept for API compatibility: fraction of the element that must be visible. */
  amount?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || startsInViewport(el)) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        opacity: 0,
        y,
        duration: DUR.reveal,
        delay,
        ease: EASE,
        scrollTrigger: {
          trigger: el,
          start: `top ${100 - Math.round(amount * 30)}%`,
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [delay, y, amount]);

  return createElement(as, { ref, className }, children);
}

/* ---------------------------------------------------------------------------
   MaskReveal — a wipe that uncovers its child from below. Used on imagery.
--------------------------------------------------------------------------- */
export function MaskReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        clipPath: "inset(100% 0 0 0)",
        duration: DUR.wipe,
        delay,
        ease: EASE,
        scrollTrigger: { trigger: el, start: START, once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   TextReveal — a headline arriving word by word from behind a line mask.

   Phase 6 §5 upgraded this from whole lines to words: the line still masks, but
   each word lifts on its own beat, which is what gives a display serif its
   sense of being set rather than shown. Words stay whole — never split to
   characters — so the text remains selectable and legible mid-animation.

   Accessibility: the split text is `aria-hidden` and the full string is carried
   by a visually-hidden span, so a screen reader hears one clean sentence rather
   than a word salad.

   This used to put the string on `aria-label`, which is valid on a heading but
   PROHIBITED on <p> — an element with no naming-capable role. The moment the
   footer's closing line used `as="p"`, axe flagged `aria-prohibited-attr` on
   every page of the site. An sr-only span is valid on any tag, so the primitive
   can no longer be made invalid by the tag its caller chooses.
--------------------------------------------------------------------------- */
export function TextReveal({
  text,
  className,
  as = "h2",
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const lines = text.split("\n");

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || startsInViewport(el)) return;

    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll("[data-word]"), {
        yPercent: 110,
        duration: DUR.wipe,
        delay,
        ease: EASE,
        stagger: STAGGER.tight,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [delay, text]);

  return createElement(
    as,
    { ref, className },
    <span key="sr" className="sr-only">
      {text}
    </span>,
    lines.map((line, i) => (
      <span key={i} className="block overflow-hidden pb-[0.08em]" aria-hidden>
        {line.split(" ").map((word, j) => (
          <span key={j} className="inline-block overflow-hidden align-bottom">
            <span data-word className="inline-block">
              {word}
            </span>
            {j < line.split(" ").length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    )),
  );
}

/* ---------------------------------------------------------------------------
   Stagger — parent/child pair for lists.

   Under Framer this was a variant cascade; under GSAP the parent simply selects
   its marked descendants, which is both simpler and one animation instead of N.
--------------------------------------------------------------------------- */
export function Stagger({
  children,
  className,
  gap = STAGGER.loose,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  gap?: number;
  as?: "div" | "ul" | "ol";
}) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const items = el.querySelectorAll("[data-stagger-item]");
    if (!items.length || startsInViewport(el)) return;

    const ctx = gsap.context(() => {
      gsap.from(items, {
        opacity: 0,
        y: 24,
        duration: DUR.reveal,
        ease: EASE,
        stagger: gap,
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [gap]);

  return createElement(as, { ref, className }, children);
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  return createElement(as, { className, "data-stagger-item": "" }, children);
}

/* ---------------------------------------------------------------------------
   RuleDraw — a hairline that draws itself left-to-right.
--------------------------------------------------------------------------- */
export function RuleDraw({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        scaleX: 0,
        duration: DUR.wipe,
        ease: EASE,
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return <div ref={ref} className={cn("rule origin-left", className)} />;
}
