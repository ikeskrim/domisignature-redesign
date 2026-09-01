"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Video with a poster-frame overlay so nothing downloads until the visitor asks
 * for it. WebM is offered first, MP4 second.
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
    <figure className={cn("relative overflow-hidden bg-ink", className)}>
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
          className="group absolute inset-0 flex items-center justify-center bg-ink/20 transition-colors duration-500 hover:bg-bone/30"
          aria-label={`Play video — ${label}`}
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-bone/60 text-bone backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:border-bone group-hover:bg-bone/10">
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-current" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </figure>
  );
}
