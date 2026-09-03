"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { venues } from "@content/venues";
import { capacityLabel, cn, pad2 } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { runVenueTransition } from "@/components/motion/VenueTransition";
import { prefersReducedMotion, hasFinePointer } from "@/lib/gsap";

/**
 * THE SIGNATURE ELEMENT.
 *
 * The venues index is an editorial list, not a card grid. Hovering (or
 * keyboard-focusing) a row brings that venue's photograph up full-bleed behind
 * the type while its siblings dim and the name shifts right.
 *
 * All four images are mounted up front and cross-faded by opacity, so the swap
 * is instant on hover rather than triggering a fetch.
 *
 * Below `lg` there is no hover, so the same content renders as a stacked
 * editorial sequence with each image above its name.
 */
export function VenueIndex() {
  const [active, setActive] = useState<number | null>(null);
  const backdrops = useRef<(HTMLImageElement | null)[]>([]);
  const [backdropsReady, setBackdropsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (hasFinePointer()) setBackdropsReady(true);
  }, []);

  /**
   * Carry the photograph into the venue page instead of cutting to it.
   *
   * Only intercepts a plain left click — modifier clicks and middle clicks
   * still open a new tab, which is exactly what someone doing that is asking
   * for, and a hijacked one would be a bug rather than a flourish.
   */
  const enter = (e: React.MouseEvent, i: number, slug: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const img = backdrops.current[i];
    if (!img || prefersReducedMotion()) return;

    e.preventDefault();
    setActive(i);

    /*
     * Navigate whatever happens. Once preventDefault has been called this code
     * owns the click, so the push must not be reachable only through the happy
     * path — if the animation throws or stalls, the visitor still gets the page
     * they asked for. A 900ms race guards against a promise that never settles.
     */
    const go = () => router.push(`/venues/${slug}`);
    void Promise.race([
      runVenueTransition(img).catch(() => undefined),
      new Promise((r) => setTimeout(r, 900)),
    ]).then(go);
  };

  return (
    <section className="relative bg-ink text-bone" aria-labelledby="venue-index-heading">
      {/* ---------- Desktop: the hover list ---------- */}
      <div className="relative hidden min-h-[100svh] lg:flex lg:flex-col lg:justify-center">
        {/*
          Backdrop stack.

          Mounted only once a fine pointer is confirmed. `hidden lg:flex` on the
          wrapper stops these full-bleed photographs being SEEN on a phone, but
          display:none does not stop an <img> being FETCHED — so every mobile
          visitor was downloading one full-viewport image per venue for a hover
          effect that cannot happen on touch, on top of the same images the
          stacked list below actually shows. Deferring the mount to a client-side
          pointer check costs nothing on desktop (it resolves on the first
          effect, long before anyone reaches a row) and halves the mobile
          payload of this section.
        */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          {backdropsReady && venues.map((venue, i) => (
            <div
              key={venue.slug}
              className={cn(
                "absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                active === i ? "opacity-100" : "opacity-0",
              )}
            >
              <Image
                ref={(node) => {
                  backdrops.current[i] = node;
                }}
                src={venue.coverImage}
                alt=""
                fill
                sizes="100vw"
                quality={80}
                loading="lazy"
                className={cn(
                  "grade object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                  active === i ? "scale-105" : "scale-100",
                )}
              />
            </div>
          ))}
          {/* Scrim strengthens only while an image is up, so type stays legible. */}
          <div
            className={cn(
              "absolute inset-0 transition-colors duration-[900ms]",
              active !== null ? "bg-ink/62" : "bg-ink/0",
            )}
          />
        </div>

        <div className="relative mx-auto w-full max-w-[104rem] px-gutter">
          <h2 id="venue-index-heading" className="sr-only">
            Our venues
          </h2>

          <ul onMouseLeave={() => setActive(null)}>
            {venues.map((venue, i) => (
              <li key={venue.slug} className="border-t border-bone/12 last:border-b">
                <Link
                  href={`/venues/${venue.slug}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={(e) => enter(e, i, venue.slug)}
                  className={cn(
                    "group flex items-baseline gap-8 py-12 transition-opacity duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] xl:gap-12 xl:py-16",
                    active !== null && active !== i ? "opacity-30" : "opacity-100",
                  )}
                >
                  <span className="eyebrow w-8 shrink-0 pt-3 text-bone/55">
                    {pad2(i + 1)}
                  </span>

                  <span
                    className={cn(
                      "flex-1 font-display text-[clamp(2.75rem,5.8vw,6.5rem)] font-light leading-[0.92] tracking-[-0.028em] transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                      "group-hover:translate-x-5 group-focus-visible:translate-x-5",
                    )}
                  >
                    {venue.name}
                  </span>

                  {/*
                    Condition 4 — C's contact-sheet density, held inside the
                    noir register. Capacity and location are always present, in
                    fixed-width columns so nothing reflows on hover, and every
                    row carries the sitewide primary CTA rather than a bare
                    arrow.
                  */}
                  <span className="w-32 shrink-0 pb-2 text-right text-[0.6875rem] uppercase leading-relaxed tracking-[0.18em] text-bone/70">
                    {capacityLabel(venue.capacity)}
                  </span>
                  {/* Coordinates as annotation — the venue's own published
                      position, decoded from its live map embed. */}
                  <span className="hidden w-56 shrink-0 pb-2 text-right leading-relaxed lg:block">
                    <span className="block text-[0.6875rem] tracking-[0.06em] text-muted">
                      {venue.coordinates}
                    </span>
                    <span className="mt-1 block text-[0.6875rem] uppercase tracking-[0.18em] text-bone/55">
                      {venue.location}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 pb-2">
                    <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-bone/70 transition-colors duration-[600ms] group-hover:text-bone">
                      Enquire
                    </span>
                    <span
                      aria-hidden
                      className="relative block h-px w-10 bg-bone/30 transition-colors duration-[600ms] group-hover:bg-bone"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------- Below lg: a stacked editorial sequence ---------- */}
      <ul className="lg:hidden">
        {venues.map((venue, i) => (
          <li key={venue.slug}>
            <Link href={`/venues/${venue.slug}`} className="group block">
              <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10]">
                <Image
                  src={venue.coverImage}
                  alt=""
                  fill
                  sizes="100vw"
                  quality={80}
                  loading="lazy"
                  className={cn("grade object-cover", i % 2 === 0 ? "ken" : "ken-alt")}
                />
                <div aria-hidden className="scrim-bottom absolute inset-0" />

                <div className="absolute inset-x-0 bottom-0 p-gutter pb-10">
                  <Reveal y={12}>
                    <span className="eyebrow block text-bone/60">{pad2(i + 1)}</span>
                  </Reveal>

                  <h3 className="mt-4 font-display text-[clamp(2.5rem,11vw,4rem)] font-light leading-[0.95]">
                    {venue.name}
                  </h3>

                  {/*
                    Condition 1 — touch devices never withhold. Below lg every
                    row shows its photograph by default, with the same capacity,
                    location and CTA the desktop rows carry.
                  */}
                  <p className="mt-4 text-[0.6875rem] tracking-[0.06em] text-muted">
                    {venue.coordinates}
                  </p>
                  <p className="mt-2 text-[0.6875rem] uppercase tracking-[0.2em] text-bone/70">
                    {capacityLabel(venue.capacity)}
                    <span className="mx-3 text-bone/40">/</span>
                    {venue.location}
                  </p>

                  <span className="mt-6 inline-flex items-center gap-3 text-[0.6875rem] uppercase tracking-[0.2em] text-bone">
                    Enquire
                    <span aria-hidden className="block h-px w-10 bg-bone/50" />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
