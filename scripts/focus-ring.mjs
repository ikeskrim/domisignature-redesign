/**
 * Focus-ring contrast — the check axe does not run.
 *
 * WCAG 1.4.11 / 2.4.13 ask a focus indicator to change the pixels it occupies
 * by at least 3:1 between the unfocused and the focused state. axe-core does
 * not evaluate that, and the light study found out the hard way: the shipped
 * gold ring is 6.68:1 on night and 2.52:1 on ivory, and every page passed axe
 * with a ring nobody could see. So the ring is law — near-black on paper — and
 * law needs a measurement.
 *
 * Method, faithful to 2.4.13 rather than to a token pair. Every route is tabbed
 * through the way a keyboard user tabs, so the browser's own :focus-visible
 * heuristic decides whether an indicator is drawn. At each stop the element's
 * surroundings are photographed twice at the same scroll position: once as
 * focused, and once with the indicator suppressed (outline and box-shadow
 * removed, focus kept). Then the perimeter is walked: at every position along
 * each straight side, the pixels on the line running outward from the border
 * edge are compared between the two photographs, and the position is scored by
 * the STRONGEST change it finds on that line. The line runs a band's width in
 * both directions, because where a ring outside the element would be clipped
 * (a masonry column, a button filling a clipped frame, an embed) the indicator
 * is drawn inside it. A position fails when nothing on
 * it changes by 3:1 — which is exactly the case of a ring drawn in a colour
 * too close to whatever it happens to cross.
 *
 * A stop passes when both of these hold:
 *   1. WCAG 2.4.13 - the area that changes by 3:1 is at least the area of a
 *      2px band along the element's own perimeter (rounded, for a pill);
 *   2. the owner's law, "holds on every ground it lands on" - no side of the
 *      indicator fades out (under 3:1) along more than 5% of its length. A
 *      ring that fades over a photograph, a scroller that clips it, a colour
 *      too close to the ground: each fades a whole stretch and fails.
 * Every sub-3:1 position is still counted and printed. Scoring every single
 * position was tried first and is stricter than 2.4.13: a 2px umbrella pole in
 * a photograph ran exactly under the ring for seven rows with pale sea under
 * both halos, so no pixel changed by 3:1 although the indicator was plainly
 * continuous - and any new photograph could have repeated it.
 *
 * Usage: node scripts/focus-ring.mjs         exits 1 on any stop that fails
 */

import { chromium } from "playwright";
import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const BAR = 3.0;
const MAX_TABS = 60;
const PAD = 14;
/* How far outward from the border edge an indicator may reach: the ring sits at
   an offset of 3px and is 3px wide, and its halo reaches 7px. */
const BAND = 10;
const STEP = 2;

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
  ["404", "/no-such-page"],
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

const PROBE_CSS =
  "[data-focus-probe],[data-focus-probe]:focus,[data-focus-probe]:focus-visible" +
  "{outline-color:transparent!important;box-shadow:none!important}" +
  "[data-focus-probe].focus-inset::after{display:none!important}";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
await ctx.addInitScript(() => {
  try {
    sessionStorage.setItem("domi:intro-seen", "1");
  } catch {}
  /*
   * Embeds are listed, not scored - and during the audit they are made
   * untabbable. Once Tab enters a third-party frame it walks that document's
   * own fields while this page sees only "the iframe", which used to burn the
   * whole tab budget inside the embed and leave every stop after it unmeasured.
   * The observer catches frames that mount later (the maps load on scroll).
   */
  const seal = () =>
    document.querySelectorAll("iframe:not([tabindex])").forEach((f) => f.setAttribute("tabindex", "-1"));
  new MutationObserver(seal).observe(document, { subtree: true, childList: true });
});
const page = await ctx.newPage();

const report = [];
const embeds = [];
let failingStops = 0;
let measuredStops = 0;

console.log("\nFOCUS RING — every tab stop, the indicator against what it actually crosses\n");

