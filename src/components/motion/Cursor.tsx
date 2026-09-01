"use client";

import { useEffect, useRef, useState } from "react";

import { gsap, hasFinePointer, prefersReducedMotion } from "@/lib/gsap";

/**
 * The cursor states — a small bone dot that trails the pointer, and swells into
 * a labelled disc over anything that declares what it does.
 *
 * Opt in from anywhere with `data-cursor="view" | "play" | "drag"`. A gallery
 * tile says View, an event card carrying film says Play, a draggable strip says
 * Drag. Nothing else changes the cursor, because a custom cursor that reacts to
 * everything is noise — it should only ever answer the question "what happens
 * if I click this?".
 *
 * Rules:
 *   - **Fine pointers only.** Never mounted on touch, where there is no cursor
 *     to replace and the dot would just be a stray dot.
 *   - **Never under reduced motion**, where a lagging element chasing the
 *     pointer is exactly the effect being opted out of.
 *   - **The real cursor is left alone.** This draws *alongside* it rather than
 *     hiding it with `cursor: none`, so the system pointer — which some people
 *     rely on, and which carries OS accessibility settings like size and
 *     contrast — is never taken away.
 *   - `pointer-events: none` and `aria-hidden` throughout: it can never
 *     intercept a click or reach the accessibility tree.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = dot.current;
    const text = label.current;
    if (!el || !text) return;

    gsap.set(el, { xPercent: -50, yPercent: -50, opacity: 0 });

    /* quickTo keeps the follow on GSAP's ticker rather than one tween per
       mousemove — the dot eases toward the pointer instead of snapping. */
    const moveX = gsap.quickTo(el, "x", { duration: 0.38, ease: "power3" });
    const moveY = gsap.quickTo(el, "y", { duration: 0.38, ease: "power3" });

    let visible = false;
    const onMove = (e: PointerEvent) => {
      moveX(e.clientX);
      moveY(e.clientY);
      if (!visible) {
        visible = true;
        gsap.to(el, { opacity: 1, duration: 0.3 });
      }

      const target = (e.target as Element | null)?.closest?.("[data-cursor]");
      const state = target?.getAttribute("data-cursor") ?? null;

      if (state && text.textContent !== state) {
        text.textContent = state;
        gsap.to(el, { width: 74, height: 74, duration: 0.42, ease: "cinema" });
        gsap.to(text, { opacity: 1, duration: 0.28 });
      } else if (!state && text.textContent !== "") {
        text.textContent = "";
        gsap.to(el, { width: 9, height: 9, duration: 0.42, ease: "cinema" });
        gsap.to(text, { opacity: 0, duration: 0.18 });
      }
    };

    const onLeave = () => {
      visible = false;
      gsap.to(el, { opacity: 0, duration: 0.25 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] flex h-[9px] w-[9px] items-center justify-center rounded-full border border-bone/70 bg-bone/12 backdrop-blur-[2px]"
    >
      <span
        ref={label}
        className="select-none font-sans text-[0.55rem] uppercase tracking-[0.22em] text-bone opacity-0"
      />
    </div>
  );
}
