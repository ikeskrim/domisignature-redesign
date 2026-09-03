import type { Testimonial } from "@content/pending";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Client voices. The live site has none, and the brief forbids inventing them —
 * so this renders nothing at all until real quotes are added to
 * content/pending.ts. See CONTENT-NEEDED.md.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  return (
    <section className="bg-ink py-section" aria-labelledby="testimonials-heading">
      <div className="mx-auto w-full max-w-[104rem] px-gutter">
        <Reveal>
          <span className="eyebrow text-muted">In their words</span>
          <h2 id="testimonials-heading" className="mt-6 font-display text-title font-light text-bone">
            Couples we have worked with
          </h2>
        </Reveal>

        <ul className="mt-16 grid gap-x-12 gap-y-16 lg:mt-24 lg:grid-cols-2">
          {items.map((item, i) => (
            <Reveal as="li" key={item.quote} delay={(i % 2) * 0.1}>
              <figure className="border-t border-hair pt-8">
                <blockquote>
                  <p className="font-display text-[1.6rem] font-light italic leading-snug text-bone lg:text-[1.9rem]">
                    “{item.quote}”
                  </p>
                </blockquote>
                <figcaption className="mt-6 text-xs uppercase tracking-[0.18em] text-faint">
                  {item.author}
                  {item.context && <span className="ml-3 normal-case tracking-normal text-muted">{item.context}</span>}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
