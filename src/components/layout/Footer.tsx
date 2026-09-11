import Link from "next/link";

import { contact, legal, nav, site, social } from "@content/site";
import { venues } from "@content/venues";
import { BackToTop } from "@/components/layout/BackToTop";
import { Marquee } from "@/components/motion/Marquee";
import { Stagger, StaggerItem, TextReveal } from "@/components/motion/Reveal";

/**
 * The closing scene — a full viewport of its own, not a strip of links.
 * The wordmark is set enormous and deliberately clipped by the bottom edge, so
 * the page ends on the brand rather than on legal small print.
 *
 * It is a section on the page ground, not a plate — the CtaBlock above it
 * narrows back into the ivory margins on its way out, and the footer is that
 * ivory resuming, so the last light/dark join lands on the page and not on a
 * surface step. The wordmark is drawn in the hairline colour so it is felt
 * rather than read. It inherits the page ground and declares none of its own.
 */
export function Footer() {
  const columns = [
    {
      heading: "Explore",
      links: nav.map((item) => ({ label: item.label, href: item.href, external: false })),
    },
    {
      heading: "Venues",
      links: venues.map((venue) => ({
        label: venue.name,
        href: `/venues/${venue.slug}`,
        external: false,
      })),
    },
    {
      heading: "Follow",
      links: social.map((item) => ({ label: item.label, href: item.href, external: true })),
    },
  ];

  return (
    <footer className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden bg-[var(--surface)] text-[var(--text-primary)]">
      {/* The closing scene gets the last light, low and wide behind the wordmark. */}
      <div
        aria-hidden
        className="glow bottom-[-18%] left-1/2 h-[60vh] w-[120vw] -translate-x-1/2"
      />

      <div className="relative mx-auto w-full max-w-[104rem] px-gutter pt-24 lg:pt-32">
        {/* Closing line — the last thing the site says, so it is set. */}
        <TextReveal
          as="p"
          text={site.tagline}
          className="max-w-4xl font-display text-[clamp(2rem,5vw,4.5rem)] font-light italic leading-[1.02] text-[var(--text-primary)]"
        />

        <Stagger className="mt-20 grid gap-14 lg:mt-28 lg:grid-cols-12 lg:gap-10">
          {/* Direct contact — the reason anyone reaches the footer */}
          <StaggerItem className="lg:col-span-5">
            <h2 className="eyebrow">Get in touch</h2>
            {/* Set in primary; the hover steps down the ramp rather than to
                gold, which on paper is not a text colour. */}
            <ul className="mt-8 space-y-5">
              <li>
                <a
                  href={contact.phone.href}
                  className="group inline-block font-display text-[1.75rem] font-light leading-none transition-colors duration-300 hover:text-[var(--text-secondary)]"
                >
                  {contact.phone.display}
                </a>
              </li>
              <li>
                <a
                  href={contact.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-block font-display text-[1.75rem] font-light leading-none transition-colors duration-300 hover:text-[var(--text-secondary)]"
                >
                  {contact.whatsapp.display}
                  <span className="ml-3 align-middle text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    WhatsApp
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={contact.email.href}
                  className="group inline-block break-all font-display text-[1.75rem] font-light leading-none transition-colors duration-300 hover:text-[var(--text-secondary)]"
                >
                  {contact.email.display}
                </a>
              </li>
            </ul>

            <a
              href={contact.brochure.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-10 inline-flex items-center gap-4 text-[var(--text-secondary)] transition-colors duration-300 hover:text-[var(--text-primary)]"
            >
              <span className="eyebrow">{contact.brochure.label}</span>
              <span className="relative block h-px w-14 bg-[var(--rule)]">
                <span className="absolute inset-0 origin-left scale-x-0 bg-[var(--text-primary)] transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
              </span>
              <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">PDF</span>
            </a>
          </StaggerItem>

          {/* Sitemap */}
          <nav aria-label="Footer" className="grid gap-12 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            {columns.map((column) => (
              <StaggerItem key={column.heading}>
                <h2 className="eyebrow">{column.heading}</h2>
                <ul className="mt-8 space-y-3.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[var(--text-secondary)] transition-colors duration-300 hover:text-[var(--text-primary)]"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-[var(--text-secondary)] transition-colors duration-300 hover:text-[var(--text-primary)]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            ))}
          </nav>
        </Stagger>
      </div>

      {/* Legal + the giant wordmark, clipped by the viewport edge */}
      <div className="relative mt-20">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <div className="flex flex-col gap-4 border-t border-[var(--rule)] py-7 text-[0.7rem] text-[var(--text-tertiary)] sm:flex-row sm:items-center sm:justify-between">
            <p>{legal.copyright}</p>
            <p>{legal.registration}</p>
            <BackToTop />
          </div>
        </div>

        {/*
          Decorative brand text, not content. It duplicates the wordmark in the
          header, the footer contact column and the page title, so it is hidden
          from assistive technology and carries data-a11y-exempt so the axe run
          skips it. Approved as a WCAG 1.4.3 logotype/decorative exemption —
          see design-review/a11y.md.
        */}
        <Marquee className="select-none">
          <span
            aria-hidden="true"
            data-a11y-exempt="decorative-logotype"
            className="block translate-y-[22%] whitespace-nowrap pr-[0.35em] font-display text-[clamp(3.5rem,17.5vw,17rem)] font-light uppercase leading-[0.8] tracking-[-0.04em] text-[var(--rule)]"
          >
            {site.name}
          </span>
        </Marquee>
      </div>
    </footer>
  );
}
