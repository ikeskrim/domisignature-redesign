"use client";

import { useEffect, useRef, useState } from "react";

import { useDeferredEmbed } from "@/lib/deferred-embed";

type State = "loading" | "ready" | "error";

/**
 * Google Maps embed, carried over verbatim from the live site's iframe URLs.
 *
 * A third-party iframe can be blocked by a tracker blocker, a corporate proxy
 * or a consent wall, and `load` never fires in those cases — which would leave
 * an empty grey hole where the location should be. If the map has not loaded
 * within a few seconds this falls back to a styled block naming the venue with
 * a direct "Open in Google Maps" link, so the location is always reachable.
 */
export function MapEmbed({
  src,
  title,
  name,
  location,
  mapLink,
}: {
  src: string;
  title: string;
  /** Venue name, shown in the fallback. */
  name: string;
  /** Human-readable location, shown in the fallback. */
  location: string;
  /** Direct maps.google.com link used by the fallback. */
  mapLink: string;
}) {
  const [state, setState] = useState<State>("loading");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * Facade. Three Google Maps embeds sit at the bottom of /contact, each
   * pulling its own framework. Loading them at first paint means every visitor
   * pays for three third-party bundles to see something they may never scroll
   * to. They mount on approach, or the instant the region is pointed at or
   * focused.
   *
   * The location is never gated behind that: the venue name, its address and a
   * direct "Open in Google Maps" link are in the server HTML of the facade
   * itself, so the map is reachable even if the embed never loads at all.
   */
  const { ref: shell, mounted, activate } = useDeferredEmbed<HTMLDivElement>({
    rootMargin: "600px 0px",
  });

  useEffect(() => {
    if (!mounted) return;
    timer.current = setTimeout(() => {
      setState((current) => (current === "loading" ? "error" : current));
    }, 8000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [mounted]);

  if (state === "error") {
    return (
      <div className="flex aspect-[16/10] w-full flex-col justify-between border border-hair bg-graphite p-8 lg:aspect-[21/9] lg:p-12">
        <div>
          <p className="eyebrow text-faint">Location</p>
          <p className="mt-5 font-display text-[clamp(1.6rem,2.4vw,2.25rem)] font-light leading-tight text-bone">
            {name}
          </p>
          <p className="mt-3 text-bone/85">{location}</p>
        </div>

        <a
          href={mapLink}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-4 self-start text-[0.7rem] font-medium uppercase tracking-[0.2em] text-bone"
        >
          Open in Google Maps
          <span className="relative block h-px w-14 bg-hair sm:w-20">
            <span className="absolute inset-0 origin-left scale-x-0 bg-bone transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
          </span>
        </a>
      </div>
    );
  }

  return (
    <div
      ref={shell}
      onPointerEnter={activate}
      onFocusCapture={activate}
      className="relative aspect-[16/10] w-full overflow-hidden bg-graphite lg:aspect-[21/9]"
    >
      {mounted ? (
        <>
          {state === "loading" && (
            <div aria-hidden className="absolute inset-0 animate-pulse bg-hair/50" />
          )}
          <iframe
            src={src}
            title={title}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setState("ready")}
            onError={() => setState("error")}
            className="absolute inset-0 h-full w-full"
          />
        </>
      ) : (
        /* Same box, same aspect — mounting the map shifts nothing. */
        <div className="absolute inset-0 flex flex-col justify-between border border-hair p-8 lg:p-12">
          <div>
            <p className="eyebrow text-faint">Location</p>
            <p className="mt-5 font-display text-[clamp(1.6rem,2.4vw,2.25rem)] font-light leading-tight text-bone">
              {name}
            </p>
            <p className="mt-3 text-bone/85">{location}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <button
              type="button"
              onClick={activate}
              className="border border-hair/35 px-6 py-3 text-[0.6875rem] uppercase tracking-[0.18em] text-bone transition-colors duration-500 hover:bg-bone hover:text-ink"
            >
              Show the map
            </button>

            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-4 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-bone"
            >
              Open in Google Maps
              <span className="relative block h-px w-14 bg-hair sm:w-20">
                <span className="absolute inset-0 origin-left scale-x-0 bg-bone transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
              </span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
