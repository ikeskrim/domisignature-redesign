"use client";

import { useRef, useLayoutEffect, useEffect } from "react";
import { usePathname } from "next/navigation";

import { site } from "@content/site";
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from "@/lib/gsap";
import { consumeCurtainSuppression } from "@/components/motion/VenueTransition";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Page transition: a full-screen charcoal curtain wipes up off the arriving
 * route, the wordmark holds for a beat at its centre, a warm bloom flares
 * through the seam as it clears, and the incoming content settles. ~1.15s.
 *
 * Phase 6 §5 rebuilt this on a GSAP timeline. The bloom is the "light through
 * the noir" beat the brief asks for at scene changes — a single gold flare on
 * an otherwise unlit ground, which is also the one place gold is allowed to
 * appear on a screen that has already spent its accent elsewhere, because it is
 * gone again inside half a second.
 *
 * The curtain is `aria-hidden` and `pointer-events-none` throughout, and the
 * whole thing is skipped outright under reduced motion — a full-screen wipe on
 * every navigation is exactly what that preference is asking us not to do.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const curtain = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLSpanElement>(null);
  const bloom = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    /*
     * A venue navigation runs its own shared-element transition. Wiping a
     * curtain over it would hide the photograph the whole effect exists to
     * carry across, so this sits that one navigation out and simply lets the
     * page be visible underneath.
     */
    if (consumeCurtainSuppression()) {
      gsap.set(curtain.current, { opacity: 0 });
      gsap.set(content.current, { opacity: 1, y: 0, clearProps: "transform" });
      ScrollTrigger.refresh();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.set(curtain.current, { clipPath: "inset(0% 0 0% 0)", opacity: 1 })
        .set(content.current, { opacity: 0, y: 18 })
        .fromTo(
          word.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.3, ease: EASE },
        )
        .to(word.current, { opacity: 0, duration: 0.25, ease: EASE }, 0.5)
        /* The curtain lifts from the bottom edge, uncovering the page upward. */
        .to(
          curtain.current,
          { clipPath: "inset(0% 0 100% 0)", duration: 0.75, ease: "power4.inOut" },
          0.3,
        )
        /* Bloom flares through the seam, then is gone. */
        .fromTo(
          bloom.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.28, ease: EASE },
          0.42,
        )
        .to(bloom.current, { opacity: 0, duration: 0.45, ease: EASE }, 0.7)
        .to(
          content.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: EASE,
            /*
             * Critical: strip the inline transform when the entrance ends.
             * A `transform` — even `translate(0,0)` — makes the element a
             * containing block for `position: fixed` descendants, and every
             * pinned ScrollTrigger inside the page pins with fixed. Leaving
             * it behind silently breaks the pinned scenes on every route.
             */
            clearProps: "transform",
            onComplete: () => ScrollTrigger.refresh(),
          },
          0.5,
        );

    });

    return () => ctx.revert();
  }, [pathname]);

  /*
   * No branch on the media query during render — that would differ between the
   * server and the client and break hydration. Instead the static markup IS the
   * reduced-motion state: curtain and bloom start at opacity 0, content starts
   * visible. If the effect never runs, the page is simply already correct.
   */
  return (
    <>
      <div
        ref={curtain}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center bg-charcoal opacity-0"
      >
        <span
          ref={word}
          className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.42em] text-bone opacity-0"
        >
          {site.name}
        </span>
      </div>

      <div
        ref={bloom}
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[94] h-[38vh] opacity-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 100% at 50% 0%, color-mix(in srgb, var(--color-gold) 22%, transparent) 0%, transparent 70%)",
        }}
      />

      <div ref={content}>{children}</div>
    </>
  );
}
