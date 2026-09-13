import type { Venue } from "@content/venues";
import { contact } from "@content/site";
import { Button } from "@/components/ui/Button";
import { capacityLabel } from "@/lib/utils";

/**
 * The sticky quick-facts panel on a venue page: capacity, location, curfew and
 * the two ways to start a conversation.
 *
 * Stage 5 sets it as a specimen card: a card of the raised surface with a
 * hairline frame, laid on the paper the way a plate is, one fact to a row
 * between hairlines. Every label is an eyebrow, so no label lands on a
 * different rung from the one beside it. A single value (capacity) is set large
 * in the display face; prose stays in the text face, where it reads. The facts
 * are untouched: same values, the same derived capacity label, new typesetting
 * only.
 */

/* One mark for both lists. The fact list used an en dash and the advantages a
   hairline - two marks doing one job. The hairline stays, drawn in the strong
   rule: a twelve-pixel mark in the decorative rule would not read as a mark. */
function Mark() {
  return <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-[var(--rule-strong)]" />;
}

/* `.eyebrow` sets a line-height of 1, right for a one-word label and cramped
   for the list headings, which are sentences and can wrap. */
const label = "eyebrow leading-[1.7]";
const listItem = "flex gap-3 leading-relaxed text-[var(--text-primary)]";

export function VenueFacts({ venue }: { venue: Venue }) {
  const capacity = capacityLabel(venue.capacity);

  const enquiry = `${contact.whatsapp.href}?text=${encodeURIComponent(
    `Hello Domisignature, I would like to enquire about ${venue.name}.`,
  )}`;

  return (
    <aside className="lg:sticky lg:top-32">
      <div className="border border-[var(--rule)] bg-[var(--surface-raised)] p-6 sm:p-8">
        <h2 className="eyebrow">At a glance</h2>

        <dl className="mt-6 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
          <div className="py-5">
            <dt className={label}>Capacity</dt>
            <dd className="mt-2.5 font-display text-[2.25rem] font-light leading-[1.05] text-[var(--text-primary)] lg:text-[2.5rem]">
              {capacity}
            </dd>
          </div>

          <div className="py-5">
            <dt className={label}>Location</dt>
            <dd className="mt-2.5 leading-relaxed text-[var(--text-primary)]">{venue.location}</dd>
            {/*
              The coordinates, re-set from the title card: the venue's own
              published position, decoded from its map embed. The content has no
              label word for them, so they take none of their own; they are a
              second value of Location, which is what they are - and they are
              set as Location's second line, not a row between hairlines: a row
              of its own read as an orphan without a label (stage-5 review).
              One term to a screen reader, and a valid list (one dt, then one
              or more dd).
            */}
            <dd className="mt-1.5 text-[0.9375rem] tabular-nums tracking-[0.06em] text-[var(--text-secondary)]">
              {venue.coordinates}
            </dd>
          </div>

          {venue.note && (
            <div className="py-5">
              <dt className={label}>Please note</dt>
              <dd className="mt-2.5 leading-relaxed text-[var(--text-primary)] underline decoration-[var(--rule)] underline-offset-4">
                {venue.note}
              </dd>
            </div>
          )}

          {venue.factList && (
            <div className="py-5">
              <dt className={label}>{venue.factList.heading}</dt>
              <dd className="mt-4">
                <ul className="space-y-2.5">
                  {venue.factList.items.map((item) => (
                    <li key={item} className={listItem}>
                      <Mark />
                      {item}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}

          <div className="py-5">
            <dt className={label}>{venue.advantagesHeading}</dt>
            <dd className="mt-4">
              <ul className="space-y-2.5">
                {venue.advantages.map((item) => (
                  <li key={item} className={listItem}>
                    <Mark />
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col gap-3">
          <Button href="/contact" variant="solid" className="w-full">
            Enquire about {venue.name}
          </Button>
          <Button href={enquiry} external className="w-full">
            WhatsApp us
          </Button>
        </div>
      </div>
    </aside>
  );
}
