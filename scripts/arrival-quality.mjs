/**
 * Re-pricing the arrival plates.
 *
 * `quality={50}` was not a performance default — it was a decision priced for
 * CONCEALMENT. The comment in Arrival.tsx says so outright: the plates "sit at
 * 30-46% opacity under a full-height gradient and never resolve as detail", so
 * detail would have been bytes spent on something no one could see.
 *
 * The plate mechanism voids that premise. The photograph now sits at 62% under
 * an ivory wash that is 0.58 at the top of the frame, and it is *meant* to be
 * seen. So the question has to be asked again from scratch, and answered by
 * measurement rather than by raising the number because it feels safer.
 *
 * Method. Each frame is fetched from the real image optimizer at every quality
 * `next.config.ts` allows, and the bytes are recorded. Then each is composited
 * in a real browser exactly as the scene composites it — ivory ground, 62%
 * opacity, the `grade-b` filter, the plate wash on top — and diffed against the
 * highest quality as the reference. What is reported is the delta a visitor
 * could actually see, not the delta between the source files.
 *
 * The top band is reported separately, because that is where the wash is
 * thinnest (0.58) and therefore where compression artefacts have the least
 * covering them. If any quality is going to fail, it fails there first.
 *
 * Usage: node scripts/arrival-quality.mjs
 */

import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const QUALITIES = [50, 75, 80, 85];
const REFERENCE = 85;
const WIDTH = 1920; // what sizes="100vw" resolves to on a 1440 screen at DPR 1
const VIEW = { width: 1440, height: 900 };

const FRAMES = [
  "/media/mdGEOR3108.jpg",
  "/media/xDJI_20260207131326_0065_D.jpg",
  "/media/th3-DSC_5495.jpg",
  "/media/paDJI_2289.JPG",
  "/media/stDSC_5339.jpg",
];

const imgUrl = (src, q) => `${BASE}/_next/image?url=${encodeURIComponent(src)}&w=${WIDTH}&q=${q}`;

/* The composite, copied from the plate: ivory under, photograph at 62% with
   grade-b over it, and the wash on top. Nothing here is approximated — the
   filter and the gradient are the same declarations the component ships. */
const composite = (url) => `
<style>
  html,body{margin:0;height:100%;background:#f2ece1}
  .scene{position:relative;width:100vw;height:100vh;overflow:hidden}
  .plate{position:absolute;inset:0;opacity:0.62}
  .plate img{width:100%;height:100%;object-fit:cover;
    filter:contrast(1.12) brightness(0.99) saturate(1.1) sepia(0.05)}
  .wash{position:absolute;inset:0;background:linear-gradient(to top,
    rgb(242 236 225 / 0.94) 0%, rgb(242 236 225 / 0.72) 46%, rgb(242 236 225 / 0.58) 100%)}
</style>
<div class="scene"><div class="plate"><img src="${url}"></div><div class="wash"></div></div>`;

const bytes = new Map();
const shots = new Map();

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 });
const page = await ctx.newPage();

for (const src of FRAMES) {
  for (const q of QUALITIES) {
    const res = await fetch(imgUrl(src, q));
    if (!res.ok) throw new Error(`optimizer returned ${res.status} for ${src} q=${q}`);
    const buf = Buffer.from(await res.arrayBuffer());
    bytes.set(`${src}|${q}`, buf.length);

    await page.setContent(composite(imgUrl(src, q)), { waitUntil: "load" });
    await page.evaluate(() => Promise.all(Array.from(document.images, (i) => i.decode())));
    await page.waitForTimeout(120);
    shots.set(`${src}|${q}`, await page.screenshot());
  }
}

await browser.close();

/* Per-pixel delta between a candidate composite and the reference one. The top
   third is scored on its own — thinnest wash, least cover. */
async function delta(a, b) {
  const A = await sharp(a).raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(b).raw().toBuffer();
  const { width, height, channels } = A.info;
  const band = Math.round(height / 3);
  let max = 0, sum = 0, n = 0, topMax = 0, topSum = 0, topN = 0;

  for (let i = 0; i < A.data.length; i += channels) {
    const d = Math.max(
      Math.abs(A.data[i] - B[i]),
      Math.abs(A.data[i + 1] - B[i + 1]),
      Math.abs(A.data[i + 2] - B[i + 2]),
    );
    if (d > max) max = d;
    sum += d; n++;
    if (Math.floor(i / channels / width) < band) {
      if (d > topMax) topMax = d;
      topSum += d; topN++;
    }
  }
  return { max, mean: sum / n, topMax, topMean: topSum / topN };
}

const kb = (b) => `${(b / 1024).toFixed(0)} KB`;

console.log(`\nARRIVAL PLATE QUALITY — composite delta against q${REFERENCE}, and what it costs\n`);
console.log(`  frames composited at 62% under the plate wash, ${VIEW.width}x${VIEW.height}, w=${WIDTH}\n`);

const totals = Object.fromEntries(QUALITIES.map((q) => [q, 0]));

for (const src of FRAMES) {
  console.log(src.replace("/media/", ""));
  for (const q of QUALITIES) {
    const size = bytes.get(`${src}|${q}`);
    totals[q] += size;
    if (q === REFERENCE) {
      console.log(`  q${q}  ${kb(size).padStart(7)}   reference`);
      continue;
    }
    const d = await delta(shots.get(`${src}|${q}`), shots.get(`${src}|${REFERENCE}`));
    console.log(
      `  q${q}  ${kb(size).padStart(7)}   ` +
        `whole frame  max ${String(d.max).padStart(3)}  mean ${d.mean.toFixed(2)}` +
        `   |   top third  max ${String(d.topMax).padStart(3)}  mean ${d.topMean.toFixed(2)}`,
    );
  }
  console.log("");
}

console.log("-".repeat(72));
console.log("five frames together, as served:");
for (const q of QUALITIES) {
  const over50 = totals[q] - totals[50];
  console.log(
    `  q${q}  ${kb(totals[q]).padStart(8)}` +
      (q === 50 ? "   (what ships today)" : `   +${kb(over50)} over q50`),
  );
}
console.log(
  "\nread it as: a max delta at or under ~2 is below a just-noticeable difference on\n" +
    "a smooth wash; anything in double figures is a visible artefact at 62%.",
);