for (const [name, route] of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1800);
  await page.addStyleTag({ content: PROBE_CSS });

  const stops = [];
  const seen = new Set();
  let first = null;

  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(260);
    /* Bring the stop to the middle of the screen first: the browser scrolls a
       focused element only until it touches an edge, which leaves the ring on
       that side off-screen and unmeasurable. */
    await page.evaluate(() => document.activeElement?.scrollIntoView({ block: "center", inline: "nearest" }));
    await page.waitForTimeout(160);

    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      const rects = [...el.getClientRects()]
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({ l: r.left, t: r.top, r: r.right, b: r.bottom }));
      if (!rects.length) return { hidden: true };
      const cs = getComputedStyle(el);
      const radius = Math.max(
        ...["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"].map(
          (k) => parseFloat(cs[k]) || 0,
        ),
      );
      const u = {
        l: Math.min(...rects.map((r) => r.l)),
        t: Math.min(...rects.map((r) => r.t)),
        r: Math.max(...rects.map((r) => r.r)),
        b: Math.max(...rects.map((r) => r.b)),
      };
      const text = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("href") || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 38);
      return {
        label: `<${el.tagName.toLowerCase()}> ${text}`,
        ground: el.closest("[data-ground]")?.getAttribute("data-ground") ?? "none",
        outline: cs.outlineColor,
        rects,
        u,
        radius,
        vw: innerWidth,
        vh: innerHeight,
      };
    });

    if (!info) break;
    if (info.hidden) continue;
    /*
     * An embed is recorded, not scored. With focus inside a third-party
     * document the <iframe> matches neither :focus nor :focus-within in this
     * page (measured), so nothing in our stylesheet can draw its indicator -
     * the same reason axe excludes iframes, and the same embeds the keyboard
     * audit records on main. Listed, so the gap stays visible.
     */
    if (info.label.startsWith("<iframe>")) {
      continue;
    }
    const key = `${info.label}|${Math.round(info.u.l)},${Math.round(info.u.t)}`;
    if (first === null) first = key;
    else if (key === first) break; // the tab order has wrapped
    if (seen.has(key)) continue;
    seen.add(key);

    const { u, vw, vh } = info;
    if (u.b < 0 || u.t > vh || u.r < 0 || u.l > vw) continue;

    const clip = {
      x: Math.max(0, Math.floor(u.l - PAD)),
      y: Math.max(0, Math.floor(u.t - PAD)),
    };
    clip.width = Math.min(vw, Math.ceil(u.r + PAD)) - clip.x;
    clip.height = Math.min(vh, Math.ceil(u.b + PAD)) - clip.y;
    if (clip.width < 4 || clip.height < 4) continue;

    const withShot = await page.screenshot({ clip });
    await page.evaluate(() => document.activeElement?.setAttribute("data-focus-probe", ""));
    await page.waitForTimeout(90);
    const withoutShot = await page.screenshot({ clip });
    await page.evaluate(() => document.activeElement?.removeAttribute("data-focus-probe"));

    const A = await sharp(withShot).raw().toBuffer({ resolveWithObject: true });
    const B = await sharp(withoutShot).raw().toBuffer();
    const W = A.info.width;
    const H = A.info.height;
    const ch = A.info.channels;
    const at = (buf, x, y) => {
      const p = (y * W + x) * ch;
      return lum(buf[p], buf[p + 1], buf[p + 2]);
    };
    const inside = (x, y) => info.rects.some((r) => x >= r.l && x < r.r && y >= r.t && y < r.b);

    let positions = 0;
    let failing = 0;
    let gapPx = 0;
    let gapSide = "";
    let gapFrac = 0;
    let worst = Infinity;
    let anyChange = 1;
    const failSides = new Set();

    /* Walk each straight side of each client rect, outward. */
    for (const r of info.rects) {
      /* Skip each corner: a rounded one's straight run starts past its radius,
         and a square one's first few pixels cannot meet an indicator drawn
         inside the element along a line perpendicular to the side. */
      const rad = Math.min(Math.max(info.radius, 6), (r.b - r.t) / 2, (r.r - r.l) / 2);
      const sides = [
        ["top", (s) => [s, r.t - 1], (k) => [0, -k], r.l + rad + 1, r.r - rad - 1],
        ["bottom", (s) => [s, r.b], (k) => [0, k], r.l + rad + 1, r.r - rad - 1],
        ["left", (s) => [r.l - 1, s], (k) => [-k, 0], r.t + rad + 1, r.b - rad - 1],
        ["right", (s) => [r.r, s], (k) => [k, 0], r.t + rad + 1, r.b - rad - 1],
      ];
      for (const [side, origin, dir, from, to] of sides) {
        let run = 0;
        for (let s = from; s <= to; s += STEP) {
          const [ox, oy] = origin(s);
          let best = 1;
          let sampled = 0;
          for (let k = -BAND; k <= BAND; k++) {
            const [dx, dy] = dir(k);
            const px = Math.round(ox + dx);
            const py = Math.round(oy + dy);
            if (px < 0 || py < 0 || px >= vw || py >= vh) continue;
            if (k >= 0 && inside(px, py)) continue;
            const cx = px - clip.x;
            const cy = py - clip.y;
            if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
            sampled++;
            const q = ratio(at(A.data, cx, cy), at(B, cx, cy));
            if (q > best) best = q;
          }
          if (!sampled) continue;
          positions++;
          if (best > anyChange) anyChange = best;
          if (best < worst) worst = best;
          if (best < BAR) {
            failing++;
            failSides.add(side);
            run += STEP;
            const frac = run / Math.max(STEP, to - from);
            if (run > gapPx) {
              gapPx = run;
              gapSide = side;
              gapFrac = frac;
            }
          } else {
            run = 0;
          }
        }
      }
    }

    /* WCAG 2.4.13: the changed area against a 2px perimeter of the element. */
    let changed = 0;
    for (let p = 0; p < A.data.length; p += ch) {
      const q = ratio(lum(A.data[p], A.data[p + 1], A.data[p + 2]), lum(B[p], B[p + 1], B[p + 2]));
      if (q >= BAR) changed++;
    }
    /* A 2px band along the component's OWN perimeter - for a rounded pill that
       is 2(w + h) - 8r + 2*pi*r, much shorter than its bounding rectangle's. */
    const required = info.rects.reduce((n, r) => {
      const w = r.r - r.l;
      const h = r.b - r.t;
      const rad = Math.min(info.radius, w / 2, h / 2);
      return n + 2 * (2 * (w + h) - 8 * rad + 2 * Math.PI * rad);
    }, 0);

    measuredStops++;
    const stop = {
      label: info.label,
      ground: info.ground,
      outline: info.outline,
      positions,
      failing,
      worst: Number.isFinite(worst) ? Number(worst.toFixed(2)) : null,
      failSides: [...failSides],
    };
    stop.strict = `${failing}/${positions}`;
    stop.area = `${changed}px² changed, ${Math.round(required)}px² required`;
    if (positions > 0 && anyChange < 1.05) stop.problem = "no visible indicator";
    else if (changed < required) stop.problem = `changed area ${changed}px² is under a 2px perimeter's ${Math.round(required)}px² (WCAG 2.4.13)`;
    else if (gapPx > 8 && gapFrac > 0.05)
      stop.problem = `fades out along ${gapPx}px of the ${gapSide} (${Math.round(gapFrac * 100)}% of that side)`;
    else if (failing > 0) stop.note = `${failing}/${positions} isolated positions under ${BAR}:1 (${[...failSides].join(", ")}), no gap over 5% of a side`;
    stops.push(stop);
  }

  const bad = stops.filter((s) => s.problem);
  failingStops += bad.length;
  const worstStop = stops.filter((s) => s.worst !== null).sort((a, b) => a.worst - b.worst)[0];
  console.log(
    `  ${bad.length ? "FAIL" : "ok  "}  ${name.padEnd(14)} ${String(stops.length).padStart(2)} stops` +
      (worstStop ? `   weakest position ${worstStop.worst}:1 on ${worstStop.label} [${worstStop.ground}]` : ""),
  );
  for (const s of bad) console.log(`          - ${s.label} [${s.ground}, ring ${s.outline}]: ${s.problem}`);
  for (const s of stops.filter((x) => !x.problem && x.note)) console.log(`          · ${s.label}: ${s.note}`);
  const frames = await page.evaluate(() =>
    [...document.querySelectorAll("iframe")].map((f) => f.title || (f.getAttribute("src") || "").replace(/^https?:\/\//, "").slice(0, 40)),
  );
  for (const f of new Set(frames)) embeds.push(`${name}: ${f}`);
  report.push({ route: name, stops });
}

await browser.close();
await mkdir("design-review", { recursive: true });
await writeFile("design-review/focus-ring.json", JSON.stringify(report, null, 2));
console.log(`\n${"-".repeat(72)}`);
console.log(
  failingStops === 0
    ? `${measuredStops} tab stops measured; at every position on every perimeter the indicator changes the page by ${BAR}:1 or more.`
    : `${failingStops} of ${measuredStops} tab stops have an indicator that fades out somewhere on its perimeter.`,
);
if (embeds.length) console.log(`embeds recorded, not scored (third-party documents): ${embeds.join("; ")}`);
console.log("written -> design-review/focus-ring.json");
if (failingStops) process.exitCode = 1;
