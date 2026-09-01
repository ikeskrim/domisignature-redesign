import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";

import { contact, social, legal } from "@content/site";
import { venues } from "@content/venues";
import { PageHeader } from "@/components/ui/PageHeader";
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
  const channels = [
    { label: "Telephone", value: contact.phone.display, href: contact.phone.href, external: false },
    {
      label: "WhatsApp",
      value: contact.whatsapp.display,
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

      <section className="bg-ink pb-section">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
            {/* Direct channels */}
            <div className="lg:col-span-4">
              <Reveal>
                <h2 className="eyebrow text-muted">Speak to us directly</h2>
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
                    className="border-t border-hair py-6"
                  >
                    <dt className="text-xs uppercase tracking-[0.16em] text-faint">
                      {channel.label}
                    </dt>
                    <dd className="mt-2">
                      <a
                        href={channel.href}
                        {...(channel.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="break-words font-display text-[1.5rem] font-light text-bone transition-colors duration-300 hover:text-gold"
                      >
                        {channel.value}
                      </a>
                    </dd>
                  </Reveal>
                ))}
              </dl>

              <Reveal delay={0.2}>
                <div className="border-t border-hair py-6">
                  <h3 className="text-xs uppercase tracking-[0.16em] text-faint">Brochure</h3>
                  <a
                    href={contact.brochure.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-3 inline-flex items-center gap-3 text-bone transition-colors duration-300 hover:text-gold"
                  >
                    {contact.brochure.label}
                    <span className="text-xs uppercase tracking-[0.16em] text-faint">PDF</span>
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
                <div className="border-t border-hair py-6">
                  <h3 className="text-xs uppercase tracking-[0.16em] text-faint">Follow</h3>
                  <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    {social.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-bone transition-colors duration-300 hover:text-gold"
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
                <p className="mt-6 text-xs text-faint">{legal.registration}</p>
              </Reveal>
            </div>

            {/* Enquiry form */}
            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal>
                <h2 className="eyebrow text-muted">Send an enquiry</h2>
                <p className="mt-5 max-w-xl leading-relaxed text-bone/85">
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

      {/* Venue locations */}
      <section className="bg-graphite py-section" aria-labelledby="locations-heading">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <Reveal>
            <h2 id="locations-heading" className="font-display text-title font-light text-bone">
              Find our venues
            </h2>
            <p className="mt-4 text-muted">All three are within reach of Rethymno, Crete.</p>
          </Reveal>

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            {venues.map((venue, i) => (
              <Reveal key={venue.slug} delay={(i % 2) * 0.08}>
                <h3 className="mb-4 font-display text-heading font-light text-bone">{venue.name}</h3>
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
