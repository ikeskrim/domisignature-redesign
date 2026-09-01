/**
 * Derive and check the Aegean Bone light system before building anything.
 *
 * A light inversion is not a token swap — it changes which pairs exist. The
 * accent is the obvious risk: #b98f4a is a mid-luminance brass. On a near-black
 * ground it is luminous and passes comfortably; on warm ivory it is a mid tone
 * on a light tone, which is exactly where accents fail. Better to know that in
 * numbers before drawing three pages around it.
 *
 * Usage: node scripts/derive-aegean.mjs
 */

const IVORY = "#f2ece1"; // the brief's ground
const CARD = "#fbf7f0"; // matte for photographs
const GOLD = "#b98f4a"; // unchanged, rationed
const DARK_GROUND = "#0a0a0b"; // shipped ink, for the full-bleed chapters

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

/** Darken a hue until it clears `target` against `ground`. */
function darkenToRatio(startHex, ground, target) {
  const [r, g, b] = hex2rgb(startHex);
  const peak = Math.max(r, g, b) || 1;
  const u = [r / peak, g / peak, b / peak];
  let lo = 0, hi = peak;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (ratio(rgb2hex(u.map((x) => x * mid)), ground) < target) hi = mid;
    else lo = mid;
  }
  return rgb2hex(u.map((x) => x * lo));
}

console.log("\nAEGEAN BONE — derivation\n");
console.log(`  ground  ${IVORY}  L=${lum(IVORY).toFixed(4)}`);
console.log(`  card    ${CARD}  L=${lum(CARD).toFixed(4)}\n`);

/* Warm near-black and stone secondary, solved rather than picked. */
const INKTEXT = darkenToRatio("#3a3128", IVORY, 13.5); // warm near-black, same family as the ivory
const STONE = darkenToRatio("#6b6558", IVORY, 4.8); // stone secondary, comfortably over AA

console.log("  solved type");
console.log(`    text-primary   ${INKTEXT}   ${ratio(INKTEXT, IVORY).toFixed(2)}:1 on ivory   ${ratio(INKTEXT, CARD).toFixed(2)}:1 on card`);
console.log(`    text-secondary ${STONE}   ${ratio(STONE, IVORY).toFixed(2)}:1 on ivory   ${ratio(STONE, CARD).toFixed(2)}:1 on card`);

/* ---------- the accent, which is the whole question ---------- */
console.log("\n  the accent");
const goldOnIvory = ratio(GOLD, IVORY);
const goldOnDark = ratio(GOLD, DARK_GROUND);
console.log(`    ${GOLD} on ink   ${goldOnDark.toFixed(2)}:1   ${goldOnDark >= 4.5 ? "AA" : goldOnDark >= 3 ? "AA-large only" : "FAIL"}`);
console.log(`    ${GOLD} on ivory ${goldOnIvory.toFixed(2)}:1   ${goldOnIvory >= 4.5 ? "AA" : goldOnIvory >= 3 ? "AA-large only" : "FAIL"}`);

if (goldOnIvory < 4.5) {
  const needed = darkenToRatio(GOLD, IVORY, 4.5);
  console.log(`\n    To carry small text on ivory the gold would have to darken to ${needed}`);
  console.log(`    (${ratio(needed, IVORY).toFixed(2)}:1) — a different colour, not the same accent.`);
  console.log(`    Kept at ${GOLD} and used ONLY as hairline rules and large type,`);
  console.log(`    where 3:1 applies: ${goldOnIvory >= 3 ? "which it clears." : "which it does NOT clear."}`);
}

/* ---------- the full-bleed dark chapters ---------- */
console.log("\n  dark chapters (photography keeps the shipped ground, ungraded)");
for (const [n, t] of [["bone", "#f3efe7"], ["muted", "#9b968c"], ["gold", GOLD]]) {
  console.log(`    ${n.padEnd(6)} on ink  ${ratio(t, DARK_GROUND).toFixed(2)}:1`);
}

console.log("\n  token block\n");
console.log(`  --color-ivory: ${IVORY};`);
console.log(`  --color-card: ${CARD};`);
console.log(`  --color-inktext: ${INKTEXT};`);
console.log(`  --color-stone: ${STONE};`);
