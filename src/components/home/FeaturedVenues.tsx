import { Reveal, RuleDraw, TextReveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { VenueIndex } from "@/components/venue/VenueIndex";

/**
 * The venues scene. A quiet typographic opener on limestone, then straight into
 * the full-bleed hover index on ink — the site's one signature interaction.
 */
export function FeaturedVenues() {
  return (
    <>
      <section className="bg-ink pb-20 pt-section lg:pb-28">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <Reveal>
                <div className="flex items-center gap-6">
                  <span className="eyebrow text-muted">Venues</span>
                  <RuleDraw className="w-20" />
                </div>
              </Reveal>

              <TextReveal
                text={"Three settings,\none island"}
                className="mt-9 text-display font-light text-bone"
                delay={0.05}
              />
            </div>

            <div className="lg:col-span-4 lg:col-start-9 lg:pt-4">
              <Reveal delay={0.18}>
                <p className="prose-editorial">
                  A mountain estate, a private beach, an olive field and a house in the hills.
                  Each chosen for what it lets you do — the curfew, the capacity, the view at the
                  moment you say yes.
                </p>
              </Reveal>
              <Reveal delay={0.26}>
                <div className="mt-10">
                  <Button href="/venues" variant="ghost">
                    All three venues
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
