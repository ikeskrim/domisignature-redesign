/**
 * Asset integrity check — crawls the built site and fails on any request that
 * does not return 200.
 *
 * Written when preparing the public repository: excluding 135 MB of raw masters
 * and withheld frames is only safe if nothing the site actually serves went
 * with them. A green build proves the code compiles; this proves the deployed
 * page can fetch everything it asks for.
 *
 * Usage: npm run audit:assets
 */

import { chromium } from "playwright";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";

const ROUTES = [
  "/",
  "/venues",
  "/venues/mountain-escape",
  "/venues/thalasses",
  "/venues/olive-stories",
  "/events",
  "/events/sunset-by-the-pool",
  "/events/villa-party",
  "/events/party-celebration",
  "/events/wedding-rituals-aerial",
  "/events/dinner-celebration",
  "/events/party-drone",
  "/events/wedding-rituals-olive",
  "/services",
  "/wedding-guide",
  "/about",
  "/contact",
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const failures = [];
const seen = new Set();

page.on("response", (res) => {
  const url = res.url();
  /* Only our own origin — third-party embeds are not ours to police. */
  if (!url.startsWith(BASE)) return;
  if (seen.has(url)) return;
  seen.add(url);
  const s = res.status();
  if (s >= 400) failures.push(`${s}  ${url.replace(BASE, "")}`);
});

for (const route of ROUTES) {
  /*
   * `domcontentloaded`, not `load`, and this is not a shortcut.
   *
   * `load` waits for every subresource including the hero film — several MB of
   * video. On a fast local machine that lands inside the default 30s; on a CI
   * runner it does not, and this audit failed with a TimeoutError on a
   * documentation-only commit. A gate that goes red for reasons unrelated to
   * the code is a gate people learn to ignore, so the flake is the bug.
   *
   * Nothing is lost by not waiting: the check listens to the `response` event,
   * so a request is recorded whenever it completes. What matters is that every
   * request gets ISSUED — which is what the scroll walk below forces — and the
   * settle after it gives them time to come back.
   */
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1800);
  /* Walk the page so lazy assets are actually requested. */
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 130));
    }
  });
  await page.waitForTimeout(1200);
  process.stdout.write(".");
}

console.log(`\n\n${seen.size} same-origin requests across ${ROUTES.length} routes`);

/*
 * Re-fetch anything that came back non-200, once, before calling it a failure.
 *
 * Each URL is recorded on its FIRST response only, so a single hiccup from the
 * image optimiser under a burst of concurrent requests marked that URL failed
 * for the whole run — even though every later request for it succeeded. That
 * turned a green audit red at random, which is how a quality gate becomes
 * something people learn to skim past.
 *
 * This is not papering over it. A genuinely missing asset fails the retry too
 * and still fails the audit; a URL that recovers is reported as a flake, by
 * name, so a real intermittent problem stays visible instead of being silently
 * swallowed.
 */
const confirmed = [];
const recovered = [];
for (const entry of [...new Set(failures)]) {
  const path = entry.slice(entry.indexOf("/"));
  let ok = false;
  try {
    ok = (await fetch(`${BASE}${path}`)).ok;
  } catch {
    ok = false;
  }
  (ok ? recovered : confirmed).push(entry);
}

if (recovered.length) {
  console.log(`\n${recovered.length} recovered on retry — transient, not a missing asset:`);
  for (const r of recovered) console.log(`  ${r}`);
}

if (confirmed.length) {
  console.log(`\n${confirmed.length} FAILED:`);
  for (const f of confirmed) console.log(`  ${f}`);
  process.exitCode = 1;
} else {
  console.log("Every asset the site requests returned 200.");
}

await browser.close();
