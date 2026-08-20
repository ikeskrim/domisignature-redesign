"use client";

import { useRef, useLayoutEffect, useEffect } from "react";

import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * A figure that counts up once, when it arrives, and then stays put.
 *
 * The stats on this site are derived from the content, never typed — "03"
 * because that is how many venues there are, "300" because that is the largest
 * real capacity. So this takes the finished STRING and animates the numbers
 * inside it, rather than taking a number and formatting it. That way
 * zero-padding, an en dash in a range, and any wording all survive untouched,
 * and the component can never quietly render a figure the content does not
 * support.
 *
 *   "03"      -> 00 … 03
 *   "200–300" -> both runs count in parallel, dash intact
 *
 * `once: true` and no repeat: a number that keeps re-counting every time it
 * scrolls past reads as a gimmick, and the brief rules it out.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    /* Split into numeric runs and the separators between them. */
    const parts = value.split(/(\d+)/).filter(Boolean);
    if (!parts.some((p) => /^\d+$/.test(p))) return;

    el.textContent = "";
    const counters: { span: HTMLSpanElement; target: number; pad: number }[] = [];

    for (const part of parts) {
      const span = document.createElement("span");
      if (/^\d+$/.test(part)) {
        span.textContent = "0".repeat(part.length);
        counters.push({ span, target: Number(part), pad: part.length });
      } else {
        span.textContent = part;
      }
      el.appendChild(span);
    }

    const ctx = gsap.context(() => {
      for (const { span, target, pad } of counters) {
        const box = { n: 0 };
        gsap.to(box, {
          n: target,
          duration: 1.6,
          ease: EASE,
          snap: { n: 1 },
          onUpdate: () => {
            span.textContent = String(Math.round(box.n)).padStart(pad, "0");
          },
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      }
    }, el);

    return () => {
      ctx.revert();
      el.textContent = value;
    };
  }, [value]);

  /* Server-rendered and reduced-motion output is the real figure, so the number
     is correct with no JavaScript at all and never animates from a wrong one. */
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
