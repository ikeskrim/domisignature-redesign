/**
 * Derive the Ember Ink ladder from the shipped one, by measurement.
 *
 * The diagnosis both analyses agree on: the grounds are cool (every one of
 * #0a0a0b / #131316 / #1e1e22 / #2b2b30 is blue-leaning) while the type is warm
 * (#f3efe7, #9b968c). Warm type on cool ground is why the dark reads austere
 * rather than candlelit.
 *
 * The requirement is to warm the ladder while PRESERVING ITS RELATIVE LUMINANCE
 * STEPS, so this does not eyeball hexes. It measures the shipped ladder's rung
 * spacing as WCAG contrast ratios — (L1 + 0.05) / (L0 + 0.05), which is the step
 * that actually governs legibility — then rebuilds those exact steps in a warm
 * hue, anchored on the brief's ground value.
 *
 * Prints the full contrast matrix for every token pair at the end, because a
 * recolour is precisely where invisible-on-X bugs breed.
 *
 * Usage: node scripts/derive-ember.mjs
 */

const CURRENT = {
  ink: "#0a0a0b",
  charcoal: "#131316",
  graphite: "#1e1e22",
  hair: "#2b2b30",
};
const TYPE = { bone: "#f3efe7", muted: "#9b968c", faint: "#8d8880", gold: "#b98f4a" };

/** The brief's anchors. ground is authoritative; surface is checked against. */
const ANCHOR_GROUND = "#17140F";
const ANCHOR_SURFACE = "#221E17";

const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (rgb) => "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
const chan = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (h) => {
  const [r, g, b] = hex2rgb(h);
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/* ---------- 1. measure the shipped ladder ---------- */
const rungs = Object.entries(CURRENT);
console.log("shipped ladder\n");
for (const [name, hex] of rungs) {
  const [r, g, b] = hex2rgb(hex);
  const warmth = r - b; // negative = blue-leaning = cool
  console.log(
    `  ${name.padEnd(9)} ${hex}  L=${lum(hex).toFixed(5)}  r-b=${String(warmth).padStart(3)}  ${warmth < 0 ? "COOL" : "warm"}`,
  );
}

const steps = [];
for (let i = 1; i < rungs.length; i++) {
  steps.push(ratio(rungs[i][1], rungs[i - 1][1]));
}
console.log(`\n  rung steps (contrast ratio between neighbours): ${steps.map((s) => s.toFixed(4)).join("  ")}`);

/* ---------- 2. rebuild them warm ---------- */
/* The chromatic direction comes from the brief's own ground anchor, so the
   family matches what was asked for; only the lightness is solved. */
const dir = hex2rgb(ANCHOR_GROUND);
const peak = Math.max(...dir);
const unit = dir.map((c) => c / peak);

/** Smallest 0-255 triple in this hue whose luminance is >= target. */
function atLuminance(target) {
  let lo = 0, hi = 255;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const rgb = unit.map((u) => u * mid);
    const l = 0.2126 * chan(rgb[0]) + 0.7152 * chan(rgb[1]) + 0.0722 * chan(rgb[2]);
    if (l < target) lo = mid;
    else hi = mid;
  }
  return rgb2hex(unit.map((u) => u * hi));
}

const EMBER = {};
EMBER.ink = ANCHOR_GROUND.toLowerCase();
let L = lum(EMBER.ink);
const names = rungs.map(([n]) => n);
for (let i = 1; i < names.length; i++) {
  L = (L + 0.05) * steps[i - 1] - 0.05;
  EMBER[names[i]] = atLuminance(L);
}

console.log("\nember ink ladder\n");
for (const [name, hex] of Object.entries(EMBER)) {
  const [r, g, b] = hex2rgb(hex);
  console.log(
    `  ${name.padEnd(9)} ${hex}  L=${lum(hex).toFixed(5)}  r-b=${String(r - b).padStart(3)}  ${r - b > 0 ? "WARM" : "cool"}`,
  );
}
const rebuilt = [];
for (let i = 1; i < names.length; i++) rebuilt.push(ratio(EMBER[names[i]], EMBER[names[i - 1]]));
console.log(`\n  rung steps rebuilt:                              ${rebuilt.map((s) => s.toFixed(4)).join("  ")}`);
console.log(`  max step drift: ${Math.max(...rebuilt.map((r, i) => Math.abs(r - steps[i]))).toFixed(5)}`);
console.log(`\n  surface anchor asked for ${ANCHOR_SURFACE}, derived ${EMBER.graphite} (ΔE by luminance: ${(lum(EMBER.graphite) - lum(ANCHOR_SURFACE)).toFixed(5)})`);

