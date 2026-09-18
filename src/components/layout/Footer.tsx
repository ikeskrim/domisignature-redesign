import Link from "next/link";

import { contact, legal, nav, site, social } from "@content/site";
import { venues } from "@content/venues";
import { BackToTop } from "@/components/layout/BackToTop";
import { WORDMARK } from "@/components/layout/wordmark-outline";
import { Marquee } from "@/components/motion/Marquee";
import { RuleDraw, Stagger, StaggerItem, TextReveal } from "@/components/motion/Reveal";
import { Phone } from "@/components/ui/Phone";

/**
 * The closing scene — a full viewport of its own, not a strip of links.
 * The wordmark is set enormous and deliberately clipped by the bottom edge, so
 * the page ends on the brand rather than on legal small print.
 *
 * It is a colophon on the raised surface — the card at the back of the book
 * (INVERSION-PLAN §6): heads near-black, meta tertiary, and one gold hairline,
 * decorative, above the closing line. Gold is never its type. Where a CtaBlock
 * comes before it, that chapter still narrows back into the ivory margins on
 * its way out, so the dark plate ends on paper and the colophon begins beneath
 * it as a tonal step (1.10:1) — the step a plate's mat makes against the page,
 * so, like the mat, its edge needs no hairline. The paper lamp is keyed to
 * --surface and does not paint here, as it does not on any mat. It inherits
 * the light ground and declares none of its own.
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
    <footer className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden bg-[var(--surface-raised)] text-[var(--text-primary)]">
      <div className="relative mx-auto w-full max-w-[104rem] px-gutter pt-24 lg:pt-32">
        {/* The one gold hairline the colophon is allowed — decorative, hidden
            from assistive technology; gold marks, it never sets type. It draws
            itself (RuleDraw: scaleX from the left, never a fade). The wrapper
            carries aria-hidden and the margins; RuleDraw's .rule sets the 1px
            height, and the gold utility overrides its --rule ground, so at rest
            it is the same 3.5rem hairline in the same place as the static one. */}
        <div aria-hidden className="mb-10 lg:mb-12">
          <RuleDraw className="w-14 bg-[var(--accent)]" />
        </div>

        {/* Closing line — the last thing the site says, so it is set. */}
        <TextReveal
          as="p"
          text={site.tagline}
          className="max-w-4xl font-display text-[clamp(2rem,5vw,4.5rem)] font-light italic leading-[1.02] text-[var(--text-primary)]"
        />

        <Stagger className="mt-20 grid gap-14 lg:mt-28 lg:grid-cols-12 lg:gap-10">
          {/* Direct contact — the reason anyone reaches the footer */}
          <StaggerItem className="lg:col-span-5">
            {/* The colophon's heads are near-black: they head columns, they are
                not meta, so they say so over .eyebrow's tertiary default. */}
            <h2 className="eyebrow text-[var(--text-primary)]">Get in touch</h2>
            {/* Set in primary; the hover steps down the ramp rather than to
                gold, which on paper is not a text colour. The numbers go
                through <Phone>: Playfair has no plus, so it is set in the sans. */}
            <ul className="mt-8 space-y-5">
              <li>
                <a
                  href={contact.phone.href}
                  className="group inline-block font-display text-[1.75rem] font-light leading-none transition-colors duration-300 hover:text-[var(--text-secondary)]"
                >
                  <Phone number={contact.phone.display} />
                </a>
              </li>
              <li>
                <a
                  href={contact.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-block font-display text-[1.75rem] font-light leading-none transition-colors duration-300 hover:text-[var(--text-secondary)]"
                >
                  <Phone number={contact.whatsapp.display} />
                  {/* font-sans: the link sets the display face for the number,
                      and the label beside it inherited Playfair capitals; every
                      other small label in the footer is in the sans. */}
                  <span className="ml-3 align-middle font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
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
                <h2 className="eyebrow text-[var(--text-primary)]">{column.heading}</h2>
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
          {/* The legal rule draws itself in --rule (RuleDraw's .rule ground). It
              replaces the line's 1px border-top and sits directly above it, so
              at rest it is the same full-width hairline in the same place. */}
          <RuleDraw />
          <div className="flex flex-col gap-4 py-7 text-[0.7rem] text-[var(--text-tertiary)] sm:flex-row sm:items-center sm:justify-between">
            <p>{legal.copyright}</p>
            <p>{legal.registration}</p>
            <BackToTop />
          </div>
        </div>

        {/*
          The wordmark as a drawing, not text (stage 8, owner's instruction).
          It duplicates the name in the header, the footer contact column and
          the page title, so it is decoration: set as text it needed a WCAG
          1.4.3 logotype exemption, which the gate honoured and Lighthouse could
          not. It is now Playfair Display's own outlines, generated from the
          built font and site.name by scripts/wordmark-outline.mjs (the gate
          fails if they drift), laid out exactly as the text was: the span
          keeps the size clamp, so 1em is the font-size it had, and the drawing
          is 7.56em by the 0.8em line box. The path is defined once here and
          used by both copies the marquee renders.

          Its colour is --rule stepped 45% toward the colophon's ground, so it
          is felt rather than read: plain --rule is 1.45:1 on --surface-raised,
          stronger than the 1.31:1 at which it already read on paper; the mix
          is 1.22:1, still above the 1.10:1 step that parts a plate's mat from
          the page, so it does not vanish. Built from two roles, no colour named.
        */}
        <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute h-0 w-0 overflow-hidden">
          <defs>
            <path id="footer-wordmark" d={WORDMARK.d} />
          </defs>
        </svg>
        <Marquee className="select-none">
          <span
            aria-hidden="true"
            className="block translate-y-[22%] pr-[0.35em] text-[clamp(3.5rem,17.5vw,17rem)] text-[color:color-mix(in_srgb,var(--rule)_55%,var(--surface-raised))]"
          >
            <svg
              viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
              focusable="false"
              className="block overflow-visible"
              style={{ width: `${WORDMARK.width / 1000}em`, height: `${WORDMARK.height / 1000}em` }}
            >
              <use href="#footer-wordmark" fill="currentColor" />
            </svg>
          </span>
        </Marquee>
      </div>
    </footer>
  );
}
