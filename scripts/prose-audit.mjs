/**
 * Fact audit — verifies that every factual token in the live venue copy still
 * appears somewhere in the rebuilt venue content.
 *
 * This started as a sentence-level diff, which caught a real loss: three
 * Thalasses sentences (the villa names Thoi/Persi/Eeanthe/Melia, the storey
 * detail, the "ideal for" line) were dropped in Phase 1 and nothing noticed,
 * because the content audit compared image counts and never the prose.
 *
 * Once Phase 6 deliberately rewrote the prose, verbatim matching stopped being
 * a useful test — every intentional edit looked like a loss. What must survive
 * a rewrite is not the wording but the FACTS, so that is what this checks now:
 * every number, measurement and proper noun the live copy asserts must still be
 * findable in the venue's content block.
 *
 * Usage: npm run audit:prose
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(ROOT, "scripts", "source.html"), "utf8");
const venuesTs = await readFile(path.join(ROOT, "content", "venues.ts"), "utf8");

/*
 * portfolioModal4 (Villa Aetos) is deliberately absent. The owner withdrew that
 * venue from the collection, so its copy is not missing — it is removed, on
 * purpose, and the page redirects to /venues. Leaving it in this list would
 * report an owner decision as a content loss every time the audit runs, which
 * is exactly the noise that makes an audit stop being read.
 *
 * Recorded as an approved delta in design-review/content-audit.md §7.
 */
const MODALS = [
  ["portfolioModal1", "Mountain Escape", "mountain-escape"],
  ["portfolioModal2", "Thalasses", "thalasses"],
  ["portfolioModal3", "Olive Stories", "olive-stories"],
];

/** Capitalised words that begin a sentence or describe, rather than assert a fact. */
const STOP = new Set([
  "The", "This", "It", "Each", "All", "Because", "Set", "Surrounded", "Ideal", "Perfect",
  "How", "Please", "A", "An", "When", "Cycladic", "Greece", "Greek", "Villas", "Villa",
  "No", "Possibility", "Pool", "Sea", "Calm", "Raw", "Relaxed", "Rustic", "Boho",
  "Authentic", "Multi", "Intimate", "Private", "LGBTQ", "Domisi",
]);

/**
 * Approved deltas — differences that are deliberate, signed off, and must not
 * be reported as losses. Keep this list short and always cite the approval.
 */
const APPROVED = new Set([
  "Thallases", // misspelling of the venue's own name; fix approved in TEXT-FIXES.md §A2
]);

function textOf(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The venue's whole content block, so a fact may live anywhere in it. */
function contentBlock(slug) {
  const start = venuesTs.indexOf(`slug: "${slug}"`);
  if (start < 0) return "";
  const next = venuesTs.indexOf("\n  {\n", start);
  return venuesTs.slice(start, next > 0 ? next : venuesTs.length).toLowerCase();
}

const report = [];
let totalMissing = 0;

for (let i = 0; i < MODALS.length; i++) {
  const [id, name, slug] = MODALS[i];
  const start = source.indexOf(`id="${id}"`);
  const end =
    i < MODALS.length - 1
      ? source.indexOf(`id="${MODALS[i + 1][0]}"`)
      : source.indexOf('id="portfolio1Modal1"');

  let seg = source.slice(start, end);
  const afterGallery = seg.lastIndexOf("</a>");
  const beforeCategory = seg.indexOf("<strong>Category:</strong>");
  seg = seg.slice(afterGallery > 0 ? afterGallery : 0, beforeCategory > 0 ? beforeCategory : seg.length);

  const text = textOf(seg);
  const block = contentBlock(slug);

  /* Numbers and measurements: 65, 12, 180, 00:00, 200-300, 50 … */
  const numbers = [...new Set((text.match(/\d+(?:[.:-]\d+)*/g) ?? []))].filter(
    (n) => n.length > 0 && !/^1?[0-9]?pt$/.test(n),
  );

  /* Proper nouns the copy asserts — villa names above all. */
  const propers = [...new Set((text.match(/\b[A-Z][a-z]{2,}\b/g) ?? []))].filter(
    (w) => !STOP.has(w) && !APPROVED.has(w),
  );

  const missingNumbers = numbers.filter((n) => !block.includes(n.toLowerCase()));
  const missingProper = propers.filter((w) => !block.includes(w.toLowerCase()));

  const missing = [...missingNumbers.map((n) => `number ${n}`), ...missingProper.map((w) => `name ${w}`)];
  totalMissing += missing.length;
  report.push({ venue: name, numbers: numbers.length, propers: propers.length, missing });

  console.log(
    `${name.padEnd(16)} ${String(numbers.length).padStart(2)} numbers, ${String(propers.length).padStart(2)} names — ${missing.length === 0 ? "all present" : `${missing.length} MISSING`}`,
  );
  for (const m of missing) console.log(`    MISSING: ${m}`);
}

await writeFile(
  path.join(ROOT, "design-review", "prose-audit.json"),
  JSON.stringify(report, null, 2),
  "utf8",
);
console.log(`\n${totalMissing} missing fact(s) -> design-review/prose-audit.json`);
if (totalMissing > 0) process.exitCode = 1;
