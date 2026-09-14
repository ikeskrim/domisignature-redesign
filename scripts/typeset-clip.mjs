/**
 * Typeset clip — no TextReveal line cuts its own ink.
 *
 * TextReveal sets a headline from behind its line: each word sits in a mask
 * that clips it while it rises. At rest the mask must hold the whole glyph,
 * and on a display serif it often does not — a descender under the line, an
 * accent or an italic overhang past the word's box is cut clean off, and no
 * CSS reading says so. Only the pixels do.
 *
 * Method. Under reduced motion (the final state, nothing moving) every visual
 * line of `[data-word]` masks on every route is photographed twice at the same
 * scroll position: once as rendered, and once with every `[data-word]`, its
 * descendants and its ancestors up to the line set to `overflow: visible` (and
 * no clip-path). Whatever differs between the two photographs, anywhere in the
 * region, is ink the masks were cutting: inside a mask nothing should change,
 * and a word's padded mask overlaps its neighbour's, so a glyph one mask cut
 * can reappear inside the next word's box. Excusing the inside of any mask
 * would excuse exactly that. Any such pixel fails the line, named by its text.
 * The glyphs' positions are read before and after too: if unclipping moves
 * them, the photographs are not comparable and that fails as well, with its
 * own reason.
 *
 * The photographed region is the line's words grown by half an em above and
 * below and a third of an em at the sides, where clipped descenders, accents
 * and overhangs would be.
 *
 * Usage: node scripts/typeset-clip.mjs      (server at SHOTS_BASE)
 */

import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = "design-review/typeset-clip.json";
/* A channel has to move by more than this to count: re-rasterising the same
   glyph at the same position is exact, and revealed ink is far above it. */
const TOLERANCE = 6;

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

const STILL =
  "*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}";
const UNCLIP =
  "[data-tc-unclip],[data-word] *{overflow:visible!important;clip-path:none!important}";

const nextFrames = (page) =>
  page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

const browser = await chromium.launch();
const results = [];
const failures = [];
let linesMeasured = 0;

