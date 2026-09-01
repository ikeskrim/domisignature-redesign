import Image from "next/image";

import { venues } from "@content/venues";

/**
 * DIRECTION A — Gallery Ivory
 *
 * A museum wall. Near-white ground, enormous air, hairline rules and type kept
 * deliberately small so the room reads as expensive. Photographs hang as framed
 * plates rather than bleeding to the edge, and they are monochrome until you
 * approach them — colour is something the visitor earns.
 */

const PLATE = "plate relative overflow-hidden bg-[var(--bg-alt)]";

export default function DirectionA() {
  // Resolved by slug, not position — see the note in direction/d.
  const venue = venues.find((v) => v.slug === "thalasses") ?? venues[0];

  return (
    <main className="dir dir-a">
      {/* ---------------------------------------------- 1. Hero */}
      <section className="flex min-h-[100svh] flex-col items-center justify-center px-6 py-28 text-center">
        <p className="label in">Crete, Greece</p>

        <div className="in mt-14 w-full max-w-[62rem]">
          <div className={`${PLATE} aspect-[16/9]`}>
            <Image
              src="/media/video/hero.jpg"
              alt="Dusk over a seaside celebration in Crete"
              fill
              priority
              sizes="(max-width: 768px) 92vw, 62rem"
              quality={75}
              className="object-cover"
            />
          </div>
        </div>

        <h1 className="display in mt-16 text-[clamp(2.5rem,6vw,5.5rem)]">Domisignature</h1>

        <p className="in mt-7 max-w-md text-[0.95rem] leading-relaxed text-[var(--muted)]">
          Where Every Moment Is Signed
        </p>

        <div className="hair in mt-16 w-24" />
      </section>

      {/* ---------------------------------------------- 2. Homepage scene */}
      <section className="flex min-h-[85svh] items-center justify-center px-6 py-32">
        <div className="max-w-3xl text-center">
          <p className="label">The collection</p>
          <p className="display mt-12 text-[clamp(1.75rem,3.4vw,3.25rem)] leading-[1.25]">
            Three private settings on one island, chosen for what each
            one lets you do.
          </p>
          <div className="hair mx-auto mt-16 w-24" />
        </div>
      </section>

      {/* ---------------------------------------------- 3. Venues index */}
      <section className="px-6 pb-32 lg:px-24">
        <div className="mx-auto max-w-[86rem]">
          <div className="hair" />
          <p className="label mt-8">Venues — I to IV</p>

          <div className="mt-20 grid gap-x-16 gap-y-24 sm:grid-cols-2">
            {venues.map((v, i) => (
              <a key={v.slug} href={`/venues/${v.slug}`} className="group block">
                <div className={`${PLATE} aspect-[4/5]`}>
                  <Image
                    src={v.coverImage}
                    alt={v.name}
                    fill
                    sizes="(max-width: 640px) 92vw, 42vw"
                    quality={75}
                    className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                </div>
                <div className="hair mt-7" />
                <div className="mt-5 flex items-baseline justify-between gap-6">
                  <h3 className="display text-[1.5rem]">{v.name}</h3>
                  <span className="label">{["I", "II", "III", "IV"][i]}</span>
                </div>
                <p className="label mt-3 !tracking-[0.18em]">{v.location}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------- 4. Venue page opening */}
      <section className="bg-[var(--bg-alt)] px-6 py-32 lg:px-24">
        <div className="mx-auto max-w-[62rem] text-center">
          <p className="label">Venue</p>
          <h2 className="display mt-8 text-[clamp(2.25rem,5vw,4.5rem)]">{venue.name}</h2>

          <div className={`${PLATE} mt-16 aspect-[3/2]`}>
            <Image
              src={venue.gallery[3]}
              alt={venue.name}
              fill
              sizes="(max-width: 768px) 92vw, 62rem"
              quality={75}
              className="object-cover"
            />
          </div>

          <div className="mx-auto mt-16 max-w-md">
            <div className="hair" />
            <dl className="text-left">
              {[
                ["Capacity", "Up to 300"],
                ["Setting", "Private beachfront, Rethymno"],
                ["Composition", "Four villas, nine bedrooms"],
              ].map(([k, v2]) => (
                <div key={k} className="flex justify-between gap-8 border-b border-[var(--hair)] py-4">
                  <dt className="label">{k}</dt>
                  <dd className="text-[0.95rem]">{v2}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
