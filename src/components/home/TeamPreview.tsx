import Image from "next/image";

import { team, teamIntro, teamStatement } from "@content/team";
import { MaskReveal, Reveal, TextReveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";

/* On the page ground: the portraits are plates, and a plate's mat is the raised
   tone - on a raised band it read as a hairline alone. */
export function TeamPreview() {
  return (
    <section className="bg-[var(--surface)] py-section">
      <div className="mx-auto w-full max-w-[104rem] px-gutter">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <span className="eyebrow">Our Team</span>
            </Reveal>

            <TextReveal
              text={teamIntro.heading}
              className="mt-7 text-title font-light text-[var(--text-primary)]"
              delay={0.05}
            />

            <Reveal delay={0.15}>
              <p className="mt-8 max-w-lg text-lead leading-relaxed text-[var(--text-primary)]">
                {teamIntro.subheading}
              </p>
            </Reveal>

            <Reveal delay={0.22}>
              <p className="mt-6 max-w-lg leading-relaxed text-[var(--text-secondary)]">{teamStatement}</p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-11">
                <Button href="/about">About Domisignature</Button>
              </div>
            </Reveal>
          </div>

          <ul className="grid gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7 lg:gap-8">
            {team.map((member, i) => (
              <li key={member.name} className={i === 1 ? "sm:mt-14" : undefined}>
                {/* Each portrait is a plate on the page. The wipe uncovers the
                    whole plate, mat and all, as it uncovered the frame before;
                    the name and role stay beneath it on paper as the caption,
                    and the name keeps its heading. No placeholder fill: the
                    section is on the page ground, so a portrait still loading
                    reads as an empty mat - the same as on /about. */}
                <MaskReveal delay={i * 0.09}>
                  <Plate as="div" frameClassName="aspect-[3/4]">
                    <Image
                      src={member.image}
                      alt={`${member.name} — ${member.role}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 22vw"
                      loading="lazy"
                      className="grade-b object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.04]"
                    />
                  </Plate>
                </MaskReveal>
                {/* The caption aligns with the photograph's edge inside the mat,
                    as every plate caption does (px = the mat's padding). */}
                <Reveal delay={0.1 + i * 0.09}>
                  <h3 className="mt-6 px-3 font-display text-[1.6rem] font-light leading-tight text-[var(--text-primary)] sm:px-4 lg:px-5">
                    {member.name}
                  </h3>
                  <p className="mt-2 px-3 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)] sm:px-4 lg:px-5">
                    {member.role}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
