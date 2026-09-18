import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Image from "next/image";

import { site } from "@content/site";
import { team, teamIntro, teamStatement } from "@content/team";
import { testimonials, stats } from "@content/pending";
import { venues } from "@content/venues";
import { PageHeader } from "@/components/ui/PageHeader";
import { Plate } from "@/components/ui/Plate";
import { MaskReveal, Reveal, RuleDraw, TextReveal } from "@/components/motion/Reveal";
import { CtaBlock } from "@/components/ui/CtaBlock";
import { Testimonials } from "@/components/ui/Testimonials";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";

export const metadata: Metadata = pageMetadata({
  title: "About & Team",
  description: `${teamIntro.subheading} Meet the Domisignature team behind luxury weddings and private celebrations in Crete.`,
  path: "/about",
  image: "/media/thLK_LD_071.jpg",
  imageAlt: "A ceremony arch dressed in white florals against the Cretan sea",
});

const crumbs = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
];

export default function AboutPage() {
  return (
    <>
      <BreadcrumbSchema items={crumbs} />

      <PageHeader
        eyebrow="About"
        heading={teamIntro.heading}
        standfirst={teamIntro.subheading}
        crumbs={crumbs}
      />

      {/* Statement */}
      <section className="bg-[var(--surface)] py-section">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-7">
              <TextReveal
                text={site.tagline}
                className="font-display text-display font-light italic text-[var(--text-primary)]"
              />
              <Reveal delay={0.15}>
                <p className="prose-editorial mt-10 max-w-2xl">{teamStatement}</p>
              </Reveal>
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <Reveal delay={0.1}>
                <span className="eyebrow">Where we work</span>
              </Reveal>
              <RuleDraw className="mt-5" />
              <ul className="mt-7 space-y-3.5">
                {venues.map((venue, i) => (
                  <Reveal as="li" key={venue.slug} delay={0.05 + i * 0.05} y={14}>
                    <span className="text-[var(--text-primary)]">{venue.name}</span>
                    <span className="ml-2 text-sm text-[var(--text-tertiary)]">{venue.location}</span>
                  </Reveal>
                ))}
              </ul>

              {/* Renders only once real figures land in content/pending.ts */}
              {stats.length > 0 && (
                <dl className="mt-12 grid grid-cols-2 gap-8">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <dt className="eyebrow">{stat.label}</dt>
                      <dd className="mt-2 font-display text-4xl font-light text-[var(--text-primary)]">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>
      </section>

      {/*
        Team. The portraits are objects on the page, so each is a Plate — and
        the section rests on paper, not on the raised band it used to be: the
        plate's mat IS the raised surface, and on a band of its own colour the
        mat vanishes, leaving the frame to a decorative hairline. Sharing the
        statement's ground, it takes only a bottom margin; two section paddings
        on one paper stack into a void.
      */}
      <section className="bg-[var(--surface)] pb-section" aria-labelledby="team-heading">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <Reveal>
            <span className="eyebrow">The team</span>
            <h2 id="team-heading" className="mt-6 font-display text-title font-light text-[var(--text-primary)]">
              Who you will be working with
            </h2>
          </Reveal>

          <ul className="mt-16 grid gap-10 sm:grid-cols-3 lg:mt-24 lg:gap-14">
            {team.map((member, i) => (
              <li key={member.name} className={i === 1 ? "sm:mt-16" : undefined}>
                {/* The mask wipes the whole plate in, as it did the bare
                    photograph. No caption: the name and role beneath already
                    caption it on paper, and three people have no order to
                    number. The frame has no fill of its own, so a portrait not
                    yet loaded reads as an empty plate, not a hole. */}
                <MaskReveal delay={i * 0.1}>
                  <Plate as="div" frameClassName="aspect-[3/4]">
                    <Image
                      src={member.image}
                      alt={`${member.name} — ${member.role}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      priority={i === 0}
                      className="grade-b object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.04]"
                    />
                  </Plate>
                </MaskReveal>
                {/* The caption aligns with the photograph's edge inside the mat,
                    as every plate caption does (px = the mat's padding). */}
                <Reveal delay={0.1 + i * 0.1}>
                  <h3 className="mt-6 px-3 font-display text-2xl font-light text-[var(--text-primary)] sm:px-4 lg:px-5">{member.name}</h3>
                  <p className="mt-2 px-3 text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)] sm:px-4 lg:px-5">
                    {member.role}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Renders only once real client quotes land in content/pending.ts */}
      <Testimonials items={testimonials} />

      {/*
        No `standfirst` here on purpose. It used to pass teamStatement, which is
        already printed in full in the statement section above — the same 250-character
        paragraph twice on one page. Omitting it falls back to CtaBlock's own
        default, the site descriptor, which is what every other page's closing
        block uses.
      */}
      <CtaBlock
        heading={"Let’s talk\nabout your day"}
        image="/media/we3-IMG_5776.JPG"
        imageAlt="A couple walking hand in hand after their ceremony"
      />
    </>
  );
}
