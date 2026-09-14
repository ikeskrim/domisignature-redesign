"use client";

/**
 * The motion contract.
 *
 * Phase 6 §5 replaces the Phase 4 Framer Motion layer with GSAP + ScrollTrigger.
 * Everything that moves on this site reads its numbers from here, so the whole
 * build shares one ease and one sense of timing — the difference between a site
 * that feels authored and one that feels assembled.
 *
 * Registration happens once, on import, and only in the browser. Every consumer
 * is a "use client" component, so this module is never pulled into a server
 * render.
 *
 * Stage 6 — motion on paper. Nothing on paper fades: type is set from behind
 * its line, blocks settle, photographs are uncovered, rules draw, sheets move.
 * The additions here are the sheet's ease, the settle and draw durations, and
 * `finishOnFocus`, which lets no focused element wait on an entrance.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

if (typeof window !== "undefined") {
  /* Flip is not registered here: only the events index uses it, and this
     module is in every route's shared chunk. EventsBrowser imports and
     registers it itself (stage 6, the loading fixes). */
  gsap.registerPlugin(ScrollTrigger, CustomEase);

  /*
   * The house ease, identical to the CSS `--ease-cinema` token
   * cubic-bezier(0.16, 1, 0.3, 1) — a fast departure and a long, quiet
   * settle. GSAP's built-in expo.out is close but not the same curve, and
   * mixing the two would show wherever CSS and JS animate side by side.
   */
  CustomEase.create("cinema", "M0,0 C0.16,1 0.3,1 1,1");

  /*
   * The sheet's ease, identical to `--ease-curtain`
   * cubic-bezier(0.83, 0, 0.17, 1): a sheet of paper is lifted, travels, and
   * is set down. Used only by the moving ivory panels (the preloader, the page
   * transition, the mobile menu), never by a reveal.
   */
  CustomEase.create("curtain", "M0,0 C0.83,0 0.17,1 1,1");
}

export { gsap, ScrollTrigger };

/** The one ease. Named so a call site reads as intent, not as a magic string. */
export const EASE = "cinema";

/** The moving sheet's ease. */
export const CURTAIN = "curtain";

/**
 * Durations, in seconds. The brief sets the bands; these are the values chosen
 * inside them, and nothing should animate at a duration that is not from here.
 */
export const DUR = {
  /** Blocks arriving on scroll. Brief: 0.8–1.2s. */
  reveal: 0.95,
  /** Long wipes — the slowest thing that moves. */
  wipe: 1.2,
  /** A photograph uncovered by its mask: between a draw and a wipe. */
  uncover: 1.0,
  /** Hovers, chips, arrows, magnetic pulls. Brief: 0.3–0.45s. */
  micro: 0.38,
  /** A sheet of paper travelling across the viewport. */
  panel: 0.7,
  /** A block settling onto the page — a lift without a fade. */
  settle: 0.8,
  /** A hairline drawing itself. */
  draw: 0.9,
} as const;

/** Stagger between siblings, in seconds. Brief: 60–90ms. */
export const STAGGER = {
  tight: 0.06,
  normal: 0.075,
  loose: 0.09,
} as const;

/** Where a scroll-triggered reveal fires: element top at 85% of the viewport. */
export const START = "top 85%";

/**
 * True when the visitor has asked for less motion.
 *
 * Every primitive checks this and renders its FINAL state rather than a reduced
 * one — no half-animations, no lingering transforms. Read at call time, not
 * cached, so a mid-session change of preference is honoured on the next mount.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * True when an element is already on screen at mount.
 *
 * Reveal animations work by hiding an element and bringing it back, which is
 * right for something you scroll down to and wrong for something already in
 * front of you: it cannot paint until JavaScript has downloaded, parsed and
 * hydrated, so it becomes the Largest Contentful Paint and drags LCP out to
 * whenever hydration finishes. On a throttled phone that measured 6.6s on
 * /events for a page whose images were fully optimised and 23 KB.
 *
 * So anything starting in the viewport is left alone. It was already correct in
 * the server-rendered HTML; hiding it in order to re-show it is a flash of
 * hidden content, not a flourish.
 */
export function startsInViewport(el: Element): boolean {
  if (typeof window === "undefined") return false;
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight * 0.9 && r.bottom > 0;
}

/** True on devices that actually have a pointer — cursor work is desktop-only. */
export function hasFinePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}

/**
 * Finish an entrance the moment focus arrives inside it.
 *
 * A keyboard visitor can Tab into a block that is still settling (or has not
 * started): its focus ring would move with it, or sit behind its mask. On
 * `focusin` anywhere in `root` the tween jumps to its end state, so a focused
 * element is always where it will rest. For triggered tweens and timelines
 * only — a scrubbed animation belongs to the scroll position, not to focus.
 *
 * Returns the cleanup; call it from the effect's teardown.
 */
export function finishOnFocus(
  root: Element | null | undefined,
  tween: gsap.core.Animation | null | undefined,
): () => void {
  if (!root || !tween) return () => {};
  const finish = () => {
    if (tween.progress() < 1) tween.progress(1);
  };
  root.addEventListener("focusin", finish);
  return () => root.removeEventListener("focusin", finish);
}
