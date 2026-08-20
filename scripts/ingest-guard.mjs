/**
 * The half of the ingest tool that says no.
 *
 * `ingest-gallery.mjs` writes a stub full of TODO markers because a title and a
 * line of alt text require someone to look at the photograph — the tool
 * prepares that judgement and must never fake it. This is what stops a
 * half-finished stub reaching the site: the moment a TODO( marker appears
 * anywhere under content/, the QA gate fails, and so does CI.
 *
 * It is deliberately blunt. It does not try to decide which TODOs are
 * acceptable, because none are: an unfilled title ships a placeholder as a
 * gallery name, and unfilled alt text ships silence to someone using a screen
 * reader.
 *
 * Usage: npm run audit:ingest
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");

const MARKER = /TODO\(([a-z]+)\)/g;

const files = (await readdir(CONTENT)).filter((f) => f.endsWith(".ts"));
const found = [];

for (const file of files) {
  const text = await readFile(path.join(CONTENT, file), "utf8");
  text.split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(MARKER)) {
      found.push({ file, line: i + 1, kind: m[1], text: line.trim().slice(0, 96) });
    }
  });
}

if (found.length === 0) {
  console.log(`no unfilled ingest markers in content/ (${files.length} files checked)`);
} else {
  console.log(`${found.length} unfilled ingest marker(s) — a gallery is half-published:\n`);
  for (const f of found) console.log(`  content/${f.file}:${f.line}  TODO(${f.kind})  ${f.text}`);
  console.log(`
Every one of these needs a person and the contact sheet in design-review/ingest/.
Describe what is in the photograph — not what the filename suggests.`);
  process.exitCode = 1;
}
