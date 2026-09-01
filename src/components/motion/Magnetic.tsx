"use client";

import { useEffect } from "react";

import { gsap, hasFinePointer, prefersReducedMotion } from "@/lib/gsap";

/**
 * Magnetic pull on primary calls to action.
 *
 * Mounted once at the root and delegated: anything anywhere carrying
 * `data-magnetic` leans a few pixels toward the pointer as it approaches, and
 * springs back when it leaves. Because it is delegated rather than a wrapper
 * component, a CTA opts in by adding one attribute — no import, no extra DOM,
 * and it keeps working across route changes without re-binding.
 *
 * Deliberately restrained: 26px of catch radius beyond the element and a
 * maximum 7px of travel. The point is that the button feels weighted, not that
 * it runs away from the pointer.
 *
 * Fine pointers only, and never under reduced motion — on touch there is no
 * approach to detect, only a tap.
 */
export function Magnetic() {
  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;

    const CATCH = 26;
    const TRAVEL = 7;
    let current: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      const hit = (e.target as Element | null)?.closest?.(
        "[data-magnetic]",
      ) as HTMLElement | null;

      /* Left the previous target — spring it home. */
      if (current && current !== hit) {
        gsap.to(current, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
        current = null;
      }
      if (!hit) return;
      current = hit;

      const r = hit.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      /* Normalised against the element's own half-size plus the catch radius,
         so a wide pill and a small arrow both pull by the same amount. */
      const nx = gsap.utils.clamp(-1, 1, dx / (r.width / 2 + CATCH));
      const ny = gsap.utils.clamp(-1, 1, dy / (r.height / 2 + CATCH));

      gsap.to(hit, { x: nx * TRAVEL, y: ny * TRAVEL, duration: 0.45, ease: "cinema" });
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (current) gsap.set(current, { x: 0, y: 0 });
    };
  }, []);

  return null;
}
