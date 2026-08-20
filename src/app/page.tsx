import type { Metadata } from "next";

import { siteMeta } from "@content/site";
import { Hero } from "@/components/home/Hero";
import { Arrival } from "@/components/home/Arrival";
import { Statement } from "@/components/home/Statement";
import { FeaturedVenues } from "@/components/home/FeaturedVenues";
import { JourneyTeaser } from "@/components/home/JourneyTeaser";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { EventsPreview } from "@/components/home/EventsPreview";
import { TeamPreview } from "@/components/home/TeamPreview";
import { CtaBlock } from "@/components/ui/CtaBlock";
import { LocalBusinessSchema } from "@/components/seo/StructuredData";

export const metadata: Metadata = {
  // The homepage keeps the live site's exact <title>, not the "%s | " template.
  title: { absolute: siteMeta.title },
  description: siteMeta.description,
  alternates: { canonical: "/" },
};

/**
 * The homepage is a voyage, not a stack of sections.
 *
 *   1. Hero      — the brand and the thread: Domisignature, "Where Every
 *                  Moment Is Signed". The first screen stays ours.
 *   2. Arrival   — the giant single word, below the fold, with the facts
 *                  beneath it: the venue count, the largest capacity, six steps.
 *   3. Statement — what we do, in one line.
 *   4. Venues    — the settings, the signature interaction.
 *   5. Journey   — how it works, six steps.
 *   6. Services  — what the six steps actually cover.
 *   7. Events    — the celebration itself.
 *   8. Team      — who runs it.
 *   9. Enquiry   — the close.
 *
 * Services moved below the journey: the steps explain the shape of the work,
 * so the service detail lands better once a reader knows the sequence.
 */
export default function HomePage() {
  return (
    <>
      <LocalBusinessSchema />
      <Hero />
      <Arrival />
      <Statement />
      <FeaturedVenues />
      <JourneyTeaser />
      <ServicesPreview />
      <EventsPreview />
      <TeamPreview />
      <CtaBlock />
    </>
  );
}
