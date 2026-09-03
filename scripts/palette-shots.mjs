/**
 * Side-by-side captures for the palette study.
 *
 * Each surface is shot in all three palettes at the same viewport and the same
 * scroll position, then composited into one strip with labels, so the
 * comparison is a single image rather than three files someone has to flick
 * between. Nothing is graded, cropped or retouched — the only difference
 * between panels is the token set.
 *
 * One browser per capture: this machine kills long-lived Chromium sessions
 * part-way through, which has left half-era capture sets before.
 *
 * Usage: node scripts/palette-shots.mjs
 */

import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = "design-review/palette";
await mkdir(OUT, { recursive: true });

const PALETTES = [
  ["current", ""],
  ["ember", "?palette=ember"],
  ["ember-deep", "?palette=ember-deep"],
];

/*
 * surface, route, scroll fraction, and the Aegean Bone equivalent if one was
 * built. The light study is only three surfaces, so journey and contact stay
 * three-panel — showing an empty fourth panel would imply something exists that
 * does not.
 *
 * Aegean panels come from different routes because a light inversion is not a
 * token swap: it needs mats, frames and dark chapters, which are layout, not
 * colour. The strips label it so the comparison is not mistaken for one.
 */
const SURFACES = [
  ["hero", "/", 0, "/study/aegean/hero", 0],
  ["venues", "/venues", 0.35, "/study/aegean/venues", 0.28],
  ["venue-opening", "/venues/thalasses", 0, "/study/aegean/venue", 0],
  ["journey", "/wedding-guide", 0.55, null, 0],
  ["contact", "/contact", 0.35, null, 0],
];

const WIDTHS = [
  [1440, 900, "1440"],
  [390, 844, "390"],
];

async function shoot(url, w, h, scrollFraction, fullPage = false) {
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      ...(w < 768 ? { hasTouch: true, isMobile: true } : {}),
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2600);

    /* Walk the page so scroll-reveals fire, then settle where we want to shoot.
       Never return to the top before a full-page shot: that reverses the
       reveals and photographs empty ground. */
    await page.evaluate(async (frac) => {
      const step = Math.round(window.innerHeight * 0.75);
      const target = Math.round(document.body.scrollHeight * frac);
      for (let y = 0; y <= Math.max(target, step); y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
      window.scrollTo(0, target);
    }, fullPage ? 1 : scrollFraction);
    await page.waitForTimeout(2200);

    return await page.screenshot({ fullPage });
  } finally {
    await browser.close();
  }
}

/** Stack the three panels side by side with a caption strip above each. */
async function strip(panels, labels, outfile) {
  const metas = await Promise.all(panels.map((b) => sharp(b).metadata()));
  const w = Math.min(...metas.map((m) => m.width));
  const h = Math.min(...metas.map((m) => m.height));
  const CAP = 34;
  const GAP = 14;

  const resized = await Promise.all(
    panels.map((b) => sharp(b).extract({ left: 0, top: 0, width: w, height: h }).png().toBuffer()),
  );

  const composites = [];
  resized.forEach((buf, i) => {
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
    create: {
      width: panels.length * w + (panels.length - 1) * GAP,
      height: h + CAP,
      channels: 3,
      background: "#101012",
    },
  })
    .composite(composites)
    .png()
    .toFile(outfile);
}

/* One surface per invocation: this machine kills long runs part-way, and a
   half-finished strip set is worse than none. */
const only = process.argv[2] ?? null;
const onlyWidth = process.argv[3] ?? null;

for (const [surface, route, frac, aegean, aegeanFrac] of SURFACES) {
  if (only && only !== surface) continue;
  for (const [w, h, wlabel] of WIDTHS.filter(([, , l]) => !onlyWidth || l === onlyWidth)) {
    const panels = [];
    const labels = PALETTES.map(([n]) => n);
    for (const [, q] of PALETTES) panels.push(await shoot(`${BASE}${route}${q}`, w, h, frac));
    if (aegean) {
      panels.push(await shoot(`${BASE}${aegean}`, w, h, aegeanFrac));
      labels.push("aegean-bone");
    }
    const file = `${OUT}/${wlabel}-${surface}.png`;
    await strip(panels, labels, file);
    console.log(`  ${file}`);
  }
}

/* One full-page pair, so the whole scroll can be judged rather than five slices. */
for (const [w, , wlabel] of (only !== "fullpage" ? [] : [[1440, 900, "1440"], [390, 844, "390"]].filter(([, , l]) => !onlyWidth || l === onlyWidth))) {
  const panels = [];
  for (const [, q] of PALETTES) panels.push(await shoot(`${BASE}/${q}`, w, w < 768 ? 844 : 900, 1, true));
  const file = `${OUT}/${wlabel}-home-fullpage.png`;
  await strip(panels, PALETTES.map(([n]) => n), file);
  console.log(`  ${file}`);
}

console.log(`\n-> ${OUT}/`);
