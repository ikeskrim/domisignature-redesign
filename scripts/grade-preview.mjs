/**
 * Renders a side-by-side of the shared photographic grade so the exact filter
 * values can be judged by eye rather than argued about in the abstract.
 *
 * The comparison uses the real CSS filter from globals.css `.grade`, applied by
 * a real browser — not an approximation in sharp.
 *
 * Usage: node scripts/grade-preview.mjs
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "design-review", "grade");

/** The value under review — keep in sync with `.grade` in globals.css. */
const GRADE = "contrast(1.06) saturate(1.08) brightness(1.015) sepia(0.05)";

const SAMPLES = [
  ["/media/video/hero.jpg", "Hero — dusk aerial"],
  ["/media/mdGEOR3108.jpg", "Mountain Escape — midday"],
  ["/media/olth4.jpg", "Thalasses — overcast banquet"],
  ["/media/we3-IMG_5776.JPG", "Couple — skin tones"],
];

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  body { margin:0; background:#f4f2ed; font-family: system-ui, sans-serif; padding:32px; }
  h1 { font-size:15px; letter-spacing:.18em; text-transform:uppercase; color:#736e63; margin:0 0 4px; font-weight:500 }
  code { font-size:13px; color:#131311 }
  .row { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:26px; }
  figure { margin:0 }
  figcaption { font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#a5a096; margin-bottom:7px }
  img { width:100%; height:300px; object-fit:cover; display:block }
  .after img { filter:${GRADE} }
  .label { font-size:12px; color:#4b4841; margin:22px 0 0 }
</style>
<h1>Shared photographic grade</h1>
<code>.grade { filter: ${GRADE} }</code>
${SAMPLES.map(
  ([src, label]) => `
  <p class="label">${label}</p>
  <div class="row">
    <figure><figcaption>Before</figcaption><img src="${src}"></figure>
    <figure class="after"><figcaption>After</figcaption><img src="${src}"></figure>
  </div>`,
).join("")}
`;

await mkdir(OUT, { recursive: true });
await writeFile(path.join(ROOT, "public", "_grade-preview.html"), html, "utf8");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto("http://localhost:3004/_grade-preview.html", { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(OUT, "grade-before-after.png"), fullPage: true });
await browser.close();

console.log(`grade comparison -> design-review/grade/grade-before-after.png`);
console.log(`values: ${GRADE}`);
