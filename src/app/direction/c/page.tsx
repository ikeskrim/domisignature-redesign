import Image from "next/image";

import { venues } from "@content/venues";

/**
 * DIRECTION C — Editorial Sand
 *
 * A magazine, printed on warm limestone paper. Nothing is centred: the grid is
 * deliberately off-balance, images bleed off one side only, and a high-contrast
 * serif is annotated by monospaced caps that behave like the notes down the
 * edge of a contact sheet.
 */

export default function DirectionC() {
  // Resolved by slug, not position — see the note in direction/d.
  const venue = venues.find((v) => v.slug === "olive-stories") ?? venues[0];

  return (
    <main className="dir dir-c">
      {/* ---------------------------------------------- 1. Hero */}
      <section className="grid min-h-[100svh] items-center gap-10 px-6 py-28 lg:grid-cols-12 lg:gap-0 lg:px-0">
        <div className="in lg:col-span-5 lg:pl-16 xl:pl-24">
          <p className="label">Issue 01 — Crete, Greece</p>
          {/* Sized to the 5-column measure, not the viewport, so it never
              collides with the image bleeding in from the right. */}
          <h1 className="display mt-10 text-[clamp(2.5rem,4.2vw,4rem)]">Domisignature</h1>
          <div className="hair mt-10 w-full max-w-xs" />
          <p className="body mt-8 max-w-sm text-[1.15rem] leading-[1.5] italic">
            Where Every Moment Is Signed
          </p>
          <p className="label mt-12">Luxury events, weddings &amp; private celebrations</p>
        </div>

        {/* bleeds off the right edge */}
        <div className="plate relative aspect-[4/5] overflow-hidden lg:col-span-7 lg:aspect-auto lg:h-[86svh]">
          <Image
            src="/media/video/hero.jpg"
            alt="Dusk over a seaside celebration in Crete"
            fill
            priority
            sizes="(max-width: 1024px) 92vw, 58vw"
            quality={75}
            className="object-cover"
          />
          <span className="label absolute bottom-4 left-4 !text-[0.625rem] bg-[var(--bg)] px-2 py-1">
            fig. 01
          </span>
        </div>
      </section>

      {/* ---------------------------------------------- 2. Homepage scene */}
      <section className="border-t border-[var(--hair)] px-6 py-28 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <p className="label lg:col-span-2">§ 01 — The collection</p>

          <div className="lg:col-span-7 lg:col-start-4">
            <p className="display text-[clamp(1.75rem,3.8vw,3.5rem)] leading-[1.12]">
              Three private settings on one island, chosen for what each
            one lets you do.
            </p>
            <div className="hair mt-12" />
            <p className="body mt-8 max-w-lg text-[1.05rem] leading-[1.6]">
              Chosen for what they let you do — the curfew, the capacity, the
              view at the moment you say yes.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------- 3. Venues index */}
      <section className="border-t border-[var(--hair)] px-6 py-24 lg:px-16">
        <p className="label">§ 02 — Venues</p>

        <ul className="mt-16">
          {venues.map((v, i) => (
            <li key={v.slug} className="border-t border-[var(--hair)] last:border-b">
              <a
                href={`/venues/${v.slug}`}
                className="group grid items-center gap-6 py-8 lg:grid-cols-12 lg:gap-10"
              >
                <span className="label lg:col-span-1">{String(i + 1).padStart(2, "0")}</span>

                {/* contact-sheet thumbnail */}
                <span className="plate relative block aspect-[3/2] overflow-hidden lg:col-span-3">
                  <Image
                    src={v.coverImage}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 92vw, 24vw"
                    quality={75}
                    className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                </span>

                <span className="display lg:col-span-4 text-[clamp(1.75rem,3.4vw,3rem)]">
                  {v.name}
                </span>

                <span className="label lg:col-span-2">
                  {v.capacity.replace("How many people can fit: up to ", "Up to ")}
                </span>
                <span className="label hidden lg:col-span-2 lg:block">{v.location}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------- 4. Venue page opening */}
      <section className="border-t border-[var(--hair)] bg-[var(--bg-alt)]">
        <div className="grid items-stretch gap-10 lg:grid-cols-12 lg:gap-0">
          <div className="px-6 py-24 lg:col-span-5 lg:px-16 lg:py-32">
            <p className="label">§ 03 — Venue</p>
            <h2 className="display mt-10 text-[clamp(2.5rem,5.5vw,5rem)]">{venue.name}</h2>
            <div className="hair mt-10" />

            <dl className="mt-10 space-y-5">
              {[
                ["Capacity", "Up to 20–30"],
                ["Setting", "Hills of Rethymno, Crete"],
                ["Rooms", "6 bedrooms, 180 m²"],
                ["Note", "Parties until 00:00"],
              ].map(([k, val]) => (
                <div key={k} className="flex items-baseline gap-6">
                  <dt className="label w-24 shrink-0">{k}</dt>
                  <dd className="body text-[1.05rem]">{val}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="plate relative aspect-[4/5] overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[80svh]">
            <Image
              src={venue.coverImage}
              alt={venue.name}
              fill
              sizes="(max-width: 1024px) 92vw, 58vw"
              quality={75}
              className="object-cover"
            />
            <span className="label absolute bottom-4 left-4 !text-[0.625rem] bg-[var(--bg)] px-2 py-1">
              fig. 04 — {venue.name}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
