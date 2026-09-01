import { contact, site } from "@content/site";
import { Reveal, RuleDraw, TextReveal } from "@/components/motion/Reveal";
import { ScrollImage } from "@/components/motion/ScrollImage";
import { Button } from "@/components/ui/Button";

/**
 * The closing invitation, sized as a scene rather than a strip. Sits above the
 * footer on every page so there is always a way to start a conversation.
 */
export function CtaBlock({
  heading = "Begin with\na conversation",
  standfirst = site.descriptor,
  image = "/media/thLK_LD_071.jpg",
}: {
  heading?: string;
  standfirst?: string;
  image?: string;
  /** Accepted for call-site readability; the image is decorative, so unused. */
  imageAlt?: string;
}) {
  return (
    <section className="relative flex min-h-[85svh] items-center overflow-hidden bg-charcoal text-bone">
      <div className="absolute inset-0">
        <ScrollImage
          src={image}
          alt=""
          sizes="100vw"
          className="h-full w-full opacity-40"
          drift={5}
          zoom={0.08}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-ink via-ink/88 to-ink/40"
        />
      </div>

      <div className="relative mx-auto w-full max-w-[104rem] px-gutter py-section">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <div className="flex items-center gap-6">
                <span className="eyebrow text-bone/55">Enquire</span>
                <RuleDraw className="w-20 bg-bone/25" />
              </div>
            </Reveal>

            <TextReveal
              text={heading}
              className="mt-10 text-display font-light text-bone"
              delay={0.05}
            />

            <Reveal delay={0.16}>
              <p className="prose-editorial mt-10 text-bone/70">{standfirst}</p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-14 flex flex-wrap items-center gap-8">
                <Button
                  href="/contact"
                  className="border-bone/40 text-bone hover:border-bone hover:bg-bone hover:text-ink"
                  size="lg"
                >
                  Enquire
                </Button>
                <Button
                  href={contact.whatsapp.href}
                  external
                  variant="ghost"
                  className="text-bone/75 hover:text-bone"
                >
                  Or message us on WhatsApp
                </Button>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <Reveal delay={0.32}>
              <dl className="space-y-7 border-t border-bone/15 pt-9">
                <div>
                  <dt className="eyebrow text-bone/55">Call</dt>
                  <dd className="mt-3">
                    <a
                      href={contact.phone.href}
                      className="font-display text-[1.6rem] font-light text-bone/90 transition-colors duration-[450ms] hover:text-gold"
                    >
                      {contact.phone.display}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-bone/55">Email</dt>
                  <dd className="mt-3">
                    <a
                      href={contact.email.href}
                      className="break-all font-display text-[1.6rem] font-light text-bone/90 transition-colors duration-[450ms] hover:text-gold"
                    >
                      {contact.email.display}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-bone/55">Brochure</dt>
                  <dd className="mt-3">
                    <a
                      href={contact.brochure.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display text-[1.6rem] font-light text-bone/90 transition-colors duration-[450ms] hover:text-gold"
                    >
                      {contact.brochure.label}
                    </a>
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
