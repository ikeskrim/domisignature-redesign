import { eventsIntro, signatureEvents } from "@content/events";
import { Reveal, RuleDraw, TextReveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { EventsStrip } from "@/components/home/EventsStrip";

/**
 * A preview of the seven galleries.
 *
 * Phase 6 §5: the masonry became a horizontal shelf. A vertical page that
 * suddenly moves sideways is the strongest change of register available without
 * changing anything else, and it stops the homepage reading as four stacked
 * grids in a row. The shelf itself lives in EventsStrip.
 */
export function EventsPreview() {
  return (
    <section className="bg-ink py-section">
      <div className="mx-auto w-full max-w-[104rem] px-gutter">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <div className="flex items-center gap-6">
                <span className="eyebrow text-muted">Signature Events</span>
                <RuleDraw className="w-20" />
              </div>
            </Reveal>
            <TextReveal
              text={"Our collection\nof events"}
              className="mt-9 text-display font-light text-bone"
              delay={0.05}
            />
          </div>
          <div className="lg:col-span-3 lg:col-start-10 lg:self-end">
            <Reveal delay={0.2}>
              <Button href="/events" variant="ghost">
                {eventsIntro.heading}
              </Button>
            </Reveal>
          </div>
        </div>

        <p className="sr-only">
          A horizontal strip of {signatureEvents.length} galleries. Scroll it sideways, or use
          Tab to move through them.
        </p>
      </div>

      {/*
        Outside the container so the shelf runs to the viewport edge and reads
        as continuing past it, which is the whole point of a strip.
      */}
      <div className="pl-gutter">
        <EventsStrip />
      </div>
    </section>
  );
}
