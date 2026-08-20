"use client";

import { useCallback, useEffect, useRef, useLayoutEffect } from "react";
import Image from "next/image";

import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface LightboxItem {
  src: string;
  alt: string;
}

/**
 * Accessible full-screen image viewer replacing the site's old GLightbox.
 *
 * - Arrow keys / Escape, wrapping at both ends
 * - Focus is moved into the dialog and returned to the trigger on close
 * - Background scroll locked while open
 *
 * Phase 6 §5: rebuilt on GSAP. Closing now animates before it unmounts — every
 * close routes through `dismiss()`, so Escape, the close button and a backdrop
 * click all fade out identically instead of Escape snapping shut while the
 * button faded. Focus is still returned to whatever opened it.
 */
export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  const open = index !== null;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onNavigate((index + delta + items.length) % items.length);
    },
    [index, items.length, onNavigate],
  );

  /** Fade out, then unmount. All close paths go through here. */
  const dismiss = useCallback(() => {
    const el = dialogRef.current;
    if (closing.current) return;
    if (!el || prefersReducedMotion()) {
      onClose();
      return;
    }
    closing.current = true;
    gsap.to(el, {
      opacity: 0,
      duration: 0.3,
      ease: EASE,
      onComplete: () => {
        closing.current = false;
        onClose();
      },
    });
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    restoreFocusTo.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      restoreFocusTo.current?.focus?.();
    };
  }, [open, dismiss, go]);

  /* Fade the whole dialog in on open. */
  useIsomorphicLayoutEffect(() => {
    const el = dialogRef.current;
    if (!el || !open || prefersReducedMotion()) return;
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: EASE });
  }, [open]);

  const current = index !== null ? items[index] : null;

  /* Cross-fade the stage whenever the frame changes. */
  useIsomorphicLayoutEffect(() => {
    const el = stageRef.current;
    if (!el || !current || prefersReducedMotion()) return;
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.985 },
      { opacity: 1, scale: 1, duration: 0.45, ease: EASE },
    );
  }, [current?.src]);

  if (!open || !current) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${(index ?? 0) + 1} of ${items.length}`}
      tabIndex={-1}
      className="fixed inset-0 z-[80] flex flex-col bg-ink/97 outline-none backdrop-blur-sm"
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-gutter py-6">
        <span className="eyebrow text-bone/55" aria-hidden>
          {String((index ?? 0) + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={dismiss}
          className="group flex items-center gap-3 p-2 text-bone/70 transition-colors hover:text-bone"
        >
          <span className="eyebrow">Close</span>
          <span className="relative block h-4 w-4" aria-hidden>
            <span className="absolute left-0 top-1/2 block h-px w-4 rotate-45 bg-current" />
            <span className="absolute left-0 top-1/2 block h-px w-4 -rotate-45 bg-current" />
          </span>
        </button>
      </div>

      {/* Stage */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16">
        <div ref={stageRef} className="relative h-full w-full">
          <Image
            src={current.src}
            alt={current.alt}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-1 top-1/2 -translate-y-1/2 p-4 text-2xl text-bone/60 transition-colors hover:text-bone sm:left-4"
            >
              &larr;
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-1 top-1/2 -translate-y-1/2 p-4 text-2xl text-bone/60 transition-colors hover:text-bone sm:right-4"
            >
              &rarr;
            </button>
          </>
        )}
      </div>

      <p className="shrink-0 px-gutter pb-7 text-center text-xs text-bone/55">{current.alt}</p>
    </div>
  );
}
