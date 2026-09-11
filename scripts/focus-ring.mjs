/**
 * Focus-ring contrast — the check axe does not run.
 *
 * WCAG 1.4.11 asks a focus indicator to hold 3:1 against what it sits next
 * to. axe-core does not evaluate that, and the light study found out the hard
 * way: the shipped gold ring is 6.68:1 on night and 2.52:1 on ivory, and every
 * page passed axe with a ring nobody could see. So the ring became law — near-
 * black on paper, gold inside a dark chapter — and law needs a measurement.
 *
 * Assumption-free, like the arrival check. Every route is tabbed through the
 * way a keyboard user tabs, so the browser's own :focus-visible heuristic is
 * what decides whether a ring is drawn. At each stop the element's surroundings
 * are photographed twice — with the ring, and with the ring's colour forced to
 * transparent at the same scroll position — and the pixels that differ ARE the
 * ring. Each solid ring pixel is scored against the pixel it replaced, and the
 * worst one is reported, because a ring is only as visible as its faintest
 * stretch. A stop whose two photographs do not differ has no visible ring at
 * all, which is its own failure.
 *
 * Usage: node scripts/focus-ring.mjs           exits 1 on any ring under 3:1
 */

import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const BAR = 3.0;
const MAX_TABS = 45;
const PAD = 10;

const ROUTES = [
  ["home", "/"],
  ["venues", "/venues"],
  ["venue-detail", "/venues/thalasses"],
  ["events", "/events"],
  ["event-detail", "/events/villa-party"],
  ["services", "/services"],
  ["wedding-guide", "/wedding-guide"],
  ["about", "/about"],
  ["contact", "/contact"],
];

const chan = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (r, g, b) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const ratio = (a, b) => {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};
const parse = (s) => (s.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();

let fails = 0;
let measured = 0;

console.log("\nFOCUS RING — every tab stop, the ring against what it actually sits on\n");

for (const [name, route] of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2200);

  let worst = { ratio: Infinity, label: "" };
  const problems = [];
  const seen = new Set();

  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(220);

    const info = await page.evaluate((pad) => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const label =
        `<${el.tagName.toLowerCase()}> ` +
        (el.getAttribute("aria-label") || el.textContent || el.getAttribute("href") || "").trim().replace(/\s+/g, " ").slice(0, 40);
      return {
        label,
        outline: cs.outlineColor,
        visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
        box: {
          x: Math.max(0, Math.floor(r.left - pad)),
          y: Math.max(0, Math.floor(r.top - pad)),
          w: Math.min(innerWidth, Math.ceil(r.right + pad)) - Math.max(0, Math.floor(r.left - pad)),
          h: Math.min(innerHeight, Math.ceil(r.bottom + pad)) - Math.max(0, Math.floor(r.top - pad)),
        },
      };
    }, PAD);

    if (!info) break;
    if (!info.visible || info.box.w < 4 || info.box.h < 4) continue;
    const key = `${info.label}|${info.box.x},${info.box.y}`;
    if (seen.has(key)) break; // the tab order has wrapped
    seen.add(key);

    const clip = { x: info.box.x, y: info.box.y, width: info.box.w, height: info.box.h };
    const withRing = await page.screenshot({ clip });
    await page.evaluate(() => {
      const el = document.activeElement;
      el.dataset.focusProbe = el.style.outlineColor;
      el.style.outlineColor = "transparent";
    });
    await page.waitForTimeout(60);
    const without = await page.screenshot({ clip });
    await page.evaluate(() => {
      const el = document.activeElement;
      el.style.outlineColor = el.dataset.focusProbe || "";
      delete el.dataset.focusProbe;
    });

    const A = await sharp(withRing).raw().toBuffer({ resolveWithObject: true });
    const B = await sharp(without).raw().toBuffer();
    const [orr, og, ob] = parse(info.outline);
    const ch = A.info.channels;

    /* Solid ring pixels: differ from the unfocused frame, and sit close to the
       computed outline colour — the anti-aliased fringe is left out so a faint
       edge pixel cannot masquerade as the ring's worst case. */
    let ring = 0;
    let worstHere = Infinity;
    for (let p = 0; p < A.data.length; p += ch) {
      const d = Math.max(Math.abs(A.data[p] - B[p]), Math.abs(A.data[p + 1] - B[p + 1]), Math.abs(A.data[p + 2] - B[p + 2]));
      if (d < 24) continue;
      const near = Math.max(Math.abs(A.data[p] - orr), Math.abs(A.data[p + 1] - og), Math.abs(A.data[p + 2] - ob));
      if (near > 40) continue;
      ring++;
      const r = ratio(lum(A.data[p], A.data[p + 1], A.data[p + 2]), lum(B[p], B[p + 1], B[p + 2]));
      if (r < worstHere) worstHere = r;
    }

    measured++;
    if (ring < 20) {
      problems.push(`${info.label}: no visible ring (${ring} ring pixels)`);
      continue;
    }
    if (worstHere < worst.ratio) worst = { ratio: worstHere, label: info.label };
    if (worstHere < BAR) problems.push(`${info.label}: ring ${worstHere.toFixed(2)}:1 against its surroundings`);
  }

  const ok = problems.length === 0;
  if (!ok) fails += problems.length;
  console.log(
    `  ${ok ? "ok  " : "FAIL"}  ${name.padEnd(14)} ${seen.size} stops` +
      (worst.label ? `   worst ring ${worst.ratio.toFixed(2)}:1 on ${worst.label}` : ""),
  );
  for (const p of problems) console.log(`          - ${p}`);
}

await browser.close();
console.log(`\n${"-".repeat(70)}`);
console.log(fails === 0 ? `${measured} tab stops measured; every ring clears ${BAR}:1.` : `${fails} focus problem(s) across ${measured} stops.`);
if (fails) process.exitCode = 1;