console.log("\nTYPESET CLIP — every TextReveal line, as rendered against unclipped\n");

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
    await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(1200);
    await page.addStyleTag({ content: STILL });
    await page.evaluate(() => document.querySelectorAll("video").forEach((v) => v.pause()));

    /* Group the masks into visual lines: the words under one block-level line
       container, clustered by where their boxes end. */
    const lines = await page.evaluate(() => {
      const out = [];
      const byContainer = new Map();
      let w = 0;
      for (const word of document.querySelectorAll("[data-word]")) {
        const cs = getComputedStyle(word);
        const r = word.getBoundingClientRect();
        if (cs.visibility !== "visible" || r.width < 1 || r.height < 1) continue;
        let line = word.parentElement;
        while (line && line !== document.body && getComputedStyle(line).display.startsWith("inline")) line = line.parentElement;
        if (!line) continue;
        for (let a = word; a; a = a.parentElement) {
          a.setAttribute("data-tc-unclip", "");
          if (a === line) break;
        }
        word.setAttribute("data-tc-word", String(w));
        const list = byContainer.get(line) ?? [];
        list.push({ id: w, bottom: r.bottom + scrollY, size: parseFloat(cs.fontSize) || 16, text: word.textContent.trim() });
        byContainer.set(line, list);
        w++;
      }
      for (const words of byContainer.values()) {
        const rows = [];
        for (const word of words) {
          const row = rows.find((x) => Math.abs(x.bottom - word.bottom) < word.size * 0.5);
          if (row) row.words.push(word);
          else rows.push({ bottom: word.bottom, words: [word] });
        }
        for (const row of rows) out.push({ ids: row.words.map((x) => x.id), text: row.words.map((x) => x.text).join(" ") });
      }
      return out;
    });

    const routeFails = [];
    for (const line of lines) {
      await page.evaluate((id) => document.querySelector(`[data-tc-word="${id}"]`)?.scrollIntoView({ block: "center" }), line.ids[0]);
      await page.waitForTimeout(120);

      const geometry = (ids) =>
        page.evaluate((ids) => {
          const words = ids.map((id) => document.querySelector(`[data-tc-word="${id}"]`)).filter(Boolean);
          const glyphs = [];
          let u = null;
          let size = 16;
          for (const word of words) {
            const r = word.getBoundingClientRect();
            size = Math.max(size, parseFloat(getComputedStyle(word).fontSize) || 16);
            u = u ? { l: Math.min(u.l, r.left), t: Math.min(u.t, r.top), r: Math.max(u.r, r.right), b: Math.max(u.b, r.bottom) } : { l: r.left, t: r.top, r: r.right, b: r.bottom };
            const walker = document.createTreeWalker(word, NodeFilter.SHOW_TEXT);
            let n;
            while ((n = walker.nextNode())) {
              if (!n.textContent.trim()) continue;
              const range = document.createRange();
              range.selectNodeContents(n);
              for (const q of range.getClientRects()) glyphs.push([q.left, q.top, q.right, q.bottom]);
            }
          }
          return { u, size, glyphs, vw: innerWidth, vh: innerHeight };
        }, ids);

      const before = await geometry(line.ids);
      if (!before.u) continue;
      const x = Math.max(0, Math.floor(before.u.l - before.size / 3));
      const y = Math.max(0, Math.floor(before.u.t - before.size / 2));
      const clip = {
        x,
        y,
        width: Math.min(before.vw, Math.ceil(before.u.r + before.size / 3)) - x,
        height: Math.min(before.vh, Math.ceil(before.u.b + before.size / 2)) - y,
      };
      if (clip.width < 2 || clip.height < 2) continue;

      const rendered = await page.screenshot({ clip });
      const style = await page.addStyleTag({ content: UNCLIP });
      await nextFrames(page);
      const after = await geometry(line.ids);
      const unclipped = await page.screenshot({ clip });
      await style.evaluate((s) => s.remove());
      await nextFrames(page);

      linesMeasured++;
      const row = { width: tag, route: name, text: line.text };

      let moved = 0;
      if (after.glyphs.length !== before.glyphs.length) moved = Infinity;
      else {
        for (let i = 0; i < before.glyphs.length; i++) {
          for (let k = 0; k < 4; k++) moved = Math.max(moved, Math.abs(before.glyphs[i][k] - after.glyphs[i][k]));
        }
      }

      const A = await sharp(rendered).raw().toBuffer({ resolveWithObject: true });
      const B = await sharp(unclipped).raw().toBuffer();
      const W = A.info.width;
      const H = A.info.height;
      const ch = A.info.channels;
      let ink = 0;
      let box = null;
      for (let yy = 0; yy < H; yy++) {
        for (let xx = 0; xx < W; xx++) {
          const p = (yy * W + xx) * ch;
          const d = Math.max(Math.abs(A.data[p] - B[p]), Math.abs(A.data[p + 1] - B[p + 1]), Math.abs(A.data[p + 2] - B[p + 2]));
          if (d <= TOLERANCE) continue;
          const px = clip.x + xx + 0.5;
          const py = clip.y + yy + 0.5;
          ink++;
          box = box
            ? { l: Math.min(box.l, px), t: Math.min(box.t, py), r: Math.max(box.r, px), b: Math.max(box.b, py) }
            : { l: px, t: py, r: px, b: py };
        }
      }

      if (moved > 0.5) {
        row.problem = `unclipping moved the glyphs by ${Number.isFinite(moved) ? `${moved.toFixed(1)}px` : "a changed line count"}; overflow changes this line's layout, so its ink cannot be compared`;
      } else if (ink > 0) {
        const side = box.t < before.u.t ? "above" : box.b > before.u.b ? "below" : "beside";
        row.problem = `${ink}px of ink outside its mask (${side} the line)`;
        row.inkBox = box;
      }
      if (row.problem) {
        routeFails.push(row);
        failures.push(row);
      }
    }

    results.push({ width: tag, route: name, lines: lines.length, failing: routeFails });
    console.log(`  ${routeFails.length ? "FAIL" : "ok  "}  ${tag.padEnd(4)} ${name.padEnd(24)} ${String(lines.length).padStart(3)} lines`);
    for (const f of routeFails.slice(0, 8)) console.log(`          - "${f.text}": ${f.problem}`);
  }
  await ctx.close();
}

await browser.close();
await mkdir("design-review", { recursive: true });
await writeFile(OUT, JSON.stringify({ tolerance: TOLERANCE, linesMeasured, results }, null, 2));
console.log(`\n${"-".repeat(72)}`);
if (linesMeasured === 0) {
  console.log("no [data-word] line was found on any route — nothing was measured, which is not a pass.");
  process.exitCode = 1;
} else {
  console.log(failures.length ? `${failures.length} of ${linesMeasured} lines clip their own ink.` : `${linesMeasured} lines measured; no mask cuts its ink.`);
  if (failures.length) process.exitCode = 1;
}
console.log(`written -> ${OUT}`);
