"use client";

import { useMemo, useRef, useState, useLayoutEffect, useEffect } from "react";

import Image from "next/image";
import Link from "next/link";

import { eventCategories, signatureEvents, type SignatureEvent } from "@content/events";
import { Plate } from "@/components/ui/Plate";
import { cn } from "@/lib/utils";
import { Flip } from "gsap/Flip";

import {
  gsap,
  ScrollTrigger,
  EASE,
  DUR,
  STAGGER,
  prefersReducedMotion,
  startsInViewport,
  hasFinePointer,
  finishOnFocus,
} from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* Flip lives here, not in the shared motion contract: this is its only user, so
   it now ships in the events route's chunk alone. */
if (typeof window !== "undefined") gsap.registerPlugin(Flip);

/**
 * The Signature Events index: an editorial masonry of captioned plates, with
 * generous gutters and category filtering. Galleries that have film play it
 * inline on hover.
 *
 * Phase 6 §5: filtering now runs through GSAP Flip. Previously the surviving
 * tiles jumped to their new column positions while only the leavers animated,
 * which read as a page reflowing rather than a collection rearranging. Flip
 * measures every tile before the filter changes and again after, then animates
 * the difference — so a tile that moves from column three to column one glides
 * there.
 *
 * Stage 6: nothing on paper fades. The arrival settles — a lift without a fade —
 * and so does a tile a filter brings in; a tile the filter takes out is simply
 * gone, because React has removed it before Flip could animate it. A focus
 * inside the grid finishes whatever is still moving, and each tile's plate
 * lifts on hover or focus (`<Plate lift>`) in place of the photograph's hover
 * zoom.
 */
