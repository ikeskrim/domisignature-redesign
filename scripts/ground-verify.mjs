/**
 * Stage 1 gate — does the ground switch actually resolve, and does every role
 * clear its bar on both ladders, as the browser computes them?
 *
 * derive-tokens.mjs solves the map on paper. This proves the cascade delivers
 * it: it finds every element carrying `data-ground`, reads back the resolved
 * value of every role underneath it, and sweeps the contrast. A recolour is
 * where invisible-on-X bugs breed, and a *semantic* recolour adds a second way
 * to fail — a role that resolves to the wrong ladder looks fine in the token
 * file and is invisible until someone reads the pixels.
 *
 * Usage: node scripts/ground-verify.mjs
 */

import { chromium } from "playwright";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const ROUTES = ["/study/aegean", "/study/aegean/hero", "/study/aegean/venues", "/study/aegean/venue"];

const ROLES = [
  "surface", "surface-raised",
  "text-primary", "text-secondary", "text-tertiary",
  "rule", "rule-strong", "focus", "accent",
];

let fails = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${detail ? `  ${detail}` : ""}`);
  if (!ok) fails++;
};

const chan = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = ([r, g, b]) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const parse = (s) => (s.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const seen = { light: 0, dark: 0 };
const ladders = {};

console.log("\nGROUND SWITCH — stage 1\n");

for (const route of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(900);

  const grounds = await page.evaluate((roles) => {
    const probe = document.createElement("span");
    return [...document.querySelectorAll("[data-ground]")].map((el) => {
      el.appendChild(probe);
      const cs = getComputedStyle(el);
      const out = { ground: el.dataset.ground, roles: {} };
      for (const r of roles) {
        probe.style.color = cs.getPropertyValue(`--${r}`).trim() || "rgb(255,0,255)";
        out.roles[r] = getComputedStyle(probe).color;
      }
      probe.remove();
      return out;
    });
  }, ROLES);

  for (const g of grounds) {
    seen[g.ground] = (seen[g.ground] ?? 0) + 1;
    ladders[g.ground] = g.roles;
  }
  console.log(`  ${route.padEnd(26)} grounds: ${grounds.map((g) => g.ground).join(", ") || "(none)"}`);
}

console.log("");
check(seen.light > 0, "light grounds present", `${seen.light} sections`);
check(seen.dark > 0, "dark chapters present — the local inversion", `${seen.dark} sections`);

/* ---- every role clears its bar, on both ladders, as resolved ---- */
for (const ground of ["light", "dark"]) {
  const m = ladders[ground];
  if (!m) continue;
  console.log(`\n${ground} — resolved from the cascade\n`);

  const surface = parse(m.surface);
  const raised = parse(m["surface-raised"]);

  for (const role of ["text-primary", "text-secondary", "text-tertiary"]) {
    const onS = ratio(parse(m[role]), surface);
    const onR = ratio(parse(m[role]), raised);
    check(Math.min(onS, onR) >= 4.5, `${role.padEnd(15)} ${m[role]}`, `${onS.toFixed(2)} / ${onR.toFixed(2)} (needs 4.5)`);
  }
  const f = ratio(parse(m.focus), surface);
  check(f >= 3, `focus           ${m.focus}`, `${f.toFixed(2)} (needs 3.0)`);
  const rs = ratio(parse(m["rule-strong"]), surface);
  check(rs >= 3, `rule-strong     ${m["rule-strong"]}`, `${rs.toFixed(2)} (needs 3.0)`);

  const a = ratio(parse(m.accent), surface);
  if (ground === "light") {
    check(a < 3, "accent is decorative-only on light", `${a.toFixed(2)} — mark and hairlines, never text or focus`);
    check(m.focus !== m.accent, "focus is NOT the accent on light", `${m.focus}`);
  } else {
    check(a >= 4.5, "accent may carry text on dark", `${a.toFixed(2)}`);
  }
}

/* ---- the two ladders must actually differ ---- */
if (ladders.light && ladders.dark) {
  const differ = ROLES.filter((r) => ladders.light[r] !== ladders.dark[r]);
  check(differ.length >= 6, "the ladders genuinely invert", `${differ.length}/${ROLES.length} roles differ`);
  check(
    ladders.light["text-primary"] !== ladders.dark["text-primary"] &&
      ladders.light.surface !== ladders.dark.surface,
    "surface and primary text both flip",
  );
}

await browser.close();
console.log(`\n${"-".repeat(60)}`);
console.log(fails === 0 ? "ground switch verifies clean." : `${fails} check(s) failed.`);
if (fails) process.exitCode = 1;
