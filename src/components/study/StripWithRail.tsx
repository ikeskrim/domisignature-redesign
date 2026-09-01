"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { signatureEvents } from "@content/events";

/**
 * STUDY ONLY — a copy of the events shelf with a progress rail underneath.
 *
 * The shipped component, `home/EventsStrip.tsx`, is not imported and not
 * touched. This mirrors its card markup closely enough to judge the addition
 * and nothing more: no drag, no cursor state, no links. It exists to be looked
 * at beside the real thing and then thrown away or promoted.
 *
 * The rail tracks scrollLeft as a fraction of the scrollable distance. It is
 * `aria-hidden` because it tells a screen reader nothing a native scroll
 * container does not already say.
 */
export function StripWithRail() {
  const scroller = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);

  return (
    <div>
      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 lg:gap-12"
        style={{ scrollPaddingInline: "var(--spacing-gutter, 1.5rem)" }}
      >
        {signatureEvents.map((event, i) => (
          <div
            key={event.slug}
            className="block w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw] xl:w-[26rem]"
          >
            <div
              className={`relative overflow-hidden bg-graphite ${
                i % 3 === 0 ? "aspect-[4/5]" : i % 3 === 1 ? "aspect-[4/3]" : "aspect-square"
              }`}
            >
              <Image
                src={event.coverImage}
                alt=""
                fill
                sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 30vw"
                loading="lazy"
                draggable={false}
                className="grade object-cover"
              />
              <div aria-hidden className="scrim-bottom absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <h3 className="font-display text-[clamp(1.6rem,2.4vw,2.1rem)] font-light leading-none text-bone">
                  {event.title}
                </h3>
                <p className="mt-2.5 text-[0.6875rem] uppercase tracking-[0.2em] text-bone/60">
                  {event.category}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* The proposal: one hairline, filled to show how far the shelf runs. */}
      <div aria-hidden className="mt-6 h-px w-full bg-hair">
        <div
          className="h-px bg-bone/70 transition-[width] duration-150 ease-out"
          style={{ width: `${Math.max(8, progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
