import Image from "next/image";
import { hero } from "@content/site";
import { venues } from "@content/venues";
import { capacityLabel } from "@/lib/utils";

/**
 * Surface 1 — the hero, as a full-bleed dark chapter opening onto ivory.
 *
 * This is the whole thesis of the light direction in one screen. The hero
 * photograph is NOT lifted onto the ivory ground and it is NOT hazed to make it
 * sit there. It keeps the shipped dark treatment exactly — same frame, same
 * grade, same scrim, same bone type — and the page simply ends that chapter and
 * begins the ivory one underneath.
 *
 * The join is the difficult part and it is shown rather than hidden: a dark
 * chapter meeting a light ground is a hard edge, so the ivory section opens
 * with generous air above its first line instead of butting type against the
 * photograph.
 *
 * Every word is existing site copy and every figure derives from content/ —
 * nothing here is written for the study.
 */
export default function AegeanHero() {
  const largest = Math.max(
    ...venues.map((v) => Math.max(...(v.capacity.match(/\d+/g) ?? ["0"]).map(Number))),
  );

  return (
    <main>
      {/* ── dark chapter: the photograph keeps its own world ─────────────── */}
      <section data-ground="dark" className="relative h-[86svh] min-h-[32rem] w-full overflow-hidden bg-[var(--surface)]">
        <Image
          src={hero.video.poster}
          alt={hero.video.posterAlt}
          fill
          priority
          sizes="100vw"
          quality={75}
          className="grade-b object-cover"
        />
        <div aria-hidden className="wash-bottom absolute inset-0" />

        <div className="relative mx-auto flex h-full w-full max-w-[104rem] flex-col justify-end px-gutter pb-16">
          <p className="eyebrow text-[var(--text-tertiary)]">{hero.eyebrow}</p>
          <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.75rem,7vw,6.5rem)] font-light leading-[0.95] text-[var(--text-primary)]">
            {hero.tagline}
          </h1>
        </div>
      </section>

      {/* ── ivory chapter: reading air, warm near-black type ─────────────── */}
      <section className="bg-[var(--surface)] px-gutter pb-24 pt-24 lg:pb-32 lg:pt-32">
        <div className="mx-auto w-full max-w-[104rem]">
          {/* The one gold moment on this screen — a rule, never a word. On ivory
              #b98f4a measures 2.52:1, which cannot carry text legibly. */}
          <span aria-hidden className="block h-px w-24 bg-[var(--accent)]" />

          <p className="mt-10 max-w-3xl font-display text-[clamp(1.6rem,3vw,2.6rem)] font-light leading-[1.25] text-[var(--text-primary)]">
            {hero.subtitle}
          </p>

          <div className="mt-14 h-px w-full bg-[var(--rule)]" />

          {/* Derived from content/venues.ts, exactly as the shipped stats are. */}
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            <div>
              <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Private venues
              </p>
              <p className="mt-3 font-display text-[2.4rem] font-light leading-none text-[var(--text-primary)]">
                {String(venues.length).padStart(2, "0")}
              </p>
            </div>
            <div>
              <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Guests
              </p>
              <p className="mt-3 font-display text-[2.4rem] font-light leading-none text-[var(--text-primary)]">
                Up to {largest}
              </p>
            </div>
            <div>
              <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Largest setting
              </p>
              <p className="mt-3 font-display text-[1.5rem] font-light leading-snug text-[var(--text-primary)]">
                {venues.find((v) => v.capacity.includes(String(largest)))?.name}
                <span className="block text-[0.95rem] text-[var(--text-secondary)]">
                  {capacityLabel(
                    venues.find((v) => v.capacity.includes(String(largest)))?.capacity ?? "",
                  )}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
