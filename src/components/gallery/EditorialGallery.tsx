"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Plate } from "@/components/ui/Plate";
import { Lightbox, type LightboxItem } from "@/components/gallery/Lightbox";
import {
  gsap,
  ScrollTrigger,
  EASE,
  DUR,
  STAGGER,
  prefersReducedMotion,
  startsInViewport,
  finishOnFocus,
} from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Editorial masonry gallery. CSS columns keep the natural aspect ratio of every
 * photograph — no cropping to a uniform grid, which is what made the old
 * Bootstrap layout feel like a template.
 *
 * Phase 6 §5: the reveal is now a `ScrollTrigger.batch`. A gallery of thirty-one
 * frames used to mean thirty-one independent viewport watchers, each with its
 * own hard-coded delay, so a row arriving together animated as a ragged queue.
 * batch() collects whatever actually enters the viewport in the same moment and
 * staggers *those*, which is the difference between a considered reveal and a
 * page that looks like it is still loading.
 *
 * Stage 5: each tile is a sourcebook Plate: the photograph in a mat of the
 * raised surface, a hairline at its edge, numbered by position. That way the
 * gallery reads as photographs laid on the page, not as bare frames
 * dissolving into ivory. The mat and hairline paint from the first frame, and
 * the image's width/height attributes reserve its window. So a tile whose lazy
 * image has not arrived reads as an empty plate, not a hole.
 *
 * Stage 6: nothing on paper fades. A batch settles — a lift without a fade —
 * and a tile waiting below the fold is only a little low, never hidden. A focus
 * anywhere in the grid brings every tile home at once, so a tile Tabbed to
 * before or during its settle is already where it will rest. Each tile's plate
 * lifts on hover or focus (`<Plate lift>`), in place of the photograph's hover
 * zoom.
 */
export function EditorialGallery({
  images,
  alt,
  className,
  columns = 3,
  /** How many load eagerly before lazy-loading takes over. */
  eager = 4,
}: {
  images: string[];
  alt: string;
  className?: string;
  columns?: 2 | 3 | 4;
  eager?: number;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const grid = useRef<HTMLDivElement>(null);

  const items: LightboxItem[] = images.map((src, i) => ({
    src,
    alt: `${alt} — image ${i + 1} of ${images.length}`,
  }));

  useIsomorphicLayoutEffect(() => {
    const el = grid.current;
    if (!el || prefersReducedMotion()) return;

    /* The focus listeners, one per settle; removed with the context. */
    const offs: (() => void)[] = [];

    const ctx = gsap.context((self) => {
      /* Tiles already on screen are left untouched — holding them until
         hydration makes one of them the LCP and delays it to whenever JS lands. */
      const tiles = gsap.utils
        .toArray<HTMLElement>("[data-tile]", el)
        .filter((t) => !startsInViewport(t));
      if (!tiles.length) return;
      gsap.set(tiles, { y: 22 });

      /* Never played: a focus inside the grid jumps it to its end, which
         brings every tile still waiting for its batch home at once. */
      offs.push(finishOnFocus(el, gsap.to(tiles, { y: 0, duration: DUR.settle, ease: EASE, paused: true })));

      ScrollTrigger.batch(tiles, {
        start: "top 92%",
        once: true,
        /* batch() calls this a tick after the trigger fires, outside the
           context, so the settle is added back into it: an unmount reverts a
           batch still in flight. */
        onEnter: (batch) => {
          const settle = self.add(() =>
            gsap.to(batch, {
              y: 0,
              duration: DUR.settle,
              ease: EASE,
              stagger: STAGGER.tight,
            }),
          );
          offs.push(finishOnFocus(el, settle));
        },
      });
    }, el);

    return () => {
      offs.forEach((off) => off());
      ctx.revert();
    };
  }, [images]);

  const columnClass = {
    2: "columns-1 sm:columns-2",
    3: "columns-1 sm:columns-2 lg:columns-3",
    4: "columns-2 sm:columns-3 lg:columns-4",
  }[columns];

  return (
    <>
      <div ref={grid} className={cn(columnClass, "gap-5 lg:gap-10", className)}>
        {images.map((src, i) => (
          /* The tile is this div, not the button: the plate lifts while its
             .group :has(:focus-visible), and :has() looks only inside, so the
             group must hold the focused button rather than be it. The margin
             and the column break stay on the column item. */
          <div key={src} className="group mb-5 break-inside-avoid lg:mb-10">
            <button
              type="button"
              data-tile
              data-cursor="view"
              onClick={() => setIndex(i)}
              aria-label={`Open image ${i + 1} of ${images.length} full screen`}
              className="focus-inset block w-full"
            >
              {/* The mat and hairline live inside the button, so the whole plate
                  is the hit target. The button does not clip, and the inset ring
                  (.focus-inset::after, z-index 2) is the button's own child, so
                  no overflow can cut it; the lifting plate is positioned but sets
                  no z-index, so neither it nor its shadow can rise over the ring.
                  The ring lands on the mat, clear of the image at every mat
                  width, lifted or not. The plate is built of spans: a button may
                  hold phrasing content only. */}
              {/* No plate number: the tiles fill masonry columns, so position runs
                  down each column and the top row read 01 / 09 / 17 (stage-5
                  review). The lightbox gives each image its place. */}
              <Plate as="span" lift>
                <Image
                  src={src}
                  alt=""
                  width={1200}
                  height={800}
                  sizes={
                    columns === 4
                      ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  }
                  loading={i < eager ? "eager" : "lazy"}
                  priority={i < Math.min(2, eager)}
                  className="grade-b h-auto w-full"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-transparent transition-colors duration-700 group-hover:bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]"
                />
              </Plate>
            </button>
          </div>
        ))}
      </div>

      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onNavigate={setIndex} />
    </>
  );
}
