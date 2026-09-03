import { NextResponse, type NextRequest } from "next/server";

/**
 * Only the real domain may be indexed.
 *
 * There was already an environment check for this — `robots.ts` and `lib/seo.ts`
 * both key off `VERCEL_ENV === "production"`. It was not enough, and the way it
 * failed is worth recording so nobody removes this file thinking it is
 * redundant.
 *
 * The repository is connected to Vercel, and `main` is the production branch.
 * So every push to `main` — the ordinary act of publishing the source — created
 * a *production* deployment, and a production deployment sets
 * `VERCEL_ENV=production`. The application dutifully declared itself indexable:
 * `robots.txt` said `Allow: /`, every page said `index, follow`. Vercel adds
 * `X-Robots-Tag: noindex` to the hashed deployment URLs, but **not** to the
 * project's production alias. The result was a fully crawlable second copy of
 * the site at `domisignature-redesign.vercel.app` — a duplicate that could
 * outrank the real domain for its own content.
 *
 * The mistake was in the predicate, not the plumbing. "Is this a production
 * deployment" is not the question. The question is "is this the live site", and
 * the only honest answer to that is the host in the request. A build cannot
 * know where it will be served; a request always knows where it was served
 * from.
 *
 * So: anything not on the canonical domain gets `X-Robots-Tag: noindex` and a
 * robots.txt that disallows everything. Google applies the most restrictive
 * directive when a header and a meta tag disagree, so this wins over the
 * prerendered `index, follow` in the HTML.
 *
 * This survives things the environment check does not: moving to another host,
 * a second Vercel project, a staging domain, or someone opening a preview
 * through a custom domain.
 */

/** The one host that serves the site and is allowed to be indexed. */
const CANONICAL_HOST = "domisignature.com";

/** Redirected to the apex, never served and never indexed in its own right. */
const WWW_HOST = "www.domisignature.com";

/* Local hosts are exempt so the audits measure what production will actually
   serve. They are not reachable by a crawler, so nothing is at risk here. */
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/;

const BLOCK_EVERYTHING = "User-Agent: *\nDisallow: /\n";

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  /*
   * www redirects to the apex, permanently.
   *
   * One host serves the site, so there is one canonical address and search
   * engines never have to decide which of two identical sites to rank. Vercel
   * can do this in its dashboard, but doing it here keeps it in the repository
   * where it is reviewable, testable by Host header, and cannot drift out of
   * sync with a setting nobody remembers changing.
   *
   * 308 rather than 302: permanent, and it preserves the method.
   */
  if (host === WWW_HOST) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (host === CANONICAL_HOST || LOCAL.test(host)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/robots.txt") {
    return new NextResponse(BLOCK_EVERYTHING, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export const config = {
  /* Everything except the immutable build assets, which no crawler indexes and
     which would only pay the middleware cost for nothing. */
  matcher: ["/((?!_next/static|_next/image).*)"],
};
