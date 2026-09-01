"use client";

import { useEffect } from "react";
import Lenis from "lenis";

import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * Lenis smooth scrolling, mounted once at the root, driving ScrollTrigger.
 *
 * The integration matters more than the smoothing does. Lenis animates a
 * transform rather than moving the real scroll position at native speed, so if
 * ScrollTrigger keeps listening to the browser's own scroll event it reads
 * stale values and every pinned scene drifts a frame or two behind the page.
 * The fix is to make them share a clock:
 *
 *   - Lenis tells ScrollTrigger to update on every one of its own scroll ticks
 *   - `gsap.ticker` drives `lenis.raf`, so there is ONE requestAnimationFrame
 *     loop for the whole site instead of two competing ones
 *   - lagSmoothing is off, because a stutter should show as a stutter rather
 *     than as scroll and animation silently diverging
 *
 * Disabled outright when the visitor prefers reduced motion, and on coarse
 * pointers — momentum scrolling on touch devices is better left to the OS. In
 * both cases ScrollTrigger falls back to the native scroll event, which is
 * exactly right when nothing is intercepting it.
 */
export function SmoothScroll() {
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (prefersReducedMotion() || coarse) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000); // gsap ticker is in seconds
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    /* Pinned scenes measure on mount; refresh once Lenis owns the scroll. */
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return null;
}
