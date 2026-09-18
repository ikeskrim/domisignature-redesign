"use client";

import { useRef, useLayoutEffect, useEffect } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { isDropped } from "@/lib/motion-tier";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * An image in an overflow-hidden frame whose inner picture scales 1.1 -> 1 as
 * the frame travels through the viewport, and drifts vertically against it -
 * never further than its scale leaves room for, so no edge shows in the frame.
 *
 * This is the default treatment for every editorial image on the site: the
 * photography is the film, so it should never sit perfectly still.
 *
 * Phase 6 §5: rebuilt on a scrubbed ScrollTrigger. The drift is now driven by
 * the same clock as Lenis and the pinned scenes, so an image parallaxing beside
 * a pinned headline no longer slides a frame or two out of step with it.
 *
 * Stage 6: parallax is the owner's second drop (src/lib/motion-tier.ts). On a
 * phone that drops it, as under reduced motion, the picture sits at rest in
 * its frame — no scale, no drift, exactly the server render.
 */
export function ScrollImage({
  src,
  alt,
  className,
  sizes = "100vw",
  priority = false,
  quality = 80,
  /** Vertical drift in percent of the frame height. */
  drift = 8,
  /** Extra scale headroom the inner image starts with. */
  zoom = 0.1,
  /**
   * The photographic grade. `grade-b` is the light-ground grade for a
   * photograph on paper; a caller inside a dark chapter passes `grade`.
   */
  grade = "grade-b",
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: 75 | 80 | 85;
  drift?: number;
  zoom?: number;
  grade?: "grade" | "grade-b";
}) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const frameEl = frame.current;
    const innerEl = inner.current;
    if (!frameEl || !innerEl || prefersReducedMotion() || isDropped("parallax")) return;

    const ctx = gsap.context(() => {
      /*
       * Scale and drift share one scrubbed progress, and the drift is clamped
       * to the headroom the scale leaves at that moment, so the picture's own
       * edge never enters its frame. Unclamped, the picture reached scale 1 at
       * full drift: on a frame that is short against the viewport (a plate at
       * phone width) a strip of the mat showed at the frame's top while the
       * frame was still on screen. The clamp only bites in that last stretch
       * of travel; on tall and full-bleed frames it happens off-screen.
       */
      const setScale = gsap.quickSetter(innerEl, "scale");
      const setY = gsap.quickSetter(innerEl, "yPercent");
      const state = { p: 0 };
      const apply = () => {
        const scale = 1 + zoom * (1 - state.p);
        const room = ((scale - 1) / 2) * 100;
        setScale(scale);
        setY(Math.max(-room, Math.min(room, drift * (2 * state.p - 1))));
      };
      apply();
      gsap.to(state, {
        p: 1,
        ease: "none", // linear: the scroll position IS the timeline
        onUpdate: apply,
        scrollTrigger: {
          trigger: frameEl,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, frameEl);

    return () => ctx.revert();
  }, [drift, zoom]);

  return (
    <div ref={frame} className={cn("relative overflow-hidden bg-[var(--surface-raised)]", className)}>
      <div ref={inner} className="absolute inset-0">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          loading={priority ? "eager" : "lazy"}
          className={cn(grade, "object-cover")}
        />
      </div>
    </div>
  );
}
