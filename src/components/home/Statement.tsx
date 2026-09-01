import { Reveal, RuleDraw, TextReveal } from "@/components/motion/Reveal";

/**
 * The manifesto beat, straight after the hero: one line set very large and
 * revealed line by line, with the disciplines listed quietly alongside.
 *
 * Every word here already exists on the live site — the brand descriptor and
 * the "Type of Events" list, arranged as a statement rather than a paragraph.
 */
export function Statement() {
  const disciplines = [
    "Destination Weddings",
    "Private Villa Celebrations",
    "Corporate Retreats",
    "Luxury Brand Events",
    "Anniversary & Birthday Celebrations",
    "Wellness & Yoga Retreats",
    "Private Chef Experiences",
    "Sunset Dinners & Exclusive Gatherings",
  ];

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-ink py-section">
      {/*
        The statement sits on the emptiest ground on the site — no photograph,
        just type on ink. A single light pool behind the headline gives that
        void a source and stops it reading as dead space.
      */}
      <div
        aria-hidden
        className="glow left-[-10%] top-[8%] h-[70vh] w-[80vw] lg:left-[-5%] lg:w-[55vw]"
      />

      <div className="relative mx-auto w-full max-w-[104rem] px-gutter">
        <Reveal>
          <div className="flex items-center gap-6">
            <span className="eyebrow text-muted">Crete, Greece</span>
            <RuleDraw className="w-20" />
          </div>
        </Reveal>

        {/* The big statement — set huge, revealed a line at a time. */}
        <TextReveal
          text={"Luxury weddings\nand private celebrations\nin Crete"}
          className="mt-14 font-display text-[clamp(2.5rem,7.2vw,7.5rem)] font-light leading-[0.95] tracking-[-0.028em] text-bone"
          delay={0.05}
        />

        <div className="mt-20 grid gap-12 lg:mt-28 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal delay={0.1}>
              <p className="prose-editorial">
                Three venues on one island, and a small team who will be there on the day. We plan
                the whole of it — the paperwork, the partners, the hour the music stops.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.16}>
              <span className="eyebrow text-muted">What we create</span>
            </Reveal>
            <RuleDraw className="mt-6" />
            <ul className="mt-8 space-y-4">
              {disciplines.map((item, i) => (
                <Reveal as="li" key={item} delay={0.04 + i * 0.05} y={14}>
                  <span className="text-[0.98rem] leading-relaxed text-bone/85">{item}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
