/**
 * Stage 4's completion test — mechanical, not visual.
 *
 * The inversion's whole structural bet is that no component names a colour:
 * it asks for a ROLE (`--text-primary`, `--surface`, `--rule`) and the ground
 * it sits on decides what that resolves to. The moment a component reaches
 * past that and names `text-bone` or `#0a0a0b`, a dark chapter stops being a
 * local inversion and becomes a conditional again — and the failure is
 * invisible in a dark section, because bone on night looks right.
 *
 * So the proof is a count, and the count has to be zero. This walks `src/`
 * and reports every palette literal it finds outside the places where a
 * literal is the DEFINITION rather than a use:
 *
 *   - the `@theme` block in globals.css
 *   - the `[data-palette=…]` study ladders
 *   - the `[data-ground=…]` role ladders
 *   - the one hand edit the plan names: `themeColor` in layout.tsx, because
 *     metadata cannot read a CSS variable
 *
 * Three families of literal are caught:
 *
 *   1. a Tailwind utility built from a palette name — `text-bone`,
 *      `bg-ink/85`, `border-hair`, `from-charcoal`, `decoration-gold/60`
 *   2. a palette variable — `var(--color-bone)`
 *   3. a raw colour — any `#hex`, `rgb(…)`, `hsl(…)`
 *
 * The third is broader than the palette and deliberately so: a hard-coded
 * `#fff` is exactly as much of a literal as `#f3efe7`, and a future palette
 * would have to find it by eye.
 *
 * Usage: node scripts/palette-literals.mjs           exits 1 on any literal
 *        node scripts/palette-literals.mjs --list    print every hit
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const LIST = process.argv.includes("--list");

/* The site's own palette names, and Tailwind's default ones: a `bg-black/70`
   or a `text-white` is a colour literal by any reading, and the default
   palette is the easiest one to reach for by accident. */
const NAMES =
  "ink|charcoal|graphite|hair|bone|muted|faint|gold|black|white|" +
  "(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\\d{2,3})?";
const PREFIXES =
  "text|bg|border|border-[trblxyse]|from|via|to|fill|stroke|ring|ring-offset|outline|decoration|shadow|divide|placeholder|caret|accent";

const PATTERNS = [
  {
    kind: "utility",
    re: new RegExp(`(?<![\\w-])(?:[\\w-]+:)*(?:${PREFIXES})-(?:${NAMES})(?:/\\d+)?(?![\\w-])`, "g"),
  },
  { kind: "variable", re: new RegExp(`var\\(--color-(?:${NAMES})\\)`, "g") },
  /* A raw colour: a hex, or an rgb()/hsl() call whose first argument is a
     number. `rgb(var(--wash) / 0.9)` is a role being used, not a literal. */
  { kind: "raw", re: /(?<![\w&])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![\w-])|\b(?:rgba?|hsla?)\(\s*\d/g },
];

/*
 * Comments are not uses. A hex quoted in a comment — "gold is #b98f4a at
 * 2.52:1" — is documentation of a decision, not a colour the browser paints.
 * Block comments are blanked in place so line numbers survive; line comments
 * are cut from the first `//` that is not part of a URL.
 */
function stripComments(text) {
  const blocks = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  return blocks
    .split("\n")
    .map((line) => line.replace(/(^|[^:\\])\/\/.*$/, "$1"))
    .join("\n");
}

/*
 * Lines that are allowed to carry a literal because they DEFINE one.
 *
 * globals.css: any line inside a top-level `@theme { … }`, `[data-palette…] { … }`
 * or `[data-ground…] { … }` block. Tracked by brace depth from the block
 * opener, so a literal in a `.component { … }` rule two lines later is not
 * excused by proximity.
 */
function allowedLinesInCss(text) {
  const allowed = new Set();
  const lines = text.split("\n");
  let depth = 0;
  let inDefinition = false;
  let definitionDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/{/g) ?? []).length;
    const closes = (line.match(/}/g) ?? []).length;

    if (!inDefinition && depth === 0 && /^\s*(@theme|\[data-palette[^\]]*\]|\[data-ground[^\]]*\])\s*{/.test(line)) {
      inDefinition = true;
      definitionDepth = depth;
    }
    if (inDefinition) allowed.add(i);

    depth += opens - closes;
    if (inDefinition && depth <= definitionDepth) inDefinition = false;
  }
  return allowed;
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const hits = [];
const files = await walk(SRC);

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const text = stripComments(await readFile(file, "utf8"));
  const lines = text.split("\n");
  const allowed = rel === "src/app/globals.css" ? allowedLinesInCss(text) : new Set();

  lines.forEach((line, i) => {
    if (allowed.has(i)) return;
    /* The plan's one named exception — mobile browser chrome cannot read CSS. */
    if (rel === "src/app/layout.tsx" && /themeColor\s*:/.test(line)) return;
    /* The SVG grain tile is a data URI with no colour in it; skip URL bodies so
       a `#` inside `url(%23n)` is not read as a hex colour. */
    const scan = line.replace(/url\([^)]*\)/g, "url()");

    for (const { kind, re } of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(scan))) {
        hits.push({ file: rel, line: i + 1, kind, text: m[0] });
      }
    }
  });
}

const byFile = new Map();
for (const h of hits) byFile.set(h.file, (byFile.get(h.file) ?? 0) + 1);

console.log(`\nPALETTE LITERALS — ${files.length} files under src/\n`);

if (hits.length === 0) {
  console.log("  zero palette literals outside the token definitions. The tree is semantic.");
} else {
  const rows = [...byFile.entries()].sort((a, b) => b[1] - a[1]);
  for (const [file, n] of rows) console.log(`  ${String(n).padStart(4)}  ${file}`);
  if (LIST) {
    console.log("");
    for (const h of hits) console.log(`  ${h.file}:${h.line}  ${h.kind.padEnd(8)} ${h.text}`);
  }
  console.log(`\n  ${hits.length} literal(s) in ${byFile.size} file(s).`);
  process.exitCode = 1;
}
