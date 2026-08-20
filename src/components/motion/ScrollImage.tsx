"use client";

import { useRef, useLayoutEffect, useEffect } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * An image in an overflow-hidden frame whose inner picture scales 1.1 -> 1 as
 * the frame travels through the viewport, and drifts vertically against it.
 *
 * This is the default treatment for every editorial image on the site: the
 * photography is the film, so it should never sit perfectly still.
 *
 * Phase 6 §5: rebuilt on a scrubbed ScrollTrigger. The drift is now driven by
 * the same clock as Lenis and the pinned scenes, so an image parallaxing beside
 * a pinned headline no longer slides a frame or two out of step with it.
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
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: 75 | 80 | 85;
  drift?: number;
  zoom?: number;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const frameEl = frame.current;
    const innerEl = inner.current;
    if (!frameEl || !innerEl || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        innerEl,
        { scale: 1 + zoom, yPercent: -drift },
        {
          scale: 1,
          yPercent: drift,
          ease: "none", // linear: the scroll position IS the timeline
          scrollTrigger: {
            trigger: frameEl,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, frameEl);

    return () => ctx.revert();
  }, [drift, zoom]);

  return (
    <div ref={frame} className={cn("relative overflow-hidden bg-graphite", className)}>
      <div ref={inner} className="absolute inset-0">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          loading={priority ? "eager" : "lazy"}
          className="grade object-cover"
        />
      </div>
    </div>
  );
}
