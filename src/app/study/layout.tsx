import type { Metadata } from "next";

/**
 * Study routes — prototypes built to make a decision, never part of the site.
 *
 * noindex in every environment, production included, exactly like
 * `/direction/*`. They are excluded from the sitemap because the sitemap is
 * generated from the content slugs and these are not content.
 *
 * They deliberately keep the real header and footer, unlike the direction
 * studies: the whole point of an enquiry-form prototype is to judge it inside
 * the design it would ship into.
 */
export const metadata: Metadata = {
  title: "Study",
  robots: { index: false, follow: false, nocache: true },
};

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
