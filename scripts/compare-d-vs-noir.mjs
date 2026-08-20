/**
 * Phase 6b Step 1 — side-by-side of Direction D against the live noir build.
 *
 * Captures the same four surfaces from the real site (noir) and from
 * /direction/d, then composites each pair into one image so they can be judged
 * against each other rather than from memory.
 *
 * Usage: node scripts/compare-d-vs-noir.mjs
 */

import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = path.join(ROOT, "design-review", "directions");

/** [label, noir route, noir scroll fraction, D scroll fraction] */
const SURFACES = [
  ["1-hero", "/", 0, 0],
  ["2-scene", "/wedding-guide", 0.25, 0.3],
  ["3-venues", "/venues", 0.5, 0.62],
  ["4-venue", "/venues/villa-aetos", 0, 0.9],
];

const VIEWPORTS = [
  { tag: "1440", width: 1440, height: 900 },
  { tag: "390", width: 390, height: 844 },
];

async function shoot(page, url, fraction, height, file) {
  await page.goto(`${BASE}${url}`, { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(2600);
  const total = await page.evaluate(() => document.body.scrollHeight);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round((total - height) * fraction));
  // Long enough for lazy images in view to decode before the shutter.
  await page.waitForTimeout(2200);
  await page.screenshot({ path: file, timeout: 30_000 });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const [label, noirRoute, noirFrac, dFrac] of SURFACES) {
      const noirFile = path.join(OUT, `_tmp-noir-${vp.tag}-${label}.png`);
      const dFile = path.join(OUT, `_tmp-d-${vp.tag}-${label}.png`);

      await shoot(page, noirRoute, noirFrac, vp.height, noirFile);
      await shoot(page, "/direction/d", dFrac, vp.height, dFile);

      // Composite: noir left, D right, with a hairline between them.
      const gap = 24;
      await sharp({
        create: {
          width: vp.width * 2 + gap,
          height: vp.height,
          channels: 3,
          background: { r: 90, g: 90, b: 90 },
        },
      })
        .composite([
          { input: noirFile, left: 0, top: 0 },
          { input: dFile, left: vp.width + gap, top: 0 },
        ])
        .png()
        .toFile(path.join(OUT, `compare-${vp.tag}-${label}.png`));

      console.log(`  compare-${vp.tag}-${label}.png`);
    }

    await context.close();
  }

  await browser.close();
  console.log("\nleft = live noir build, right = Direction D");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
