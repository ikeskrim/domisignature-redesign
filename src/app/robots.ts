import type { MetadataRoute } from "next";

import { site } from "@content/site";

/**
 * Vercel already sends `X-Robots-Tag: noindex` on preview deployments, but that
 * is a property of the platform rather than of this codebase — move the repo,
 * self-host it, or open a preview through a custom domain and the protection is
 * gone. This makes the intent explicit in the app itself: nothing but a genuine
 * production deployment is crawlable.
 *
 * `/direction/*` stays noindex in every environment, production included. Those
 * routes are the Phase 6 art-direction studies; they are scratch, they use a
 * different design system, and they must never appear in a search result.
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === "production" || !process.env.VERCEL;

  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/direction/" },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
