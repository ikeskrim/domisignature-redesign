import Image from "next/image";

import { venues } from "@content/venues";
import { journey } from "@content/journey";

/**
 * Stage 3 — the arrival, proposed two ways.
 *
 * The shipped scene works by CONCEALMENT: photographic plates sit at 30%
 * opacity beneath a full-height ink gradient, and the giant word carries the
 * screen. That is why the plates are served at quality 50 — they never resolve
 * as detail, so detail would be bytes wasted. It is also why a graffitied rock
 * in one frame has never mattered: the ink band swallows it.
 *
 * An ivory wash does not conceal. It reveals. So this is the one part of the
 * inversion that cannot be re-coloured, only re-decided:
 *
 *   plate    keep the structure, invert the wash, and let the photograph be
 *            deliberately visible — a fading photographic ground under
 *            near-black type, closer to a printed title page.
 *   chapter  drop the wash idea entirely; the arrival becomes the one place the
 *            site goes to night, with ivory resuming underneath.
 *
 * The pin is not reproduced here and is orthogonal to the decision — it holds
 * the section for an extra viewport in both cases. What is being judged is the
 * ground, the wash and whether type survives on top of a visible photograph.
 *
 * Copy and figures are the shipped ones: "Crete", the standfirst, and three
 * stats derived from content/ exactly as the live scene derives them.
 */

export function ArrivalProposal({ variant }: { variant: "plate" | "chapter" }) {
  const capacities = venues
    .map((v) => v.capacity.replace(/\D+/g, " ").trim().split(/\s+/).map(Number))
    .flat();

  const stats = [
    { value: String(venues.length).padStart(2, "0"), label: "Private venues" },
    { value: String(Math.max(...capacities)), label: "Guests at the largest setting" },
    { value: String(journey.length).padStart(2, "0"), label: "Steps from enquiry to ceremony" },
  ];

  const isPlate = variant === "plate";

  return (
    <section
      data-ground={isPlate ? "light" : "dark"}
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden bg-[var(--surface)]"
    >
      {/*
        PLATE raises the photograph to 62% and washes it back with ivory; the
        image is meant to be seen. CHAPTER holds the shipped 30% under an ink
        wash, where the image is texture and the word is the subject.
      */}
      <div className={`absolute inset-0 ${isPlate ? "opacity-[0.62]" : "opacity-30"}`} aria-hidden>
        <Image
          src="/media/xDJI_20260207131326_0065_D.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={isPlate ? 75 : 50}
          className={`${isPlate ? "grade-b" : "grade-hero"} object-cover`}
        />
      </div>

      {/*
        The wash. Weighted to the bottom on both, because that is where the
        stats sit and where a photograph is most likely to be busy. On plate it
        has to do real work: ivory over a 62% photograph is the only thing
        keeping near-black type legible.
      */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: isPlate
            ? "linear-gradient(to top, rgb(var(--wash) / 0.94) 0%, rgb(var(--wash) / 0.72) 46%, rgb(var(--wash) / 0.58) 100%)"
            : "linear-gradient(to top, rgb(var(--wash) / 1) 0%, rgb(var(--wash) / 0.7) 55%, rgb(var(--wash) / 0.85) 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[104rem] px-gutter pt-28 lg:pt-36">
        <div className="flex items-center gap-6">
          <span className="eyebrow text-[var(--text-tertiary)]">Arrival</span>
          <span aria-hidden className="h-px w-20 bg-[var(--rule-strong)]" />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[104rem] px-gutter">
        <h2
          data-measure="arrival-word"
          className="font-display text-[clamp(5rem,21vw,19rem)] font-light leading-[0.82] tracking-[-0.045em] text-[var(--text-primary)]"
        >
          Crete
        </h2>
        <p
          data-measure="arrival-prose"
          className="mt-10 max-w-lg text-[1.0625rem] leading-[1.7] text-[var(--text-secondary)]"
        >
          One island, three private settings, and a small team who will be there on the day.
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-[104rem] px-gutter pb-20 lg:pb-24">
        <span aria-hidden className="mb-12 block h-px w-full bg-[var(--rule)]" />
        <dl className="grid gap-12 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span
                  data-measure="arrival-stat"
                  className="block font-display text-[clamp(3rem,7vw,7rem)] font-light leading-[0.85] tracking-[-0.04em] text-[var(--text-primary)] tabular-nums"
                >
                  {stat.value}
                </span>
                <span aria-hidden className="eyebrow mt-5 block text-[var(--text-tertiary)]">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
