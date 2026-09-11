"use client";

import { useRef, useLayoutEffect, useEffect, createElement } from "react";

import { cn } from "@/lib/utils";
import { gsap, prefersReducedMotion, startsInViewport } from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Ground = "light" | "dark";
type Tag = "section" | "div" | "header" | "footer" | "article" | "figure";

/**
 * A chapter — a stretch of the page that declares its own ground.
 *
 * This is the one place a light→dark boundary is defined. Amendment 3 to the
 * inversion plan: chapter boundaries are defined ONCE, as a token-driven
 * scale-mask, and reused everywhere — nine scenes must not invent nine of
 * their own. Any section that goes to night wraps itself in this and nothing
 * else; the ground attribute does the colour work, and the mask does the join.
 *
 * The join. A dark chapter meeting an ivory page is a hard edge, and a hard
 * edge is exactly what a printed sourcebook never has: plates sit inside the
 * page's margins. So the chapter ARRIVES as a plate — clipped in from both
 * sides by one gutter, aligned to the content column — and expands to full
 * bleed as it scrolls up into the reader's attention. On the way out it does
 * the reverse, narrowing back into the margins before the ivory resumes. The
 * dark ground is never a wall the page runs into; it is an object laid on it.
 *
 * Mechanics. The clip is a `clip-path: inset()` whose horizontal insets read
 * two custom properties, `--chapter-in` and `--chapter-out`, and take the
 * larger. Each is scrubbed by its own ScrollTrigger — entry as the top edge
 * travels 92% → 40% of the viewport, exit as the bottom edge travels 60% → 8%.
 * Nothing here is pinned, nothing repaints the photograph: a clip on a
 * composited layer is about as cheap as scroll-linked motion gets, which is
 * what the mobile floor requires of anything added to Home.
 *
 * Reduced motion, and the server render, are the FINAL state: both properties
 * default to 0px in CSS, so the chapter is full-bleed before JavaScript and
 * stays that way when the visitor has asked for less movement. A chapter that
 * already fills the first screen at mount — a page's title card — skips the
 * entry mask, because there is nothing to arrive from.
 *
 * Text inside inherits the chapter's ladder. Nothing under it may name a
 * palette literal; it asks for a role and the ground answers.
 */
export function Chapter({
  ground,
  as = "section",
  enter = true,
  exit = true,
  className,
  children,
  ...rest
}: {
  ground: Ground;
  as?: Tag;
  /** Mask the top boundary as the chapter scrolls in. Off for page openers. */
  enter?: boolean;
  /** Mask the bottom boundary as the chapter scrolls out. Off for page closers. */
  exit?: boolean;
  className?: string;
  children: React.ReactNode;
  id?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    /*
     * The gutter in pixels. `--spacing-gutter` is a clamp(), which a custom
     * property keeps as text until something uses it — so it is read through a
     * probe that does, rather than parsed. Measured on refresh, so a resize
     * re-solves the inset instead of animating toward a stale value.
     */
    const gutter = () => {
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;visibility:hidden;width:var(--spacing-gutter)";
      el.appendChild(probe);
      const px = probe.getBoundingClientRect().width;
      probe.remove();
      return `${px}px`;
    };

    const ctx = gsap.context(() => {
      if (enter && !startsInViewport(el)) {
        gsap.fromTo(
          el,
          { "--chapter-in": gutter },
          {
            "--chapter-in": "0px",
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 92%",
              end: "top 40%",
              scrub: 0.4,
              invalidateOnRefresh: true,
            },
          },
        );
      }
      if (exit) {
        gsap.fromTo(
          el,
          { "--chapter-out": "0px" },
          {
            "--chapter-out": gutter,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "bottom 60%",
              end: "bottom 8%",
              scrub: 0.4,
              invalidateOnRefresh: true,
            },
          },
        );
      }
    }, el);

    return () => ctx.revert();
  }, [enter, exit]);

  return createElement(
    as,
    {
      ref,
      "data-ground": ground,
      className: cn("chapter relative bg-[var(--surface)] text-[var(--text-primary)]", className),
      ...rest,
    },
    children,
  );
}
