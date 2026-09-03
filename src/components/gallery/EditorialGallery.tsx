"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
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
            className="group mb-5 block w-full break-inside-avoid overflow-hidden bg-graphite lg:mb-10"
          >
            <span className="relative block overflow-hidden">
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
                priority={i < 2}
                className="grade h-auto w-full transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-700 group-hover:bg-bone/10"
              />
            </span>
          </button>
        ))}
      </div>

      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onNavigate={setIndex} />
    </>
  );
}
