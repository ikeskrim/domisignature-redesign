import Image from "next/image";
import Link from "next/link";

import type { Venue } from "@content/venues";
import { cn, pad2 } from "@/lib/utils";

/**
 * Editorial venue card. Deliberately not a boxed "card" — no border, no shadow,
 * no rounded corners. Image, index, name, one line, capacity.
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
      <div className={cn("relative overflow-hidden bg-graphite", ratios[aspect])}>
        <Image
          src={venue.coverImage}
          alt={`${venue.name} — ${venue.standfirst}`}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 40vw"
          className="grade object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-ink/0 transition-colors duration-700 group-hover:bg-bone/12"
        />
        <span className="eyebrow absolute left-5 top-5 text-bone/80 mix-blend-difference">
          {pad2(index + 1)}
        </span>
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-6">
        <h3 className="font-display text-[1.75rem] leading-none text-bone lg:text-[2.15rem]">
          {venue.name}
        </h3>
        <span
          aria-hidden
          className="shrink-0 text-lg text-muted transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5"
        >
          &rarr;
        </span>
      </div>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{venue.standfirst}</p>

      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-faint">
        {venue.capacity.replace("How many people can fit: ", "Capacity ")}
      </p>
    </Link>
  );
}
