/**
 * The live-domain verification, in one command.
 *
 *   npm run verify:launch
 *
 * Runs the three checks that matter after a cutover, against the real domain
 * over the real internet:
 *
 *   1. Indexability, from outside. The live domain must serve `index, follow`
 *      and a permissive robots.txt naming the sitemap — and every other host
 *      the project answers on must still be sealed. This is the check that
 *      would have caught the duplicate-content problem found in Run 2.
 *   2. The complete legacy redirect map, executed live. Every path row, every
 *      asset row, every fragment row.
 *   3. A full crawl: every route 200s, every same-origin asset 200s, no mixed
 *      content, TLS valid, www redirects to the apex.
 *
 * This is also the first-24-hours tool: run it again tomorrow, and next week.
 * Exits non-zero if anything fails, so it can front a cron job.
 */

import { chromium } from "playwright";

const LIVE = process.env.LIVE_URL ?? "https://domisignature.com";
const HOST = new URL(LIVE).host;
const ALIAS = process.env.ALIAS_URL ?? "https://domisignature-redesign.vercel.app";

let pass = 0;
const failures = [];
const check = (label, ok, detail = "") => {
  if (ok) {
    pass++;
    console.log(`  ok    ${label}${detail ? `  ${detail}` : ""}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL  ${label}  ${detail}`);
  }
  return ok;
};

/*
 * Exiting on Windows while a fetch socket is still closing trips a libuv
 * assertion — "!(handle->flags & UV_HANDLE_CLOSING)" — and the process dies
 * with code 127 AFTER printing everything correctly. That looked like a
 * missing command and killed two background watchers before the assertion
 * text gave it away. Letting the loop turn a few times first lets undici's
 * keep-alive sockets close cleanly.
 */
async function bail(code) {
  await new Promise((r) => setTimeout(r, 400));
  process.exit(code);
}

const ROUTES = [
  "/", "/venues", "/venues/thalasses", "/venues/mountain-escape", "/venues/olive-stories",
  "/events", "/events/sunset-by-the-pool", "/events/villa-party", "/events/party-celebration",
  "/events/wedding-rituals-aerial", "/events/dinner-celebration", "/events/party-drone",
  "/events/wedding-rituals-olive", "/services", "/wedding-guide", "/about", "/contact",
];

const PATH_ROWS = [
  ["/index.html", "/"],
  ["/events/party-dance", "/events/sunset-by-the-pool"],
  ["/venues/villa-aetos", "/venues"],
];

const HASH_ROWS = [
  ["#about", "/wedding-guide"], ["#team", "/about"], ["#services", "/services"],
  ["#contact", "/contact"], ["#portfolio", "/venues"], ["#portfolio1", "/events"],
  ["#portfolioModal1", "/venues/mountain-escape"], ["#portfolioModal2", "/venues/thalasses"],
  ["#portfolioModal3", "/venues/olive-stories"], ["#portfolioModal4", "/venues"],
  ["#portfolio1Modal1", "/events/sunset-by-the-pool"], ["#portfolio1Modal2", "/events/villa-party"],
  ["#portfolio1Modal3", "/events/party-celebration"], ["#portfolio1Modal4", "/events/wedding-rituals-aerial"],
  ["#portfolio1Modal5", "/events/dinner-celebration"], ["#portfolio1Modal6", "/events/party-drone"],
  ["#portfolio1Modal7", "/events/wedding-rituals-olive"],
];

const ASSETS = ["/assets/files/Weddingbrochure.pdf", "/assets/favicon.ico"];

console.log(`\nVERIFY LAUNCH  ${LIVE}\n`);

/* ---------- 0. is it even the new site? ---------- */
let home;
try {
  home = await fetch(`${LIVE}/`, { signal: AbortSignal.timeout(25000) });
} catch (e) {
  console.log(`  cannot reach ${LIVE}: ${String(e).slice(0, 90)}`);
  console.log("\n  If the cutover has not happened yet this is expected.");
  await bail(1);
}
/*
 * "Rethymno" appears in BOTH sites' HTML — it is the same business — so it
 * cannot tell them apart. The discriminating pair is an `x-vercel-id` header,
 * which only Vercel sets, and /venues returning 200, which the old one-page
 * site 404s. A dry run against the pre-cutover domain caught this.
 */
const vercelId = home.headers.get("x-vercel-id");
const venuesProbe = await fetch(`${LIVE}/venues`, { redirect: "manual" }).catch(() => null);
const isNewBuild = check(
  "the live domain serves the new build",
  !!vercelId && venuesProbe?.status === 200,
  `x-vercel-id ${vercelId ?? "absent"}, /venues ${venuesProbe?.status ?? "unreachable"}`,
);
check("TLS is valid", LIVE.startsWith("https://") && home.ok, home.headers.get("x-vercel-id") ?? "");

/*
 * Stop here if the cutover has not happened. Everything below assumes the new
 * site is being served; running it against the old one produces seventeen
 * confusing 404s and a wall of failures that say nothing useful. Fail fast and
 * say which site answered instead.
 */
