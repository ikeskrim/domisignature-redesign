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

    const ctx = gsap.context(() => {
      /* Tiles already on screen are left visible — hiding them until hydration
         makes one of them the LCP and delays it to whenever JS lands. */
      const tiles = gsap.utils
        .toArray<HTMLElement>("[data-tile]", el)
        .filter((t) => !startsInViewport(t));
      if (!tiles.length) return;
      gsap.set(tiles, { opacity: 0, y: 22 });

      ScrollTrigger.batch(tiles, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: DUR.reveal,
            ease: EASE,
            stagger: STAGGER.tight,
            overwrite: true,
          }),
      });
    }, el);

    return () => ctx.revert();
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
          <button
            key={src}
            type="button"
            data-tile
            data-cursor="view"
            onClick={() => setIndex(i)}
            aria-label={`Open image ${i + 1} of ${images.length} full screen`}
            className="focus-inset group mb-5 block w-full break-inside-avoid lg:mb-10"
          >
            {/* The mat and hairline live inside the button, so the whole plate is
                the hit target. The frame clips the hover scale; the button does
                not clip, and the inset ring (.focus-inset::after, z-index 2) is
                the button's own child, so no overflow can cut it and nothing in
                the frame, which sets no z-index, can rise over it. It lands on
                the mat, clear of the image at every mat width. The plate is
                built of spans: a button may hold phrasing content only. */}
            {/* No plate number: the tiles fill masonry columns, so position runs
                down each column and the top row read 01 / 09 / 17 (stage-5
                review). The lightbox gives each image its place. */}
            <Plate as="span">
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
                className="grade-b h-auto w-full transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-transparent transition-colors duration-700 group-hover:bg-[color-mix(in_srgb,var(--text-primary)_10%,transparent)]"
              />
            </Plate>
          </button>
        ))}
      </div>

      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onNavigate={setIndex} />
    </>
  );
}
