import { venues } from "@content/venues";
import { Reveal, RuleDraw, TextReveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { VenueIndex } from "@/components/venue/VenueIndex";
import { countWord } from "@/lib/utils";

/**
 * The venues scene. A quiet typographic opener on paper, then straight into
 * the full-bleed hover index — the site's one signature interaction.
 */
export function FeaturedVenues() {
  return (
    <>
      <section className="bg-[var(--surface)] pb-20 pt-section lg:pb-28">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Reveal>
                <div className="flex items-center gap-6">
                  <span className="eyebrow">Venues</span>
                  <RuleDraw className="w-20" />
                </div>
              </Reveal>

              <TextReveal
                text={"Three settings,\none island"}
                className="mt-9 text-display font-light text-[var(--text-primary)]"
                delay={0.05}
              />
            </div>

            <div className="lg:col-span-4 lg:col-start-9 lg:pt-4">
              <Reveal delay={0.18}>
                {/* One setting per venue. The house in the hills was Villa Aetos,
                    withdrawn; the sentence kept it for three stages (owner-approved
                    fix, stage 8). Prose cannot derive, so the button's count does. */}
                <p className="prose-editorial">
                  A mountain estate, a private beach and an olive field.
                  Each chosen for what it lets you do — the curfew, the capacity, the view at the
                  moment you say yes.
                </p>
              </Reveal>
              <Reveal delay={0.26}>
                <div className="mt-10">
                  <Button href="/venues" variant="ghost">
                    {`All ${countWord(venues.length)} venues`}
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <VenueIndex />
    </>
  );
}
