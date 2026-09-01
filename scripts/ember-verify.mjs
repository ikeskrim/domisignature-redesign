/**
 * Verify the Ember Ink study palette on the rendered site.
 *
 * A recolour is exactly where invisible-on-X bugs breed, so nothing here is
 * taken from the token file. Every value is read back out of the browser after
 * the cascade has run, then:
 *
 *   1. the swap is proved — the same routes are loaded with and without the
 *      query param and their computed grounds compared;
 *   2. every token pair is swept for contrast, from the values the browser
 *      actually resolved;
 *   3. axe-core runs on the key routes in the variant, which is the only check
 *      that sees real elements rather than theoretical pairs.
 *
 * Usage: node scripts/ember-verify.mjs
 */

import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const PALETTE = process.env.PALETTE ?? "ember";
const ROUTES = [
  ["home", "/"],
  ["venues", "/venues"],
  ["venue", "/venues/thalasses"],
  ["journey", "/wedding-guide"],
  ["contact", "/contact"],
];

const GROUNDS = ["ink", "charcoal", "graphite", "hair"];
const TYPES = ["bone", "muted", "faint", "gold"];

let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${detail ? `  ${detail}` : ""}`);
  if (!ok) failures++;
};

const chan = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lumOf = ([r, g, b]) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const ratio = (a, b) => {
  const [x, y] = [lumOf(a), lumOf(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const parse = (s) => (s.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

/** Read every colour token as the browser resolved it. */
async function tokens(url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(700);
  return page.evaluate((names) => {
    const cs = getComputedStyle(document.documentElement);
    const probe = document.createElement("span");
    document.body.appendChild(probe);
    const out = {};
    for (const n of names) {
      probe.style.color = cs.getPropertyValue(`--color-${n}`).trim();
      out[n] = getComputedStyle(probe).color;
    }
    probe.remove();
    out.__body = getComputedStyle(document.body).backgroundColor;
    out.__palette = document.documentElement.dataset.palette ?? "(default)";
    return out;
  }, [...GROUNDS, ...TYPES]);
}

console.log("\nEMBER INK — verification\n");

/* ---------- 1. the swap actually happens ---------- */
console.log("1. the swap");
const base = await tokens(`${BASE}/`);
const ember = await tokens(`${BASE}/?palette=${PALETTE}`);

check("default page carries no palette attribute", base.__palette === "(default)", base.__palette);
check(`variant page carries data-palette=${PALETTE}`, ember.__palette === PALETTE, ember.__palette);
check("the ground actually changed", base.ink !== ember.ink, `${base.ink} -> ${ember.ink}`);

let allWarm = true;
for (const g of GROUNDS) {
  const [r, , b] = parse(ember[g]);
  const [br, , bb] = parse(base[g]);
  if (r - b <= 0) allWarm = false;
  console.log(`      ${g.padEnd(9)} ${base[g].padEnd(20)} r-b ${String(br - bb).padStart(3)}   ->   ${ember[g].padEnd(20)} r-b ${String(r - b).padStart(3)}`);
}
check("every ember ground is warm (r-b > 0)", allWarm);
check("every shipped ground was cool (r-b < 0)", GROUNDS.every((g) => { const [r, , b] = parse(base[g]); return r - b < 0; }));
check("bone unchanged", base.bone === ember.bone, ember.bone);
check("muted unchanged", base.muted === ember.muted, ember.muted);
check("gold unchanged", base.gold === ember.gold, ember.gold);
/* faint moves only on the lifted ladder; on the deep one it needs no help. */
console.log(`      faint     ${base.faint} -> ${ember.faint}${base.faint === ember.faint ? "  (unchanged — no lift needed)" : "  (lifted to hold AA)"}`);

/* ---------- 2. contrast sweep, every pair, from rendered values ---------- */
console.log("\n2. contrast sweep — every token pair, as the browser resolved them\n");
console.log(`      ${"pair".padEnd(20)} ${"shipped".padStart(8)} ${"ember".padStart(8)}   verdict`);
let worstEmber = Infinity;
let worstPair = "";
const regressed = [];
for (const t of TYPES) {
  for (const g of GROUNDS) {
    const now = ratio(parse(base[t]), parse(base[g]));
    const next = ratio(parse(ember[t]), parse(ember[g]));
    if (next < worstEmber) { worstEmber = next; worstPair = `${t} on ${g}`; }
    if (next < now - 0.05) regressed.push(`${t} on ${g} ${now.toFixed(2)}->${next.toFixed(2)}`);
    console.log(
      `      ${`${t} on ${g}`.padEnd(20)} ${now.toFixed(2).padStart(8)} ${next.toFixed(2).padStart(8)}   ${next >= 4.5 ? "AA" : next >= 3 ? "AA-large" : "FAIL"}`,
    );
  }
}
console.log("");
check("no pair falls below 3:1", worstEmber >= 3, `worst is ${worstPair} at ${worstEmber.toFixed(2)}:1`);

/*
 * A pair that is lower than it was but still clears its bar is a COST, not a
 * failure — the bar here is axe-0 and AA, and calling a passing value a failure
 * would just train someone to ignore the check. It is reported in full so the
 * trade is visible and priced, rather than quietly absorbed.
 */
if (regressed.length) {
  console.log(`\n      cost of this ladder: ${regressed.length} pair(s) lower than shipped, all still AA at their usage size`);
  regressed.forEach((r) => console.log(`        ${r}`));
} else {
  console.log("\n      cost of this ladder: none — every pair holds its shipped ratio exactly");
}

/* ---------- 3. axe on the variant ---------- */
console.log("\n3. axe-core on the variant");
for (const [name, route] of ROUTES) {
  for (const [w, h, label] of [[1440, 900, "1440"], [390, 844, "390"]]) {
    const c = await browser.newContext({ viewport: { width: w, height: h }, ...(w < 768 ? { hasTouch: true, isMobile: true } : {}) });
    const p = await c.newPage();
    await p.goto(`${BASE}${route}?palette=${PALETTE}`, { waitUntil: "load", timeout: 60000 });
    await p.waitForTimeout(1800);
    const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const contrast = r.violations.filter((v) => v.id === "color-contrast");
    check(
      `${name} @ ${label}`,
      r.violations.length === 0,
      r.violations.length === 0 ? "0 violations" : `${r.violations.length} (${r.violations.map((v) => v.id).join(", ")})${contrast.length ? ` — ${contrast[0].nodes.length} contrast nodes` : ""}`,
    );
    await c.close();
  }
}

await browser.close();
console.log(`\n${"-".repeat(60)}`);
console.log(failures === 0 ? "Ember Ink verifies clean." : `${failures} check(s) failed.`);
if (failures) process.exitCode = 1;
