/**
 * Before / after for the atmosphere layer (film grain + ambient light pools).
 *
 * Both halves are captured from the SAME page at the SAME scroll position in
 * the SAME session; the only difference is that `.grain` and `.glow` are set to
 * `display: none` for the "before" pass. Comparing against an older screenshot
 * would have meant comparing two builds and calling the difference grain.
 *
 * Grain at 4% opacity is invisible in a downscaled full-page screenshot, so
 * each pair also gets a 1:1 crop of the same 520x300 patch — the only honest
 * way to show a texture that operates at the pixel level.
 *
 * Usage: node scripts/compare-atmosphere.mjs
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = "design-review/atmosphere";
await mkdir(OUT, { recursive: true });

/** [label, viewport width, height, scroll fraction of page height] */
const SCENES = [
  ["1440-statement", 1440, 900, 0.16],
  ["1440-footer", 1440, 900, 0.965],
  ["390-statement", 390, 844, 0.16],
  ["390-footer", 390, 844, 0.965],
];

const HIDE = `.grain, .glow { display: none !important; }`;

const browser = await chromium.launch();

for (const [label, w, h, frac] of SCENES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();

  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(2600); // let the preloader clear

  /* Walk the page so lazy images decode, then settle at the target scene. */
  await page.evaluate(async (f) => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 110));
    }
    window.scrollTo(0, Math.round(document.body.scrollHeight * f));
  }, frac);
  await page.waitForTimeout(1800);

  const after = await page.screenshot();

  const handle = await page.addStyleTag({ content: HIDE });
  await page.waitForTimeout(500);
  const before = await page.screenshot();
  await handle.evaluate((el) => el.remove());

  /* Side by side, before on the left. */
  const cap = 26;
  const strip = (text, width) =>
    Buffer.from(
      `<svg width="${width}" height="${cap}"><rect width="${width}" height="${cap}" fill="#111"/><text x="8" y="18" font-family="monospace" font-size="14" fill="#eee">${text}</text></svg>`,
    );

  await sharp({ create: { width: w * 2 + 12, height: h + cap, channels: 3, background: "#000" } })
    .composite([
      { input: before, top: cap, left: 0 },
      { input: after, top: cap, left: w + 12 },
      { input: strip(`BEFORE — no grain, no glow`, w), top: 0, left: 0 },
      { input: strip(`AFTER — grain 4% + light pools`, w), top: 0, left: w + 12 },
    ])
    .png()
    .toFile(path.join(OUT, `${label}.png`));

  /* 1:1 crop of the same patch from each, so the grain is actually visible. */
  const cw = Math.min(520, w), ch = 300;
  const cx = Math.round((w - cw) / 2), cy = Math.round((h - ch) / 2);
  const crop = (buf) => sharp(buf).extract({ left: cx, top: cy, width: cw, height: ch }).toBuffer();

  await sharp({ create: { width: cw * 2 + 12, height: ch + cap, channels: 3, background: "#000" } })
    .composite([
      { input: await crop(before), top: cap, left: 0 },
      { input: await crop(after), top: cap, left: cw + 12 },
      { input: strip(`BEFORE 1:1`, cw), top: 0, left: 0 },
      { input: strip(`AFTER 1:1`, cw), top: 0, left: cw + 12 },
    ])
    .png()
    .toFile(path.join(OUT, `${label}-1to1.png`));

  console.log(`  ${label}`);
  await ctx.close();
}

await browser.close();
console.log(`\n-> ${OUT}/`);
