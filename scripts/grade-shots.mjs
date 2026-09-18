/**
 * Stage 2 captures — the grade decision, as pictures.
 *
 * Two kinds of evidence, because they answer different questions:
 *
 *   frames    the six classified photographs, A beside B, on ivory and again
 *             inside a dark chapter — does the grade hold on both grounds?
 *   venues    the full north-star composition rendered twice, once per grade —
 *             does it hold in a real page rather than a specimen row?
 *
 * One browser per shot: this machine kills long Chromium sessions part-way and
 * a half-captured comparison is worse than none.
 *
 * Usage: node scripts/grade-shots.mjs <frames|venues> <1440|390>
 */

import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = "design-review/grade";
await mkdir(OUT, { recursive: true });

const what = process.argv[2] ?? "frames";
const width = Number(process.argv[3] ?? 1440);
const height = width < 768 ? 844 : 900;

async function shoot(url, { clipTo = null, fullPage = false } = {}) {
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      ...(width < 768 ? { hasTouch: true, isMobile: true } : {}),
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2600);
    /* Walk so lazy images decode and reveals fire; never return to the top. */
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.75);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 160));
      }
    });
    await page.waitForTimeout(2600);

    if (clipTo) {
      const el = page.locator(clipTo).first();
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      return await el.screenshot();
    }
    return await page.screenshot({ fullPage });
  } finally {
    await browser.close();
  }
}

async function strip(panels, labels, outfile) {
  const metas = await Promise.all(panels.map((b) => sharp(b).metadata()));
  const w = Math.min(...metas.map((m) => m.width));
  const h = Math.min(...metas.map((m) => m.height));
  const CAP = 34, GAP = 14;
  const cropped = await Promise.all(
    panels.map((b) => sharp(b).extract({ left: 0, top: 0, width: w, height: h }).png().toBuffer()),
  );
  const composites = [];
  cropped.forEach((buf, i) => {
    const left = i * (w + GAP);
    composites.push({ input: buf, left, top: CAP });
    composites.push({
      input: Buffer.from(
        `<svg width="${w}" height="${CAP}" xmlns="http://www.w3.org/2000/svg">
           <rect width="100%" height="100%" fill="#101012"/>
           <text x="10" y="23" font-family="monospace" font-size="15" fill="#e8e4de">${labels[i]}</text>
         </svg>`,
      ),
      left,
      top: 0,
    });
  });
  await sharp({
    create: { width: panels.length * w + (panels.length - 1) * GAP, height: h + CAP, channels: 3, background: "#101012" },
  })
    .composite(composites)
    .png()
    .toFile(outfile);
}

if (what === "frames") {
  const buf = await shoot(`${BASE}/study/aegean/grade`, { fullPage: true });
  const file = `${OUT}/${width}-grade-frames.png`;
  await sharp(buf).png().toFile(file);
  console.log(`  ${file}`);
} else {
  const panels = [];
  for (const g of ["a", "b"]) panels.push(await shoot(`${BASE}/study/aegean/venues?grade=${g}`, { fullPage: true }));
  const file = `${OUT}/${width}-venues-grade.png`;
  await strip(panels, ["A — plate", "B — window"], file);
  console.log(`  ${file}`);
}
