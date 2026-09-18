/**
 * The drop switch, read off the running page.
 *
 * Stage 6 gives a phone one switch for the motion it may give up, in the
 * owner's order: preloader, parallax, grain, shadow (`DROP_ORDER` in
 * src/lib/motion-tier.ts). A level is always a prefix of that order, it is set
 * on <html data-drop> before first paint, and desktop never drops. The switch
 * is only worth something if every consumer obeys it, so this loads Home at
 * 390 with ?drop=0..4, each in a fresh context (sessionStorage empty, so the
 * preloader is free to show), and checks each feature against the level:
 *
 *   data-drop   the tokens on <html> are exactly DROP_ORDER.slice(0, N)
 *   preloader   [data-preloader] appears during the load iff N === 0
 *   parallax    after scrolling, a ScrollImage's inner layer carries a
 *               non-identity transform iff parallax is not dropped
 *   grain       .grain computes display:none iff grain is dropped
 *   shadow      .plate-lift::before and .panel-edge::after compute
 *               display:none iff shadow is dropped (plates from /venues when
 *               Home has none; a panel edge from the open menu when the page
 *               carries none)
 *
 * Then at 1440 every ?drop must leave <html> without data-drop.
 *
 * DROP_ORDER is read from the source, not copied, so a change there is a
 * change here. A feature whose element cannot be found is a FAIL: a check that
 * measured nothing must never read as a pass.
 *
 * Usage: node scripts/motion-tier.mjs      (server at SHOTS_BASE)
 */

import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = "design-review/motion-tier.json";

