/**
 * Publication manifest — decides, from the code rather than by eye, exactly
 * which assets the built site needs and which are safe to leave out of a public
 * repository.
 *
 * The rule that matters: anything the site REFERENCES must ship, or the
 * deployed preview 404s its own assets. Everything else is a candidate for
 * exclusion, and every exclusion has to give a reason.
 *
 * Three kinds of file are deliberately not published:
 *
 *   1. WITHHELD — frames pulled in Phase 6 §4. The chalkboard carrying a
 *      couple's names (no confirmed permission), the two files that read as
 *      AI-generated, and the weak frames. These stay in local history; they
 *      must not exist in the published tree at all.
 *   2. MASTERS — the raw camera files. `content/*.ts` records each one in an
 *      `original:` field so the provenance of every transcode is documented,
 *      but nothing serves them: the site plays the web transcodes. Publishing
 *      125 MB of source footage to make a record readable is the wrong trade.
 *   3. ORPHANS — anything else on disk that no longer has a reference.
 *
 * `original:` values are matched first and treated as records, NOT references —
 * that distinction is the whole reason this is a script and not a guess.
 *
 * Usage: npm run publish:manifest
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");

/** Pulled in Phase 6 §4 — see design-review/imagery-report.md. */
export const WITHHELD = new Map([
  ["/media/olLK_LD_072.jpg", "a couple's names legible, no confirmed permission"],
  ["/media/spire2.png", "reads as AI-generated (no EXIF/ICC, impossible reflection)"],
  ["/media/thspire2.png", "byte-identical duplicate of spire2.png"],
  ["/media/stHARLEY.jpg", "withdrawn as a weak frame"],
  ["/media/blDSC_9849.jpg", "withdrawn as a weak frame"],
  ["/media/ae9Z8A4481-Edit.jpg", "withdrawn as off-register"],
  ["/media/aeIMG_2133.jpg", "withdrawn as off-register"],
]);

async function* walk(dir, exts) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full, exts);
    else if (!exts || exts.test(entry.name)) yield full;
  }
}

/* ---- 1. What does the site actually reference? ---------------------------- */

const referenced = new Set();
const recordedOnly = new Set();

for (const dir of ["content", "src"]) {
  for await (const file of walk(path.join(ROOT, dir), /\.(tsx?|mjs)$/)) {
    const code = await readFile(file, "utf8");

    /* `original: "..."` documents provenance; it is never fetched. Capture and
       blank these before the general sweep so they cannot be double-counted. */
    const withoutRecords = code.replace(/original:\s*"([^"]+)"/g, (_, p) => {
      recordedOnly.add(p);
      return 'original: ""';
    });

    /*
     * Quotes AND backticks. The JSON-LD block builds its logo URL as
     * `${site.url}/assets/img/logo.png`, so a quote-only sweep declared the
     * brand logo an orphan and would have dropped it from a public repo.
     */
    for (const m of withoutRecords.matchAll(/[`"'](\/(?:media|assets|images)\/[^`"']+)[`"']/g)) {
      referenced.add(m[1]);
    }
    for (const m of withoutRecords.matchAll(/\$\{[^}]*\}(\/(?:media|assets|images)\/[^`"']+)/g)) {
      referenced.add(m[1]);
    }
  }
}

/*
 * Files with no code reference that must still publish. Each says why, because
 * "nothing links to it" is exactly the argument that would drop a licence file.
 */
const ALWAYS = new Map([
  ["/images/CREDITS.md", "the third-party image ledger the imagery policy requires"],
  ["/assets/img/mark.png", "the untouched original mark; scripts/make-mark.mjs derives mark-bone.png from it"],
  ["/media/video/wedding-rituals-olive-1.jpg", "poster emitted by npm run media:video; kept so the script's outputs are complete"],
]);

/* ---- 2. What is on disk? -------------------------------------------------- */

const onDisk = [];
for await (const file of walk(PUBLIC)) {
  const rel = "/" + path.relative(PUBLIC, file).split(path.sep).join("/");
  onDisk.push({ rel, abs: file, size: (await stat(file)).size });
}

const kb = (n) => Math.round(n / 1024);
const mb = (n) => (n / 1024 / 1024).toFixed(1);

const keep = [];
const drop = [];

for (const f of onDisk) {
  if (WITHHELD.has(f.rel)) {
    drop.push({ ...f, kind: "withheld", why: WITHHELD.get(f.rel) });
  } else if (referenced.has(f.rel) || ALWAYS.has(f.rel)) {
    keep.push(f);
  } else if (recordedOnly.has(f.rel)) {
    drop.push({ ...f, kind: "master", why: "raw camera master; the site serves the transcode" });
  } else {
    drop.push({ ...f, kind: "orphan", why: "no reference in content/ or src/" });
  }
}

/* ---- 3. Safety checks ----------------------------------------------------- */

const problems = [];

/* Every reference must resolve to a file we are keeping. */
const keptSet = new Set(keep.map((f) => f.rel));
for (const ref of referenced) {
  if (!keptSet.has(ref)) {
    problems.push(`REFERENCED BUT NOT PUBLISHED: ${ref}`);
  }
}

/* No withheld frame may still be referenced anywhere. */
for (const w of WITHHELD.keys()) {
  if (referenced.has(w)) problems.push(`WITHHELD FRAME STILL REFERENCED: ${w}`);
}

const LIMIT = 95 * 1024 * 1024;
const oversize = keep.filter((f) => f.size > LIMIT);
for (const f of oversize) problems.push(`OVER 95 MB: ${f.rel} (${mb(f.size)} MB)`);

/* ---- 4. Report ------------------------------------------------------------ */

keep.sort((a, b) => b.size - a.size);
drop.sort((a, b) => b.size - a.size);

const keepTotal = keep.reduce((a, b) => a + b.size, 0);
const dropTotal = drop.reduce((a, b) => a + b.size, 0);

console.log(`referenced by the build : ${referenced.size}`);
console.log(`recorded only (masters) : ${recordedOnly.size}`);
console.log(`\nPUBLISH  ${String(keep.length).padStart(3)} files  ${mb(keepTotal)} MB`);
console.log(`EXCLUDE  ${String(drop.length).padStart(3)} files  ${mb(dropTotal)} MB`);

console.log(`\n--- largest published files ---`);
for (const f of keep.slice(0, 6)) console.log(`  ${String(mb(f.size)).padStart(6)} MB  ${f.rel}`);
console.log(`  largest published file: ${mb(keep[0].size)} MB (limit 95 MB)`);

console.log(`\n--- excluded, by kind ---`);
for (const kind of ["withheld", "master", "orphan"]) {
  const set = drop.filter((d) => d.kind === kind);
  if (!set.length) continue;
  const t = set.reduce((a, b) => a + b.size, 0);
  console.log(`  ${kind.toUpperCase().padEnd(9)} ${String(set.length).padStart(3)} files  ${mb(t)} MB`);
  for (const d of set) console.log(`      ${String(kb(d.size)).padStart(7)} KB  ${d.rel}  — ${d.why}`);
}

if (problems.length) {
  console.log(`\n!!! ${problems.length} PROBLEM(S)`);
  for (const p of problems) console.log(`  ${p}`);
  process.exitCode = 1;
} else {
  console.log(`\nNo problems: every referenced asset publishes, no withheld frame is referenced.`);
}
