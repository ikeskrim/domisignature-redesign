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

const CANONICAL_HOSTS = new Set(["domisignature.com", "www.domisignature.com"]);

/* Local hosts are exempt so the audits measure what production will actually
   serve. They are not reachable by a crawler, so nothing is at risk here. */
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/;

const BLOCK_EVERYTHING = "User-Agent: *\nDisallow: /\n";

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  if (CANONICAL_HOSTS.has(host) || LOCAL.test(host)) {
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