export function EventsBrowser() {
  const [filter, setFilter] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  /** Brings the arrival to rest; set by the arrival, called before a filter measures. */
  const settleArrival = useRef<(() => void) | null>(null);
  /** The filters' Flips, in one context for the index's lifetime. */
  const flips = useRef<gsap.Context | null>(null);

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
    /* Every tile at rest first, so Flip measures where the tiles stay rather
       than where an unfinished arrival holds them - and so no tile is left
       waiting on a trigger whose position the new layout has moved. */
    settleArrival.current?.();
    if (grid.current && !prefersReducedMotion()) {
      flipState.current = Flip.getState(grid.current.querySelectorAll("[data-tile]"));
    }
    setFilter(next);
  };

  /* Initial arrival, once. */
  useIsomorphicLayoutEffect(() => {
    const el = grid.current;
    if (!el || prefersReducedMotion()) return;

    const settles: gsap.core.Animation[] = [];
    const offs: (() => void)[] = [];
    const hold = (settle: gsap.core.Animation) => {
      settles.push(settle);
      offs.push(finishOnFocus(el, settle));
    };

    const ctx = gsap.context((self) => {
      /* See EditorialGallery — anything already on screen stays painted, so the
         LCP does not wait for hydration. */
      const tiles = gsap.utils
        .toArray<HTMLElement>("[data-tile]", el)
        .filter((t) => !startsInViewport(t));
      if (!tiles.length) return;
      gsap.set(tiles, { y: 28 });

      /* Never played: a focus inside the grid, or a filter, jumps it to its
         end, which brings every tile still waiting for its batch home at once. */
      hold(gsap.to(tiles, { y: 0, duration: DUR.settle, ease: EASE, paused: true }));

      ScrollTrigger.batch(tiles, {
        start: "top 94%",
        once: true,
        /* batch() calls this a tick after the trigger fires, outside the
           context, so the settle is added back into it: an unmount reverts a
           batch still in flight. */
        onEnter: (batch) =>
          hold(
            self.add(() =>
              gsap.to(batch, {
                y: 0,
                duration: DUR.settle,
                ease: EASE,
                stagger: STAGGER.normal,
              }),
            ),
          ),
      });
    }, el);

    settleArrival.current = () => {
      for (const settle of settles) if (settle.progress() < 1) settle.progress(1);
    };

    return () => {
      settleArrival.current = null;
      offs.forEach((off) => off());
      ctx.revert();
    };
  }, []);

  /* The Flips' context is reverted on unmount only, never by the next filter:
     Flip.getState completes an unfinished Flip, and the next one measures from
     there. Reverting between filters would strip a Flip's styles just before
     the next one measured. */
  useIsomorphicLayoutEffect(
    () => () => {
      flips.current?.revert();
      flips.current = null;
    },
    [],
  );

  /* Then play the difference on every filter change. */
  useIsomorphicLayoutEffect(() => {
    const el = grid.current;
    const state = flipState.current;
    if (!el || !state) return;
    flipState.current = null;

    const ctx = (flips.current ??= gsap.context(() => {}));
    const flip = ctx.add(() =>
      Flip.from(state, {
        duration: 0.72,
        ease: EASE,
        scale: true,
        absolute: true,
        /* A tile the filter brings in settles into its place; it does not fade
           in, because its caption is type on paper. There is no onLeave: React
           has already removed a leaving tile, so nothing is left to animate. */
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { y: 28 },
            { y: 0, duration: DUR.settle, ease: EASE, stagger: STAGGER.tight },
          ),
      }),
    );

    return finishOnFocus(el, flip);
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
          /* The tile is also a .group: its plate lifts while a .group
             :has(:focus-visible), and :has() looks only inside, so the focused
             link's own .group cannot lift it. Same box as the link. */
          <div key={event.slug} data-tile className="group mb-8 break-inside-avoid lg:mb-14">
            <EventTile event={event} index={i} />
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-24 text-center text-lead text-[var(--text-secondary)]">No galleries in this category yet.</p>
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
   * The "Film" mark still renders everywhere, because that is information
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
      className="focus-inset group block"
      data-cursor={film ? "play" : "view"}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/*
        A plate, not a card. Stage 4 set the title, category and Film badge
        over the photograph, so the frame had to declare the dark ground and
        carry a wash, and the badge a veil of its own (it measured 1.99:1 on a
        bright sky without one). On paper that was a wall of dark cards; the
        sourcebook idiom sets the words BENEATH the picture instead, so the
        photograph is shown whole — no wash, no veil, no ground switch — and
        takes grade-b, the light-ground grade. Before the image arrives the
        frame shows the mat: an empty plate, not a hole in the page.
        A div rather than Plate's default figure: inside a link, a figure role
        is one more node between the link and the words that name it.
      */}
      <Plate as="div" lift frameClassName={ratio}>
        <Image
          src={event.coverImage}
          alt={`${event.title} — ${event.category}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          // The first tile is the LCP element on /events, so it is preloaded;
          // everything below it stays lazy.
          priority={index === 0}
          loading={index === 0 ? "eager" : "lazy"}
          className="grade-b object-cover"
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
            className="grade-b absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100"
          >
            {film.webm && <source src={film.webm} type="video/webm" />}
            <source src={film.src} type="video/mp4" />
          </video>
        )}
      </Plate>

      {/*
        The caption, on paper beneath the plate. It is set here rather than in
        Plate's caption slot because the title is an h2 in display type, and
        the slot is one eyebrow span. Its side padding matches the mat's, so
        the words align with the photograph's edge as Plate's own caption does
        — and that padding is also what keeps the .focus-inset ring (4px in,
        3px wide, a 3px halo) off the type: the ring frames the whole link,
        plate and caption, without crossing a letter.
      */}
      <div className="flex items-end justify-between gap-5 px-3 pb-4 pt-5 sm:px-4 lg:px-5 lg:pb-5 lg:pt-6">
        <div>
          {/* No index number here — the galleries are a collection, not a
              sequence, so the plate carries none either (and a filter would
              renumber it). */}
          <h2 className="font-display text-[clamp(1.6rem,2.4vw,2.1rem)] font-light leading-none text-[var(--text-primary)]">
            {event.title}
          </h2>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              {event.category}
              <span className="mx-2.5 text-[var(--text-tertiary)]">/</span>
              {event.gallery.length} images
            </p>
            {film && (
              /* The Film badge, now a caption mark on the category's line. On
                 paper it needs no ground of its own, so the pill goes; it
                 takes the line's step so the apparatus reads as one line. */
              <span className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
                {event.videos!.length === 1 ? "Film" : `${event.videos!.length} films`}
              </span>
            )}
          </div>
        </div>
        <span
          aria-hidden
          className="shrink-0 pb-1 text-[var(--text-secondary)] transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5 group-hover:text-[var(--text-primary)]"
        >
          &rarr;
        </span>
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
          ? "border-[var(--text-primary)] bg-[var(--inverse)] text-[var(--text-on-inverse)]"
          : "border-[var(--rule)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]",
      )}
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="text-[0.58rem]">{children}</span>;
}
