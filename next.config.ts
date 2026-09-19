import type { NextConfig } from "next";

/**
 * HSTS **without `includeSubDomains`, and without `preload`** (owner's
 * instruction, 2026-09-19). Vercel's own header is
 * `max-age=63072000; includeSubDomains; preload`, and that is the wrong promise
 * for this domain: `webmail`, `ftp` and `mail` are independent records still
 * pointing at the old host (WAITING-FOR-DNS.md), and a browser that has seen
 * `includeSubDomains` will refuse to reach them over plain HTTP. `preload` is
 * worse: the list is slow to leave. Two years on the apex alone, which is the
 * part this project controls, and the subdomains keep working.
 */
const HSTS_VALUE = "max-age=63072000";

/**
 * Documents only. `_next/static` and `_next/image` carry their own rules (the
 * optimiser has a sandbox CSP of its own), and media, the brochure and the
 * favicon are not documents. Confirm the compiled regex in
 * `.next/routes-manifest.json` after a build; `scripts/headers-audit.mjs` does.
 */
const DOCUMENTS = "/:path((?!_next/static|_next/image|media/|assets/|images/|favicon.ico).*)";

const nextConfig: NextConfig = {
  /*
   * There was a `distDir` override here, sending production builds to
   * `.next-build` so that building while the dev server ran could not corrupt
   * the dev server's `.next`.
   *
   * It is gone, because it broke deployment. Vercel's builder — and `vercel
   * build` run locally — compile with NODE_ENV=production and then look for
   * output in `.next`. A renamed directory meant they found an empty one and
   * the deploy failed with "No serverless pages were built" while reporting the
   * build itself as successful. Scoping the override to `process.env.VERCEL`
   * did not help either, since the local `vercel build` does not set it.
   *
   * The problem it solved is real but it is a workflow problem, and the fix is
   * a workflow one: stop the dev server before building. Trading a deployable
   * app for that convenience is the wrong way round.
   */


  // The dev overlay badge sits on top of the design in review screenshots.
  devIndicators: false,

  /*
   * Next's defaults, written down so nobody turns them off by accident: a build
   * that does not type-check or lint does not count. scripts/build.mjs also
   * runs tsc first and refuses any build whose output says either was skipped.
   */
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 requires every `quality` used with next/image to be declared here.
    // 50 is for heavily scrimmed decorative plates only — see Arrival.tsx.
    qualities: [50, 75, 80, 85],
    // Source photography is large; these breakpoints match the editorial layouts.
    deviceSizes: [420, 640, 828, 1080, 1280, 1600, 1920, 2560],
    imageSizes: [96, 160, 256, 384, 512, 768],
  },
  async redirects() {
    // The old one-page site used anchors; keep every published link alive.
    return [
      { source: "/index.html", destination: "/", permanent: true },
      /*
       * The "dance" label was disproved by the photographs — that gallery is a
       * sunset poolside dinner with one dancing frame in twenty-five. The slug
       * moved with the title; this keeps the old URL alive permanently.
       */
      {
        source: "/events/party-dance",
        destination: "/events/sunset-by-the-pool",
        permanent: true,
      },
      /*
       * Villa Aetos was withdrawn from the collection by the owner. Its page
       * had been live and indexed, so the URL is kept alive and lands on the
       * collection rather than a 404 — a removed venue should not cost the
       * site a crawled page or a shared link.
       */
      { source: "/venues/villa-aetos", destination: "/venues", permanent: true },
    ];
  },
  /* Next's version banner tells an attacker which advisories to try. */
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        /*
         * Everything, assets included: a sniffed content type is how a file
         * served as one thing runs as another. Plus HSTS — see HSTS_VALUE.
         */
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: HSTS_VALUE },
        ],
      },
      {
        /* Documents only. Never the build assets, the image optimiser (it has
           its own sandbox CSP), the photographs, the brochure or the favicon. */
        source: DOCUMENTS,
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          /* No autoplay token: the hero film is muted. fullscreen is delegated
             to the maps embed, which offers it. geolocation is denied to the
             map too, and it still renders. */
          {
            key: "Permissions-Policy",
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self "https://www.google.com")',
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          /*
           * Deliberately absent, each for a reason:
           *   - Content-Security-Policy: ships next, Report-Only first, on the
           *     owner's order. The harness measured the policy clean over 248
           *     runs (design-review/csp-harness.md) before anything was sent.
           *   - COEP: would block the Monday form and the Google map.
           *   - CORP: optional here, and never on media.
           */
        ],
      },
    ];
  },
};

export default nextConfig;
