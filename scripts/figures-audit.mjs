/**
 * Figures audit — no number the site renders is typed into a component.
 *
 * The standing law is that figures derive from `content/`: "three venues", "up to
 * 300 guests", the phone numbers. Until stage 8 nothing enforced it. `audit:claims`
 * guards scarcity and exclusivity *wording* and never looked at digits, though
 * QA-TOOLKIT.md claimed it did — and stage 8 found two figures that had gone
 * wrong exactly this way: a typed `300` in the `/venues` header that would not
 * follow the venues, and a venue's structured data that stripped every non-digit
 * from "up to 200-300" and told search engines 200300 guests. Both were found by
 * reading code. This is the check that would have found them.
 *
 * What it reads: every `.tsx` under `src/`, parsed with the repository's own
 * TypeScript, looking at the places a figure reaches a visitor —
 *   - JSX text ("Up to 300 guests" written into the markup),
 *   - a literal as a JSX child (`{300}`, `{"300"}`, a template with digits),
 *   - the accessible and placeholder text of an element (alt, aria-label, title,
 *     placeholder, aria-valuetext),
 *   - the string properties that become page copy or metadata (title,
 *     description, alt, imageAlt, heading, standfirst, label).
 * An expression that computes — `{venues.length}`, `{capacityLabel(v.capacity)}`,
 * `{guestCeiling}` — is not a candidate at all: that is the law working.
 *
 * How a candidate passes:
 *   1. its file is allowed by name below, with the reason recorded here, or
 *   2. every digit group in it appears in `content/` as a number in its own right
 *      (not as a substring: "30" does not trace to the 300 of a capacity), so the
 *      figure traces to the source of truth.
 * Anything else fails, and an allowance that matches nothing fails too, so a
 * stale allowance cannot sit here pretending to cover something.
 *
 * What it is not: proof. Rule 2 asks whether a number exists in `content/`, not
 * whether it means there what it means here — "200" would pass on any page,
 * because a venue holds 200. It is a tripwire for invented and stale figures, and
 * reading the diff is still the real check.
 *
 * Usage: npm run audit:figures
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ts = createRequire(path.join(ROOT, "package.json"))("typescript");

/** Files whose numbers are not claims about the business. Every one is printed. */
const ALLOWED = [
  {
    prefix: "src/app/direction/",
    why: "the three design-direction studies, kept for the owner: their prose is the study's own, not the site's copy",
  },
  {
    prefix: "src/app/study/",
    why: "the study routes and their notes: section numbers, stage numbers and measured pixel figures about the work itself",
  },
  {
    prefix: "src/components/study/",
    why: "the study components (a native-form specimen): its example values are part of the specimen",
  },
  {
    prefix: "src/app/not-found.tsx",
    why: 'the HTTP status in "Error 404", not a figure about the business',
  },
];

/**
 * Single figures allowed in a file that is otherwise held to the law, each with
 * its reason. Finer than a whole file: `/venues` is the page that carried the
 * typed 300, so it stays covered for everything else.
 */
const ALLOWED_FIGURES = [
  {
    rel: "src/app/venues/page.tsx",
    group: "65",
    why: "the estate's acreage in the SEO description: content/venues.ts says it in words (\"Sixty-five private acres\"), and the live site's own copy uses the numeral",
  },
];

/** Element attributes a visitor hears or reads. */
const TEXT_ATTRS = /^(alt|aria-label|aria-valuetext|title|placeholder)$/;
/** Object properties that become page copy or metadata. */
const TEXT_PROPS = /^(title|description|alt|imageAlt|heading|standfirst|label)$/;

const digits = (s) => [...new Set(String(s).match(/\d+/g) ?? [])];
/** In content/ as a number of its own, not inside a longer one. */
const inContent = (content, group) => new RegExp(String.raw`(?<!\d)` + group + String.raw`(?!\d)`).test(content);

async function tsxFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await tsxFiles(p)));
    else if (entry.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

async function contentText() {
  const dir = path.join(ROOT, "content");
  const parts = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".ts")) parts.push(await readFile(path.join(dir, entry.name), "utf8"));
  }
  if (!parts.length) {
    console.error("figures: content/ holds no .ts files — nothing to trace figures to");
    process.exit(1);
  }
  return parts.join("\n");
}

