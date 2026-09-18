/**
 * The footer wordmark as a drawing.
 *
 * The footer ends on the site's name set enormous and felt rather than read:
 * 1.22:1 against the colophon, on purpose. As text it was a WCAG 1.4.3
 * logotype exemption that the gate's own axe run honoured and Lighthouse could
 * not, so every route read 95-96 for accessibility. Stage 8 (owner's
 * instruction) draws it instead: the name in Playfair Display's own outlines,
 * laid out exactly as the text was, so the page carries a picture of the
 * wordmark and no low-contrast text at all.
 *
 * This script writes src/components/layout/wordmark-outline.ts from the font
 * the build actually ships (.next/static/media, found through the built CSS)
 * and from site.name (content/site.ts). With no flag it checks instead: the
 * committed drawing must equal what the current build and name produce, so a
 * renamed site or a new version of the font can never leave a stale drawing
 * behind. The check runs in the gate after the build.
 *
 * Layout, in thousandths of an em (the footer's font-size is the em):
 *   - each glyph advances by its own width, the GPOS `kern` pair adjustment and
 *     the footer's tracking, -0.04em, which Chromium also applies after the last
 *     letter; the box is the sum (7.56em for DOMISIGNATURE);
 *   - the line box is the footer's leading, 0.8em, and the baseline sits where
 *     the text's did: half-leading plus ascent is 815.5, and Chromium rounds
 *     ascent, descent and half-leading to whole pixels at each size, which
 *     lifts real text by 0-1px. Across the footer's sizes (56-272px) the best
 *     single baseline is 813.3 (mean error +0.07px, worst 1.01px; measured in
 *     Chromium 151 against the text it replaces, 2026-09-17).
 * Playfair Display renders weight 300 as its 400 default instance (the site
 * loads 400 and 500 only), so the default outlines are the ones to draw; the
 * script refuses a font whose wght default is not 400.
 *
 * The path uses the nonzero fill rule: A, R and E are overlapping contours.
 *
 * Usage: node scripts/wordmark-outline.mjs          check (exit 1 on a mismatch)
 *        node scripts/wordmark-outline.mjs --write  regenerate the module
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { TrueTypeFont, compactPath, contoursToCommands, decodeWoff2 } from "./woff2-font.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = "src/components/layout/wordmark-outline.ts";
const WRITE = process.argv.includes("--write");

/* The footer's setting (src/components/layout/Footer.tsx). */
const EM = 1000;
const TRACKING = -0.04;
const LEADING = 0.8;
/* Chromium's per-size rounding, as a constant lift (see the header). */
const BASELINE_LIFT = 2.2;

const fail = (why) => {
  console.error(`wordmark: ${why}`);
  process.exit(1);
};

/** site.name, read as text (content/site.ts is TypeScript). */
async function siteName() {
  const src = await readFile(path.join(ROOT, "content", "site.ts"), "utf8");
  const block = /export const site = \{([\s\S]*?)\n\};?/.exec(src)?.[1] ?? "";
  const name = /^\s*name:\s*"([^"]+)"/m.exec(block)?.[1];
  if (!name) fail("site.name not found in content/site.ts");
  return name;
}

/**
 * Does a CSS unicode-range cover every character of the text? Ranges are
 * compared by what they mean, not how they are spelled: Next 15's webpack CSS
 * writes `u+00??` and Next 16's Turbopack writes `U+??`, and both mean
 * U+0000-U+00FF. `?` is a wildcard digit; a bare value is one code point.
 */
function rangeCovers(value, text) {
  const spans = [];
  for (const token of value.split(",")) {
    const t = token.trim().replace(/^u\+/i, "");
    if (!t) continue;
    if (t.includes("?")) {
      const from = Number.parseInt(t.replace(/\?/g, "0"), 16);
      const to = Number.parseInt(t.replace(/\?/g, "F"), 16);
      spans.push([from, to]);
    } else if (t.includes("-")) {
      const [a, b] = t.split("-").map((x) => Number.parseInt(x, 16));
      spans.push([a, b]);
    } else {
      const a = Number.parseInt(t, 16);
      spans.push([a, a]);
    }
  }
  if (!spans.length || spans.some(([a, b]) => Number.isNaN(a) || Number.isNaN(b))) return false;
  return [...text].every((ch) => spans.some(([a, b]) => ch.codePointAt(0) >= a && ch.codePointAt(0) <= b));
}

/** Every .css the build wrote, wherever this Next version puts it. */
async function builtCss() {
  const staticDir = path.join(ROOT, ".next", "static");
  const out = [];
  const walk = async (dir) => {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "media") await walk(p);
      else if (entry.isFile() && entry.name.endsWith(".css")) out.push(p);
    }
  };
  await walk(staticDir);
  if (!out.length) fail("no build: .next/static holds no CSS (run `npm run build` first)");
  return out;
}

/**
 * The font file the build serves for the wordmark: Playfair Display, normal,
 * weight 400 (the site loads 400 and 500, and 300 renders as 400), whose
 * unicode-range covers every letter drawn. Next 15 wrote
 * `url(/_next/static/media/x.woff2)` from `.next/static/css`; Next 16's
 * Turbopack writes `url(../media/x.woff2)` from `.next/static/chunks`. Both are
 * resolved to the file on disk.
 */