/* ---------- 3. every text-on-ground pair, both ladders ---------- */
console.log("\ncontrast matrix — text on ground (AA needs 4.5 body / 3.0 large)\n");
console.log(`  ${"pair".padEnd(20)} ${"current".padStart(8)} ${"ember".padStart(8)}   verdict`);
let worst = Infinity;
let regressions = 0;
for (const [tn, th] of Object.entries(TYPE)) {
  for (const gn of names) {
    const now = ratio(th, CURRENT[gn]);
    const next = ratio(th, EMBER[gn]);
    if (tn !== "gold") worst = Math.min(worst, next);
    const drop = next < now - 0.05;
    if (drop) regressions++;
    console.log(
      `  ${`${tn} on ${gn}`.padEnd(20)} ${now.toFixed(2).padStart(8)} ${next.toFixed(2).padStart(8)}   ${
        next >= 4.5 ? "AA" : next >= 3 ? "AA-large" : "FAIL"
      }${drop ? "  ↓ regressed" : ""}`,
    );
  }
}
console.log(`\n  worst non-gold pair on Ember Ink: ${worst.toFixed(2)}:1`);
console.log(`  pairs that lost contrast: ${regressions}`);

console.log("\ntoken block for globals.css\n");
for (const [k, v] of Object.entries(EMBER)) console.log(`  --color-${k}: ${v};`);

/* ---------- 4. the correction the measurement demands ---------- */
/*
 * The anchored ground sits at L=0.00717 against ink's 0.00306 — the whole
 * ladder lifts, so every pair loses roughly 7% of its ratio. Bone and muted
 * absorb it (13.44 and 5.24 are comfortable). `faint` does not: 4.38 on
 * graphite is under AA for the small uppercase labels it is used for.
 *
 * So `faint` is lifted by the minimum that restores its SHIPPED ratio, in the
 * same warm direction as the rest — not a redesign of the type, a correction
 * the numbers require. Everything else stays exactly as it ships.
 */
function liftToRatio(startHex, groundHex, targetRatio) {
  const [r0, g0, b0] = hex2rgb(startHex);
  const peakC = Math.max(r0, g0, b0);
  const u = [r0 / peakC, g0 / peakC, b0 / peakC];
  let lo = peakC, hi = 255;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (ratio(rgb2hex(u.map((x) => x * mid)), groundHex) < targetRatio) lo = mid;
    else hi = mid;
  }
  return rgb2hex(u.map((x) => x * hi));
}

const faintTarget = ratio(TYPE.faint, CURRENT.graphite);
const faintLifted = liftToRatio(TYPE.faint, EMBER.graphite, faintTarget);
console.log(`\ncorrection\n`);
console.log(`  faint  ${TYPE.faint} -> ${faintLifted}`);
for (const gn of names) {
  console.log(
    `    on ${gn.padEnd(9)} was ${ratio(TYPE.faint, CURRENT[gn]).toFixed(2)}  ember-uncorrected ${ratio(TYPE.faint, EMBER[gn]).toFixed(2)}  corrected ${ratio(faintLifted, EMBER[gn]).toFixed(2)}`,
  );
}
const [fr, fg, fb] = hex2rgb(faintLifted);
console.log(`  warmth r-b = ${fr - fb} (shipped faint is ${hex2rgb(TYPE.faint)[0] - hex2rgb(TYPE.faint)[2]})`);

/* ---------- 5. the same warmth with no contrast cost at all ---------- */
/*
 * Anchoring on #17140f is what costs the ~7%: it sits at more than twice ink's
 * luminance, so the whole ladder lifts and every pair pays for it.
 *
 * The warmth and the lift are separable. Keep the warm hue, but solve each rung
 * at the luminance the shipped rung already has, and every contrast ratio in
 * the site is preserved EXACTLY while every ground still becomes warm. The
 * ground reads deeper than the report's anchor — which for a site whose whole
 * argument is darkness is arguably the point.
 */
const DEEP = {};
for (const [name, hex] of rungs) DEEP[name] = atLuminance(lum(hex));

console.log("\nember ink (deep) — warm hue at the shipped luminances\n");
for (const [name, hex] of Object.entries(DEEP)) {
  const [r, g, b] = hex2rgb(hex);
  console.log(
    `  ${name.padEnd(9)} ${hex}  L=${lum(hex).toFixed(5)}  r-b=${String(r - b).padStart(3)}  (shipped L=${lum(CURRENT[name]).toFixed(5)})`,
  );
}
let deepWorst = Infinity, deepDrop = 0;
for (const [tn, th] of Object.entries(TYPE)) {
  for (const gn of names) {
    const now = ratio(th, CURRENT[gn]);
    const next = ratio(th, DEEP[gn]);
    if (tn !== "gold") deepWorst = Math.min(deepWorst, next);
    if (next < now - 0.05) deepDrop++;
  }
}
console.log(`\n  worst non-gold pair: ${deepWorst.toFixed(2)}:1   pairs that lost contrast: ${deepDrop}`);
console.log(`  faint needs no correction: ${ratio(TYPE.faint, DEEP.graphite).toFixed(2)} on graphite (shipped ${ratio(TYPE.faint, CURRENT.graphite).toFixed(2)})`);
console.log("\n  token block\n");
for (const [k, v] of Object.entries(DEEP)) console.log(`  --color-${k}: ${v};`);
