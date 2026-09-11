import { contact, site } from "@content/site";
import { Chapter } from "@/components/layout/Chapter";
import { Reveal, RuleDraw, TextReveal } from "@/components/motion/Reveal";
import { ScrollImage } from "@/components/motion/ScrollImage";
import { Button } from "@/components/ui/Button";

/**
 * The closing invitation, sized as a scene rather than a strip. Sits above the
 * footer on every page so there is always a way to start a conversation.
 *
 * One of the designated dark chapters: the ground inverts here, so everything
 * inside asks for a role and the chapter's ladder answers — the buttons
 * included, which need no override to sit on night.
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
    <Chapter ground="dark" className="flex min-h-[85svh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <ScrollImage
          src={image}
          alt=""
          sizes="100vw"
          className="h-full w-full opacity-40"
          grade="grade"
          drift={5}
          zoom={0.08}
        />
        {/* The veil over the photograph, heaviest on the left where the type
            sits, drawn in the chapter's own ground rather than a named black. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgb(var(--wash) / 0.88) 0%, rgb(var(--wash) / 0.88) 20%, rgb(var(--wash) / 0.4) 100%)",
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[104rem] px-gutter py-section">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <div className="flex items-center gap-6">
                <span className="eyebrow">Enquire</span>
                <RuleDraw className="w-20 bg-[var(--rule)]" />
              </div>
            </Reveal>

            <TextReveal
              text={heading}
              className="mt-10 text-display font-light text-[var(--text-primary)]"
              delay={0.05}
            />

            <Reveal delay={0.16}>
              <p className="prose-editorial mt-10 text-[var(--text-secondary)]">{standfirst}</p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-14 flex flex-wrap items-center gap-8">
                <Button href="/contact" size="lg">
                  Enquire
                </Button>
                <Button
                  href={contact.whatsapp.href}
                  external
                  variant="ghost"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Or message us on WhatsApp
                </Button>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <Reveal delay={0.32}>
              <dl className="space-y-7 border-t border-[var(--rule)] pt-9">
                <div>
                  <dt className="eyebrow">Call</dt>
                  <dd className="mt-3">
                    <a
                      href={contact.phone.href}
                      className="font-display text-[1.6rem] font-light text-[var(--text-primary)] transition-colors duration-[450ms] hover:text-[var(--text-secondary)]"
                    >
                      {contact.phone.display}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow">Email</dt>
                  <dd className="mt-3">
                    <a
                      href={contact.email.href}
                      className="break-all font-display text-[1.6rem] font-light text-[var(--text-primary)] transition-colors duration-[450ms] hover:text-[var(--text-secondary)]"
                    >
                      {contact.email.display}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow">Brochure</dt>
                  <dd className="mt-3">
                    <a
                      href={contact.brochure.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display text-[1.6rem] font-light text-[var(--text-primary)] transition-colors duration-[450ms] hover:text-[var(--text-secondary)]"
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
    </Chapter>
  );
}
