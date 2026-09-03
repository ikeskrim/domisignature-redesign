/**
 * Phase 6 Step A — capture the three art directions.
 *
 * Viewport-sized shots (not full page) at successive scroll offsets, so each of
 * the four surfaces is judged at the size it will actually be seen.
 *
 * Usage: node scripts/shots-directions.mjs
 */

import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = path.join(ROOT, "design-review", "directions");

const DIRECTIONS = (process.argv.find((a) => a.startsWith("--only="))?.split("=")[1] ?? "a,b,c,d").split(",");
const VIEWPORTS = [
  { tag: "1440", width: 1440, height: 900 },
  { tag: "390", width: 390, height: 844 },
];

/** The four surfaces, as a fraction of total scrollable height. */
const SURFACES = [
  ["1-hero", 0],
  ["2-scene", 0.28],
  ["3-venues", 0.55],
  ["4-venue", 0.86],
];

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  let n = 0;

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const d of DIRECTIONS) {
      await page.goto(`${BASE}/direction/${d}`, { waitUntil: "load", timeout: 60_000 });
      // Let the entry animations finish rather than catching them mid-flight.
      await page.waitForTimeout(2500);

      const height = await page.evaluate(() => document.body.scrollHeight);

      for (const [label, fraction] of SURFACES) {
        const y = Math.round((height - vp.height) * fraction);
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(900);
        await page.screenshot({
          path: path.join(OUT, `${vp.tag}-${d}-${label}.png`),
          timeout: 30_000,
        });
        n++;
      }
    }

    await context.close();
    console.log(`captured ${vp.tag}px`);
  }

  await browser.close();
  console.log(`\n${n} screenshots -> design-review/directions/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
