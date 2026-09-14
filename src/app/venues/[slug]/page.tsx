import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";

import { getVenue, venues, venueSlugs } from "@content/venues";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Chapter } from "@/components/layout/Chapter";
import { VenueFacts } from "@/components/venue/VenueFacts";
import { VenueCard } from "@/components/venue/VenueCard";
import { EditorialGallery } from "@/components/gallery/EditorialGallery";
import { VideoPlayer } from "@/components/gallery/VideoPlayer";
import { MapEmbed } from "@/components/ui/MapEmbed";
import { CtaBlock } from "@/components/ui/CtaBlock";
import { Plate } from "@/components/ui/Plate";
import { Reveal } from "@/components/motion/Reveal";
import { BreadcrumbSchema, VenueSchema } from "@/components/seo/StructuredData";
import { capacityLabel, countWord } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return venueSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venue = getVenue(slug);
  if (!venue) return {};

  /* Had an openGraph block but no twitter card, so X fell back to the
     site-wide image — a shared venue link showed a different venue. */
  return pageMetadata({
    title: `${venue.name} — Wedding Venue in Crete`,
    description: `${venue.standfirst} ${capacityLabel(venue.capacity)}.`,
    path: `/venues/${venue.slug}`,
    image: venue.coverImage,
    imageAlt: `${venue.name} — ${venue.location}`,
  });
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = getVenue(slug);
  if (!venue) notFound();

  const related = venues.filter((v) => v.slug !== venue.slug);

  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Venues", href: "/venues" },
    { name: venue.name, href: `/venues/${venue.slug}` },
  ];

  return (
    <>
      <VenueSchema venue={venue} />
      <BreadcrumbSchema items={crumbs} />

      {/*
        Title card — the venue name set over its own establishing shot. A
        designated dark chapter and the page opener: it declares its own ground
        and skips the entry mask, because there is nothing to arrive from.
      */}
      <Chapter
        ground="dark"
        enter={false}
        className="flex h-[92svh] min-h-[34rem] w-full flex-col justify-between overflow-hidden"
      >
        <Image
          src={venue.coverImage}
          alt={`${venue.name} — ${venue.standfirst}`}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={75}
          className="grade ken object-cover"
        />
        <div aria-hidden className="wash-full absolute inset-0" />

        <div className="relative mx-auto w-full max-w-[104rem] px-gutter pt-28 lg:pt-40">
          <div className="[&_a]:text-[var(--text-primary)] [&_a:hover]:text-[var(--text-secondary)] [&_li]:text-[var(--text-primary)] [&_[aria-current]]:text-[var(--text-primary)]">
            <Breadcrumbs items={crumbs} />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[104rem] px-gutter pb-14 lg:pb-20">
          {/* The two hairlines here sit directly on the photograph, so they are
              the strong rule: --rule is decorative by definition, and a line
              over an image nobody chose for it has to be seen whatever is
              behind it. */}
          <div className="flex items-center gap-6">
            <span className="eyebrow">{venue.category}</span>
            <span aria-hidden className="h-px w-20 bg-[var(--rule-strong)]" />
          </div>

          <h1 className="mt-8 font-display text-[clamp(3rem,8.5vw,8.5rem)] font-light leading-[0.9] tracking-[-0.03em] text-[var(--text-primary)]">
            {venue.name}
          </h1>

          <div className="mt-10 flex flex-col gap-6 border-t border-[var(--rule-strong)] pt-7 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-md text-[0.95rem] leading-relaxed text-[var(--text-primary)]">
              {venue.standfirst}
            </p>
            <div className="shrink-0 text-right">
              {/* The venue's own published coordinates, from its map embed. */}
              <p className="text-[0.6875rem] tracking-[0.06em] text-[var(--text-primary)]">{venue.coordinates}</p>
              <p className="mt-2 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-primary)]">
                {/* capacityLabel already ends in "guests" — see lib/utils.ts. */}
                {capacityLabel(venue.capacity)}
                <span className="mx-3 text-[var(--text-tertiary)]">/</span>
                {venue.location}
              </p>
            </div>
          </div>
        </div>
      </Chapter>

      {/* Description + sticky facts */}
      <section className="bg-[var(--surface)] py-section" id="detail">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-7">
              <Reveal>
                <div className="prose-editorial">
                  {venue.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="mt-12 font-display text-heading font-light text-[var(--text-primary)]">
                  {/*
                    The unit is set apart in quieter type, so it is stripped from
                    the label rather than added to it — capacityLabel already
                    ends in "guests", and appending another one is exactly the
                    bug this line used to have.
                  */}
                  {capacityLabel(venue.capacity).replace(/\s*guests$/i, "")}
                  <span className="text-[var(--text-secondary)]"> guests</span>
                </p>
              </Reveal>
            </div>

            {/* Five columns, not four: as a specimen card the facts gained a mat
                and hairline rows, and at four the Enquire button broke onto two
                lines and the card ran far past the text beside it. */}
            <div className="lg:col-span-5 lg:col-start-8">
              <VenueFacts venue={venue} />
            </div>
          </div>
        </div>
      </section>

      {/*
        Gallery. On the page ground, not a raised band: its tiles are Plates,
        whose mat is the raised surface, and a mat on its own colour reads as a
        bare hairline - a tile still loading looked like an empty box. From here
        down every section shares that ground, so each takes bottom padding
        only; two paddings stacked into dead air where a change of ground used
        to mark the break.
      */}
      <section className="bg-[var(--surface)] pb-section">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <Reveal>
            <div className="mb-12 flex items-baseline justify-between gap-6 lg:mb-16">
              <h2 className="font-display text-title font-light text-[var(--text-primary)]">The gallery</h2>
              <span className="eyebrow">
                {String(venue.gallery.length).padStart(2, "0")} images
              </span>
            </div>
          </Reveal>

          {/* eager={0}: on a venue page the gallery sits below the fold, and React 19
              preloads every image that is not lazy - four tile preloads were
              competing with the title card's photograph for the first paint. */}
          <EditorialGallery images={venue.gallery} alt={venue.name} columns={3} eager={0} />
        </div>
      </section>

      {/* Video - continues the gallery's sheet (bottom padding only), so it
          takes the same ground; left raised, its heading would sit flush on
          the top edge of a band of its own. */}
      {venue.video && (
        <section className="bg-[var(--surface)] pb-section">
          <div className="mx-auto w-full max-w-[104rem] px-gutter">
            <Reveal>
              <h2 className="mb-10 font-display text-title font-light text-[var(--text-primary)]">In motion</h2>
              {/* The film is laid as a plate, like the event pages' films: a
                  poster is a photograph set on the page. A div - VideoPlayer is
                  already the figure; no caption, the heading names it. */}
              <Plate as="div">
                <VideoPlayer
                  src={venue.video.src}
                  webm={venue.video.webm}
                  poster={venue.video.poster}
                  label={`${venue.name} — venue film`}
                />
              </Plate>
            </Reveal>
          </div>
        </section>
      )}

      {/* Map - bottom padding only, like every section on this sheet. */}
      <section className="bg-[var(--surface)] pb-section">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <Reveal>
            <div className="mb-10 flex flex-col gap-2">
              <h2 className="font-display text-title font-light text-[var(--text-primary)]">Where it is</h2>
              <p className="text-[var(--text-secondary)]">{venue.location}</p>
            </div>
            <MapEmbed
              src={venue.mapEmbed}
              title={`Map showing the location of ${venue.name}`}
              name={venue.name}
              location={venue.location}
              mapLink={venue.mapLink}
            />
          </Reveal>
        </div>
      </section>

      {/* Related venues. On the page ground: each is a plate, and a plate's mat
          is the raised tone - on a raised band it read as a hairline alone.
          Bottom padding only, like every section on this sheet. */}
      <section className="bg-[var(--surface)] pb-section">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <Reveal>
            <h2 className="mb-12 font-display text-title font-light text-[var(--text-primary)] lg:mb-16">
              The other {countWord(related.length)}
            </h2>
          </Reveal>

          <div className="grid gap-x-10 gap-y-16 sm:grid-cols-3 lg:gap-x-14">
            {related.map((item) => (
              <VenueCard
                key={item.slug}
                venue={item}
                index={venues.findIndex((v) => v.slug === item.slug)}
                aspect="tall"
              />
            ))}
          </div>
        </div>
      </section>

      <CtaBlock
        heading={`Enquire about\n${venue.name}`}
        standfirst={venue.standfirst}
        image={venue.gallery[1] ?? venue.coverImage}
      />
    </>
  );
}