const source = await readFile("src/lib/motion-tier.ts", "utf8");
const orderMatch = source.match(/DROP_ORDER\s*=\s*\[([^\]]*)\]/);
if (!orderMatch) {
  console.log("FAIL  DROP_ORDER not found in src/lib/motion-tier.ts");
  process.exit(1);
}
const DROP_ORDER = [...orderMatch[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
if (DROP_ORDER.length !== 4) {
  console.log(`FAIL  DROP_ORDER should name four features, found ${JSON.stringify(DROP_ORDER)}`);
  process.exit(1);
}

const failures = [];
const report = { order: DROP_ORDER, phone: [], desktop: [] };
const fail = (where, reason) => {
  failures.push(`${where}: ${reason}`);
  console.log(`  FAIL  ${where}: ${reason}`);
};

/* React has hydrated a node once it carries its props key. */
const hydrated = (page) =>
  page.waitForFunction(
    () => {
      const el = document.querySelector("header a[href='/'], header button, main a[href]");
      return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps$"));
    },
    null,
    { timeout: 30000 },
  );

/* Records whether [data-preloader] was ever in the document, however briefly. */
const watchPreloader = () => {
  window.__sawPreloader = false;
  const look = () => {
    if (!window.__sawPreloader && document.querySelector("[data-preloader]")) window.__sawPreloader = true;
  };
  new MutationObserver(look).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-preloader"] });
  document.addEventListener("DOMContentLoaded", look);
};

const readShadow = (page) =>
  page.evaluate(() => {
    const pick = (sel, pseudo) =>
      [...document.querySelectorAll(sel)].map((el) => getComputedStyle(el, pseudo).display);
    return { plates: pick(".plate-lift", "::before"), edges: pick(".panel-edge", "::after") };
  });

const browser = await chromium.launch();

console.log(`\nMOTION TIER — the drop switch at 390 and 1440 (order: ${DROP_ORDER.join(", ")})\n`);

for (let n = 0; n <= 4; n++) {
  const where = `390 ?drop=${n}`;
  const dropped = DROP_ORDER.slice(0, n);
  const is = (f) => dropped.includes(f);
  const row = { drop: n, expected: dropped };
  const before = failures.length;

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(watchPreloader);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?drop=${n}`, { waitUntil: "load", timeout: 60000 });
  await hydrated(page);

  /* The preloader decides in an effect after hydration and holds for ~1.6s.
     Give it the whole window to show before reading anything else. */
  if (n === 0) {
    await page.waitForFunction(() => window.__sawPreloader, null, { timeout: 4000 }).catch(() => {});
  } else {
    await page.waitForTimeout(2500);
  }
  row.preloader = await page.evaluate(() => window.__sawPreloader);
  if (row.preloader !== (n === 0)) fail(where, n === 0 ? "[data-preloader] never appeared on a fresh session with nothing dropped" : "[data-preloader] appeared although the preloader is dropped");
  /* Let a shown preloader finish before scrolling. */
  await page.waitForFunction(() => !document.querySelector("[data-preloader]"), null, { timeout: 6000 }).catch(() => {});

  row.dataDrop = await page.evaluate(() => document.documentElement.getAttribute("data-drop"));
  const tokens = (row.dataDrop ?? "").split(" ").filter(Boolean);
  if (JSON.stringify(tokens) !== JSON.stringify(dropped)) {
    fail(where, `html[data-drop] is ${row.dataDrop === null ? "absent" : `"${row.dataDrop}"`}, expected ${dropped.length ? `"${dropped.join(" ")}"` : "absent"}`);
  }

  /* Grain. */
  row.grain = await page.evaluate(() => [...document.querySelectorAll(".grain")].map((g) => getComputedStyle(g).display));
  if (!row.grain.length) fail(where, "no .grain element on the page");
  else if (row.grain.some((d) => (d === "none") !== is("grain"))) {
    fail(where, `.grain computes display ${row.grain.join(",")}; grain is ${is("grain") ? "" : "not "}dropped`);
  }

  /*
   * Parallax. A ScrollImage is a clipped frame whose only child is an
   * absolutely filled layer holding the photograph; the layer is what the
   * scrub moves. Each is brought to the middle of the screen, where a running
   * scrub is never at identity (its scale is mid-way to 1).
   */
  const frames = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("main img").forEach((img) => {
      const layer = img.parentElement;
      const frame = layer?.parentElement;
      if (!layer || !frame) return;
      const lc = layer.classList;
      const fc = frame.classList;
      if (lc.contains("absolute") && lc.contains("inset-0") && frame.children.length === 1 && fc.contains("relative") && fc.contains("overflow-hidden") && fc.contains("bg-[var(--surface-raised)]")) {
        layer.setAttribute("data-mt-layer", String(out.length));
        out.push(out.length);
      }
    });
    return out;
  });
  row.parallax = [];
  if (!frames.length) fail(where, "no ScrollImage found on Home (a clipped frame holding one filled image layer)");
  for (const i of frames) {
    await page.evaluate((k) => document.querySelector(`[data-mt-layer="${k}"]`)?.parentElement?.scrollIntoView({ block: "center" }), i);
    await page.waitForTimeout(900);
    const t = await page.evaluate((k) => {
      const el = document.querySelector(`[data-mt-layer="${k}"]`);
      if (!el) return null;
      const cs = getComputedStyle(el);
      let moved = false;
      if (cs.transform && cs.transform !== "none") {
        const m = new DOMMatrixReadOnly(cs.transform);
        moved = !m.isIdentity && [m.a - 1, m.b, m.c, m.d - 1, m.e, m.f].some((v) => Math.abs(v) > 0.001);
      }
      for (const p of ["translate", "scale", "rotate"]) if (cs[p] && cs[p] !== "none") moved = true;
      return { transform: cs.transform, moved };
    }, i);
    row.parallax.push(t);
  }
  const anyMoved = row.parallax.some((t) => t?.moved);
  if (frames.length && is("parallax") && anyMoved) fail(where, `a ScrollImage layer still moves (${row.parallax.find((t) => t?.moved).transform}) although parallax is dropped`);
  if (frames.length && !is("parallax") && !anyMoved) fail(where, `no ScrollImage layer moved after scrolling (${frames.length} found) although parallax is not dropped`);

  /* Shadow: plates and panel edges. */
  let shadow = await readShadow(page);
  row.shadowFrom = { plates: "/", edges: "/" };
  if (!shadow.edges.length) {
    /* The moving sheets carry the edge; the menu is one that mounts on demand. */
    const toggle = page.locator("button[aria-controls='mobile-menu']").first();
    if (await toggle.count()) {
      await toggle.tap();
      await page.waitForTimeout(1200);
      const again = await readShadow(page);
      if (again.edges.length) {
        shadow = { ...shadow, edges: again.edges };
        row.shadowFrom.edges = "/ (menu open)";
      }
      await toggle.tap().catch(() => {});
      await page.waitForTimeout(900);
    }
  }
  if (!shadow.plates.length) {
    await page.goto(`${BASE}/venues?drop=${n}`, { waitUntil: "load", timeout: 60000 });
    await hydrated(page);
    await page.waitForTimeout(800);
    shadow = { ...shadow, plates: (await readShadow(page)).plates };
    row.shadowFrom.plates = "/venues";
  }
  row.shadow = shadow;
  if (!shadow.plates.length) fail(where, "no .plate-lift on Home or /venues");
  else if (shadow.plates.some((d) => (d === "none") !== is("shadow"))) {
    fail(where, `.plate-lift::before computes display ${[...new Set(shadow.plates)].join(",")}; shadow is ${is("shadow") ? "" : "not "}dropped`);
  }
  if (!shadow.edges.length) fail(where, "no .panel-edge on Home, with or without the menu open");
  else if (shadow.edges.some((d) => (d === "none") !== is("shadow"))) {
    fail(where, `.panel-edge::after computes display ${[...new Set(shadow.edges)].join(",")}; shadow is ${is("shadow") ? "" : "not "}dropped`);
  }

  row.ok = failures.length === before;
  report.phone.push(row);
  if (row.ok) console.log(`  ok    ${where}: data-drop ${row.dataDrop === null ? "absent" : `"${row.dataDrop}"`}, preloader ${row.preloader ? "shown" : "not shown"}, parallax ${anyMoved ? "moving" : "still"}, grain ${is("grain") ? "hidden" : "shown"}, shadows ${is("shadow") ? "hidden" : "live"}`);
  await ctx.close();
}

for (let n = 0; n <= 4; n++) {
  const where = `1440 ?drop=${n}`;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?drop=${n}`, { waitUntil: "load", timeout: 60000 });
  await hydrated(page);
  const dataDrop = await page.evaluate(() => document.documentElement.getAttribute("data-drop"));
  report.desktop.push({ drop: n, dataDrop });
  if (dataDrop !== null) fail(where, `html carries data-drop="${dataDrop}"; desktop never drops`);
  else console.log(`  ok    ${where}: no data-drop`);
  await ctx.close();
}

await browser.close();
await mkdir("design-review", { recursive: true });
await writeFile(OUT, JSON.stringify({ ...report, failures }, null, 2));
console.log(`\n${"-".repeat(72)}`);
console.log(failures.length ? `${failures.length} drop-switch failure(s).` : "every level drops exactly its prefix at 390; 1440 drops nothing.");
console.log(`written -> ${OUT}`);
if (failures.length) process.exitCode = 1;
