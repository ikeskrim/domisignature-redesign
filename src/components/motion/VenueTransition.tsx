"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";

/**
 * The shared-element transition from the venue index to a venue page.
 *
 * A route change replaces the whole DOM, so there is no element to hand from
 * one page to the next. This holds one instead: an overlay mounted in the root
 * layout, outside everything the router swaps, carrying a copy of the
 * photograph you clicked. The index fades out beneath it, the venue page mounts
 * with the same photograph as its hero, and the overlay dissolves — so the
 * picture never leaves the screen and the navigation reads as moving *into* the
 * venue rather than cutting to a different page.
 *
 * Continuity is exact rather than approximate: it copies the source element's
 * `currentSrc`, which is the already-decoded, already-cached, correctly-sized
 * next/image variant. There is no second fetch and no resolution pop.
 *
 * While this runs, `suppressCurtain` tells PageTransition to sit out — a
 * charcoal curtain wiping over a shared-element transition would hide the one
 * thing it exists to show.
 */

let suppressed = false;

/** PageTransition asks this once per navigation, and clears it. */
export function consumeCurtainSuppression(): boolean {
  const was = suppressed;
  suppressed = false;
  return was;
}

type Runner = (img: HTMLImageElement) => Promise<void>;
let run: Runner = async () => {};

/** Called from the venue index just before it navigates. */
export function runVenueTransition(img: HTMLImageElement): Promise<void> {
  return run(img);
}

export function VenueTransition() {
  const layer = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    run = async (source: HTMLImageElement) => {
      const el = layer.current;
      const target = picture.current;
      if (!el || !target || prefersReducedMotion()) return;

      const rect = source.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      target.src = source.currentSrc || source.src;
      suppressed = true;

      gsap.set(el, {
        opacity: 1,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });

      /*
       * Pixels, not viewport units. GSAP cannot convert `svh`, and animating to
       * it left the timeline never completing — which meant the promise this
       * returns never resolved and the navigation waiting on it never happened.
       * A link that does not navigate is a far worse bug than a missing
       * flourish, so the target box is measured here instead.
       */
      await gsap
        .timeline()
        .to(el, {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
          duration: 0.62,
          ease: EASE,
        })
        .to(target, { scale: 1.06, duration: 0.9, ease: EASE }, 0)
        .then(() => undefined);
    };

    return () => {
      run = async () => {};
    };
  }, []);

  /* The new route has mounted and is painting its own hero — dissolve. */
  useEffect(() => {
    const el = layer.current;
    if (!el) return;
    if (Number(getComputedStyle(el).opacity) === 0) return;

    const tween = gsap.to(el, {
      opacity: 0,
      duration: 0.55,
      ease: EASE,
      delay: 0.1,
      onComplete: () => {
        gsap.set(el, { clearProps: "all" });
        gsap.set(picture.current, { clearProps: "transform" });
      },
    });
    return () => {
      tween.kill();
    };
  }, [pathname]);

  return (
    <div
      ref={layer}
      aria-hidden
      className="pointer-events-none fixed z-[96] overflow-hidden opacity-0"
    >
      {/* Deliberately a bare <img>: the src is copied from an already-resolved
          next/image element at runtime, so there is nothing left to optimise
          and next/image would only re-request it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={picture} alt="" className="grade h-full w-full object-cover" />
    </div>
  );
}
