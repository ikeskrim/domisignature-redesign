import Image from "next/image";
import Link from "next/link";

import type { Venue } from "@content/venues";
import { Plate } from "@/components/ui/Plate";
import { cn } from "@/lib/utils";

/**
 * Editorial venue card. Deliberately not a boxed "card" — no shadow, no rounded
 * corners, and the only frame is the plate's. Plate, name, one line, capacity.
 *
 * Stage 5: the photograph is a sourcebook Plate on the page, captioned with the
 * venue's name and numbered by its place in the collection. The index number
 * used to be set over the photograph, which needed a dark-ground frame and a
 * top veil to stay legible over a pale sky; moved into the caption on paper, it
 * needs neither, so both are gone and no type sits on the image at all. The
 * photograph is now on paper, so it takes the paper grade.
 */
export function VenueCard({
  venue,
  index,
  className,
  priority = false,
  aspect = "portrait",
}: {
  venue: Venue;
  index: number;
  className?: string;
  priority?: boolean;
  aspect?: "portrait" | "landscape" | "tall";
}) {
  const ratios = {
    portrait: "aspect-[4/5]",
    landscape: "aspect-[16/11]",
    tall: "aspect-[3/4]",
  } as const;

  return (
    <Link href={`/venues/${venue.slug}`} className={cn("group block", className)}>
      {/*
        A div, not a figure: the plate sits inside a link, and the frame it
        replaces was a div, so the link's semantics are unchanged. No caption:
        the heading beneath already names the venue, and a caption said it
        twice, 40px apart (stage-5 review). The plate carries its number.
      */}
      <Plate
        as="div"
        number={index + 1}
        frameClassName={ratios[aspect]}
      >
        <Image
          src={venue.coverImage}
          alt={`${venue.name} — ${venue.standfirst}`}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 40vw"
          className="grade-b object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
        {/* On paper this hover tint is ink rather than bone: it asks for the
            primary role, and the frame no longer declares a dark ground. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-transparent transition-colors duration-700 group-hover:bg-[color-mix(in_srgb,var(--text-primary)_12%,transparent)]"
        />
      </Plate>
      {/* Plate hides its number from assistive technology, but the old index
          over the photograph was read as part of this link's name ("02"), and
          link names are frozen. The same derived number, in the same place in
          the reading order - after the image, before the name. */}
      <span className="sr-only">{String(index + 1).padStart(2, "0")}</span>

      {/* The caption aligns with the photograph's edge inside the mat, as
          every plate caption does (px = the mat's padding). */}
      <div className="mt-6 flex items-baseline justify-between gap-6 px-3 sm:px-4 lg:px-5">
        <h3 className="font-display text-[1.75rem] leading-none text-[var(--text-primary)] lg:text-[2.15rem]">
          {venue.name}
        </h3>
        <span
          aria-hidden
          className="shrink-0 text-lg text-[var(--text-secondary)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5"
        >
          &rarr;
        </span>
      </div>

      <p className="mt-3 max-w-md px-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:px-4 lg:px-5">{venue.standfirst}</p>

      <p className="mt-4 px-3 text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)] sm:px-4 lg:px-5">
        {venue.capacity.replace("How many people can fit: ", "Capacity ")}
      </p>
    </Link>
  );
}
