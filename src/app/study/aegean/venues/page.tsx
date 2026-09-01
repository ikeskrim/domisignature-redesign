import Image from "next/image";
import { venues, venuesIntro } from "@content/venues";
import { capacityLabel } from "@/lib/utils";

/**
 * Surface 2 — the venues index on ivory, the hardest of the three.
 *
 * This is where a light ground usually fails, because the shipped index is
 * full-bleed dusk photography edge to edge. The answer here is the mat: each
 * photograph sits inside a card of near-white with a generous ivory border and
 * a hairline frame, so the eye reads "photograph on a page" rather than "dark
 * hole in a light wall". The frame is what stops the image edge dissolving into
 * the ground.
 *
 * The photographs themselves are untouched — same files, same `grade` filter as
 * the live site. Nothing is lightened, faded or tinted to help it sit here.
 * That is the constraint the study exists to test.
 */
export default function AegeanVenues() {
  return (
    <main className="px-gutter pb-28 pt-32 lg:pb-40 lg:pt-40">
      <div className="mx-auto w-full max-w-[104rem]">
        <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--aegean-stone)]">
          {venuesIntro.heading}
        </p>
        <h1 className="mt-7 max-w-3xl font-display text-[clamp(2.5rem,5.5vw,4.75rem)] font-light leading-[1.02] text-[var(--aegean-ink)]">
          Three settings,
          <br />
          one island
        </h1>

        <span aria-hidden className="mt-10 block h-px w-24 bg-[#b98f4a]" />

        <div className="mt-20 space-y-24 lg:mt-28 lg:space-y-32">
          {venues.map((venue, i) => (
            <article
              key={venue.slug}
              className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16"
            >
              {/* The mat. Generous near-white border, hairline frame, and the
                  photograph inside it at full strength. */}
              <div className={i % 2 ? "lg:order-2 lg:col-span-7" : "lg:col-span-7"}>
                <div className="border border-[var(--aegean-rule)] bg-[var(--aegean-card)] p-3 sm:p-4 lg:p-5">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={venue.coverImage}
                      alt={`${venue.name} — ${venue.standfirst}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      quality={80}
                      className="grade object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className={i % 2 ? "lg:order-1 lg:col-span-5" : "lg:col-span-5"}>
                <p className="font-display text-[1.05rem] text-[var(--aegean-stone)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-4 font-display text-[clamp(2rem,3.4vw,3rem)] font-light leading-[1.02] text-[var(--aegean-ink)]">
                  {venue.name}
                </h2>
                <p className="mt-6 max-w-md text-[1.0625rem] leading-relaxed text-[var(--aegean-stone)]">
                  {venue.standfirst}
                </p>
                <div className="mt-8 h-px w-full bg-[var(--aegean-rule)]" />
                <p className="mt-6 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--aegean-stone)]">
                  {capacityLabel(venue.capacity)}
                  <span className="mx-3 text-[var(--aegean-rule)]">/</span>
                  {venue.location}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
