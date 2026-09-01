"use client";

import { useMemo, useRef, useState, useLayoutEffect, useEffect } from "react";

import Image from "next/image";
import Link from "next/link";

import { eventCategories, signatureEvents, type SignatureEvent } from "@content/events";
import { cn } from "@/lib/utils";
import {
  gsap,
  Flip,
  ScrollTrigger,
  EASE,
  DUR,
  STAGGER,
  prefersReducedMotion,
  startsInViewport,
  hasFinePointer,
} from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * The Signature Events index: an editorial masonry with generous gutters and
 * category filtering. Galleries that have film play it inline on hover.
 *
 * Phase 6 §5: filtering now runs through GSAP Flip. Previously the surviving
 * tiles jumped to their new column positions while only the leavers animated,
 * which read as a page reflowing rather than a collection rearranging. Flip
 * measures every tile before the filter changes and again after, then animates
 * the difference — so a tile that moves from column three to column one glides
 * there, and only genuinely departing tiles fade.
 */
export function EventsBrowser() {
  const [filter, setFilter] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  const visible = useMemo(
    () => (filter ? signatureEvents.filter((e) => e.category === filter) : signatureEvents),
    [filter],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of signatureEvents) {
      map.set(event.category, (map.get(event.category) ?? 0) + 1);
    }
    return map;
  }, []);

  /** Capture the layout BEFORE React re-renders with the new filter. */
  const changeFilter = (next: string | null) => {
    if (next === filter) return;
    if (grid.current && !prefersReducedMotion()) {
      flipState.current = Flip.getState(grid.current.querySelectorAll("[data-tile]"));
    }
    setFilter(next);
  };

  /* Initial arrival, once. */
  useIsomorphicLayoutEffect(() => {
    const el = grid.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      /* See EditorialGallery — anything already on screen stays painted, so the
         LCP does not wait for hydration. */
      const tiles = gsap.utils
        .toArray<HTMLElement>("[data-tile]", el)
        .filter((t) => !startsInViewport(t));
      if (!tiles.length) return;
      gsap.set(tiles, { opacity: 0, y: 28 });
      ScrollTrigger.batch(tiles, {
        start: "top 94%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: DUR.reveal,
            ease: EASE,
            stagger: STAGGER.normal,
            overwrite: true,
          }),
      });
    }, el);

    return () => ctx.revert();
  }, []);

  /* Then play the difference on every filter change. */
  useIsomorphicLayoutEffect(() => {
    const state = flipState.current;
    if (!state) return;
    flipState.current = null;

    Flip.from(state, {
      duration: 0.72,
      ease: EASE,
      scale: true,
      absolute: true,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { opacity: 0, scale: 0.94 },
          { opacity: 1, scale: 1, duration: 0.55, ease: EASE, stagger: STAGGER.tight },
        ),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.35, ease: EASE }),
    });
  }, [filter]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <FilterChip active={filter === null} onClick={() => changeFilter(null)}>
          All
          <Count>{signatureEvents.length}</Count>
        </FilterChip>

        {eventCategories.map((category) => (
          <FilterChip
            key={category}
            active={filter === category}
            onClick={() => changeFilter(category)}
          >
            {category}
            <Count>{counts.get(category) ?? 0}</Count>
          </FilterChip>
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        Showing {visible.length} of {signatureEvents.length} galleries
        {filter ? ` in ${filter}` : ""}.
      </p>

      <div
        ref={grid}
        className="mt-20 columns-1 gap-8 sm:columns-2 lg:mt-28 lg:columns-3 lg:gap-14"
      >
        {visible.map((event, i) => (
          <div key={event.slug} data-tile className="mb-8 break-inside-avoid lg:mb-14">
            <EventTile event={event} index={i} />
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-24 text-center text-lead text-muted">No galleries in this category yet.</p>
      )}
    </>
  );
}

function EventTile({ event, index }: { event: SignatureEvent; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const film = event.videos?.[0];

  /*
   * The <video> is mounted only once a fine pointer is confirmed.
   *
   * `preload="none"` stops the FILM downloading, but a browser fetches a
   * `poster` eagerly regardless — and four posters were 658 KB, a third of this
   * page's entire weight on mobile. They paid for a hover effect that a touch
   * device cannot perform: there is no `mouseenter` on a phone, so the video
   * never played and the bytes were pure loss.
   *
   * The "Film" badge still renders everywhere, because that is information
   * about the gallery rather than a hover affordance.
   */
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    if (hasFinePointer()) setCanHover(true);
  }, []);

  /* Film only loads when the pointer arrives — never on page load. */
  const onEnter = () => {
    if (prefersReducedMotion() || !videoRef.current) return;
    void videoRef.current.play().catch(() => {});
  };

  const onLeave = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  const ratio =
    index % 3 === 0 ? "aspect-[4/5]" : index % 3 === 1 ? "aspect-[4/3]" : "aspect-square";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block"
      data-cursor={film ? "play" : "view"}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className={cn("relative overflow-hidden bg-graphite", ratio)}>
        <Image
          src={event.coverImage}
          alt={`${event.title} — ${event.category}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          // The first tile is the LCP element on /events, so it is preloaded;
          // everything below it stays lazy.
          priority={index === 0}
          loading={index === 0 ? "eager" : "lazy"}
          className="grade object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />

        {film && canHover && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            poster={film.poster}
            aria-hidden
            tabIndex={-1}
            className="grade absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100"
          >
            {film.webm && <source src={film.webm} type="video/webm" />}
            <source src={film.src} type="video/mp4" />
          </video>
        )}

        <div aria-hidden className="scrim-bottom absolute inset-0" />

        {film && (
          /*
            The card's scrim is `scrim-bottom`, and this badge sits at the TOP,
            over whatever the photograph happens to be doing there. Measured on
            "A ceremony by the water" — bone/80 on a bright sky — it came out at
            1.99:1 against the 4.5:1 that 11px text needs. axe cannot see this:
            it has no way to compute contrast against a photograph.

            A shadow rather than a scrim or a pill, because it costs nothing
            where the photograph is already dark and does not add a second
            rectangle to a card that is deliberately clean.
          */
          <span
            className="absolute right-5 top-5 flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.18em] text-bone/80"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.85), 0 0 10px rgba(0,0,0,0.55)" }}
          >
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            {event.videos!.length === 1 ? "Film" : `${event.videos!.length} films`}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-7">
          <div>
            {/* No index number here — the galleries are a collection, not a sequence. */}
            <h2 className="font-display text-[clamp(1.6rem,2.4vw,2.1rem)] font-light leading-none text-bone">
              {event.title}
            </h2>
            <p className="mt-2.5 text-[0.6875rem] uppercase tracking-[0.2em] text-bone/60">
              {event.category}
              <span className="mx-2.5 text-bone/30">/</span>
              {event.gallery.length} images
            </p>
          </div>
          <span
            aria-hidden
            className="shrink-0 pb-1 text-bone/60 transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5 group-hover:text-bone"
          >
            &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border px-6 py-3 text-[0.6875rem] uppercase tracking-[0.18em]",
        "transition-[color,background-color,border-color] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        active
          ? "border-bone bg-bone text-ink"
          : "border-hair/30 text-muted hover:border-bone hover:text-bone",
      )}
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="text-[0.58rem] opacity-55">{children}</span>;
}
