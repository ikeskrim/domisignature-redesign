import { contact, legal, site, siteMeta, social } from "@content/site";
import type { Venue } from "@content/venues";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Content is authored by us, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** LocalBusiness for the brand itself — emitted once, on the homepage. */
export function LocalBusinessSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `${site.url}/#organization`,
        name: site.name,
        description: siteMeta.description,
        slogan: site.tagline,
        url: site.url,
        image: `${site.url}/media/mdGEOR3108.jpg`,
        logo: `${site.url}/assets/img/logo.png`,
        telephone: contact.phone.display,
        email: contact.email.display,
        priceRange: "$$$",
        address: {
          "@type": "PostalAddress",
          addressRegion: "Crete",
          addressCountry: "GR",
        },
        areaServed: { "@type": "Place", name: "Crete, Greece" },
        sameAs: social.map((s) => s.href),
        identifier: legal.registration,
      }}
    />
  );
}

/** Place schema for an individual venue page. */
export function VenueSchema({ venue }: { venue: Venue }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "EventVenue",
        name: venue.name,
        description: venue.standfirst,
        url: `${site.url}/venues/${venue.slug}`,
        image: `${site.url}${venue.coverImage}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: venue.location,
          addressRegion: "Crete",
          addressCountry: "GR",
        },
        maximumAttendeeCapacity: venue.capacity.replace(/\D+/g, "") || undefined,
        amenityFeature: venue.advantages.map((a) => ({
          "@type": "LocationFeatureSpecification",
          name: a,
        })),
        isAccessibleForFree: false,
        parentOrganization: { "@id": `${site.url}/#organization` },
      }}
    />
  );
}

/** Breadcrumbs for any nested page. */
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${site.url}${item.href}`,
        })),
      }}
    />
  );
}
