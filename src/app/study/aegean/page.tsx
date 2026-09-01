import Link from "next/link";

/**
 * Index for the Aegean Bone mini-study. Three surfaces, nothing else built.
 */
export default function AegeanIndex() {
  const surfaces = [
    ["Hero", "/study/aegean/hero", "A dark chapter opening onto ivory."],
    ["Venues index", "/study/aegean/venues", "The hard one — dusk photography matted on a light ground."],
    ["Venue opening", "/study/aegean/venue", "Dark title card, then ivory reading and matted plates."],
  ];

  return (
    <main className="px-gutter py-32">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--aegean-stone)]">
          Study — not part of the site
        </p>
        <h1 className="mt-8 font-display text-[clamp(2.25rem,5vw,4rem)] font-light leading-[1.02] text-[var(--aegean-ink)]">
          Aegean Bone
        </h1>
        <p className="mt-8 text-[1.0625rem] leading-relaxed text-[var(--aegean-stone)]">
          Three surfaces only, built to answer one question: can this
          photography — which is mostly dusk and night — live on a warm ivory
          ground without being lightened, faded or tinted to fit? Every frame
          here is the same file the live site serves, with the same grade. The
          work is done by mats, hairline frames and full-bleed dark chapters,
          never by touching the photographs.
        </p>

        <span aria-hidden className="mt-10 block h-px w-24 bg-[#b98f4a]" />

        <ul className="mt-12 space-y-8">
          {surfaces.map(([label, href, note]) => (
            <li key={href}>
              <Link href={href} className="group block">
                <span className="font-display text-[1.6rem] font-light text-[var(--aegean-ink)] underline decoration-[var(--aegean-rule)] underline-offset-8 group-hover:decoration-[#b98f4a]">
                  {label}
                </span>
                <span className="mt-2 block text-[1rem] text-[var(--aegean-stone)]">{note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
