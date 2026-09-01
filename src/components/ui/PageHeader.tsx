import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { Reveal, RuleDraw, TextReveal } from "@/components/motion/Reveal";

/**
 * Shared opener for every inner page: breadcrumbs, eyebrow, display heading,
 * standfirst. Keeps the vertical rhythm identical across the site.
 */
export function PageHeader({
  eyebrow,
  heading,
  standfirst,
  crumbs,
  meta,
}: {
  eyebrow: string;
  heading: string;
  standfirst?: string;
  crumbs: Crumb[];
  /** Optional right-hand facts column, e.g. "4 venues". */
  meta?: React.ReactNode;
}) {
  return (
    <header className="bg-ink pb-20 pt-36 lg:pb-32 lg:pt-56">
      <div className="mx-auto w-full max-w-[104rem] px-gutter">
        <Reveal>
          <Breadcrumbs items={crumbs} />
        </Reveal>

        {/* Asymmetric: heading in cols 1–7, the standfirst offset to 9–12. */}
        <div className="mt-16 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal delay={0.05}>
              <div className="flex items-center gap-6">
                <span className="eyebrow text-muted">{eyebrow}</span>
                <RuleDraw className="w-20" />
              </div>
            </Reveal>
            <TextReveal
              as="h1"
              text={heading}
              className="mt-9 text-display font-light text-bone"
              delay={0.05}
            />
          </div>

          {standfirst && (
            <div className="lg:col-span-4 lg:col-start-9 lg:pt-6">
              <Reveal delay={0.18}>
                <p className="prose-editorial">{standfirst}</p>
              </Reveal>
              {meta && (
                <Reveal delay={0.26}>
                  <div className="mt-12">{meta}</div>
                </Reveal>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
