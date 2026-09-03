import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { eventSlugs, getEvent, signatureEvents } from "@content/events";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { EditorialGallery } from "@/components/gallery/EditorialGallery";
import { VideoPlayer } from "@/components/gallery/VideoPlayer";
import { CtaBlock } from "@/components/ui/CtaBlock";
import { Reveal } from "@/components/motion/Reveal";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";

export function generateStaticParams() {
  return eventSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return {};

  /* The old openGraph block carried no description and no twitter card, so a
     shared gallery link showed this gallery's photograph under the site-wide
     description. */
  return pageMetadata({
    title: `${event.title} — ${event.category}`,
    description: `A Domisignature ${event.title.toLowerCase()} in Crete — ${event.gallery.length} photographs from the ${event.category} collection.`,
    path: `/events/${event.slug}`,
    image: event.coverImage,
    imageAlt: `${event.title} — ${event.category}`,
  });
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const index = signatureEvents.findIndex((e) => e.slug === event.slug);
  const next = signatureEvents[(index + 1) % signatureEvents.length];

  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Signature Events", href: "/events" },
    { name: `${event.title} — ${event.category}`, href: `/events/${event.slug}` },
  ];

  return (
    <>
      <BreadcrumbSchema items={crumbs} />

      <PageHeader
        eyebrow={event.category}
        heading={event.title}
        standfirst={`${event.gallery.length} photographs${
          event.videos?.length
            ? ` and ${event.videos.length} film${event.videos.length > 1 ? "s" : ""}`
            : ""
        } from this celebration.`}
        crumbs={crumbs}
      />

      <section className="bg-ink pb-section">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <EditorialGallery images={event.gallery} alt={`${event.title} — ${event.category}`} columns={3} />
        </div>
      </section>

      {event.videos && event.videos.length > 0 && (
        <section className="bg-graphite py-section">
          <div className="mx-auto w-full max-w-[104rem] px-gutter">
            <Reveal>
              <h2 className="mb-12 font-display text-title font-light text-bone">
                {event.videos.length > 1 ? "The films" : "The film"}
              </h2>
            </Reveal>

            <div className="grid gap-8 lg:grid-cols-2">
              {event.videos.map((video, i) => (
                <Reveal key={video.src} delay={i * 0.1}>
                  <VideoPlayer
                    src={video.src}
                    webm={video.webm}
                    poster={video.poster}
                    label={`${event.title} — film ${i + 1}`}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Next gallery */}
      <section className="bg-ink py-section">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <Reveal>
            <Link
              href={`/events/${next.slug}`}
              className="group flex flex-col gap-3 border-t border-hair pt-8 sm:flex-row sm:items-end sm:justify-between"
            >
              <div>
                <span className="eyebrow text-faint">Next gallery</span>
                <p className="mt-4 font-display text-title font-light text-bone">
                  {next.title}{" "}
                  <span className="text-muted">&mdash; {next.category}</span>
                </p>
              </div>
              <span
                aria-hidden
                className="text-3xl text-muted transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2"
              >
                &rarr;
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      <CtaBlock image={event.coverImage} imageAlt={`${event.title} — ${event.category}`} />
    </>
  );
}
