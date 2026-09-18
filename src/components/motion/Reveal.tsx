"use client";

import { Fragment, useRef, useLayoutEffect, useEffect, createElement } from "react";

import { cn } from "@/lib/utils";
import {
  gsap,
  EASE,
  DUR,
  STAGGER,
  START,
  prefersReducedMotion,
  startsInViewport,
  finishOnFocus,
} from "@/lib/gsap";

/**
 * The reveal vocabulary, rebuilt on GSAP + ScrollTrigger in Phase 6 §5.
 *
 * The public API is deliberately unchanged from the Framer Motion version:
 * every call site across the consuming components keeps working, and the
 * engine swap is invisible from the outside. What changed underneath is that
 * these now share one timeline clock with Lenis and with the pinned scenes, so
 * a reveal firing next to a scrubbed scene stays in step with it.
 *
 * Stage 6 — motion on paper. Nothing here fades: blocks settle (a lift without
 * a fade), type is set from behind its line, photographs are uncovered, rules
 * draw. Anything already in the viewport at mount is left exactly as the
 * server painted it, and every entrance ends by clearing the property it
 * animated, so nothing at rest carries a leftover transform or clip.
 *
 * Every primitive renders its FINAL state under `prefers-reduced-motion` — no
 * half-animation, no leftover transform.
 */

/* `useLayoutEffect` is correct here (we set styles before paint) but warns
   during SSR, so fall back on the server where it never runs anyway. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Tag = "div" | "section" | "li" | "article" | "header" | "figure" | "ul" | "ol";

/* ---------------------------------------------------------------------------
   Reveal — the workhorse. Settles a block into view once: a lift, no fade.

   The transform is cleared when it lands — a lingering `transform` makes the
   block a containing block for anything `position: fixed` inside it, which
   breaks pins. A keyboard focus arriving inside a block still in flight (or
   not yet triggered) finishes it, so a focus ring never travels.
--------------------------------------------------------------------------- */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
  as = "div",
  amount = 0.3,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** The lift, in pixels: the block starts this far below where it rests. */
  y?: number;
  as?: Tag;
  /** Kept for API compatibility: fraction of the element that must be visible. */
  amount?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || startsInViewport(el)) return;

    let stopFinishing = () => {};
    const ctx = gsap.context(() => {
      const tween = gsap.from(el, {
        y,
        duration: DUR.settle,
        delay,
        ease: EASE,
        clearProps: "transform",
        scrollTrigger: {
          trigger: el,
          start: `top ${100 - Math.round(amount * 30)}%`,
          once: true,
        },
      });
      stopFinishing = finishOnFocus(el, tween);
    }, el);

    return () => {
      stopFinishing();
      ctx.revert();
    };
  }, [delay, y, amount]);

  return createElement(as, { ref, className }, children);
}

