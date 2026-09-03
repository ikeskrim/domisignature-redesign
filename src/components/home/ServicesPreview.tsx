import { servicesIntro } from "@content/services";
import { Reveal, RuleDraw, TextReveal } from "@/components/motion/Reveal";
import { ServiceScenes } from "@/components/services/ServiceScenes";
import { Button } from "@/components/ui/Button";

/** The services chapter of the homepage — the same scenes as /services. */
export function ServicesPreview() {
  return (
    <section className="bg-ink py-section">
      <div className="mx-auto w-full max-w-[104rem] px-gutter">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal>
              <div className="flex items-center gap-6">
                <span className="eyebrow text-muted">Services</span>
                <RuleDraw className="w-20" />
              </div>
            </Reveal>
            <TextReveal
              text={"Everything a celebration asks\nof you, taken off your hands"}
              className="mt-10 text-display font-light text-bone"
              delay={0.05}
            />
          </div>
        </div>
      </div>

      <div className="mt-24 lg:mt-40">
        <ServiceScenes idPrefix={false} />
      </div>

      <div className="mx-auto mt-24 w-full max-w-[104rem] px-gutter lg:mt-40">
        <Reveal>
          <Button href="/services" variant="ghost">
            {servicesIntro.heading}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
