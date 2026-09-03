/**
 * Stage 1 — solve the complete semantic role map for both grounds.
 *
 * Amendment 1 is the reason this script exists: the switch has to cover EVERY
 * role, not just text and surface, so that no component ever names a palette
 * literal. A component asks for `--text-secondary` or `--rule`; whether that
 * resolves to stone or muted is the section's business, not the component's.
 * That is what makes a dark chapter a local inversion instead of a conditional.
 *
 * Nothing here is picked by eye. Each unknown is solved against its ground for
 * the ratio its ROLE requires:
 *
 *   text        4.5:1   (AA, small text — the labels on this site are small)
 *   focus ring  3:1     (non-text, WCAG 1.4.11)
 *   rule-strong 3:1     (a boundary you must see to understand the page)
 *   rule        exempt  (decorative hairline — measured and reported anyway)
 *
 * Usage: node scripts/derive-tokens.mjs
 */

/* ---- the two grounds, both already proven ---- */
const LIGHT = { surface: "#f2ece1", raised: "#fbf7f0" };
const DARK = { surface: "#0a0a0b", raised: "#1e1e22" };

/* ---- what already ships and must not move ---- */
const SHIPPED = { bone: "#f3efe7", muted: "#9b968c", faint: "#8d8880", gold: "#b98f4a" };
const LIGHT_PRIMARY = "#27211b";
const LIGHT_TERTIARY = "#6b6558";
const LIGHT_RULE_SOFT = "#d8cfc0";

const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (v) => "#" + v.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
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

/** Walk a hue lighter until it clears `target` against `ground`. */
function solveLighter(hue, ground, target) {
  const [r, g, b] = hex2rgb(hue);
  const peak = Math.max(r, g, b) || 1;
  const u = [r / peak, g / peak, b / peak];
  let lo = peak, hi = 255;
  for (let i = 0; i < 44; i++) {
    const mid = (lo + hi) / 2;
    if (ratio(rgb2hex(u.map((x) => x * mid)), ground) < target) lo = mid;
    else hi = mid;
  }
  return rgb2hex(u.map((x) => x * hi));
}

/** Walk a hue darker until it clears `target` against `ground`. */
function solveDarker(hue, ground, target) {
  const [r, g, b] = hex2rgb(hue);
  const peak = Math.max(r, g, b) || 1;
  const u = [r / peak, g / peak, b / peak];
  let lo = 0, hi = peak;
  for (let i = 0; i < 44; i++) {
    const mid = (lo + hi) / 2;
    if (ratio(rgb2hex(u.map((x) => x * mid)), ground) < target) hi = mid;
    else lo = mid;
  }
  return rgb2hex(u.map((x) => x * lo));
}

/* ---------- solve the light ladder's middle step and its strong rule ---------- */
/* The light ground has a three-level text ramp like the dark one. primary and
   tertiary are fixed by the study; the middle step is solved so the three are
   genuinely distinct and all clear AA on the HARDER of the two light grounds. */
const LIGHT_SECONDARY = solveDarker("#4f4840", LIGHT.surface, 6.5);
const LIGHT_RULE_STRONG = solveDarker("#8a8378", LIGHT.surface, 3.0);
/*
 * Today's `hair` (#2b2b30) measures 1.41:1 on ink — decorative strength only,
 * so the dark ground currently has NO rule that meets the 3:1 a meaningful
 * boundary needs. That is a pre-existing gap, not something the inversion
 * introduced, and it is worth closing while the token layer is being built:
 * dark chapters get a solved rule-strong, and `hair` stays exactly as it is for
 * the decorative hairlines it already draws.
 */
const DARK_RULE_STRONG = solveLighter("#5f5f66", DARK.surface, 3.0);

const MAP = {
  light: {
    surface: LIGHT.surface,
    "surface-raised": LIGHT.raised,
    "text-primary": LIGHT_PRIMARY,
    "text-secondary": LIGHT_SECONDARY,
    "text-tertiary": LIGHT_TERTIARY,
    rule: LIGHT_RULE_SOFT,
    "rule-strong": LIGHT_RULE_STRONG,
    focus: LIGHT_PRIMARY,
    "shadow-tint": "39 33 27",
    accent: SHIPPED.gold,
  },
  dark: {
    surface: DARK.surface,
    "surface-raised": DARK.raised,
    "text-primary": SHIPPED.bone,
    "text-secondary": SHIPPED.muted,
    "text-tertiary": SHIPPED.faint,
    rule: "#2b2b30",
    "rule-strong": DARK_RULE_STRONG,
    focus: SHIPPED.gold,
    "shadow-tint": "0 0 0",
    accent: SHIPPED.gold,
  },
};

let fails = 0;
const line = (ok, label, detail) => {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(42)} ${detail}`);
  if (!ok) fails++;
};

for (const ground of ["light", "dark"]) {
  const m = MAP[ground];
  console.log(`\n${ground.toUpperCase()} — surface ${m.surface}, raised ${m["surface-raised"]}\n`);

  for (const role of ["text-primary", "text-secondary", "text-tertiary"]) {
    const onS = ratio(m[role], m.surface);
    const onR = ratio(m[role], m["surface-raised"]);
    line(
      Math.min(onS, onR) >= 4.5,
      `${role}  ${m[role]}`,
      `${onS.toFixed(2)}:1 on surface, ${onR.toFixed(2)}:1 on raised   (needs 4.5)`,
    );
  }

  const f = ratio(m.focus, m.surface);
  line(f >= 3, `focus  ${m.focus}`, `${f.toFixed(2)}:1 on surface   (needs 3.0)`);

  const rs = ratio(m["rule-strong"], m.surface);
  line(rs >= 3, `rule-strong  ${m["rule-strong"]}`, `${rs.toFixed(2)}:1 on surface   (needs 3.0)`);

  const r = ratio(m.rule, m.surface);
  console.log(`  --    rule (decorative)  ${m.rule.padEnd(9)}        ${r.toFixed(2)}:1 — exempt, hairline only`);

  const a = ratio(m.accent, m.surface);
  const accentOk = ground === "dark" ? a >= 4.5 : true;
  console.log(
    `  ${ground === "dark" ? (accentOk ? "ok  " : "FAIL") : "--  "}  accent ${m.accent}` +
      `                        ${a.toFixed(2)}:1 — ${ground === "dark" ? "may carry text" : "MARK AND HAIRLINES ONLY"}`,
  );
  if (ground === "dark" && !accentOk) fails++;
}

/* the three light text steps must be visibly distinct, not just legal */
const l = MAP.light;
const steps = [
  ratio(l["text-primary"], l.surface),
  ratio(l["text-secondary"], l.surface),
  ratio(l["text-tertiary"], l.surface),
];
console.log(`\nlight text ramp: ${steps.map((s) => s.toFixed(2)).join("  >  ")}`);
line(
  steps[0] > steps[1] * 1.5 && steps[1] > steps[2] * 1.2,
  "the three light steps are distinct",
  `ratios ${(steps[0] / steps[1]).toFixed(2)}x and ${(steps[1] / steps[2]).toFixed(2)}x apart`,
);

console.log("\n\nCSS\n");
for (const ground of ["light", "dark"]) {
  console.log(`[data-ground="${ground}"] {`);
  for (const [k, v] of Object.entries(MAP[ground])) console.log(`  --${k}: ${v};`);
  console.log("}");
}

console.log(fails === 0 ? "\nevery role clears its own bar." : `\n${fails} role(s) failed.`);
if (fails) process.exitCode = 1;
