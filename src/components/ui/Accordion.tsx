"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";

import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface AccordionEntry {
  heading: string;
  body: string;
}

/**
 * Native-feeling disclosure list. Built on buttons with aria-expanded rather
 * than <details> so the open/close can be animated.
 *
 * Phase 6 §5: rebuilt on GSAP. Panels now stay mounted and animate their own
 * height instead of being added and removed from the tree, which keeps every
 * `aria-controls` pointing at an element that actually exists — with
 * AnimatePresence the target of a collapsed panel's id vanished from the DOM.
 * Collapsed panels are set `visibility: hidden` once closed, so their text
 * leaves both the accessibility tree and the tab order rather than lurking at
 * zero height.
 */
export function Accordion({ items }: { items: AccordionEntry[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  /* Skip the very first pass so the initially-open panel is simply open. */
  const mounted = useRef(false);

  useIsomorphicLayoutEffect(() => {
    const reduced = prefersReducedMotion();

    panels.current.forEach((el, i) => {
      if (!el) return;
      const expanded = open === i;

      if (!mounted.current || reduced) {
        gsap.set(el, {
          height: expanded ? "auto" : 0,
          opacity: expanded ? 1 : 0,
          visibility: expanded ? "visible" : "hidden",
        });
        return;
      }

      gsap.killTweensOf(el);
      if (expanded) {
        gsap.set(el, { visibility: "visible" });
        gsap.to(el, { height: "auto", opacity: 1, duration: 0.5, ease: EASE });
      } else {
        gsap.to(el, {
          height: 0,
          opacity: 0,
          duration: 0.5,
          ease: EASE,
          onComplete: () => gsap.set(el, { visibility: "hidden" }),
        });
      }
    });

    mounted.current = true;
  }, [open]);

  if (items.length === 0) return null;

  return (
    <ul className="border-t border-hair">
      {items.map((item, i) => {
        const expanded = open === i;
        const panelId = `accordion-panel-${i}`;
        const buttonId = `accordion-button-${i}`;

        return (
          <li key={item.heading} className="border-b border-hair">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : i)}
                className="group flex w-full items-start justify-between gap-8 py-6 text-left"
              >
                <span className="font-display text-[1.35rem] font-light leading-snug text-bone lg:text-[1.6rem]">
                  {item.heading}
                </span>
                <span
                  aria-hidden
                  className="relative mt-2.5 block h-3.5 w-3.5 shrink-0 text-muted transition-colors group-hover:text-bone"
                >
                  <span className="absolute left-0 top-1/2 block h-px w-3.5 bg-current" />
                  <span
                    className={`absolute left-1/2 top-0 block h-3.5 w-px bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      expanded ? "scale-y-0" : "scale-y-100"
                    }`}
                  />
                </span>
              </button>
            </h3>

            <div
              ref={(el) => {
                panels.current[i] = el;
              }}
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="overflow-hidden"
            >
              <p className="pb-7 pr-10 leading-relaxed text-bone/85">{item.body}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
