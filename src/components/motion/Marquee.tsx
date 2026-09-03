"use client";

import { useRef, useLayoutEffect, useEffect } from "react";

import { cn } from "@/lib/utils";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * One slow marquee — the whole site gets exactly this one, carrying the
 * wordmark across the bottom of the footer.
 *
 * Seamless by construction rather than by tuning: the text is rendered twice
 * and the track is translated by exactly half its width, so the second copy is
 * sitting precisely where the first started when the loop wraps. There is no
 * measured width to go stale on resize and no visible seam at any viewport.
 *
 * `duration` is seconds per full pass and defaults to a deliberately unhurried
 * 42s. This is ambient texture at the very end of the page, not something
 * anyone should catch themselves watching.
 *
 * Under reduced motion the track simply does not move — the wordmark is still
 * there, still set enormous, just still.
 */
export function Marquee({
  children,
  className,
  duration = 42,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}) {
  const track = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = track.current;
    if (!el || prefersReducedMotion()) return;

    const tween = gsap.to(el, {
      xPercent: -50,
      duration,
      ease: "none",
      repeat: -1,
    });

    return () => {
      tween.kill();
    };
  }, [duration]);

  return (
    <div className={cn("overflow-hidden", className)} aria-hidden="true">
      <div ref={track} className="flex w-max">
        <div className="shrink-0">{children}</div>
        {/* The seam-free half. Identical, and never announced twice because the
            whole component is aria-hidden. */}
        <div className="shrink-0">{children}</div>
      </div>
    </div>
  );
}
