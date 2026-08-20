import type { NextConfig } from "next";

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
      { source: "/services", has: [{ type: "query", key: "modal" }], destination: "/services", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
