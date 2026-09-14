"use client";

import { useRef, useLayoutEffect, useEffect } from "react";
import { usePathname } from "next/navigation";

import { site } from "@content/site";
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from "@/lib/gsap";
import { consumeCurtainSuppression } from "@/components/motion/VenueTransition";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* The first mount is a hard load: the server has already painted the page,
   and running the curtain then covered it and set the content to opacity 0
   until the timeline finished - measured as the largest loading cost on Home
   (brief audit, stage 6). The curtain is for client navigations only. */
let firstMountDone = false;

/**
 * Page transition: a full-screen ivory curtain — the page's raised surface, a
 * plate laid over the arriving route — wipes up off it, the wordmark holds for
 * a beat at its centre, a warm bloom flares through the seam as it clears, and
 * the incoming content settles. ~1.15s.
 *
 * Phase 6 §5 rebuilt this on a GSAP timeline. The bloom was the dark site's
 * "light through the noir" beat — a single gold flare on an unlit ground. On
 * paper there is no unlit ground for it to light, and gold on paper is the
 * mark and decorative hairlines only, so the flare is now the raised
 * surface's own warmth — the curtain's light spilling through the seam — not
 * gold. Whether the beat survives at all is stage 6's call.
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
    if (!firstMountDone) {
      firstMountDone = true;
      return;
    }
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
        className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center bg-[var(--surface-raised)] opacity-0"
      >
        <span
          ref={word}
          className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.42em] text-[var(--text-primary)] opacity-0"
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
            "radial-gradient(ellipse 90% 100% at 50% 0%, color-mix(in srgb, var(--surface-raised) 70%, transparent) 0%, transparent 70%)",
        }}
      />

      <div ref={content}>{children}</div>
    </>
  );
}
