/**
 * Arrival closing frame — is the graffiti rock distinguishable?
 *
 * `stDSC_5339.jpg` is the last photograph in the scrubbed arrival sequence. It
 * carries small blue graffiti on a rock at roughly 72% across, 75% down the
 * frame. The claim made when it was chosen was that the gradient's ink band and
 * the plate's opacity bury it. This measures that claim instead of asserting it.
 *
 * Method: put the arrival in view, force the closing frame to its full shipped
 * presentation (layer opacity 1, plate opacity 0.46 — the values the scrub ends
 * on), then map the graffiti's position in the SOURCE image through the
 * object-cover transform to find where it lands on screen. Sample a patch there
 * and an identical patch of plain rock beside it, and compare luminance.
 *
 * A delta of a couple of levels out of 255 is not perceptible on a dark ground.
 * Anything larger and the frame needs recropping or replacing — never
 * retouching, which would put invented pixels on the page.
 *
 * Usage: node scripts/graffiti-check.mjs
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = "design-review/graffiti";
await mkdir(OUT, { recursive: true });

/* The sequence is gated to >=1024px wide and >=700px tall. Below that the
   closing frame never mounts, so those widths cannot show it at all. */
const VIEWPORTS = [
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
  [2560, 1080],
];

/** Where the graffiti sits in the source frame, as a fraction of the image. */
const GRAFFITI = { x: 0.72, y: 0.75 };
const PATCH = 44;

const browser = await chromium.launch();
const rows = [];

for (const [w, h] of VIEWPORTS) {
  const tag = `${w}x${h}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();

  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(2600);

  const box = await page.evaluate(async (g) => {
    const img = [...document.querySelectorAll("img")].find((i) =>
      (i.currentSrc || i.src || "").includes("stDSC_5339"),
    );
    if (!img) return { mounted: false };

    const layer = img.closest("div");
    const plate = layer.parentElement;
    plate.closest("section").scrollIntoView();
    await new Promise((r) => setTimeout(r, 700));

    /* The shipped end-of-scrub state, set directly so the measurement does not
       depend on landing on exactly the right scroll position. */
    layer.style.opacity = "1";
    plate.style.opacity = "0.46";
    await new Promise((r) => setTimeout(r, 500));

    const r = img.getBoundingClientRect();
    const scale = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
    const drawnW = img.naturalWidth * scale;
    const drawnH = img.naturalHeight * scale;
    const offX = r.left + (r.width - drawnW) / 2;
    const offY = r.top + (r.height - drawnH) / 2;

    return {
      mounted: true,
      x: Math.round(offX + g.x * drawnW),
      y: Math.round(offY + g.y * drawnH),
      vw: window.innerWidth,
      vh: window.innerHeight,
    };
  }, GRAFFITI);

  if (!box.mounted) {
    rows.push({ tag, verdict: "closing frame not mounted at this size" });
    console.log(`${tag.padEnd(11)} closing frame not mounted`);
    await ctx.close();
    continue;
  }

  const file = `${OUT}/${tag}.png`;
  await page.screenshot({ path: file });

  const onScreen =
    box.x >= PATCH && box.x < box.vw - PATCH && box.y >= PATCH && box.y < box.vh - PATCH;

  if (!onScreen) {
    rows.push({ tag, point: `${box.x},${box.y}`, verdict: "off-screen at this aspect ratio" });
    console.log(`${tag.padEnd(11)} point=(${box.x},${box.y})  off-screen at this aspect`);
    await ctx.close();
    continue;
  }

  const luminance = async (cx, cy) => {
    const left = Math.max(0, Math.min(box.vw - PATCH, Math.round(cx - PATCH / 2)));
    const top = Math.max(0, Math.min(box.vh - PATCH, Math.round(cy - PATCH / 2)));
    const { data } = await sharp(file)
      .extract({ left, top, width: PATCH, height: PATCH })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return data.reduce((a, b) => a + b, 0) / data.length;
  };

  const onGraffiti = await luminance(box.x, box.y);
  const onRock = await luminance(box.x - 90, box.y);
  const delta = Math.abs(onGraffiti - onRock);

  rows.push({
    tag,
    point: `${box.x},${box.y}`,
    graffiti: onGraffiti.toFixed(1),
    rock: onRock.toFixed(1),
    delta: delta.toFixed(1),
    verdict: delta < 3 ? "not distinguishable" : "VISIBLE — needs a fix",
  });

  console.log(
    `${tag.padEnd(11)} point=(${String(box.x).padStart(4)},${String(box.y).padStart(4)})  ` +
      `graffiti L=${onGraffiti.toFixed(1).padStart(5)}  rock L=${onRock.toFixed(1).padStart(5)}  ` +
      `delta=${delta.toFixed(1).padStart(4)}/255  ${delta < 3 ? "not distinguishable" : "VISIBLE"}`,
  );

  await ctx.close();
}

await browser.close();

const worst = rows
  .filter((r) => r.delta !== undefined)
  .reduce((a, b) => (Number(a?.delta ?? -1) > Number(b.delta) ? a : b), null);
console.log(`\nworst delta across all widths: ${worst ? `${worst.delta}/255 at ${worst.tag}` : "n/a"}`);
if (worst && Number(worst.delta) >= 3) process.exitCode = 1;
