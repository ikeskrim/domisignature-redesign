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
 * Stage 6 adds two modes, one at a time:
 *
 *   --motion  Motion ON. Nothing on paper fades, and reduced motion cannot
 *             prove that: it shows only the final state. Each route is
 *             scrolled 200px at a time with 1.2s at each stop, and every text
 *             element on paper on screen must have an effective opacity (its
 *             own times every ancestor's) of 0.99 or more. No contrast here.
 *   --lift    Every `.plate-lift` is forced into its lifted state (3px up, its
 *             shadow at full opacity), then the sweep above runs with the same
 *             bars, and also: the lift shadow may darken no pixel under type by
 *             more than 3% (relative luminance, shadow against no shadow at the
 *             same lift). A run that finds no plate to lift fails.
 *
 * Usage: node scripts/paper-legibility.mjs            every route, at 1440 and 390
 *        node scripts/paper-legibility.mjs --label=x  also writes design-review/paper-legibility-x.json
 *        node scripts/paper-legibility.mjs --motion   -> design-review/paper-legibility-motion.json
 *        node scripts/paper-legibility.mjs --lift     -> design-review/paper-legibility-lift.json
 */

import { chromium } from "playwright";
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const LABEL = (process.argv.find((a) => a.startsWith("--label=")) ?? "").split("=")[1] || null;
const MOTION = process.argv.includes("--motion");
const LIFT = process.argv.includes("--lift");
if (MOTION && LIFT) {
  console.log("--motion and --lift are separate runs; pass one.");
  process.exit(2);
}
/* The 3% ceiling: the most any pixel under type may be darkened. */
const SHADOW_CEILING = 0.03;
const MOTION_STEP = 200;
const MOTION_WAIT = 1200;

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
/* --lift: every interactive plate as it is while hovered or its row focused. */
const LIFTED =
  ".plate-lift{transform:translateY(-3px)!important;transition:none!important}" +
  ".plate-lift::before{opacity:1!important;transition:none!important}";
/* The same lift without its shadow: the reference the darkening is read against. */
const SHADOW_OFF = ".plate-lift::before{opacity:0!important}";

const browser = await chromium.launch();
const results = [];
let fails = 0;
let measured = 0;
let plates = 0;

console.log(
  MOTION
    ? "\nLEGIBILITY ON PAPER, MOTION ON — no text on paper part-transparent at any scroll stop\n"
    : LIFT
      ? "\nLEGIBILITY ON PAPER, PLATES LIFTED — the worst pixel, and the lift shadow under type\n"
      : "\nLEGIBILITY ON PAPER — every text element against the worst pixel behind it\n",
);

for (const [vw, vh, tag] of [
  [1440, 900, "1440"],
  [390, 844, "390"],
]) {
  const ctx = await browser.newContext({
    viewport: { width: vw, height: vh },
    deviceScaleFactor: 1,
    reducedMotion: MOTION ? "no-preference" : "reduce",
  });
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
    if (LIFT) {
      await page.addStyleTag({ content: LIFTED });
      plates += await page.evaluate(() => document.querySelectorAll(".plate-lift").length);
      await page.waitForTimeout(60);
    }

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

    if (MOTION) {
      /* Scroll down in even steps, the way a reader does, so every trigger
         fires in order; at each stop read what is on screen after the wait. */
      const worst = new Map(); // id -> {opacity, text, y}
      const seenIds = new Set();
      for (let y = 0; ; y += MOTION_STEP) {
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        if (y > height - vh + MOTION_STEP) break;
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(MOTION_WAIT);
        const onScreen = await page.evaluate((vh) => {
          const out = [];
          for (const el of document.querySelectorAll("[data-pl]")) {
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= vh) continue;
            /* Collapsed or hidden text is not shown text; its opacity says nothing. */
            if (getComputedStyle(el).visibility !== "visible") continue;
            let op = 1;
            for (let a = el; a; a = a.parentElement) op *= Number(getComputedStyle(a).opacity);
            out.push({ id: el.getAttribute("data-pl"), opacity: op, text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 40) });
          }
          return out;
        }, vh);
        const scrollY = await page.evaluate(() => Math.round(scrollY));
        for (const t of onScreen) {
          seenIds.add(t.id);
          const prev = worst.get(t.id);
          if (t.opacity < 0.99 && (!prev || t.opacity < prev.opacity)) worst.set(t.id, { opacity: t.opacity, text: t.text, scrollY });
        }
      }
      const bad = [...worst.values()];
      measured += seenIds.size;
      fails += bad.length;
      console.log(
        `  ${bad.length ? "FAIL" : "ok  "}  ${tag.padEnd(4)} ${name.padEnd(24)} ${String(seenIds.size).padStart(3)} of ${String(total).padStart(3)} text elements seen` +
          (bad.length ? `   ${bad.length} part-transparent` : ""),
      );
      for (const r of bad.slice(0, 8)) console.log(`          - "${r.text}": opacity ${r.opacity.toFixed(2)} at scroll ${r.scrollY}`);
      results.push({ width: tag, route: name, measured: seenIds.size, failing: bad.length, bad });
      continue;
    }

    const header = await page.evaluate(() => {
      const h = document.querySelector("body > header, header.fixed");
      return h ? Math.ceil(h.getBoundingClientRect().bottom) : 0;
    });

    const best = new Map(); // id -> {ratio, bar, text, color}
    const darkest = new Map(); // id -> the most the lift shadow darkens a pixel under it (--lift)
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
      let reference = null;
      if (LIFT) {
        const off = await page.addStyleTag({ content: SHADOW_OFF });
        await page.waitForTimeout(60);
        reference = await sharp(await page.screenshot()).raw().toBuffer();
        await off.evaluate((s) => s.remove());
      }
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
        let darken = 0;
        for (const b of t.rects) {
          for (let yy = b.y; yy < Math.min(H, b.y + b.h); yy++) {
            for (let xx = b.x; xx < Math.min(W, b.x + b.w); xx++) {
              const p = (yy * W + xx) * ch;
              const ground = lum(img.data[p], img.data[p + 1], img.data[p + 2]);
              const q = ratio(tl, ground);
              if (q < worst) worst = q;
              if (reference) {
                const flat = lum(reference[p], reference[p + 1], reference[p + 2]);
                if (flat > 0) darken = Math.max(darken, (flat - ground) / flat);
              }
            }
          }
        }
        const bar = t.large ? 3 : 4.5;
        const prev = best.get(t.id);
        if (!prev || worst < prev.ratio) {
          best.set(t.id, { ratio: worst, bar, text: t.text, color: t.color, alpha, opacity: t.opacity });
        }
        if (LIFT && darken > (darkest.get(t.id) ?? 0)) darkest.set(t.id, darken);
      }
    }

    const rows = [...best.entries()].map(([id, r]) => (LIFT ? { ...r, darken: darkest.get(id) ?? 0 } : r));
    const bad = rows.filter((r) => r.ratio < r.bar || r.alpha < 1 || r.opacity < 0.99 || (LIFT && r.darken > SHADOW_CEILING));
    measured += rows.length;
    fails += bad.length;
    const worstRow = rows.sort((a, b) => a.ratio / a.bar - b.ratio / b.bar)[0];
    console.log(
      `  ${bad.length ? "FAIL" : "ok  "}  ${tag.padEnd(4)} ${name.padEnd(24)} ${String(rows.length).padStart(3)} of ${String(total).padStart(3)} text elements` +
        (worstRow ? `   tightest ${worstRow.ratio.toFixed(2)}:1 (bar ${worstRow.bar}) "${worstRow.text}"` : "") +
        (LIFT && rows.length ? `   shadow under type ≤ ${(Math.max(...rows.map((r) => r.darken)) * 100).toFixed(1)}%` : ""),
    );
    for (const r of bad.slice(0, 8)) {
      const why =
        r.alpha < 1
          ? `text colour carries alpha ${r.alpha}`
          : r.opacity < 0.99
            ? `faded to opacity ${r.opacity.toFixed(2)}`
            : r.ratio < r.bar
              ? `${r.ratio.toFixed(2)}:1 under ${r.bar}`
              : `the lift shadow darkens a pixel under it by ${(r.darken * 100).toFixed(1)}% (ceiling 3%)`;
      console.log(`          - "${r.text}": ${why}`);
    }
    results.push({ width: tag, route: name, measured: rows.length, failing: bad.length, worst: worstRow ?? null, bad });
  }
  await ctx.close();
}

await browser.close();
const base = MOTION ? "paper-legibility-motion" : LIFT ? "paper-legibility-lift" : "paper-legibility";
const out = LABEL ? `design-review/${base}-${LABEL}.json` : `design-review/${base}.json`;
await writeFile(out, JSON.stringify(results, null, 2));
console.log(`\n${"-".repeat(72)}`);
if (MOTION) {
  console.log(fails === 0 ? `${measured} text elements on paper seen in motion; none was part-transparent at any stop.` : `${fails} of ${measured} text elements on paper were part-transparent at a scroll stop.`);
} else {
  console.log(fails === 0 ? `${measured} text elements on paper measured; every one clears its bar on the worst pixel.` : `${fails} of ${measured} text elements on paper fail.`);
}
if (LIFT && plates === 0) {
  console.log("no .plate-lift on any route: nothing was lifted, so the lift was not measured.");
  fails++;
}
console.log(`written -> ${out}`);
if (fails) process.exitCode = 1;
