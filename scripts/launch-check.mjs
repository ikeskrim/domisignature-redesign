/**
 * The launch rehearsal, run against a real production build.
 *
 * Three questions, answered by measurement rather than by reading the source:
 *
 *   1. Do the environment flips actually flip? robots.txt, the per-page robots
 *      meta, canonicals, the sitemap and absolute og:image URLs all behave
 *      differently on a production deployment than on a preview, and the
 *      difference is decided at BUILD time — so this runs against each build.
 *   2. Does every legacy URL still land somewhere real? Every path and every
 *      fragment the old site published, tested one at a time.
 *   3. Does every URL in the sitemap return 200?
 *
 * Usage: node scripts/launch-check.mjs                      (expects a prod-mode build)
 *        LAUNCH_EXPECT=noindex node scripts/launch-check.mjs (expects a preview build)
 *
 * Writes design-review/redirect-map.md and prints a pass/fail summary.
 */

import { chromium } from "playwright";
import http from "node:http";
import { writeFile, mkdir } from "node:fs/promises";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const EXPECT_INDEXABLE = process.env.LAUNCH_EXPECT !== "noindex";
const LIVE = "https://domisignature.com";

let pass = 0;
const failures = [];
function check(label, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  ok    ${label}${detail ? "  " + detail : ""}`);
  } else {
    failures.push(`${label}${detail ? " — " + detail : ""}`);
    console.log(`  FAIL  ${label}  ${detail}`);
  }
  return ok;
}

const PAGES = [
  "/", "/venues", "/venues/thalasses", "/venues/mountain-escape", "/venues/olive-stories",
  "/events", "/events/sunset-by-the-pool", "/events/villa-party", "/events/party-celebration",
  "/events/wedding-rituals-aerial", "/events/dinner-celebration", "/events/party-drone",
  "/events/wedding-rituals-olive", "/services", "/wedding-guide", "/about", "/contact",
];

/*
 * Every URL the old site published. Path rows are server redirects; fragment
 * rows are handled on the client by src/components/layout/LegacyAnchorRedirect.tsx,
 * because a fragment never reaches a server.
 *
 * Two rows read wrong until you check the old markup, and they are the two most
 * likely to be "fixed" into breakage: #about and #team were named for their
 * position in the old nav, not their content. #about held "Your Wedding Journey
 * with Domisignature" — the step-by-step guide — and #team held "Our Amazing
 * Team". So they land on /wedding-guide and /about respectively, which is the
 * opposite of what the names suggest and exactly right.
 */
const PATH_ROWS = [
  ["/index.html", "/", "the old entry point"],
  ["/events/party-dance", "/events/sunset-by-the-pool", "renamed — the photographs are a poolside dinner, not a dance"],
  ["/venues/villa-aetos", "/venues", "venue withdrawn; the URL keeps its crawl equity"],
];

const HASH_ROWS = [
  ["#page-top", "/", "top of the old one-pager"],
  ["#about", "/wedding-guide", "the old #about was \"Your Wedding Journey\" — the step-by-step guide"],
  ["#team", "/about", "the old #team was \"Our Amazing Team\" — now the About page"],
  ["#services", "/services", "section becomes a page"],
  ["#contact", "/contact", "section becomes a page"],
  ["#portfolio", "/venues", "the venue grid"],
  ["#portfolio1", "/events", "the events grid"],
  ["#portfolioModal1", "/venues/mountain-escape", "lightbox becomes a page"],
  ["#portfolioModal2", "/venues/thalasses", "lightbox becomes a page"],
  ["#portfolioModal3", "/venues/olive-stories", "lightbox becomes a page"],
  ["#portfolioModal4", "/venues", "Villa Aetos, withdrawn"],
  ["#portfolio1Modal1", "/events/sunset-by-the-pool", "matched by its st* photo set"],
  ["#portfolio1Modal2", "/events/villa-party", "matched by its de* photo set"],
  ["#portfolio1Modal3", "/events/party-celebration", "matched by its bl* photo set"],
  ["#portfolio1Modal4", "/events/wedding-rituals-aerial", "matched by its we* photo set"],
  ["#portfolio1Modal5", "/events/dinner-celebration", "matched by its jd* photo set"],
  ["#portfolio1Modal6", "/events/party-drone", "matched by its pa* photo set"],
  ["#portfolio1Modal7", "/events/wedding-rituals-olive", "matched by its ol* photo set"],
];

const ASSET_ROWS = [
  ["/assets/files/Weddingbrochure.pdf", "the brochure — linked from the old site and still served"],
  ["/assets/favicon.ico", "the old favicon path"],
];

console.log(`\nLAUNCH CHECK  ${BASE}  expecting ${EXPECT_INDEXABLE ? "INDEXABLE (production)" : "NOINDEX (preview)"}\n`);

/* ---------- 1. robots.txt ---------- */
console.log("robots.txt");
const robotsTxt = await (await fetch(`${BASE}/robots.txt`)).text();
const allowsAll = /Allow:\s*\/\s*$/m.test(robotsTxt);
const blocksAll = /Disallow:\s*\/\s*$/m.test(robotsTxt);
if (EXPECT_INDEXABLE) {
  check("allows crawling", allowsAll && !blocksAll);
  check("keeps /direction/ out", /Disallow:\s*\/direction\//.test(robotsTxt));
  check("declares the sitemap", robotsTxt.includes(`${LIVE}/sitemap.xml`));
  check("declares the host", /Host:\s*https:\/\/domisignature\.com/.test(robotsTxt));
} else {
  check("blocks every crawler", blocksAll && !allowsAll);
}

/* ---------- 2. per-page head ---------- */
console.log("\npage <head>");
const seen = [];
for (const path of PAGES) {
  const html = await (await fetch(`${BASE}${path}`)).text();
  const robots = /<meta name="robots" content="([^"]*)"/.exec(html)?.[1] ?? "(none)";
  const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1] ?? "(none)";
  const og = /<meta property="og:image" content="([^"]*)"/.exec(html)?.[1] ?? "(none)";
  const ogUrl = /<meta property="og:url" content="([^"]*)"/.exec(html)?.[1] ?? "(none)";
  const tw = /<meta name="twitter:image" content="([^"]*)"/.exec(html)?.[1] ?? "(none)";
  seen.push({ path, robots, canonical, og, ogUrl, tw });
}

const indexOk = seen.every((p) =>
  EXPECT_INDEXABLE ? /index/.test(p.robots) && !/noindex/.test(p.robots) : /noindex/.test(p.robots));
check(`robots meta on all ${seen.length} pages`, indexOk, seen[0].robots);

const canonicalOk = seen.every((p) => p.canonical.startsWith(LIVE));
check("canonical on every page", canonicalOk, seen[0].canonical);
check(
  "canonical matches its own path",
  seen.every((p) => p.canonical.replace(LIVE, "").replace(/\/$/, "") === p.path.replace(/\/$/, "")),
  seen.filter((p) => p.canonical.replace(LIVE, "").replace(/\/$/, "") !== p.path.replace(/\/$/, "")).map((p) => p.path).join(", "),
);
check("og:image absolute on every page", seen.every((p) => p.og.startsWith("https://")), seen[0].og);
check("twitter:image absolute on every page", seen.every((p) => p.tw.startsWith("https://")));
check("og:url absolute on every page", seen.every((p) => p.ogUrl.startsWith(LIVE)));

const distinctOg = new Set(seen.map((p) => p.og)).size;
check("social cards are per-page, not one shared image", distinctOg > 8, `${distinctOg} distinct og:images across ${seen.length} pages`);

const ogMissing = [];
for (const { og } of seen) {
  const r = await fetch(og.replace(LIVE, BASE), { method: "HEAD" });
  if (!r.ok) ogMissing.push(og);
}
check("every og:image resolves", ogMissing.length === 0, ogMissing.join(", "));

/* ---------- 3. sitemap ---------- */
console.log("\nsitemap.xml");
const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check("sitemap is not empty", urls.length > 0, `${urls.length} URLs`);
check("every entry is on the live origin", urls.every((u) => u.startsWith(LIVE)));
check("no study or direction route leaks in", !urls.some((u) => /\/(study|direction)\//.test(u)));

const dead = [];
for (const u of urls) {
  const r = await fetch(u.replace(LIVE, BASE), { redirect: "manual" });
  if (r.status !== 200) dead.push(`${u} -> ${r.status}`);
}
check("every sitemap URL returns 200", dead.length === 0, dead.join(", "));

const sitemapPaths = new Set(urls.map((u) => u.replace(LIVE, "") || "/"));
check(
  "every real page is listed",
  PAGES.every((p) => sitemapPaths.has(p)),
  PAGES.filter((p) => !sitemapPaths.has(p)).join(", "),
);

/* ---------- 4. noindex routes stay noindex in EVERY environment ---------- */
console.log("\nstudy and direction routes");
for (const p of ["/study/enquiry", "/direction/a"]) {
  const r = await fetch(`${BASE}${p}`);
  if (r.status === 404) {
    console.log(`  skip  ${p} (not built)`);
    continue;
  }
  const html = await r.text();
  check(`${p} is noindex`, /<meta name="robots" content="[^"]*noindex/.test(html));
}

/* ---------- 4b. only the real domain may be indexed ---------- */
/*
 * The check that was missing, and the one that matters most.
 *
 * Pushing to `main` makes Vercel build a PRODUCTION deployment, so VERCEL_ENV
 * says "production" and the app declares itself indexable — on
 * domisignature-redesign.vercel.app, which is not the site. That produced a
 * live, crawlable duplicate. `src/middleware.ts` now decides by request host
 * instead of by build environment, and this proves it, because the failure was
 * invisible to every check that only ever asked for localhost.
 *
 * Raw node:http, because fetch refuses to let you set the Host header — and the
 * Host header is the entire subject of this test.
 */
function headWithHost(path, host) {
  const { hostname, port } = new URL(BASE);
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname, port, path, method: "GET", headers: { host } },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () => resolve({ headers: res.headers, body }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

console.log("\nindexable only on the real domain");
{
  const impostor = await headWithHost("/", "domisignature-redesign.vercel.app");
  check("a non-canonical host gets X-Robots-Tag: noindex",
    /noindex/.test(impostor.headers["x-robots-tag"] ?? ""),
    impostor.headers["x-robots-tag"] ?? "(no header)");

  const impostorRobots = await headWithHost("/robots.txt", "domisignature-redesign.vercel.app");
  check("a non-canonical host gets a disallow-all robots.txt",
    /Disallow:\s*\/\s*$/m.test(impostorRobots.body) && !/Allow:\s*\/\s*$/m.test(impostorRobots.body));

  const real = await headWithHost("/", "domisignature.com");
  check("the real domain is NOT blocked by that rule",
    !/noindex/.test(real.headers["x-robots-tag"] ?? ""),
    real.headers["x-robots-tag"] ?? "(no header, correct)");
}

/* ---------- 5. the legacy redirect map ---------- */
console.log("\nlegacy paths");
const pathResults = [];
for (const [from, to, why] of PATH_ROWS) {
  const r = await fetch(`${BASE}${from}`, { redirect: "manual" });
  const landed = (r.headers.get("location") ?? "").replace(BASE, "") || "(none)";
  const ok = [301, 307, 308].includes(r.status) && landed === to;
  check(`${from} -> ${to}`, ok, `${r.status} ${landed}`);
  pathResults.push([from, to, why, ok ? `${r.status}` : `FAIL ${r.status} ${landed}`]);
}

console.log("\nlegacy assets");
const assetResults = [];
for (const [from, why] of ASSET_ROWS) {
  const r = await fetch(`${BASE}${from}`, { method: "HEAD" });
  check(`${from} still served`, r.ok, `${r.status}`);
  assetResults.push([from, "(same path)", why, r.ok ? "200" : `FAIL ${r.status}`]);
}

console.log("\nlegacy fragments (client hop — a fragment never reaches a server)");
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const hashResults = [];
for (const [hash, to, why] of HASH_ROWS) {
  /*
   * about:blank first, and it matters. Navigating straight from `/#about` to
   * `/#services` changes only the fragment, so the browser scrolls instead of
   * reloading — the component never remounts and the hop never runs. Testing
   * the rows back to back without this makes working redirects look broken.
   */
  await page.goto("about:blank");
  await page.goto(`${BASE}/${hash}`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const u = new URL(page.url());
  const landed = u.pathname + u.hash;
  const ok = to === "/" ? u.pathname === "/" : landed === to;
  check(`/${hash} -> ${to}`, ok, landed);
  hashResults.push([`/${hash}`, to, why, ok ? "ok" : `FAIL landed on ${landed}`]);
}
await browser.close();

/* ---------- write the map ---------- */
await mkdir("design-review", { recursive: true });
const row = ([f, t, w, r]) => `| \`${f}\` | \`${t}\` | ${w} | ${r} |`;

const md = `# Legacy redirect map

Every URL the old one-page site published, and where it lands now. Compiled from
\`scripts/source.html\` — the archived original — rather than from memory. Each
row below was executed against a production-mode build; the Result column is
what actually happened, not what should happen.

Regenerate with \`node scripts/launch-check.mjs\` against a running build.

## Paths — server redirects (\`next.config.ts\`)

308 is a permanent redirect that preserves the request method. Search engines
pass the old URL's accumulated ranking to the new one.

| Old URL | New destination | Why | Result |
| --- | --- | --- | --- |
${pathResults.map(row).join("\n")}

## Assets — unchanged paths

Still served from exactly where the old site linked them, so no redirect is
needed and no external link breaks.

| Old URL | New destination | Why | Result |
| --- | --- | --- | --- |
${assetResults.map(row).join("\n")}

## Fragments — client hop (\`src/components/layout/LegacyAnchorRedirect.tsx\`)

The old site was a single page: its sections and all eleven photo galleries were
fragments. **No server-side rule can redirect these.** A fragment is never
transmitted in an HTTP request — the browser asks for \`/\` and resolves
\`#portfolioModal2\` locally — so Next's \`redirects()\`, Vercel's config and any
nginx rule are all structurally incapable of seeing it. The only place the
information exists is the browser, so that is where the hop happens: on arrival
at the homepage a known legacy fragment is \`replace\`d with the route now holding
that content. Unknown fragments are left untouched, so the skip link and any
future in-page anchor are unaffected.

Two things here are counter-intuitive and both are deliberate.

**\`#about\` lands on \`/wedding-guide\`, and \`#team\` lands on \`/about\`.** The old
anchors were named for their position in the nav, not their contents:
\`#about\` held "Your Wedding Journey with Domisignature", the step-by-step
guide, and \`#team\` held "Our Amazing Team". Mapping them by name would send
every visitor to the wrong page. Anyone tidying this later should read
\`scripts/source.html\` before "correcting" it.

**The event galleries were matched by photo set, not by title.** The old titles
were "Party", "Party", "Party", "Wedding", "Dinner", "Party", "Wedding" — they
identify nothing. Each modal's image prefix (\`st*\`, \`de*\`, \`bl*\`, \`we*\`,
\`jd*\`, \`pa*\`, \`ol*\`) is what ties it to its new slug.

| Old URL | New destination | Why | Result |
| --- | --- | --- | --- |
${hashResults.map(row).join("\n")}

## Not redirected, deliberately

| Old URL | What happens | Why |
| --- | --- | --- |
| \`/css/styles.css\` | 404 | A stylesheet for a site that no longer exists. Nothing links to it but the old HTML, which is itself redirected. |
| \`/js/scripts.js\` | 404 | Same. |
| Old \`/media/*.jpg\` paths | 200 where the photograph is still used, 404 where it was withdrawn | These were never navigable pages — they were \`<img>\` sources. The withheld frames (\`design-review/publish-manifest.md\`) are 404 **by intent**. |
`;

await writeFile("design-review/redirect-map.md", md, "utf8");

console.log(`\n${"-".repeat(64)}`);
console.log(`${pass} checks passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  ! ${f}`));
  process.exitCode = 1;
}
console.log("-> design-review/redirect-map.md");
