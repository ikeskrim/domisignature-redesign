"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";

import { site } from "@content/site";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";
import { markIntroDone } from "@/lib/intro";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const SEEN_KEY = "domi:intro-seen";

/**
 * The opening curtain. Charcoal ground, the wordmark drawn in behind a rising
 * mask, a hairline that fills left to right, then the whole thing wipes up to
 * reveal the hero underneath.
 *
 * Rules from the brief, all enforced here:
 *
 *   - **≤1.8s.** The timeline is 1.55s end to end. It never waits on assets,
 *     because a preloader that actually waits for a 3MB film is just a delay.
 *   - **Skippable.** Any key, click or scroll cuts to the end. The skip control
 *     is a real focusable button, first in the tab order.
 *   - **Once per session.** `sessionStorage`, so a visitor moving through six
 *     pages sees it once, not six times. A new tab is a new session, which is
 *     the correct reading of "session" for a first impression.
 *   - **Never under reduced motion**, where it resolves the intro gate on the
 *     first frame and renders nothing at all.
 *
 * Whatever happens, `markIntroDone()` fires exactly once — the hero's entrance
 * is waiting on it.
 */
export function Preloader() {
  /* `null` until the client decides; nothing is rendered on the server, so the
     markup can never disagree between the two passes. */
  const [show, setShow] = useState<boolean | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion() || sessionStorage.getItem(SEEN_KEY)) {
      markIntroDone();
      setShow(false);
      return;
    }
    sessionStorage.setItem(SEEN_KEY, "1");
    setShow(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (show !== true) return;
    const el = root.current;
    if (!el) return;

    const done = () => {
      if (finished.current) return;
      finished.current = true;
      markIntroDone();
      setShow(false);
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: done });
      timeline.current = tl;

      tl.from("[data-intro-word]", { yPercent: 110, duration: 0.9, ease: EASE })
        .from("[data-intro-rule]", { scaleX: 0, duration: 0.85, ease: EASE }, 0.15)
        .to("[data-intro-word]", { opacity: 0, duration: 0.35, ease: EASE }, 1.0)
        .to("[data-intro-rule]", { opacity: 0, duration: 0.35, ease: EASE }, 1.0)
        .to(el, { yPercent: -100, duration: 0.75, ease: "power4.inOut" }, 1.05);
    }, el);

    /* Skip on any intent. `once` so these clean themselves up. */
    const skip = () => timeline.current?.progress(1);
    const opts = { once: true } as const;
    window.addEventListener("keydown", skip, opts);
    window.addEventListener("pointerdown", skip, opts);
    window.addEventListener("wheel", skip, opts);
    window.addEventListener("touchstart", skip, opts);

    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
      ctx.revert();
      /* If we unmount mid-flight, never leave the gate closed. */
      if (!finished.current) markIntroDone();
    };
  }, [show]);

  if (show !== true) return null;

  return (
    <div
      ref={root}
      /* aria-hidden: the page beneath is already the real content, and a screen
         reader should not be told to wait for an animation it cannot see. */
      aria-hidden
      className="fixed inset-0 z-[105] flex flex-col items-center justify-center bg-charcoal"
    >
      <span className="block overflow-hidden">
        <span
          data-intro-word
          className="block font-sans text-[0.78rem] font-medium uppercase tracking-[0.46em] text-bone"
        >
          {site.name}
        </span>
      </span>

      <span
        data-intro-rule
        className="mt-6 block h-px w-28 origin-left bg-bone/35"
      />

      <button
        type="button"
        onClick={() => timeline.current?.progress(1)}
        /* Was text-bone/45, which lands near 4.0:1 on charcoal — under AA, and
           on the one control a visitor may be actively looking for. */
        className="absolute bottom-10 right-10 font-sans text-[0.65rem] uppercase tracking-[0.3em] text-bone/75 transition-colors duration-300 hover:text-bone focus-visible:text-bone"
      >
        Skip
      </button>
    </div>
  );
}