if (!isNewBuild) {
  const server = home.headers.get("server") ?? "unknown";
  console.log(`\n  ${LIVE} is still served by: ${server}`);
  console.log("  The DNS cutover has not taken effect yet — nothing else is worth checking.");
  console.log("\n  Watch it with:  npm run watch:dns");
  await bail(1);
}

/* ---------- 1. indexability, from outside ---------- */
console.log("\n1. indexability");
const robots = await (await fetch(`${LIVE}/robots.txt`)).text();
check("robots.txt allows crawling", /Allow:\s*\/\s*$/m.test(robots) && !/Disallow:\s*\/\s*$/m.test(robots));
check("robots.txt names the sitemap", robots.includes(`${LIVE}/sitemap.xml`));
check("no X-Robots-Tag: noindex on the live domain", !/noindex/.test(home.headers.get("x-robots-tag") ?? ""),
  home.headers.get("x-robots-tag") ?? "(no header, correct)");

const metas = [];
for (const r of ROUTES) {
  const html = await (await fetch(`${LIVE}${r}`)).text();
  metas.push({ r, m: /<meta name="robots" content="([^"]*)"/.exec(html)?.[1] ?? "(none)",
    c: /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1] ?? "(none)" });
}
check(`all ${metas.length} routes say index, follow`,
  metas.every((x) => /index/.test(x.m) && !/noindex/.test(x.m)), metas[0].m);
check("every canonical points at the live domain",
  metas.every((x) => x.c.startsWith(LIVE)), metas[0].c);

const aliasRobots = await (await fetch(`${ALIAS}/robots.txt`)).text();
const aliasHead = await fetch(`${ALIAS}/`, { redirect: "manual" });
check("the vercel.app alias is STILL sealed",
  /Disallow:\s*\/\s*$/m.test(aliasRobots) && /noindex/.test(aliasHead.headers.get("x-robots-tag") ?? ""),
  aliasHead.headers.get("x-robots-tag") ?? "");

const sitemap = await (await fetch(`${LIVE}/sitemap.xml`)).text();
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check("sitemap lists every route", locs.length === ROUTES.length, `${locs.length} URLs`);
check("no study or direction route in the sitemap", !locs.some((u) => /\/(study|direction)\//.test(u)));

/* ---------- 2. the redirect map, live ---------- */
console.log("\n2. legacy redirects, live");
for (const [from, to] of PATH_ROWS) {
  const r = await fetch(`${LIVE}${from}`, { redirect: "manual" });
  const loc = (r.headers.get("location") ?? "").replace(LIVE, "");
  check(`${from} -> ${to}`, [301, 307, 308].includes(r.status) && loc === to, `${r.status} ${loc}`);
}
for (const a of ASSETS) {
  const r = await fetch(`${LIVE}${a}`, { method: "HEAD" });
  check(`${a} still served`, r.ok, `${r.status}`);
}

const wwwRes = await fetch(`https://www.${HOST}/venues`, { redirect: "manual" }).catch(() => null);
check("www redirects to the apex",
  !!wwwRes && [301, 307, 308].includes(wwwRes.status) && (wwwRes.headers.get("location") ?? "").startsWith(`${LIVE}/venues`),
  wwwRes ? `${wwwRes.status} ${wwwRes.headers.get("location") ?? ""}` : "no response");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
for (const [hash, to] of HASH_ROWS) {
  await page.goto("about:blank");
  await page.goto(`${LIVE}/${hash}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1400);
  const landed = new URL(page.url()).pathname;
  check(`/${hash} -> ${to}`, landed === to, landed);
}

/* ---------- 3. full crawl ---------- */
console.log("\n3. full crawl");
const bad = [];
const insecure = new Set();
page.on("response", (res) => {
  const u = res.url();
  if (u.startsWith("http://")) insecure.add(u);
  if (u.startsWith(LIVE) && res.status() >= 400) bad.push(`${res.status()} ${u.replace(LIVE, "")}`);
});
for (const r of ROUTES) {
  await page.goto(`${LIVE}${r}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
  });
  await page.waitForTimeout(900);
  process.stdout.write(".");
}
console.log("");
check("every route and same-origin asset returns < 400", bad.length === 0, [...new Set(bad)].slice(0, 6).join(" | "));
check("no mixed content", insecure.size === 0, [...insecure].slice(0, 3).join(" | "));

/* the two iframes must be present in the served pages */
await page.goto(`${LIVE}/contact`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.evaluate(async () => { const s = Math.round(innerHeight * 0.8); for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } });
await page.waitForTimeout(4000);
const frames = await page.evaluate(() => document.querySelectorAll("iframe").length);
check("the enquiry form and maps are present on /contact", frames >= 3, `${frames} iframes`);

await browser.close();

console.log(`\n${"-".repeat(64)}`);
console.log(`${pass} checks passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  ! ${f}`));
  console.log(`\nROLLBACK: at aspx.gr restore  A @ 31.22.115.30  and  A www 31.22.115.30.  Nothing else.`);
  process.exitCode = 1;
}
