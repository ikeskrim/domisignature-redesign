import Image from "next/image";

/**
 * Stage 2 — the photographic grade, A against B, on both grounds.
 *
 * Six frames, classified by looking at the contact sheet rather than by
 * filename: two dusk, two night, two daylight. All six are published frames
 * from the Thalasses gallery — nothing withheld, nothing generated, no file
 * altered. Both candidates are CSS filters over the same photograph, so either
 * is reverted by deleting a class.
 *
 * The same six run twice: matted on ivory, where most of the site's photography
 * will live, and again inside a dark chapter, where the grade has to hold up
 * with no paper around it. A grade that flatters one and ruins the other is not
 * a candidate.
 */

const FRAMES = [
  ["/media/th3-DSC_5495.jpg", "dusk", "Twilight over the pool, string lights against a mauve sky"],
  ["/media/th2b-DSC_5385.jpg", "dusk", "The sun on the horizon, guests watching from the terrace"],
  ["/media/th3-DSC_9730.jpg", "night", "Guests around the lit pool after dark"],
  ["/media/thDSC_9614.jpg", "night", "The pool lit blue against a black sky"],
  ["/media/th4.jpg", "day", "Banquet tables beside the pool under an overcast sky"],
  ["/media/th1-DSC_9500.jpg", "day", "The pool and the sea beyond, midday"],
] as const;

function Pair({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:gap-6">
      {(["a", "b"] as const).map((g) => (
        <figure key={g}>
          <div className="border border-[var(--rule)] bg-[var(--surface-raised)] p-2 lg:p-3">
            <div className="relative aspect-[3/2] overflow-hidden">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 1024px) 50vw, 32vw"
                quality={80}
                className={`grade-${g} object-cover`}
              />
            </div>
          </div>
          <figcaption className="mt-3 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            {g === "a" ? "A — plate" : "B — window"}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function GradeStudy() {
  return (
    <main>
      {/* ── on ivory ─────────────────────────────────────────────────────── */}
      <section className="px-gutter pb-24 pt-32 lg:pt-40">
        <div className="mx-auto w-full max-w-[104rem]">
          <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Stage 2 — the grade, on ivory
          </p>
          <h1 className="mt-7 max-w-3xl font-display text-[clamp(2.25rem,4.5vw,3.75rem)] font-light leading-[1.04] text-[var(--text-primary)]">
            A is a print. B is a window.
          </h1>
          <p className="mt-7 max-w-2xl text-[1.0625rem] leading-relaxed text-[var(--text-secondary)]">
            A lifts the shadows and eases the contrast, so the photograph settles
            into the paper. B holds the blacks deep and raises contrast, so the
            photograph keeps its own world and the paper frames it. Same six
            files, same mats, same sizes — only the filter differs.
          </p>

          <span aria-hidden className="mt-10 block h-px w-24 bg-[var(--accent)]" />

          <div className="mt-16 space-y-16 lg:mt-20 lg:space-y-20">
            {FRAMES.map(([src, kind, alt]) => (
              <div key={src}>
                <p className="mb-5 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  {kind} — {src.split("/").pop()}
                </p>
                <Pair src={src} alt={alt} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── the same six inside a dark chapter ───────────────────────────── */}
      <section data-ground="dark" className="bg-[var(--surface)] px-gutter py-24 lg:py-32">
        <div className="mx-auto w-full max-w-[104rem]">
          <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            The same six, inside a dark chapter
          </p>
          <h2 className="mt-7 max-w-3xl font-display text-[clamp(2rem,3.6vw,3rem)] font-light leading-[1.04] text-[var(--text-primary)]">
            No paper around them
          </h2>
          <p className="mt-7 max-w-2xl text-[1.0625rem] leading-relaxed text-[var(--text-secondary)]">
            A grade that flatters the ivory and ruins the chapter is not a
            candidate. Here the mats fall away and the photographs carry the
            screen on their own.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FRAMES.map(([src, kind, alt]) => (
              <div key={src}>
                <div className="grid grid-cols-2 gap-3">
                  {(["a", "b"] as const).map((g) => (
                    <div key={g} className="relative aspect-[3/2] overflow-hidden">
                      <Image
                        src={src}
                        alt={alt}
                        fill
                        sizes="(max-width: 640px) 50vw, 22vw"
                        quality={80}
                        className={`grade-${g} object-cover`}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  {kind} · A | B
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