/* ---------------------------------------------------------------------------
   MaskReveal — a wipe that uncovers its child from below. Used on imagery.

   Nothing focusable belongs inside: the wrapper clips. Left alone when it is
   already on screen at mount, and the clip-path is cleared when it lands.
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
    if (!el || prefersReducedMotion() || startsInViewport(el)) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        clipPath: "inset(100% 0 0 0)",
        /* Stage 6: the uncovering has its own named duration, between a draw
           and a wipe. */
        duration: DUR.uncover,
        delay,
        ease: EASE,
        clearProps: "clipPath",
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
   TextReveal — a headline arriving word by word from behind its line.

   Phase 6 §5 upgraded this from whole lines to words: each word lifts on its
   own beat, which is what gives a display serif its sense of being set rather
   than shown. Words stay whole — never split to characters — so the text
   remains selectable and legible mid-animation.

   Stage 6 fixed clipped ink. Each word's mask (`data-word`) used to be exactly
   one line-height tall, and at a tight leading (the arrival word's 0.82, the
   Statement's 0.95) a Playfair descender, an accent or an italic overhang
   reaches past that box, so the
   mask cut it — at rest, not only mid-animation. At rest nothing clips now:
   `overflow: hidden` is not in the markup and is put on the masks only by the
   effect, for the length of the entrance, so the server render, reduced
   motion and anything already on screen carry no clip. In flight each mask is
   padded (0.12em above, 0.24em below, 0.06em either side) and the padding is
   cancelled by equal negative margins, so the clip box holds the whole glyph
   while the margin box, and with it the line's layout, stays exactly as it
   was: nothing is cut on the way up, so nothing appears when the clip comes
   off. The line itself never clips and keeps its 0.08em of bottom padding;
   padding it further only grew the heading's own measured box. A word starts
   one full mask-height down (measured, not a percentage), so none of its ink
   shows before it moves.

   Nothing focusable can be inside: the component takes a string.

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
  measure,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  delay?: number;
  /**
   * Marks this element as a measurement target, rendered as `data-measure`.
   *
   * It exists because the primitive builds its root with `createElement` and
   * forwards nothing it does not name — and TypeScript does not check
   * hyphenated JSX attributes on a component, so a stray `data-*` passed here
   * compiles cleanly and then silently never reaches the DOM. An audit that
   * cannot find its target reports "not on screen", which reads like a pass.
   */
  measure?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const lines = text.split("\n");

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || startsInViewport(el)) return;

    /* The masks clip only while their words are moving. The server markup,
       reduced motion and anything already on screen never reach this line, so
       at rest no mask cuts ink. The clip goes on here, before the first frame
       paints the lowered words, and comes off when the last word lands or when
       the effect is torn down. */
    const masks = Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
    const unclip = () => {
      masks.forEach((mask) => {
        mask.style.overflow = "";
      });
    };
    masks.forEach((mask) => {
      mask.style.overflow = "hidden";
    });

    const ctx = gsap.context(() => {
      /* The moving word is the mask's only element child. */
      gsap.from(el.querySelectorAll("[data-word] > span"), {
        y: (_index: number, word: HTMLElement) => word.parentElement?.offsetHeight ?? 0,
        duration: DUR.wipe,
        delay,
        ease: EASE,
        stagger: STAGGER.tight,
        clearProps: "transform",
        onComplete: unclip,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    }, el);

    return () => {
      ctx.revert();
      unclip();
    };
  }, [delay, text]);

  return createElement(
    as,
    { ref, className, ...(measure ? { "data-measure": measure } : {}) },
    <span key="sr" className="sr-only">
      {text}
    </span>,
    lines.map((line, i) => (
      <span key={i} className="block pb-[0.08em]" aria-hidden>
        {line.split(" ").map((word, j, words) => (
          /* The space between words sits between the masks, never inside one:
             an inline-block drops a trailing space from its own width, so a
             space inside the mask rendered no gap at all and the heading read
             as one run-on word (and wrapped onto fewer lines). */
          <Fragment key={j}>
            <span
              data-word
              className="inline-block align-bottom pt-[0.12em] -mt-[0.12em] pb-[0.24em] -mb-[0.24em] pl-[0.06em] -ml-[0.06em] pr-[0.06em] -mr-[0.06em]"
            >
              <span className="inline-block">{word}</span>
            </span>
            {j < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    )),
  );
}

/* ---------------------------------------------------------------------------
   Stagger — parent/child pair for lists.

   Under Framer this was a variant cascade; under GSAP the parent simply selects
   its marked descendants, which is both simpler and one animation instead of N.
   The items settle like a Reveal — a lift, no fade, transform cleared on
   landing — and a focus arriving anywhere inside finishes the whole set.
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

    let stopFinishing = () => {};
    const ctx = gsap.context(() => {
      const tween = gsap.from(items, {
        y: 20,
        duration: DUR.settle,
        ease: EASE,
        stagger: gap,
        clearProps: "transform",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
      stopFinishing = finishOnFocus(el, tween);
    }, el);

    return () => {
      stopFinishing();
      ctx.revert();
    };
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

   Left alone when it is already on screen at mount; the transform is cleared
   when the draw lands.
--------------------------------------------------------------------------- */
export function RuleDraw({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || startsInViewport(el)) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        scaleX: 0,
        duration: DUR.draw,
        ease: EASE,
        clearProps: "transform",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return <div ref={ref} className={cn("rule origin-left", className)} />;
}
