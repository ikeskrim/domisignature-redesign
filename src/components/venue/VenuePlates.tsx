"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { venues } from "@content/venues";
import { capacityLabel, cn, pad2 } from "@/lib/utils";
import { Plate } from "@/components/ui/Plate";
import { runVenueTransition } from "@/components/motion/VenueTransition";
import { prefersReducedMotion, hasFinePointer } from "@/lib/gsap";

/**
 * The venues index as a sourcebook: the north star, shipped.
 *
 * This is the venues-index study (src/app/study/aegean/venues) made real. Each
 * venue is a photograph laid on the page in a Plate, set against its facts in
 * alternating 7/5 columns. On ivory, a full-bleed dusk photograph behind the
 * type reads as a dark hole in a light wall; a matted plate reads as a
 * photograph on a page, which is what the study was built to prove.
 *
 * VenueIndex is not retired: its hover list stays the home scene's signature
 * interaction. /venues is the index you read, so it gets the plates.
 *
 * The facts are the ones the list showed before: number, name, capacity,
 * location, coordinates and Enquire, plus the standfirst the study adds, which
 * is the venue's own line from content. The number derives from position.
 *
 * Headings keep the shipped outline: the sr-only "Our venues" h2 labels the
 * region and each name is an h3, as on the list this replaces. The study used
 * h2 names because it had no region heading above them.
 */
export function VenuePlates() {
  const plates = useRef<(HTMLImageElement | null)[]>([]);
  const router = useRouter();

  /**
   * Carry the photograph into the venue page instead of cutting to it. It now
   * lifts from the plate rather than from a backdrop.
   *
   * The guard, race and fallback are copied from VenueIndex. Only a plain left
   * click is intercepted; modifier and middle clicks still open a new tab. The
   * fine-pointer check is the one addition. On the list this replaced, the
   * transition could only run with a fine pointer, because its backdrops were
   * mounted only then, so a tap navigated plainly. Motion is stage 6's, so a
   * tap still does exactly that.
   */
  const enter = (e: React.MouseEvent, i: number, slug: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const img = plates.current[i];
    if (!img || prefersReducedMotion() || !hasFinePointer()) return;

    e.preventDefault();

    /* Navigate whatever happens. Once preventDefault has been called this code
       owns the click, so a transition that throws or stalls must still end on
       the page that was asked for. The 900ms race guards against a promise
       that never settles. */
    const go = () => router.push(`/venues/${slug}`);
    void Promise.race([
      runVenueTransition(img).catch(() => undefined),
      new Promise((r) => setTimeout(r, 900)),
    ]).then(go);
  };

  return (
    <section
      className="relative bg-[var(--surface)] pb-28 text-[var(--text-primary)] lg:pb-40"
      aria-labelledby="venue-plates-heading"
    >
      <div className="mx-auto w-full max-w-[104rem] px-gutter">
        <h2 id="venue-plates-heading" className="sr-only">
          Our venues
        </h2>

        <ul className="space-y-24 lg:space-y-32">
          {venues.map((venue, i) => {
            const flip = i % 2 === 1;
            return (
              <li
                key={venue.slug}
                className="group relative grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16"
              >
                {/* The plate sits outside the link, and its photograph keeps the
                    empty alt this list's photographs always had: the link that
                    follows already reads the name and standfirst, so an alt
                    carrying them would say both twice. Alt text is frozen. */}
                <Plate
                  className={cn("lg:col-span-7", flip && "lg:order-2")}
                  frameClassName="aspect-[4/3]"
                >
                  <Image
                    ref={(node) => {
                      plates.current[i] = node;
                    }}
                    src={venue.coverImage}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    quality={80}
                    /* The first plate is in the first screen, under the page
                       header: it is the page's largest paint, so it loads now,
                       at high fetch priority (priority alone preloads it at the
                       default, behind the header mark - stage 6). */
                    priority={i === 0}
                    fetchPriority={i === 0 ? "high" : undefined}
                    className="grade-b object-cover"
                  />
                </Plate>

                {/*
                  One link per venue, as before. Its ::after is stretched over
                  the whole row, so the plate is clickable too and a click on
                  the photograph starts the transition from that photograph.
                  The link's name stays the facts in reading order, and the
                  focus ring is the global one, drawn around the text where
                  nothing clips it.
                */}
                <Link
                  href={`/venues/${venue.slug}`}
                  onClick={(e) => enter(e, i, venue.slug)}
                  className={cn(
                    "block after:absolute after:inset-0 after:z-[1] lg:col-span-5",
                    flip && "lg:order-1",
                  )}
                >
                  <p className="font-display text-[1.05rem] text-[var(--text-secondary)]">
                    {pad2(i + 1)}
                  </p>
                  <h3 className="mt-4 font-display text-[clamp(2rem,3.4vw,3rem)] font-light leading-[1.02] text-[var(--text-primary)]">
                    {venue.name}
                  </h3>
                  <p className="mt-6 max-w-md text-[1.0625rem] leading-relaxed text-[var(--text-secondary)]">
                    {venue.standfirst}
                  </p>

                  <div aria-hidden className="rule mt-8" />

                  {/* The separator takes a text role, not --rule: set as a
                      hairline colour a glyph measured 1.24:1 (the breadcrumb
                      finding, settled in stage 4). */}
                  <p className="mt-6 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    {capacityLabel(venue.capacity)}
                    <span className="mx-3">/</span>
                    {venue.location}
                  </p>
                  {/* Coordinates as annotation: the venue's own published
                      position, decoded from its live map embed. */}
                  <p className="mt-2 text-[0.6875rem] tracking-[0.06em] text-[var(--text-secondary)]">
                    {venue.coordinates}
                  </p>

                  <span className="mt-8 flex items-center gap-3">
                    <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-secondary)] transition-colors duration-[600ms] group-hover:text-[var(--text-primary)]">
                      Enquire
                    </span>
                    <span
                      aria-hidden
                      className="relative block h-px w-10 bg-[var(--rule)] transition-colors duration-[600ms] group-hover:bg-[var(--text-primary)]"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
