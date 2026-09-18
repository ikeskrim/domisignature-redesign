import type { Testimonial } from "@content/pending";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Client voices. The live site has none, and the brief forbids inventing them —
 * so this renders nothing at all until real quotes are added to
 * content/pending.ts. See CONTENT-NEEDED.md.
 *
 * A wall of quotes is paper, not a chapter: it sits on the page's own ground
 * and asks for roles, so it would read correctly inside a dark chapter too.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  return (
    <section className="bg-[var(--surface)] py-section" aria-labelledby="testimonials-heading">
      <div className="mx-auto w-full max-w-[104rem] px-gutter">
        <Reveal>
          <span className="eyebrow">In their words</span>
          <h2 id="testimonials-heading" className="mt-6 font-display text-title font-light text-[var(--text-primary)]">
            Couples we have worked with
          </h2>
        </Reveal>

        <ul className="mt-16 grid gap-x-12 gap-y-16 lg:mt-24 lg:grid-cols-2">
          {items.map((item, i) => (
            <Reveal as="li" key={item.quote} delay={(i % 2) * 0.1}>
              <figure className="border-t border-[var(--rule)] pt-8">
                <blockquote>
                  <p className="font-display text-[1.6rem] font-light italic leading-snug text-[var(--text-primary)] lg:text-[1.9rem]">
                    “{item.quote}”
                  </p>
                </blockquote>
                <figcaption className="mt-6 text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  {item.author}
                  {item.context && <span className="ml-3 normal-case tracking-normal text-[var(--text-secondary)]">{item.context}</span>}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
