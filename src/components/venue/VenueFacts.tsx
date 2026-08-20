import type { Venue } from "@content/venues";
import { contact } from "@content/site";
import { Button } from "@/components/ui/Button";
import { capacityLabel } from "@/lib/utils";

/**
 * The sticky quick-facts panel on a venue page: capacity, location, curfew and
 * the two ways to start a conversation.
 */
export function VenueFacts({ venue }: { venue: Venue }) {
  const capacity = capacityLabel(venue.capacity);

  const enquiry = `${contact.whatsapp.href}?text=${encodeURIComponent(
    `Hello Domisignature, I would like to enquire about ${venue.name}.`,
  )}`;

  return (
    <aside className="lg:sticky lg:top-32">
      <div className="border-t border-hair pt-7">
        <h2 className="eyebrow text-muted">At a glance</h2>

        <dl className="mt-7 space-y-6">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-faint">Capacity</dt>
            <dd className="mt-1.5 font-display text-2xl font-light text-bone">{capacity}</dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-faint">Location</dt>
            <dd className="mt-1.5 leading-relaxed text-bone/85">{venue.location}</dd>
          </div>

          {venue.note && (
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-faint">Please note</dt>
              <dd className="mt-1.5 leading-relaxed text-bone/85 underline decoration-hair underline-offset-4">
                {venue.note}
              </dd>
            </div>
          )}

          {venue.factList && (
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-faint">
                {venue.factList.heading}
              </dt>
              <dd className="mt-2.5">
                <ul className="space-y-1.5">
                  {venue.factList.items.map((item) => (
                    <li key={item} className="flex gap-2.5 leading-relaxed text-bone/85">
                      <span aria-hidden className="text-faint">
                        &ndash;
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}

          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-faint">
              {venue.advantagesHeading}
            </dt>
            <dd className="mt-2.5">
              <ul className="space-y-2.5">
                {venue.advantages.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed text-bone/85">
                    <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-muted" />
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>

        <div className="mt-9 flex flex-col gap-3">
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
