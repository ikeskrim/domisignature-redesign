import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";

import { journey, journeyIntro } from "@content/journey";
import { faqs } from "@content/pending";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { JourneyChapters } from "@/components/journey/JourneyChapters";
import { CtaBlock } from "@/components/ui/CtaBlock";
import { Accordion } from "@/components/ui/Accordion";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";

export const metadata: Metadata = pageMetadata({
  title: "Wedding Guide",
  description: "Your wedding journey with Domisignature, step by step — from choosing your villa and date to the day you come and get married in Crete.",
  path: "/wedding-guide",
  image: "/media/we3-IMG_5776.JPG",
  imageAlt: "A couple walking hand in hand through the gardens after their ceremony",
});

const crumbs = [
  { name: "Home", href: "/" },
  { name: "Wedding Guide", href: "/wedding-guide" },
];

export default function WeddingGuidePage() {
  return (
    <>
      <BreadcrumbSchema items={crumbs} />

      <PageHeader
        eyebrow="Wedding Guide"
        heading={journeyIntro.heading}
        standfirst={journeyIntro.subheading}
        crumbs={crumbs}
        meta={
          <p className="font-display text-3xl font-light text-bone">
            {journey.length} steps
            <span className="mt-2 block text-sm tracking-normal text-muted">
              from first enquiry to the ceremony
            </span>
          </p>
        }
      />

      {/* The six chapters */}
      <section className="bg-ink pb-section">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <JourneyChapters />
        </div>
      </section>

      {/*
        Built and styled, renders nothing until real answers land in
        content/pending.ts. See CONTENT-NEEDED.md.
      */}
      {faqs.length > 0 && (
        <section className="bg-graphite py-section">
          <div className="mx-auto w-full max-w-[104rem] px-gutter">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
              <div className="lg:col-span-4">
                <Reveal>
                  <span className="eyebrow text-muted">Questions</span>
                  <h2 className="mt-6 font-display text-title font-light text-bone">
                    Before you enquire
                  </h2>
                </Reveal>
              </div>
              <div className="lg:col-span-7 lg:col-start-6">
                <Accordion items={faqs.map((f) => ({ heading: f.question, body: f.answer }))} />
              </div>
            </div>
          </div>
        </section>
      )}

      <CtaBlock
        heading={"Start at\nstep one"}
        standfirst="Choose your villa and secure your date — we will take the next five steps with you."
        image="/media/olth4.jpg"
        imageAlt="A long banquet table set beneath fairy lights beside the sea"
      />
    </>
  );
}
