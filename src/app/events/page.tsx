import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";

import { eventsIntro, signatureEvents } from "@content/events";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventsBrowser } from "@/components/events/EventsBrowser";
import { CtaBlock } from "@/components/ui/CtaBlock";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";

export const metadata: Metadata = pageMetadata({
  title: "Signature Events",
  description: "Our collection of events in Crete — weddings, parties, dinners and celebrations, photographed on the ground and from the air.",
  path: "/events",
  image: "/media/bl8-DSC_9672.jpg",
  imageAlt: "Guests dressed in white on a lit terrace at dusk",
});

const crumbs = [
  { name: "Home", href: "/" },
  { name: "Signature Events", href: "/events" },
];

export default function EventsPage() {
  const imageCount = signatureEvents.reduce((total, e) => total + e.gallery.length, 0);

  return (
    <>
      <BreadcrumbSchema items={crumbs} />

      <PageHeader
        eyebrow="Signature Events"
        heading={eventsIntro.heading}
        standfirst={eventsIntro.subheading}
        crumbs={crumbs}
        meta={
          <dl className="flex gap-10 text-sm">
            <div>
              <dt className="eyebrow text-faint">Galleries</dt>
              <dd className="mt-2 font-display text-3xl font-light text-bone">
                {signatureEvents.length}
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-faint">Images</dt>
              <dd className="mt-2 font-display text-3xl font-light text-bone">{imageCount}</dd>
            </div>
          </dl>
        }
      />

      <section className="bg-ink pb-section">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <EventsBrowser />
        </div>
      </section>

      <CtaBlock
        heading={"Your celebration,\nnext"}
        // Was stHARLEY.jpg, withdrawn in Phase 6 §4 — and its alt text described
        // dancing guests when the frame is a parked motorcycle, inherited from
        // the old "Party / dance" mislabelling.
        image="/media/st2c-DSC_5359.jpg"
        imageAlt="Guests watching the sun go down over the sea from cushions on the rocks"
      />
    </>
  );
}
