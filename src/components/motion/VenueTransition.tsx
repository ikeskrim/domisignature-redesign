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
 * While this runs, `suppressed` tells PageTransition to sit out — the
 * page curtain wiping over a shared-element transition would hide the one
 * thing it exists to show.
 *
 * Not from the keyboard. A row activated with a visible focus ring navigates
 * plainly: the overlay (z-96) would cover the focused row for the whole lift,
 * and the focus law says nothing may cover a focused element.
 */

let suppressed = false;

/** PageTransition asks this once per navigation, and clears it. */
export function consumeCurtainSuppression(): boolean {
  const was = suppressed;
  suppressed = false;
  return was;
}

/**
 * True when `el` holds focus the browser is showing — the sign that the
 * keyboard, not a pointer, activated it. A browser that cannot parse
 * `:focus-visible` answers for any focus at all: skipping a flourish costs
 * nothing, covering a focus ring breaks the focus law.
 */
export function focusIsVisible(el: Element | null): boolean {
  if (!el || el === document.body) return false;
  try {
    return el.matches(":focus-visible");
  } catch {
    return el === document.activeElement;
  }
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
    /* One context for every lift this overlay makes, reverted on unmount. */
    const ctx = gsap.context(() => {});

    run = async (source: HTMLImageElement) => {
      const el = layer.current;
      const target = picture.current;
      if (!el || !target || prefersReducedMotion()) return;

      /* The venue links call this from their own click handler. Activated
         from the keyboard, the link is the focused element and shows its
         ring. The test is on whatever holds focus rather than on the link
         alone, and deliberately so: in a browser where a pointer click does
         not focus a link (WebKit), an earlier keyboard focus keeps its ring
         elsewhere, and the overlay would cover that ring just the same.
         Either way: navigate plainly, and leave the curtain suppression unset
         (PageTransition makes the same test and sits out as well). */
      if (focusIsVisible(document.activeElement)) return;

      const rect = source.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      target.src = source.currentSrc || source.src;
      suppressed = true;

      /* A lift supersedes the last: the finished one's records are dropped
         (killed, not reverted) rather than kept for the life of the page. */
      ctx.kill();
      const lift = ctx.add(() => {
        gsap.set(el, {
          opacity: 1,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        /*
         * Pixels, not viewport units. GSAP cannot convert `svh`, and animating
         * to it left the timeline never completing — which meant the promise
         * this returns never resolved and the navigation waiting on it never
         * happened. A link that does not navigate is a far worse bug than a
         * missing flourish, so the target box is measured here instead.
         */
        return gsap
          .timeline()
          .to(el, {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            duration: 0.62,
            ease: EASE,
          })
          .to(target, { scale: 1.06, duration: 0.9, ease: EASE }, 0);
      });

      await lift.then(() => undefined);
    };

    return () => {
      run = async () => {};
      ctx.revert();
    };
  }, []);

  /* The new route has mounted and is painting its own hero — dissolve. */
  useEffect(() => {
    const el = layer.current;
    if (!el) return;
    if (Number(getComputedStyle(el).opacity) === 0) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        opacity: 0,
        duration: 0.55,
        ease: EASE,
        delay: 0.1,
        onComplete: () => {
          gsap.set(el, { clearProps: "all" });
          gsap.set(picture.current, { clearProps: "transform" });
        },
      });
    });
    /* Killed, not reverted: a revert mid-dissolve would snap the overlay back
       to full opacity over the page it is handing to. */
    return () => {
      ctx.kill();
    };
  }, [pathname]);

  return (
    <div
      ref={layer}
      aria-hidden
      className="lift-shadow pointer-events-none fixed z-[96] overflow-hidden opacity-0"
    >
      {/* Deliberately a bare <img>: the src is copied from an already-resolved
          next/image element at runtime, so there is nothing left to optimise
          and next/image would only re-request it.

          grade, not grade-b: this overlay ends as the venue chapter's hero, and
          the dissolve is the frame that must match. The index backdrop it lifts
          from is grade-b on paper; the grade shift happens during the 0.62s
          lift while the frame is in motion, not at the stationary full-screen
          dissolve onto the dark chapter's `grade` image.

          `lift-shadow` is the one shadow this layer casts: it is a photograph
          lifted off the page, and it exists only while the layer is visible. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={picture} alt="" className="grade h-full w-full object-cover" />
    </div>
  );
}
