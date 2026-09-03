import { services } from "@content/services";
import { Reveal, RuleDraw } from "@/components/motion/Reveal";
import { ScrollImage } from "@/components/motion/ScrollImage";
import { CopyRuns } from "@/components/ui/CopyRuns";
import { cn } from "@/lib/utils";

/**
 * Services as alternating full-bleed scenes.
 *
 * The image column carries a negative margin equal to the page gutter, so it
 * runs off the viewport edge on the side it sits — the copy stays inside the
 * measure. Nothing is boxed, nothing is centred, and there are no cards.
 */
export function ServiceScenes({ idPrefix = true }: { idPrefix?: boolean }) {
  return (
    <div className="space-y-28 lg:space-y-48">
      {services.map((service, i) => {
        const flipped = i % 2 === 1;

        return (
          <section
            key={service.slug}
            id={idPrefix ? service.slug : undefined}
            className="scroll-mt-32"
            aria-labelledby={`${service.slug}-heading`}
          >
            <div className="mx-auto w-full max-w-[104rem] px-gutter">
              <div className="lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-14">
                {/* Image — 8 of 12 columns, bleeding past the gutter to the viewport edge */}
                <div
                  className={cn(
                    "lg:col-span-8",
                    flipped ? "lg:order-2 lg:col-start-5 lg:-mr-gutter" : "lg:-ml-gutter",
                  )}
                >
                  <ScrollImage
                    src={service.image}
                    alt=""
                    sizes="(max-width: 1024px) 100vw, 70vw"
                    
                    className="aspect-[4/3] w-full lg:aspect-auto lg:h-[80vh] lg:min-h-[32rem]"
                  />
                </div>

                {/* Copy */}
                <div
                  className={cn(
                    "mt-10 lg:mt-0 lg:col-span-4",
                    flipped ? "lg:order-1 lg:col-start-1" : "lg:col-start-9",
                  )}
                >
                  <Reveal>
                    <RuleDraw className="w-16" />
                  </Reveal>

                  <Reveal delay={0.06}>
                    <h2
                      id={`${service.slug}-heading`}
                      className="mt-9 font-display text-[clamp(2.25rem,3.8vw,3.75rem)] font-light leading-[1.0] text-bone"
                    >
                      {service.title}
                    </h2>
                  </Reveal>

                  <Reveal delay={0.12}>
                    <p className="prose-editorial mt-8">
                      <CopyRuns runs={service.body} />
                    </p>
                  </Reveal>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
