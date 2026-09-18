"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Video with a poster-frame overlay so nothing downloads until the visitor asks
 * for it. WebM is offered first, MP4 second.
 *
 * The figure is a dark chapter in miniature — a poster is a photograph, and the
 * play affordance sits directly on it — so it declares `data-ground="dark"`
 * itself and its controls take the night ladder on whatever page it is placed.
 */
export function VideoPlayer({
  src,
  webm,
  poster,
  label,
  className,
}: {
  src: string;
  webm?: string;
  poster?: string;
  label: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const start = () => {
    setStarted(true);
    // Let React paint the controls before asking the element to play.
    requestAnimationFrame(() => void videoRef.current?.play());
  };

  return (
    <figure data-ground="dark" className={cn("relative overflow-hidden bg-[var(--surface)]", className)}>
      <video
        ref={videoRef}
        controls={started}
        preload="none"
        playsInline
        poster={poster}
        aria-label={label}
        className="aspect-video h-full w-full object-cover"
      >
        {webm && <source src={webm} type="video/webm" />}
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {!started && (
        <button
          type="button"
          onClick={start}
          /* The button fills a figure that clips its overflow, so the ring the
             page draws outside it was invisible (measured: no indicator at all).
             .focus-inset draws the same ring and halo inside the frame instead. */
          className="group absolute inset-0 flex items-center justify-center bg-[rgb(var(--wash)/0.2)] focus-inset transition-colors duration-500 hover:bg-[color-mix(in_srgb,var(--text-primary)_30%,transparent)]"
          aria-label={`Play video — ${label}`}
        >
          {/* The ring takes its colour from the type ladder, not the rule
              ladder: a rule is solved against the bare ground, but this ring
              sits on a poster of unknown tone around the glyph it frames.
              Primary at 60% keeps it a step below the play mark, and it rises
              to full primary on hover. */}
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--text-primary)_60%,transparent)] text-[var(--text-primary)] backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:border-[var(--text-primary)] group-hover:bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]">
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-current" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </figure>
  );
}
