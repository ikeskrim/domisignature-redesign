import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";

import { venues } from "@content/venues";
import { PageHeader } from "@/components/ui/PageHeader";
import { VenuePlates } from "@/components/venue/VenuePlates";
import { CtaBlock } from "@/components/ui/CtaBlock";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import { capacityCeiling } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Wedding Venues in Crete",
  description: "Three venues in Crete for weddings and private celebrations: Thalasses, Mountain Escape and Olive Stories — from four villas on their own beach to a private 65-acre estate.",
  path: "/venues",
  image: "/media/th3-DSC_5495.jpg",
  imageAlt: "Thalasses at dusk — a lit pool, palms and the Cretan sea beyond",
});

/* The header's ceiling derives from the venues; it was a typed 300. */
const guestCeiling = Math.max(...venues.map((v) => capacityCeiling(v.capacity)));

const crumbs = [
  { name: "Home", href: "/" },
  { name: "Venues", href: "/venues" },
];

export default function VenuesPage() {
  return (
    <>
      <BreadcrumbSchema items={crumbs} />

      <PageHeader
        eyebrow="Venues"
        heading={"Three settings,\none island"}
        standfirst="Three private venues in Crete. Each chosen for what it lets you do — the curfew, the capacity, the view at the moment you say yes."
        crumbs={crumbs}
        meta={
          <dl className="flex gap-12">
            <div>
              <dt className="eyebrow">Venues</dt>
              <dd className="mt-3 font-display text-[2.75rem] font-light leading-none text-[var(--text-primary)]">
                {venues.length}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Up to</dt>
              <dd className="mt-3 font-display text-[2.75rem] font-light leading-none text-[var(--text-primary)]">
                {guestCeiling}
                <span className="ml-2 text-base tracking-normal text-[var(--text-secondary)]">guests</span>
              </dd>
            </div>
          </dl>
        }
      />

      {/* The plates, not the hover list. /venues is the index you read, so it
          ships the north-star study. VenueIndex stays Home's signature scene. */}
      <VenuePlates />

      <CtaBlock
        heading={"Not sure which\nsuits you?"}
        standfirst="Tell us your guest count, your date and the atmosphere you have in mind — we will tell you honestly which of the three fits, and which does not."
      />
    </>
  );
}
