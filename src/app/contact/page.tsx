import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";

import { contact, social, legal } from "@content/site";
import { venues } from "@content/venues";
import { PageHeader } from "@/components/ui/PageHeader";
import { Phone } from "@/components/ui/Phone";
import { Reveal, RuleDraw } from "@/components/motion/Reveal";
import { MondayForm } from "@/components/contact/MondayForm";
import { MapEmbed } from "@/components/ui/MapEmbed";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Enquire about a luxury wedding, private celebration or event in Crete. Call +30 211 444 5757, WhatsApp +30 697 406 9475 or email domisignature@gmail.com.",
  path: "/contact",
  image: "/media/st2c-DSC_5359.jpg",
  imageAlt: "Guests watching the sun go down over the sea from cushions on the rocks",
});

const crumbs = [
  { name: "Home", href: "/" },
  { name: "Contact", href: "/contact" },
];

export default function ContactPage() {
  /* The two numbers are set in the display serif, which has no "+": Phone sets
     that one glyph in the sans. The strings are the content's, unchanged. */
  const channels = [
    {
      label: "Telephone",
      value: <Phone number={contact.phone.display} />,
      href: contact.phone.href,
      external: false,
    },
    {
      label: "WhatsApp",
      value: <Phone number={contact.whatsapp.display} />,
      href: contact.whatsapp.href,
      external: true,
    },
    { label: "Email", value: contact.email.display, href: contact.email.href, external: false },
  ];

  return (
    <>
      <BreadcrumbSchema items={crumbs} />

      <PageHeader
        eyebrow="Contact"
        heading={contact.heading}
        standfirst={contact.subheading}
        crumbs={crumbs}
      />

      <section className="bg-[var(--surface)] pb-section">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
            {/* Direct channels */}
            <div className="lg:col-span-4">
              <Reveal>
                <h2 className="eyebrow">Speak to us directly</h2>
              </Reveal>

              {/*
                Each pair sits in a single <div> directly inside the <dl>.
                An extra wrapper element between them breaks axe's
                definition-list / dlitem rules, so Reveal renders that div
                itself rather than nesting inside another.
              */}
              <dl className="mt-8">
                {channels.map((channel, i) => (
                  <Reveal
                    key={channel.label}
                    delay={0.05 * i}
                    className="border-t border-[var(--rule)] py-6"
                  >
                    <dt className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      {channel.label}
                    </dt>
                    <dd className="mt-2">
                      <a
                        href={channel.href}
                        {...(channel.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="break-words font-display text-[1.5rem] font-light text-[var(--text-primary)] transition-colors duration-300 hover:text-[var(--text-secondary)]"
                      >
                        {channel.value}
                      </a>
                    </dd>
                  </Reveal>
                ))}
              </dl>

              {/*
                These two labels are <h3>s, and the base layer sets every
                heading in the display serif — so they alone fell out of the
                sans the <dt> labels above use. .eyebrow restores the face;
                size, tracking and weight stay the <dt>'s, so every label in
                the list is set alike.
              */}
              <Reveal delay={0.2}>
                <div className="border-t border-[var(--rule)] py-6">
                  <h3 className="eyebrow text-xs font-normal uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Brochure</h3>
                  <a
                    href={contact.brochure.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-3 inline-flex items-center gap-3 text-[var(--text-primary)] transition-colors duration-300 hover:text-[var(--text-secondary)]"
                  >
                    {contact.brochure.label}
                    <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">PDF</span>
                    <span
                      aria-hidden
                      className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0.5"
                    >
                      &darr;
                    </span>
                  </a>
                </div>
              </Reveal>

              <Reveal delay={0.26}>
                <div className="border-t border-[var(--rule)] py-6">
                  <h3 className="eyebrow text-xs font-normal uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Follow</h3>
                  <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    {social.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-primary)] transition-colors duration-300 hover:text-[var(--text-secondary)]"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <RuleDraw className="mt-2" />

              <Reveal delay={0.3}>
                <p className="mt-6 text-xs text-[var(--text-tertiary)]">{legal.registration}</p>
              </Reveal>
            </div>

            {/* Enquiry form */}
            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal>
                <h2 className="eyebrow">Send an enquiry</h2>
                <p className="mt-5 max-w-xl leading-relaxed text-[var(--text-secondary)]">
                  Tell us your date, your guest count and the atmosphere you have in mind. We
                  reply to every enquiry personally.
                </p>
              </Reveal>

              <div className="mt-10">
                <MondayForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Venue locations. On the page ground: the map shells are plates - the
          raised tone with a hairline - and on a raised band they read as the
          hairline alone. */}
      <section className="bg-[var(--surface)] py-section" aria-labelledby="locations-heading">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <Reveal>
            <h2 id="locations-heading" className="font-display text-title font-light text-[var(--text-primary)]">
              Find our venues
            </h2>
            <p className="mt-4 text-[var(--text-secondary)]">All three are within reach of Rethymno, Crete.</p>
          </Reveal>

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            {venues.map((venue, i) => (
              <Reveal key={venue.slug} delay={(i % 2) * 0.08}>
                <h3 className="mb-4 font-display text-heading font-light text-[var(--text-primary)]">{venue.name}</h3>
                <MapEmbed
                  src={venue.mapEmbed}
                  title={`Map showing the location of ${venue.name}`}
                  name={venue.name}
                  location={venue.location}
                  mapLink={venue.mapLink}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
