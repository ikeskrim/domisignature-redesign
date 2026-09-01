"use client";

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
      className="group inline-flex items-center gap-2.5 self-start text-xs uppercase tracking-[0.18em] text-bone/55 transition-colors duration-300 hover:text-bone"
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
