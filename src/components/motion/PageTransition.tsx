"use client";

import { useRef, useLayoutEffect, useEffect } from "react";
import { usePathname } from "next/navigation";

import { site } from "@content/site";
import { gsap, ScrollTrigger, CURTAIN, DUR, prefersReducedMotion } from "@/lib/gsap";
import {
  consumeCurtainSuppression,
  focusIsVisible,
} from "@/components/motion/VenueTransition";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* The first mount is a hard load: the server has already painted the page,
   and running the curtain then covered it and set the content to opacity 0
   until the timeline finished - measured as the largest loading cost on Home
   (brief audit, stage 6). The curtain is for client navigations only. */
let firstMountDone = false;

/* Set by the last activation of a link: true when that link held keyboard
   focus. Consumed by the next pathname change. */
let keyboardNavigation = false;

/* The sheet rests over the arriving route for this long before it lifts. */
const LIFT_AT = 0.12;

/**
 * Page transition: a full-screen ivory sheet — the page's raised surface, laid
 * over the arriving route — covers it at once with the wordmark printed at its
 * centre, then lifts off the top of the viewport. ~0.82s.
 *
 * Stage 6, motion on paper: the sheet moves; nothing under it does. The page
 * content is never faded or shifted — it is simply uncovered. A transform on
 * the content would also make it a containing block for `position: fixed`
 * descendants, and every pinned ScrollTrigger inside the page pins with fixed.
 *
 * Skipped when a keyboard-focused link started the navigation, and whenever
 * anything outside the sheet still holds a visible focus ring as the route
 * changes — Back or Forward pressed while a header link keeps its ring, a
 * keyboard-pressed button that pushes a route, a browser where a click leaves
 * an earlier keyboard focus in place. A full-screen sheet over a focus ring is
 * exactly what the focus law forbids. For the same reason, a ring appearing
 * while the sheet is up (a Tab under it) finishes the sheet at once. Skipped
 * outright under reduced motion — a full-screen sheet on every navigation is
 * what that preference is asking us not to do.
 *
 * The curtain is `aria-hidden` and `pointer-events-none` throughout.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const curtain = useRef<HTMLDivElement>(null);

  /* Capture phase, so the activation is recorded before the link's own click
     handler starts the navigation. Every click overwrites it: only the last
     activation speaks for the next route. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      keyboardNavigation =
        !!link && !curtain.current?.contains(link) && focusIsVisible(link);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!firstMountDone) {
      firstMountDone = true;
      return;
    }

    /* Both flags are read once per navigation, and cleared. The click record
       speaks for a link that has already unmounted with the old route; the
       active element speaks for a navigation no link click started (Back,
       Forward, a button), where a ring can stay on persistent chrome. */
    const suppressed = consumeCurtainSuppression();
    const active = document.activeElement;
    const fromKeyboard =
      keyboardNavigation || (focusIsVisible(active) && !curtain.current?.contains(active));
    keyboardNavigation = false;

    if (prefersReducedMotion()) return;

    /*
     * A venue navigation runs its own shared-element transition. Laying a
     * sheet over it would hide the photograph the whole effect exists to
     * carry across, so this sits that one navigation out and simply lets the
     * page be visible underneath. A navigation with a visible focus ring
     * anywhere sits out too.
     */
    if (suppressed || fromKeyboard) {
      ScrollTrigger.refresh();
      return;
    }

    const el = curtain.current;
    let tl: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {
      tl = gsap
        .timeline({ onComplete: () => ScrollTrigger.refresh() })
        /* Covers at once: the curtain is a decorative layer, so setting it
           visible is allowed. */
        .set(el, { yPercent: 0, opacity: 1 })
        /* The sheet lifts from the bottom edge, uncovering the page upward. */
        .to(el, { yPercent: -100, duration: DUR.panel, ease: CURTAIN }, LIFT_AT)
        /* Back to the resting markup: parked above the viewport, the sheet's
           edge gradient would still hang over the top of the page. */
        .set(el, { clearProps: "opacity,transform" });
    });

    /* A Tab under the sheet lands on something the sheet covers: finish it.
       Only a visible ring counts — the menu handing focus back to its toggle
       after a tap is focus the visitor cannot see, and the sheet carries on. */
    const onFocus = (e: FocusEvent) => {
      if (e.target instanceof Element && focusIsVisible(e.target) && tl && tl.progress() < 1) {
        tl.progress(1);
      }
    };
    document.addEventListener("focusin", onFocus);

    return () => {
      document.removeEventListener("focusin", onFocus);
      ctx.revert();
    };
  }, [pathname]);

  /*
   * No branch on the media query during render — that would differ between the
   * server and the client and break hydration. Instead the static markup IS the
   * reduced-motion state: the curtain starts at opacity 0, content starts
   * visible. If the effect never runs, the page is simply already correct.
   */
  return (
    <>
      <div
        ref={curtain}
        aria-hidden
        data-curtain
        className="panel-edge pointer-events-none fixed inset-0 z-[95] flex items-center justify-center bg-[var(--surface-raised)] opacity-0"
      >
        <span className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.42em] text-[var(--text-primary)]">
          {site.name}
        </span>
      </div>

      <div>{children}</div>
    </>
  );
}
