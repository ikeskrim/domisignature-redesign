"use client";

import { useRef, useState, useLayoutEffect, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { venues } from "@content/venues";
import { gsap, hasFinePointer, prefersReducedMotion } from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * A broken grid of matted plates, with a label that follows the cursor.
 *
 * The tooltip is bound only on fine pointers. On touch there is no cursor to
 * follow and no hover state to enter, so it never mounts — and because the
 * label duplicates information already in the link's accessible name, nothing
 * is lost when it is absent. It is `aria-hidden` for the same reason: a screen
 * reader already has "Thalasses — view gallery" from the anchor, and a second
 * copy tracking the mouse would only repeat it.
 *
 * Position is driven by `gsap.quickTo`, which writes straight to the transform
 * on each move rather than allocating a tween per event — a pointermove handler
 * that creates a tween is how a cursor effect ends up costing more frames than
 * everything else on the page combined.
 *
 * The asymmetry is deliberate and derived, not random: each plate takes its
 * column span, aspect and offset from its index, so the rhythm is stable
 * between renders and reads as an edited sequence rather than a shuffle.
 */

const SHAPE = [
  { span: "lg:col-span-7", aspect: "aspect-[4/3]", offset: "" },
  { span: "lg:col-span-4 lg:col-start-9", aspect: "aspect-[3/4]", offset: "lg:mt-32" },
  { span: "lg:col-span-5 lg:col-start-2", aspect: "aspect-square", offset: "lg:-mt-16" },
  { span: "lg:col-span-6 lg:col-start-7", aspect: "aspect-[4/3]", offset: "lg:mt-24" },
];

export function TooltipGrid() {
  const root = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    const bubble = tip.current;
    if (!el || !bubble || !hasFinePointer() || prefersReducedMotion()) return;

    const x = gsap.quickTo(bubble, "x", { duration: 0.42, ease: "power3" });
    const y = gsap.quickTo(bubble, "y", { duration: 0.42, ease: "power3" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x(e.clientX - r.left);
      y(e.clientY - r.top);
    };

    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  /* Fade the bubble rather than mounting and unmounting it, so it never
     re-enters from a stale position when the pointer crosses between plates. */
  useEffect(() => {
    const bubble = tip.current;
    if (!bubble || prefersReducedMotion()) return;
    gsap.to(bubble, { autoAlpha: label ? 1 : 0, duration: 0.28, ease: "power2.out" });
  }, [label]);

  return (
    <div ref={root} className="relative mx-auto w-full max-w-[104rem] px-gutter">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0">
        {venues.map((venue, i) => {
          const s = SHAPE[i % SHAPE.length];
          return (
            <Link
              key={venue.slug}
              href={`/venues/${venue.slug}`}
              aria-label={`${venue.name} — view gallery`}
              onPointerEnter={() => setLabel(`${venue.name} — View Gallery`)}
              onPointerLeave={() => setLabel(null)}
              onFocus={() => setLabel(null)}
              className={`group block ${s.span} ${s.offset}`}
            >
              <div className="border border-[var(--rule)] bg-[var(--surface-raised)] p-3 lg:p-4">
                <div className={`relative overflow-hidden ${s.aspect}`}>
                  <Image
                    src={venue.coverImage}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    quality={80}
                    className="grade-b object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                </div>
              </div>
              <p className="mt-4 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                {String(i + 1).padStart(2, "0")} — {venue.location}
              </p>
            </Link>
          );
        })}
      </div>

      <div
        ref={tip}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-20 -translate-x-1/2 -translate-y-1/2 opacity-0 will-change-transform"
      >
        <span className="block whitespace-nowrap border border-[var(--rule-strong)] bg-[var(--surface-raised)] px-5 py-2.5 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-primary)]">
          {label ?? ""}
        </span>
      </div>
    </div>
  );
}
