import Image from "next/image";
import { getVenue } from "@content/venues";
import { capacityLabel } from "@/lib/utils";

/**
 * Surface 3 — a venue opening: dark title card, then ivory reading.
 *
 * The title card is unchanged from the shipped page — full-bleed photograph,
 * same grade, same scrim, bone type over it. That is the "dark chapter" doing
 * the work a light ground cannot: carrying a dusk photograph at full strength
 * with type on top of it.
 *
 * Underneath, the prose runs on ivory where long reading belongs, and the
 * gallery returns to mats: each frame inside near-white with a hairline, so a
 * row of night photographs reads as plates on a page instead of holes.
 *
 * No photograph is altered. Same files, same filter, no tint, no fade.
 */
export default function AegeanVenue() {
  const venue = getVenue("thalasses");
  if (!venue) return null;

  return (
    <main>
      {/* ── dark chapter: the title card ─────────────────────────────────── */}
      <section data-ground="dark" className="relative flex h-[80svh] min-h-[30rem] w-full flex-col justify-end overflow-hidden bg-[var(--surface)]">
        <Image
          src={venue.coverImage}
          alt={`${venue.name} — ${venue.standfirst}`}
          fill
          priority
          sizes="100vw"
          quality={75}
          className="grade-b object-cover"
        />
        <div aria-hidden className="wash-bottom absolute inset-0" />

        <div className="relative mx-auto w-full max-w-[104rem] px-gutter pb-14">
          <p className="eyebrow text-[var(--text-tertiary)]">{venue.category}</p>
          <h1 className="mt-6 font-display text-[clamp(3rem,8vw,7.5rem)] font-light leading-[0.9] tracking-[-0.03em] text-[var(--text-primary)]">
            {venue.name}
          </h1>
          <div className="mt-8 flex flex-col gap-4 border-t border-[var(--rule)] pt-6 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-md text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">{venue.standfirst}</p>
            <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              {capacityLabel(venue.capacity)}
              <span className="mx-3 text-[var(--rule)]">/</span>
              {venue.location}
            </p>
          </div>
        </div>
      </section>

      {/* ── ivory chapter: the reading ───────────────────────────────────── */}
      <section className="bg-[var(--surface)] px-gutter py-24 lg:py-32">
        <div className="mx-auto grid w-full max-w-[104rem] gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-7">
            <div className="space-y-6">
              {venue.body.map((p) => (
                <p key={p} className="text-[1.0625rem] leading-[1.75] text-[var(--text-secondary)]">
                  {p}
                </p>
              ))}
            </div>

            <p className="mt-12 font-display text-[clamp(1.75rem,2.6vw,2.5rem)] font-light text-[var(--text-primary)]">
              {capacityLabel(venue.capacity).replace(/\s*guests$/i, "")}
              <span className="text-[var(--text-secondary)]"> guests</span>
            </p>
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <span aria-hidden className="block h-px w-16 bg-[var(--accent)]" />
            <p className="mt-6 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              {venue.advantagesHeading}
            </p>
            <ul className="mt-6 space-y-3">
              {venue.advantages.map((a) => (
                <li key={a} className="flex gap-3 text-[1rem] leading-relaxed text-[var(--text-primary)]">
                  <span aria-hidden className="mt-3 h-px w-3 shrink-0 bg-[var(--rule)]" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        {/* The gallery as matted plates. */}
        <div className="mx-auto mt-20 w-full max-w-[104rem] lg:mt-28">
          <div className="h-px w-full bg-[var(--rule)]" />
          <p className="mt-8 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            {String(venue.gallery.length).padStart(2, "0")} images
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {venue.gallery.slice(0, 6).map((src) => (
              <div
                key={src}
                className="border border-[var(--rule)] bg-[var(--surface-raised)] p-3 lg:p-4"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={80}
                    className="grade-b object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
