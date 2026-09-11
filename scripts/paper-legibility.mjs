/**
 * Legibility on paper — every line of text, against the pixels behind it.
 *
 * axe computes contrast from CSS: the text colour against the nearest
 * background-color. That is exact while a ground is one flat colour, and it
 * stops being the truth the moment the ground carries anything else — a warm
 * wash, a vignette, grain. Amendment 5 adds exactly that to the paper, so from
 * here the only honest contrast number is the one read off the screen.
 *
 * Method, the arrival check's generalised. Each route is walked a screen at a
 * time. At each position the page is photographed with every glyph made
 * transparent, so what is left is the real ground — surface, wash, vignette,
 * grain, whatever is painted there. Then every text element on screen whose
 * nearest ground is paper is cropped out of that photograph and scored: its
 * computed colour against the WORST pixel inside its box. Text over a
 * photograph, an embed or inside a fixed overlay is out of scope here — the
 * arrival has its own check, and a photograph is a ground no CSS decides.
 *
 * Bars: 4.5:1, or 3:1 for large text (24px and up, or 18.66px bold).
 *
 * Usage: node scripts/paper-legibility.mjs            every route, at 1440 and 390
 *        node scripts/paper-legibility.mjs --label=x  also writes design-review/paper-legibility-x.json
 */

import { chromium } from "playwright";
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const LABEL = (process.argv.find((a) => a.startsWith("--label=")) ?? "").split("=")[1] || null;

