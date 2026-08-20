import Image from "next/image";

import { venues } from "@content/venues";
import { journey } from "@content/journey";

/**
 * DIRECTION D — Cretan Light
 *
 * The White Desert language translated, never copied: sun-bleached warm white
 * ground, photography in full warm colour, and haze veils standing in for their
 * cloud overlays — Cretan sea-light at the section seams.
 *
 * Type inverts from noir. The geometric sans carries the display weight, the
 * serif disappears, and a mono is reserved for coordinates. Facts are set as
 * the luxury: real capacities and real coordinates, both taken from the
 * existing content and map embeds. No invented numbers.
 */

/* Coordinates decoded from each venue's live Google Maps embed. */
const COORDS: Record<string, string> = {
  "mountain-escape": `35°16'06.2"N  24°19'15.0"E`,
  thalasses: `35°22'51.7"N  24°34'19.7"E`,
  "olive-stories": `35°21'00.7"N  24°36'03.2"E`,
};

const capacityNumber = (c: string) => c.replace("How many people can fit: up to ", "");

export default function DirectionD() {
  /*
   * These study pages used to index the venue list by position. When Villa
   * Aetos was withdrawn, `venues[3]` became undefined and the production build
   * failed prerendering this route — an archived study broke the live build.
   * Resolved by slug with a fallback, so the studies survive any future change
   * to the collection.
   */
  const venue = venues.find((v) => v.slug === "olive-stories") ?? venues[0];

  return (
    <main className="dir dir-d">
      {/* ------------------------------------------- 1. Hero — video first */}
      <section className="plate relative flex h-[100svh] min-h-[34rem] flex-col justify-between overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/media/video/hero.jpg"
          aria-hidden
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/media/video/hero.webm" type="video/webm" />
          <source src="/media/video/hero.mp4" type="video/mp4" />
        </video>

        {/* Haze at both seams — the page ground bleeding into the film */}
        <div className="haze-t" aria-hidden />
        <div className="haze-b" aria-hidden />

        <div className="relative px-6 pt-28 lg:px-16">
          <p className="label !text-[var(--ink)]/70">Luxury weddings &amp; private celebrations</p>
        </div>

        <div className="relative px-6 pb-14 lg:px-16 lg:pb-20">
          {/* The giant single word */}
          <h1 className="display text-[clamp(4.5rem,20vw,18rem)]">Crete</h1>

          <div className="mt-8 flex flex-col gap-8 border-t border-[var(--hair)] pt-8 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-md text-[1.05rem] leading-relaxed text-[var(--ink)]/80">
              Luxury weddings and private celebrations across three venues in Crete.
            </p>

            {/* Two persistent CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/contact"
                className="rounded-full bg-[var(--ink)] px-8 py-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-[var(--bg)]"
              >
                Enquire
              </a>
              <a
                href="/assets/files/Weddingbrochure.pdf"
                className="rounded-full border border-[var(--ink)]/30 px-8 py-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em]"
              >
                Wedding Brochure
              </a>
              <span className="label flex items-center gap-2.5 !text-[var(--ink)]/70">
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Film
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- 2. Homepage scene — the journey + stats */}
      <section className="px-6 py-28 lg:px-16 lg:py-40">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label">How it works</p>
            <h2 className="display mt-8 text-[clamp(2rem,3.6vw,3.5rem)]">
              Six steps,
              <br />
              from first note
              <br />
              to the ceremony
            </h2>
          </div>

          <ol className="lg:col-span-7 lg:col-start-6">
            {journey.map((step) => (
              <li key={step.number} className="border-t border-[var(--hair)] last:border-b">
                <div className="flex gap-8 py-7">
                  <span className="coord shrink-0 pt-1.5">
                    {String(step.number).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[1.1rem] font-medium">
                      {step.title.replace(/^Step \d+\s*[—-]\s*/, "")}
                    </h3>
                    {step.body[0] && (
                      <p className="mt-2 max-w-lg text-[0.95rem] leading-relaxed text-[var(--muted)]">
                        {step.body[0]}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Facts as the luxury — every figure taken from existing content */}
        <div className="mt-24 grid gap-12 border-t border-[var(--hair)] pt-14 sm:grid-cols-3 lg:mt-36">
          {/*
            Derived, not typed — these were hard-coded "04" and "20–300" and
            went stale the moment a venue was withdrawn. Even an archived study
            should not display a number the content no longer supports.
          */}
          {[
            [String(venues.length).padStart(2, "0"), "Private venues"],
            [
              String(
                Math.max(
                  ...venues.flatMap((v) =>
                    v.capacity.replace(/\D+/g, " ").trim().split(/\s+/).map(Number),
                  ),
                ),
              ),
              "Guests at the largest setting",
            ],
            [String(journey.length).padStart(2, "0"), "Steps from enquiry to ceremony"],
          ].map(([n, label]) => (
            <div key={label}>
              <p className="stat">{n}</p>
              <p className="label mt-5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------- 3. Venues index */}
      <section className="bg-[var(--bg-alt)] px-6 py-28 lg:px-16 lg:py-36">
        <p className="label">The collection</p>
        <h2 className="display mt-8 max-w-2xl text-[clamp(2rem,3.6vw,3.5rem)]">
          Three settings, one island
        </h2>

        {/* Framed cards, consistent ratio — their camp showcase, our venues */}
        <div className="mt-20 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
          {venues.map((v) => (
            <a key={v.slug} href={`/venues/${v.slug}`} className="group block">
              <div className="plate relative aspect-[3/4] overflow-hidden bg-[var(--hair)]">
                <Image
                  src={v.coverImage}
                  alt={v.name}
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 23vw"
                  quality={75}
                  className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                />
              </div>

              <p className="coord mt-6">{COORDS[v.slug]}</p>
              <h3 className="mt-3 text-[1.35rem] font-medium">{v.name}</h3>

              <div className="mt-5 flex items-baseline gap-3 border-t border-[var(--hair)] pt-4">
                <span className="text-[1.6rem] font-light leading-none">
                  {capacityNumber(v.capacity)}
                </span>
                <span className="label !tracking-[0.16em]">guests</span>
              </div>
              <p className="label mt-3 !tracking-[0.14em]">{v.location}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ------------------------------------------- 4. Venue page opening */}
      <section className="plate relative h-[86svh] min-h-[30rem] overflow-hidden">
        <Image
          src={venue.coverImage}
          alt={venue.name}
          fill
          sizes="100vw"
          quality={75}
          className="object-cover"
        />
        <div className="haze-b" aria-hidden />
        <div className="haze-t" aria-hidden />

        <div className="absolute inset-x-0 top-0 px-6 pt-24 lg:px-16 lg:pt-32">
          <p className="coord">{COORDS[venue.slug]}</p>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-6 pb-12 lg:px-16 lg:pb-16">
          <h2 className="display text-[clamp(2.75rem,7vw,6.5rem)]">{venue.name}</h2>

          <div className="mt-10 grid gap-10 border-t border-[var(--hair)] pt-8 sm:grid-cols-4">
            {[
              ["20–30", "Guests"],
              ["06", "Bedrooms"],
              ["180", "Square metres"],
              ["00:00", "Music until"],
            ].map(([n, label]) => (
              <div key={label}>
                <p className="text-[clamp(1.75rem,3vw,2.75rem)] font-light leading-none">{n}</p>
                <p className="label mt-3 !tracking-[0.16em]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
