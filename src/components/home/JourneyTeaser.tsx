import { journey, journeyIntro } from "@content/journey";
import { Reveal, RuleDraw, TextReveal } from "@/components/motion/Reveal";
import { ScrollImage } from "@/components/motion/ScrollImage";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { pad2 } from "@/lib/utils";

/**
 * Homepage teaser for the six chapters: the opening chapter given a full scene,
 * the remaining five listed as an index. The full sequence lives on
 * /wedding-guide.
 *
 * On the page ground: the lead photograph is a plate, and a plate's mat is the
 * raised tone - on a raised band it read as a hairline alone. With the band
 * gone, the join above it (after the venue index) measured 185px at 1440, the
 * tightest on the page against 264-326 elsewhere, so it takes 5rem more on top.
 */
export function JourneyTeaser() {
  const [lead, ...rest] = journey;

  return (
    <section className="bg-[var(--surface)] py-section lg:pt-[calc(var(--spacing-section)+5rem)]">
      <div className="mx-auto w-full max-w-[104rem] px-gutter">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <div className="flex items-center gap-6">
                <span className="eyebrow">{journeyIntro.heading}</span>
                <RuleDraw className="w-20" />
              </div>
            </Reveal>
            <TextReveal
              text={"Six steps, from\nfirst note to\nthe ceremony"}
              className="mt-9 text-display font-light text-[var(--text-primary)]"
              delay={0.05}
            />
          </div>
          <div className="lg:col-span-3 lg:col-start-10 lg:pt-6">
            <Reveal delay={0.2}>
              <p className="text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
                {journeyIntro.subheading}
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 grid gap-16 lg:mt-28 lg:grid-cols-12 lg:gap-20">
          {/* Chapter one, in full. Its photograph sits inside the column, an
              object on the page, so it is a plate; the drift and zoom still run
              inside the ScrollImage's own frame, which the mat surrounds.
              Stage 6 halves the amplitude (drift 4, zoom 0.06, against the
              default 8 and 0.1): at full strength the picture's own top edge
              slid into view inside the mat while the plate was leaving the
              top of the screen, several pixels deep. Halved, a sliver still
              showed as the plate's top reached the viewport's top edge (about
              2px at 1440x900, 4px at 390x844); ScrollImage now clamps the
              drift to the headroom its scale leaves, so no edge shows at any
              amplitude and the halved values stay for the quieter motion. */}
          <div className="lg:col-span-6">
            <Plate as="div">
              <ScrollImage
                src={lead.image}
                alt={lead.imageAlt}
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="aspect-[4/3] w-full"
                drift={4}
                zoom={0.06}
              />
            </Plate>
            <Reveal delay={0.08}>
              <span
                aria-hidden
                className="mt-10 block font-display text-[clamp(3rem,5vw,4.5rem)] font-light leading-[0.8] text-[var(--text-tertiary)]"
              >
                {pad2(lead.number)}
              </span>
              <h3 className="mt-5 font-display text-[clamp(1.6rem,2.6vw,2.35rem)] font-light leading-[1.05] text-[var(--text-primary)]">
                {lead.title.replace(/^Step \d+\s*[—-]\s*/, "")}
              </h3>
              <div className="prose-editorial mt-6">
                {lead.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </Reveal>
          </div>

          {/* The remaining chapters as an index */}
          <div className="lg:col-span-5 lg:col-start-8 lg:pt-10">
            <ol>
              {rest.map((step, i) => (
                <Reveal as="li" key={step.number} delay={0.05 * i} y={16}>
                  <RuleDraw />
                  <div className="flex gap-8 py-7">
                  <span
                    aria-hidden
                    className="shrink-0 font-display text-[1.75rem] font-light leading-none text-[var(--text-tertiary)]"
                  >
                    {pad2(step.number)}
                  </span>
                  <div>
                    <h3 className="font-display text-[1.4rem] font-light leading-snug text-[var(--text-primary)] lg:text-[1.6rem]">
                      {step.title.replace(/^Step \d+\s*[—-]\s*/, "")}
                    </h3>
                    {step.body[0] && (
                      <p className="mt-2.5 max-w-md text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
                        {step.body[0]}
                      </p>
                    )}
                  </div>
                  </div>
                </Reveal>
              ))}
            </ol>

            {/* Outside the <ol>: a list may only directly contain <li>. */}
            <RuleDraw />
            <Reveal delay={0.2}>
              <div className="mt-12">
                <Button href="/wedding-guide" variant="ghost">
                  Read the full guide
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