const ROUTES = [
  ["home", "/"],
  ["venues", "/venues"],
  ["venue-mountain-escape", "/venues/mountain-escape"],
  ["venue-thalasses", "/venues/thalasses"],
  ["venue-olive-stories", "/venues/olive-stories"],
  ["events", "/events"],
  ["event-sunset-by-the-pool", "/events/sunset-by-the-pool"],
  ["event-villa-party", "/events/villa-party"],
  ["services", "/services"],
  ["wedding-guide", "/wedding-guide"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["404", "/no-such-page"],
];
/* Every route at both widths: this is the contrast check for every sheet of
   paper now that axe reads them as "needs review". */
const NARROW = new Set(ROUTES.map(([name]) => name));

const chan = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (r, g, b) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const ratio = (a, b) => {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};

const HIDE_TEXT =
  "*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;" +
  "text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}";

const browser = await chromium.launch();
const results = [];
let fails = 0;
let measured = 0;

console.log("\nLEGIBILITY ON PAPER — every text element against the worst pixel behind it\n");

for (const [vw, vh, tag] of [
  [1440, 900, "1440"],
  [390, 844, "390"],
]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem("domi:intro-seen", "1");
    } catch {}
  });
  const page = await ctx.newPage();

  for (const [name, route] of ROUTES) {
    if (tag === "390" && !NARROW.has(name)) continue;
    await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(1500);

    /* Number every text-bearing element once, with the facts that do not
       change as the page scrolls. */
    const total = await page.evaluate(() => {
      const seen = new Set();
      let id = 0;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.textContent.trim()) continue;
        const el = node.parentElement;
        if (!el || seen.has(el)) continue;
        seen.add(el);
        if (el.closest("script,style,noscript,[data-a11y-exempt],.sr-only")) continue;
        let fixed = false;
        for (let a = el; a; a = a.parentElement) {
          if (getComputedStyle(a).position === "fixed") {
            fixed = true;
            break;
          }
        }
        if (fixed) continue;
        if (el.closest("[data-ground]")?.getAttribute("data-ground") !== "light") continue;
        el.setAttribute("data-pl", String(id++));
      }
      return id;
    });

    const header = await page.evaluate(() => {
      const h = document.querySelector("body > header, header.fixed");
      return h ? Math.ceil(h.getBoundingClientRect().bottom) : 0;
    });

    const best = new Map(); // id -> {ratio, bar, text, color}
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = vh - 160;

    for (let y = 0; y < height; y += step) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(350);

      const onScreen = await page.evaluate(
        ({ vw, vh, header }) => {
          const media = [...document.querySelectorAll("img,video,iframe,canvas,picture")]
            .map((m) => m.getBoundingClientRect())
            .filter((r) => r.width > 2 && r.height > 2);
          const hits = (r) => media.some((m) => r.left < m.right && r.right > m.left && r.top < m.bottom && r.bottom > m.top);
          const out = [];
          for (const el of document.querySelectorAll("[data-pl]")) {
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) continue;
            if (r.top < header + 2 || r.bottom > vh - 1 || r.left < 0 || r.right > vw) continue;
            if (hits(r)) continue;
            let op = 1;
            for (let a = el; a; a = a.parentElement) op *= Number(getComputedStyle(a).opacity);
            if (op < 0.02) continue;
            /* The glyphs' own line boxes, not the element's box: an element's box
               also holds its decorations - a bullet hairline, a pill's rounded
               corners - and scoring text against those measures the wrong thing. */
            const rects = [];
            for (const n of el.childNodes) {
              if (n.nodeType !== 3 || !n.textContent.trim()) continue;
              const range = document.createRange();
              range.selectNodeContents(n);
              for (const q of range.getClientRects()) {
                if (q.width < 1 || q.height < 1) continue;
                rects.push({ x: Math.max(0, Math.floor(q.left)), y: Math.max(0, Math.floor(q.top)), w: Math.ceil(q.width), h: Math.ceil(q.height) });
              }
            }
            if (!rects.length) continue;
            const cs = getComputedStyle(el);
            const size = parseFloat(cs.fontSize);
            const weight = Number(cs.fontWeight) || 400;
            out.push({
              id: el.getAttribute("data-pl"),
              rects,
              color: cs.color,
              opacity: op,
              large: size >= 24 || (size >= 18.66 && weight >= 700),
              text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 40),
            });
          }
          return out;
        },
        { vw, vh, header },
      );
      if (!onScreen.length) continue;

      const style = await page.addStyleTag({ content: HIDE_TEXT });
      await page.waitForTimeout(60);
      const shot = await page.screenshot();
      await style.evaluate((s) => s.remove());

      const img = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
      const W = img.info.width;
      const H = img.info.height;
      const ch = img.info.channels;

      for (const t of onScreen) {
        const m = t.color.match(/[\d.]+/g).map(Number);
        const alpha = m.length > 3 ? m[3] : 1;
        const tl = lum(m[0], m[1], m[2]);
        let worst = Infinity;
        for (const b of t.rects) {
          for (let yy = b.y; yy < Math.min(H, b.y + b.h); yy++) {
            for (let xx = b.x; xx < Math.min(W, b.x + b.w); xx++) {
              const p = (yy * W + xx) * ch;
              const q = ratio(tl, lum(img.data[p], img.data[p + 1], img.data[p + 2]));
              if (q < worst) worst = q;
            }
          }
        }
        const bar = t.large ? 3 : 4.5;
        const prev = best.get(t.id);
        if (!prev || worst < prev.ratio) {
          best.set(t.id, { ratio: worst, bar, text: t.text, color: t.color, alpha, opacity: t.opacity });
        }
      }
    }

    const rows = [...best.values()];
    const bad = rows.filter((r) => r.ratio < r.bar || r.alpha < 1 || r.opacity < 0.99);
    measured += rows.length;
    fails += bad.length;
    const worstRow = rows.sort((a, b) => a.ratio / a.bar - b.ratio / b.bar)[0];
    console.log(
      `  ${bad.length ? "FAIL" : "ok  "}  ${tag.padEnd(4)} ${name.padEnd(24)} ${String(rows.length).padStart(3)} of ${String(total).padStart(3)} text elements` +
        (worstRow ? `   tightest ${worstRow.ratio.toFixed(2)}:1 (bar ${worstRow.bar}) "${worstRow.text}"` : ""),
    );
    for (const r of bad.slice(0, 8)) {
      const why =
        r.alpha < 1 ? `text colour carries alpha ${r.alpha}` : r.opacity < 0.99 ? `faded to opacity ${r.opacity.toFixed(2)}` : `${r.ratio.toFixed(2)}:1 under ${r.bar}`;
      console.log(`          - "${r.text}": ${why}`);
    }
    results.push({ width: tag, route: name, measured: rows.length, failing: bad.length, worst: worstRow ?? null, bad });
  }
  await ctx.close();
}

await browser.close();
const out = LABEL ? `design-review/paper-legibility-${LABEL}.json` : "design-review/paper-legibility.json";
await writeFile(out, JSON.stringify(results, null, 2));
console.log(`\n${"-".repeat(72)}`);
console.log(fails === 0 ? `${measured} text elements on paper measured; every one clears its bar on the worst pixel.` : `${fails} of ${measured} text elements on paper fail.`);
console.log(`written -> ${out}`);
if (fails) process.exitCode = 1;