async function builtFont(text) {
  const found = new Set();
  for (const file of await builtCss()) {
    const css = await readFile(file, "utf8");
    for (const [rule] of css.matchAll(/@font-face\{[^}]*\}/g)) {
      if (!/font-family:\s*["']?Playfair Display["']?\s*[;}]/.test(rule)) continue;
      if (!/font-style:\s*normal/.test(rule)) continue;
      const weight = /font-weight:\s*([^;}]+)/.exec(rule)?.[1]?.trim() ?? "";
      const bounds = weight.match(/\d+/g)?.map(Number) ?? [];
      const takes400 = bounds.length === 1 ? bounds[0] === 400 : bounds.length > 1 && Math.min(...bounds) <= 400 && Math.max(...bounds) >= 400;
      if (!takes400) continue;
      const range = /unicode-range:\s*([^;}]+)/.exec(rule)?.[1];
      if (range && !rangeCovers(range, text)) continue;
      const url = /url\(\s*["']?([^"')]+\.woff2)["']?\s*\)/.exec(rule)?.[1];
      if (url) found.add(path.basename(url));
    }
  }
  if (found.size !== 1) fail(`expected one Playfair Display normal 400 face covering "${text}" in the built CSS, found ${found.size}`);
  const [file] = found;
  return { file, bytes: await readFile(path.join(ROOT, ".next", "static", "media", file)) };
}

/** A name-table string (Windows, English) — the family and the version. */
function nameString(tables, id) {
  const b = tables.get("name");
  const count = b.readUInt16BE(2);
  const storage = b.readUInt16BE(4);
  for (let i = 0; i < count; i++) {
    const r = 6 + 12 * i;
    if (b.readUInt16BE(r) !== 3 || b.readUInt16BE(r + 2) !== 1 || b.readUInt16BE(r + 4) !== 0x409 || b.readUInt16BE(r + 6) !== id) continue;
    const raw = b.subarray(storage + b.readUInt16BE(r + 10), storage + b.readUInt16BE(r + 10) + b.readUInt16BE(r + 8));
    let s = "";
    for (let k = 0; k < raw.length; k += 2) s += String.fromCharCode(raw.readUInt16BE(k));
    return s;
  }
  return "";
}

function draw(tables, text) {
  const font = new TrueTypeFont(tables);
  const wght = font.axes.find((a) => a.tag === "wght");
  if (wght && wght.default !== 400) fail(`the font's wght default is ${wght.default}, not 400: its default outlines are not what renders`);
  const scale = EM / font.unitsPerEm;
  const ids = [...text].map((ch) => {
    const id = font.glyphId(ch);
    if (!id) fail(`the font has no glyph for "${ch}"`);
    return id;
  });
  const baseline = (LEADING * EM - (font.ascender - font.descender) * scale) / 2 + font.ascender * scale - BASELINE_LIFT;
  const cmds = [];
  let x = 0;
  ids.forEach((id, i) => {
    cmds.push(...contoursToCommands(font.contours(id), x, baseline, scale));
    const kern = i + 1 < ids.length ? font.kern(id, ids[i + 1]) : 0;
    x += (font.advance[id] + kern) * scale + TRACKING * EM;
  });
  return { d: compactPath(cmds, 1), width: Math.round(x * 10) / 10, height: LEADING * EM };
}

function moduleText({ text, family, version, d, width, height }) {
  return `/**
 * The footer wordmark, drawn: ${text} in ${family}'s own outlines (${version}),
 * set as the footer set the text it replaces (tracking -0.04em, leading 0.8).
 * Units are thousandths of an em. Fill with the nonzero rule.
 *
 * GENERATED by scripts/wordmark-outline.mjs from site.name and the built font.
 * Do not edit: run \`node scripts/wordmark-outline.mjs --write\` after a build.
 * The gate fails if this file and the build disagree.
 */
export const WORDMARK = {
  text: ${JSON.stringify(text)},
  width: ${width},
  height: ${height},
  d: ${JSON.stringify(d)},
} as const;
`;
}

const text = (await siteName()).toUpperCase();
const { file, bytes } = await builtFont(text);
const tables = decodeWoff2(bytes);
const family = nameString(tables, 1) || "the site's display face";
const version = nameString(tables, 5).replace(/;.*$/, "") || "unknown version";
const drawing = draw(tables, text);
const expected = moduleText({ text, family, version, ...drawing });
const target = path.join(ROOT, OUT);

if (WRITE) {
  await writeFile(target, expected, "utf8");
  console.log(`wordmark: wrote ${OUT} — ${text}, ${family} ${version} (${file}), ${drawing.width / EM}em wide, path ${drawing.d.length} characters`);
  process.exit(0);
}

let current = "";
try {
  current = (await readFile(target, "utf8")).replace(/\r\n/g, "\n");
} catch {
  fail(`${OUT} is missing (run \`node scripts/wordmark-outline.mjs --write\`)`);
}
if (current !== expected) {
  const was = /text: "([^"]*)"/.exec(current)?.[1];
  const reason = was !== text ? `it draws "${was}", site.name is "${text}"` : "the built font's outlines or metrics differ from the drawing";
  fail(`${OUT} is stale: ${reason}. Run \`node scripts/wordmark-outline.mjs --write\` and review the footer.`);
}
console.log(`wordmark: ${OUT} matches site.name ("${text}") and the built ${family} (${version})`);
