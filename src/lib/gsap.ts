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
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { Flip } from "gsap/Flip";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, CustomEase, Flip);

  /*
   * The house ease, identical to the CSS `--ease-cinema` token
   * cubic-bezier(0.16, 1, 0.3, 1) — a fast departure and a long, quiet
   * settle. GSAP's built-in expo.out is close but not the same curve, and
   * mixing the two would show wherever CSS and JS animate side by side.
   */
  CustomEase.create("cinema", "M0,0 C0.16,1 0.3,1 1,1");
}

export { gsap, ScrollTrigger, Flip };

/** The one ease. Named so a call site reads as intent, not as a magic string. */
export const EASE = "cinema";

/**
 * Durations, in seconds. The brief sets the bands; these are the values chosen
 * inside them, and nothing should animate at a duration that is not from here.
 */
export const DUR = {
  /** Blocks arriving on scroll. Brief: 0.8–1.2s. */
  reveal: 0.95,
  /** Long wipes and masked uncoverings — the slowest thing that moves. */
  wipe: 1.2,
  /** Hovers, chips, arrows, magnetic pulls. Brief: 0.3–0.45s. */
  micro: 0.38,
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
