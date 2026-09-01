import Image from "next/image";

import { team, teamIntro, teamStatement } from "@content/team";
import { MaskReveal, Reveal, TextReveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

export function TeamPreview() {
  return (
    <section className="bg-graphite py-section">
      <div className="mx-auto w-full max-w-[104rem] px-gutter">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <span className="eyebrow text-muted">Our Team</span>
            </Reveal>

            <TextReveal
              text={teamIntro.heading}
              className="mt-7 text-title font-light text-bone"
              delay={0.05}
            />

            <Reveal delay={0.15}>
              <p className="mt-8 max-w-lg text-lead leading-relaxed text-bone/85">
                {teamIntro.subheading}
              </p>
            </Reveal>

            <Reveal delay={0.22}>
              <p className="mt-6 max-w-lg leading-relaxed text-muted">{teamStatement}</p>
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
                <MaskReveal delay={i * 0.09}>
                  <div className="relative aspect-[3/4] overflow-hidden bg-hair">
                    <Image
                      src={member.image}
                      alt={`${member.name} — ${member.role}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 22vw"
                      loading="lazy"
                      className="grade object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.04]"
                    />
                  </div>
                </MaskReveal>
                <Reveal delay={0.1 + i * 0.09}>
                  <h3 className="mt-6 font-display text-[1.6rem] font-light leading-tight text-bone">
                    {member.name}
                  </h3>
                  <p className="mt-2 text-[0.6875rem] uppercase tracking-[0.2em] text-faint">
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
