"use client";

/**
 * The last control on the page, in the colophon's meta row.
 *
 * Tertiary, like the copyright beside it: on the raised colophon that is
 * 5.42:1 (4.92 on paper), so the step down the ladder costs no legibility; the
 * hover climbs to primary rather than to gold, which is never a text colour.
 * It draws no ring of its own - the global :focus-visible ring and its halo do
 * - and carries no shadow utility, which would replace the halo. The footer
 * clips its overflow, but the row's padding and the page gutter leave the ring
 * and halo (7px out) clear on every side.
 */
export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        })
      }
      className="group inline-flex items-center gap-2.5 self-start text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)] transition-colors duration-300 hover:text-[var(--text-primary)]"
    >
      Back to top
      <span
        aria-hidden
        className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1"
      >
        &uarr;
      </span>
    </button>
  );
}
