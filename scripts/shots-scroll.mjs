/**
 * Scroll-offset review capture (Phase 6 §7).
 *
 * Full-page screenshots lie about pinned and scrubbed scenes, so this steps
 * down each page roughly one viewport at a time and captures what is actually
 * on screen.
 *
 * Usage: node scripts/shots-scroll.mjs <label> [--only=1440|390] [--routes=home,venues]
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const LABEL = process.argv[2] ?? "scroll";
const OUT = path.join(ROOT, "design-review", LABEL);

const arg = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? "").split("=")[1] || null;
const ONLY = arg("only");
const ROUTE_FILTER = arg("routes")?.split(",");

const ROUTES = [
  ["home", "/"],
  ["venues", "/venues"],
  ["venue-thalasses", "/venues/thalasses"],
  ["events", "/events"],
  ["services", "/services"],
  ["wedding-guide", "/wedding-guide"],
  ["about", "/about"],
  ["contact", "/contact"],
];

const VIEWPORTS = [
  { tag: "1440", width: 1440, height: 900 },
  { tag: "390", width: 390, height: 844 },
];

/** Cap the frames per page so a very long page cannot produce fifty images. */
const MAX_FRAMES = 9;

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  let n = 0;

  const viewports = ONLY ? VIEWPORTS.filter((v) => v.tag === ONLY) : VIEWPORTS;
  const routes = ROUTE_FILTER ? ROUTES.filter(([r]) => ROUTE_FILTER.includes(r)) : ROUTES;

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const [name, route] of routes) {
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60_000 });
        await page.waitForTimeout(2200);

        /*
         * `load` fires before a cold next/image cache has actually decoded, and
         * the shutter then catches a page of empty tiles — see the note in
         * shots.mjs settle(). Wait on decode, bounded.
         */
        for (let attempt = 0; attempt < 3; attempt++) {
          const undecoded = await page.evaluate(
            () => Array.from(document.images).filter((img) => img.naturalWidth === 0).length,
          );
          if (undecoded === 0) break;
          await page.waitForTimeout(2500);
        }

        const total = await page.evaluate(() => document.body.scrollHeight);
        const frames = Math.min(MAX_FRAMES, Math.max(1, Math.ceil(total / vp.height)));

        for (let i = 0; i < frames; i++) {
          const y = Math.round((i * (total - vp.height)) / Math.max(1, frames - 1));
          await page.evaluate((top) => window.scrollTo(0, top), y);
          // Long enough for scroll-linked transforms and reveals to settle.
          await page.waitForTimeout(1100);
          await page.screenshot({
            path: path.join(OUT, `${vp.tag}-${name}-${String(i + 1).padStart(2, "0")}.png`),
            timeout: 30_000,
          });
          n++;
        }
        console.log(`  ${vp.tag} ${name.padEnd(18)} ${frames} frames`);
      } catch (err) {
        console.log(`  ${vp.tag} ${name.padEnd(18)} ERROR ${err.message.split("\n")[0]}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log(`\n${n} frames -> design-review/${LABEL}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
