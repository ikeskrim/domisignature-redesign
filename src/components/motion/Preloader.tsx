"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";

import { site } from "@content/site";
import { gsap, CURTAIN, DUR, EASE } from "@/lib/gsap";
import { INTRO_SEEN_KEY, introWillShow, markBooted, markIntroDone } from "@/lib/intro";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* The rule starts a beat after the word and finishes the instant the sheet
   lifts; the sheet then travels for DUR.panel. 0.85 + 0.7 = 1.55s end to end. */
const RULE_AT = 0.15;
const LIFT_AT = 0.85;

/* The one way the gate is opened, so it opens exactly once. */
function release(released: { current: boolean }) {
  if (released.current) return;
  released.current = true;
  markIntroDone();
}

/**
 * The opening curtain. An ivory sheet on the page's raised surface, the
 * wordmark set from behind its line, a hairline drawn left to right, then the
 * sheet lifts off the top of the viewport to uncover the hero underneath.
 *
 * Stage 6, motion on paper: nothing on the sheet fades. The word and the rule
 * leave with the sheet they are printed on, and the sheet's leading edge
 * carries the soft `.panel-edge` gradient while it travels.
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
 *   - **Never under reduced motion** (nor when the drop switch gives it up on
 *     a phone), where it resolves the intro gate at once and renders nothing.
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
  const released = useRef(false);

  /* The hard load has committed: anything mounting after this is a client
     navigation (src/lib/intro.ts). Always, whether or not the sheet shows. */
  useEffect(() => {
    markBooted();
  }, []);

  useEffect(() => {
    /* Asked before the key is written: introWillShow() decides once and
       remembers, so the Hero asking later gets this same answer. */
    if (!introWillShow()) {
      release(released);
      setShow(false);
      return;
    }
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* Storage blocked: the sheet still shows this once. */
    }
    setShow(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (show !== true) return;
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          release(released);
          setShow(false);
        },
      });
      timeline.current = tl;

      tl.from("[data-intro-word]", { yPercent: 110, duration: DUR.settle, ease: EASE }, 0)
        .from("[data-intro-rule]", { scaleX: 0, duration: LIFT_AT - RULE_AT, ease: EASE }, RULE_AT)
        .to(el, { yPercent: -100, duration: DUR.panel, ease: CURTAIN }, LIFT_AT)
        /* Parked above the viewport, the sheet's edge gradient would still
           hang over the header's top 28px until React unmounts it. */
        .set(el, { visibility: "hidden" });
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
      timeline.current = null;
      /* If we unmount mid-flight, never leave the gate closed. */
      release(released);
    };
  }, [show]);

  if (show !== true) return null;

  /* The root is not aria-hidden: the Skip button is focusable, and a focusable
     control inside aria-hidden is announced as nothing. Only the word and the
     rule are hidden - the page beneath is already the real content, and a
     screen reader should not be told to wait for an animation it cannot see. */
  return (
    <div
      ref={root}
      data-preloader
      className="panel-edge fixed inset-0 z-[105] flex flex-col items-center justify-center bg-[var(--surface-raised)]"
    >
      <span aria-hidden className="block overflow-hidden">
        <span
          data-intro-word
          className="block font-sans text-[0.78rem] font-medium uppercase tracking-[0.46em] text-[var(--text-primary)]"
        >
          {site.name}
        </span>
      </span>

      <span
        aria-hidden
        data-intro-rule
        className="mt-6 block h-px w-28 origin-left bg-[var(--rule-strong)]"
      />

      <button
        type="button"
        onClick={() => timeline.current?.progress(1)}
        /* Secondary, not tertiary: tertiary sits at the AA floor, and this is
           the one control a visitor may be actively looking for. */
        className="absolute bottom-10 right-10 font-sans text-[0.65rem] uppercase tracking-[0.3em] text-[var(--text-secondary)] transition-colors duration-300 hover:text-[var(--text-primary)] focus-visible:text-[var(--text-primary)]"
      >
        Skip
      </button>
    </div>
  );
}
