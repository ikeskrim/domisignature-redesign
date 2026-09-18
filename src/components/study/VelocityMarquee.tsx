"use client";

import { useRef, useLayoutEffect, useEffect } from "react";

import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * A marquee whose speed answers the scroll wheel.
 *
 * The shipped `Marquee` runs at a fixed, deliberately unhurried 42s pass. This
 * one keeps that as its resting speed and lets scrolling push it: scroll down
 * and the track accelerates in the direction of travel, scroll up and it slows,
 * eases through zero and runs the other way. Stop, and it settles back to its
 * own pace.
 *
 * Velocity comes from `ScrollTrigger.getVelocity()` rather than from Lenis
 * directly — Lenis is instantiated inside SmoothScroll and is not a global, and
 * it already drives ScrollTrigger on every tick, so ScrollTrigger's own reading
 * is the same number without reaching across the app for it.
 *
 * Seamlessness is structural, not tuned: the children render twice and the
 * track translates by exactly half its width, so the second copy sits where the
 * first began when the loop wraps. No measured width to go stale on resize.
 *
 * Under reduced motion it does not move at all, and the wheel does not move it
 * either — a motion-sensitive visitor should not be able to shake the page by
 * scrolling.
 */
export function VelocityMarquee({
  children,
  duration = 42,
  /** How hard the wheel pushes. 1 is a firm shove; 0.35 is a nudge. */
  sensitivity = 0.35,
  /** Never exceed this multiple of the resting speed. */
  maxScale = 6,
}: {
  children: React.ReactNode;
  duration?: number;
  sensitivity?: number;
  maxScale?: number;
}) {
  const track = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = track.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const loop = gsap.to(el, {
        xPercent: -50,
        duration,
        ease: "none",
        repeat: -1,
      });

      /* `direction` survives between ticks so the track keeps running the way
         the reader was last travelling, rather than snapping back on every
         pause. */
      let direction = 1;

      const st = ScrollTrigger.create({
        onUpdate: (self) => {
          const v = self.getVelocity();
          if (v === 0) return;
          direction = v > 0 ? 1 : -1;
          /* Velocity is px/s and can spike into the thousands on a flick, so it
             is scaled down and clamped rather than fed in raw. */
          const boost = Math.min(Math.abs(v) / 1000, maxScale) * sensitivity;
          gsap.to(loop, {
            timeScale: direction * (1 + boost),
            duration: 0.28,
            overwrite: true,
          });
        },
      });

      /* Settle back to the resting pace once the wheel goes quiet. */
      let idle: ReturnType<typeof setTimeout>;
      const rest = () => {
        clearTimeout(idle);
        idle = setTimeout(() => {
          gsap.to(loop, { timeScale: direction, duration: 1.1, ease: "power2.out", overwrite: true });
        }, 180);
      };
      window.addEventListener("scroll", rest, { passive: true });

      return () => {
        clearTimeout(idle);
        window.removeEventListener("scroll", rest);
        st.kill();
      };
    }, track);

    return () => ctx.revert();
  }, [duration, sensitivity, maxScale]);

  return (
    <div className="overflow-hidden" aria-hidden>
      <div ref={track} className="flex w-max will-change-transform">
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0">{children}</div>
      </div>
    </div>
  );
}
