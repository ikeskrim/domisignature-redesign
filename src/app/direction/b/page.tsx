import Image from "next/image";

import { venues } from "@content/venues";

/**
 * DIRECTION B — Cretan Noir
 *
 * The room is dark and the photograph is the only light in it. Everything
 * bleeds edge to edge, images glow warm out of near-black, and type is set
 * enormous in a high-contrast serif over the top. Gold appears exactly once per
 * screen — a single rule, a single word — and never twice.
 */

export default function DirectionB() {
  // Resolved by slug, not position — see the note in direction/d.
  const venue = venues.find((v) => v.slug === "mountain-escape") ?? venues[0];

  return (
    <main className="dir dir-b">
      {/* ---------------------------------------------- 1. Hero */}
      <section className="plate relative flex h-[100svh] min-h-[34rem] flex-col justify-end overflow-hidden">
        <Image
          src="/media/video/hero.jpg"
          alt="Dusk over a seaside celebration in Crete"
          fill
          priority
          sizes="100vw"
          quality={75}
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(10,10,11,0.94) 0%, rgba(10,10,11,0.55) 34%, rgba(10,10,11,0.2) 62%, rgba(10,10,11,0.5) 100%)",
          }}
        />

        <div className="relative px-6 pb-16 lg:px-16 lg:pb-24">
          {/* the single gold moment on this screen */}
          <div className="h-px w-28" style={{ background: "var(--accent)" }} />

          <h1 className="display in mt-10 overflow-hidden text-[clamp(3rem,10vw,10rem)]">
            <span>Domisignature</span>
          </h1>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <p className="display text-[clamp(1.25rem,2.6vw,2.25rem)] italic text-[var(--ink)]/85">
              Where Every Moment Is Signed
            </p>
            <p className="label">Crete — Greece</p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------- 2. Homepage scene */}
      <section className="relative flex min-h-[95svh] items-center overflow-hidden px-6 py-32 lg:px-16">
        <div className="plate absolute inset-y-0 right-0 hidden w-[52%] overflow-hidden lg:block">
          <Image
            src="/media/olth4.jpg"
            alt=""
            fill
            sizes="52vw"
            quality={75}
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, #0a0a0b 0%, rgba(10,10,11,0.1) 55%)" }}
          />
        </div>

        <div className="relative max-w-2xl">
          <p className="label">The collection</p>
          <p className="display mt-12 text-[clamp(2rem,4.6vw,4rem)]">
            Three private settings on one island, chosen for what each
            one lets you do.
          </p>
          <p className="mt-10 max-w-md text-[0.95rem] leading-relaxed text-[var(--muted)]">
            Chosen for what they let you do — the curfew, the capacity, the view
            at the moment you say yes.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------- 3. Venues index */}
      <section className="px-6 py-24 lg:px-16">
        <p className="label">Venues</p>
        <ul className="mt-14">
          {venues.map((v, i) => (
            <li key={v.slug} className="border-t border-[var(--hair)] last:border-b">
              <a
                href={`/venues/${v.slug}`}
                className="plate group relative flex items-center gap-8 overflow-hidden py-10 lg:py-14"
              >
                {/* the photograph rises out of the dark behind the type */}
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100">
                  <Image src={v.coverImage} alt="" fill sizes="100vw" quality={75} className="object-cover" />
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: "rgba(10,10,11,0.62)" }}
                  />
                </span>

                <span className="label relative w-10 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="display relative flex-1 text-[clamp(2rem,5.4vw,5rem)]">{v.name}</span>
                <span className="label relative hidden shrink-0 sm:block">
                  {v.capacity.replace("How many people can fit: up to ", "Up to ")}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------- 4. Venue page opening */}
      <section className="plate relative flex h-[92svh] min-h-[32rem] flex-col justify-end overflow-hidden">
        <Image
          src={venue.coverImage}
          alt={venue.name}
          fill
          sizes="100vw"
          quality={75}
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.4) 45%, rgba(10,10,11,0.55) 100%)",
          }}
        />
        <div className="relative px-6 pb-16 lg:px-16 lg:pb-20">
          <p className="label">Venue</p>
          <h2 className="display mt-7 text-[clamp(2.5rem,8vw,7.5rem)]">{venue.name}</h2>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-[var(--hair)] pt-7">
            <p className="max-w-md text-[0.95rem] leading-relaxed text-[var(--ink)]/75">
              A private 65-acre estate with three pools and panoramic mountain
              and sea views.
            </p>
            <p className="label">Up to 200 — 25 minutes from Rethymno</p>
          </div>
        </div>
      </section>
    </main>
  );
}
