import type { Metadata } from "next";

import { site, siteMeta } from "@content/site";

/**
 * True only on a real production deployment.
 *
 * Vercel already sends `X-Robots-Tag: noindex` on previews, but that is a
 * property of the host rather than of this codebase — move the repo, self-host
 * it, or open a preview through a custom domain and the protection is gone.
 * `robots.ts` uses the same check for robots.txt; this puts the matching
 * directive in the page's own `<head>`, because a crawler that never fetches
 * robots.txt still reads the meta tag.
 *
 * `!process.env.VERCEL` keeps local production builds indexable-by-default, so
 * the meta tag a developer sees locally is the one that ships.
 */
export const isProductionDeploy =
  process.env.VERCEL_ENV === "production" || !process.env.VERCEL;

/** The robots directive every page inherits. Previews are never indexable. */
export const robotsForEnvironment: Metadata["robots"] = isProductionDeploy
  ? { index: true, follow: true }
  : { index: false, follow: false, nocache: true };

/**
 * Builds a page's metadata with its OWN social card.
 *
 * Every route used to set only `title` and `description`, so they all inherited
 * the site-wide OG image and the site-wide OG title — a shared venue page and a
 * shared gallery page produced an identical card showing a third venue. This
 * makes the card match the page: its own title, its own description, its own
 * photograph.
 *
 * `image` should be a path already published in `/public` — the manifest audit
 * will not catch a social card pointing at a file that was excluded.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
}: {
  title: string;
  description: string;
  path: string;
  image: string;
  imageAlt: string;
}): Metadata {
  const fullTitle = `${title} | ${site.name}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: robotsForEnvironment,
    openGraph: {
      type: "website",
      locale: "en_GB",
      url: `${site.url}${path}`,
      siteName: site.name,
      title: fullTitle,
      description,
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

/** The site-wide default, used by the root layout and the homepage. */
export const defaultSocialImage = {
  url: "/media/mdGEOR3108.jpg",
  alt: `${site.name} — ${site.descriptor}`,
} as const;

export { siteMeta };
