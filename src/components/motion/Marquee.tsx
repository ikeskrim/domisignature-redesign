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
 * It only runs while it is on screen (stage 6). The loop is created paused and
 * an IntersectionObserver plays it while any of the band is in the viewport and
 * pauses it when the band leaves, so the footer is not repainting a transform
 * for the whole of a visitor's time further up the page. It resumes from where
 * it stopped: the ease is linear, so there is no jump and no restart. An
 * observer rather than a ScrollTrigger because it needs no refresh when the
 * page above it changes height.
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
  const band = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = band.current;
    const el = track.current;
    if (!root || !el || prefersReducedMotion()) return;

    let tween: gsap.core.Tween | undefined;
    const ctx = gsap.context(() => {
      tween = gsap.to(el, {
        xPercent: -50,
        duration,
        ease: "none",
        repeat: -1,
        paused: true,
      });
    }, root);

    /* No observer (a very old engine): run as it always did. Otherwise the
       observer's first callback, delivered on observe, sets the initial state. */
    if (typeof IntersectionObserver === "undefined") {
      tween?.play();
      return () => ctx.revert();
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!tween || !entry) return;
      if (entry.isIntersecting) tween.play();
      else tween.pause();
    });
    observer.observe(root);

    return () => {
      observer.disconnect();
      ctx.revert();
    };
  }, [duration]);

  return (
    <div ref={band} className={cn("overflow-hidden", className)} aria-hidden="true">
      <div ref={track} className="flex w-max">
        <div className="shrink-0">{children}</div>
        {/* The seam-free half. Identical, and never announced twice because the
            whole component is aria-hidden. */}
        <div className="shrink-0">{children}</div>
      </div>
    </div>
  );
}