/** The candidates in one file: places a number would reach a visitor. */
function candidates(file, rel, source) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const line = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  const found = [];
  const add = (node, kind, text) => {
    const d = digits(text);
    if (d.length) found.push({ rel, line: line(node), kind, text: String(text).replace(/\s+/g, " ").trim().slice(0, 120), digits: d });
  };
  const literalText = (node) => {
    if (!node) return null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return node.text;
    if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join("…");
    if (ts.isJsxExpression(node)) return literalText(node.expression);
    return null;
  };

  const visit = (node) => {
    if (ts.isJsxText(node) && node.text.trim()) add(node, "text", node.text);
    else if (ts.isJsxExpression(node) && node.parent && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      const text = literalText(node.expression);
      if (text !== null) add(node, "child", text);
    } else if (ts.isJsxAttribute(node) && TEXT_ATTRS.test(node.name.getText(sf))) {
      const text = literalText(node.initializer);
      if (text !== null) add(node, `attr ${node.name.getText(sf)}`, text);
    } else if (ts.isPropertyAssignment(node) && TEXT_PROPS.test(node.name.getText(sf).replace(/['"]/g, ""))) {
      const text = literalText(node.initializer);
      if (text !== null) add(node, `prop ${node.name.getText(sf).replace(/['"]/g, "")}`, text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

const content = await contentText();
const files = (await tsxFiles(path.join(ROOT, "src"))).sort();
const all = [];
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  all.push(...candidates(file, rel, await readFile(file, "utf8")));
}

const traced = [];
const allowed = [];
const byFigure = [];
const failures = [];
const usedAllowance = new Set();
const usedFigure = new Set();

for (const c of all) {
  const allowance = ALLOWED.find((a) => c.rel.startsWith(a.prefix));
  if (allowance) {
    usedAllowance.add(allowance.prefix);
    allowed.push({ ...c, why: allowance.why });
    continue;
  }
  const untraced = [];
  for (const d of c.digits) {
    if (inContent(content, d)) continue;
    const one = ALLOWED_FIGURES.find((f) => f.rel === c.rel && f.group === d);
    if (one) {
      usedFigure.add(`${one.rel} ${one.group}`);
      byFigure.push({ ...c, group: d, why: one.why });
    } else untraced.push(d);
  }
  if (untraced.length) failures.push({ ...c, untraced });
  else if (!byFigure.some((f) => f.rel === c.rel && f.line === c.line)) traced.push(c);
}

console.log(`FIGURES — ${files.length} .tsx files under src/, ${all.length} rendered number(s)\n`);

console.log(`traced to content/ (${traced.length}):`);
for (const c of traced) console.log(`  ${c.rel}:${c.line} [${c.kind}] ${c.text}`);

console.log(`\nallowed by name (${allowed.length}):`);
for (const a of ALLOWED) {
  const mine = allowed.filter((c) => c.rel.startsWith(a.prefix));
  console.log(`  ${a.prefix} — ${a.why}`);
  for (const c of mine) console.log(`    ${c.rel}:${c.line} [${c.kind}] ${c.text}`);
}

if (byFigure.length || ALLOWED_FIGURES.length) {
  console.log(`\nsingle figures allowed by name (${byFigure.length}):`);
  for (const f of byFigure) console.log(`  ${f.rel}:${f.line} [${f.kind}] ${f.group} — ${f.why}`);
}

const dead = [
  ...ALLOWED.filter((a) => !usedAllowance.has(a.prefix)).map((a) => `${a.prefix} — ${a.why}`),
  ...ALLOWED_FIGURES.filter((f) => !usedFigure.has(`${f.rel} ${f.group}`)).map((f) => `${f.rel} ${f.group} — ${f.why}`),
];
if (dead.length) {
  console.log(`\n${dead.length} allowance(s) cover nothing and should go:`);
  for (const d of dead) console.log(`  ${d}`);
}

if (failures.length) {
  console.log(`\n${failures.length} figure(s) typed into a component and not traceable to content/:`);
  for (const f of failures) console.log(`  ${f.rel}:${f.line} [${f.kind}] ${f.text}   (not in content/: ${f.untraced.join(", ")})`);
  console.log("\nDerive it from content/, or — if it is not a figure about the business — allow the file by name in this script, with the reason.");
}

console.log(
  `\n${failures.length === 0 && dead.length === 0 ? "every rendered figure derives from content/ or is allowed by name." : "figures audit FAILED."}`,
);
process.exit(failures.length === 0 && dead.length === 0 ? 0 : 1);
