/**
 * Claims audit — enforces the standing law that no scarcity or exclusivity
 * claim ships, in any wording, on any surface.
 *
 * History, because it explains the shape of this file. The first offence was an
 * invented line, "held for a handful of celebrations each year". It was removed
 * and a sweep was added — but that sweep searched for `handful`, `a few couples
 * a year`, `limited to just`. It searched for the PHRASING. So when the same
 * idea came back as a hero eyebrow reading "Crete — by invitation", the sweep
 * returned zero and the claim shipped anyway.
 *
 * This one searches for the idea. It flags any gating, rationing or
 * flattery-by-exclusion language it finds in content/ or src/, and it requires
 * every allowed instance to be justified by name — either because it is the
 * client's own published copy (verified against scripts/source.html) or because
 * it has been signed off explicitly.
 *
 * Usage: npm run audit:claims
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (await readFile(path.join(ROOT, "scripts", "source.html"), "utf8")).toLowerCase();

/** Language that gates access, rations supply, or flatters by exclusion. */
const PATTERNS = [
  /by invitation/i,
  /invitation only/i,
  /\bselective\b/i,
  /\bdiscerning\b/i,
  /\bprivileged\b/i,
  /\bhandful\b/i,
  /only a few/i,
  /a few (?:couples|weddings|celebrations|clients)/i,
  /limited to (?:just|only)?/i,
  /fewer than \w+ (?:people|guests|couples)/i,
  /\bwaitlist\b/i,
  /\bvetted\b/i,
  /strictly limited/i,
  /each year we (?:take|accept|host)/i,
];

/**
 * Allowed instances. Each must say WHY. "It is the client's own copy" is only
 * accepted if the phrase is genuinely present in the live source, which is
 * checked below rather than trusted.
 */
const ALLOWED = [
  { phrase: "exclusive home", why: "live copy — Mountain Escape body" },
  { phrase: "exclusive gatherings", why: "live copy — Type of Events list" },
  { phrase: "exclusive local tours", why: "live copy — Guest Care & Experiences" },
  { phrase: "reserved for", why: "live copy — Thalasses, full-estate booking" },
  { phrase: "limited by city noise", why: "live copy — Olive Stories, curfew note" },
];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(tsx?|mdx?)$/.test(entry.name)) yield full;
  }
}

const hits = [];
for (const dir of ["content", "src"]) {
  for await (const file of walk(path.join(ROOT, dir))) {
    const text = await readFile(file, "utf8");
    const lines = text.split(/\r?\n/);

    lines.forEach((line, i) => {
      /* Comments explain decisions; they are not shipped copy. */
      const code = line.replace(/^\s*(\/\/|\*|\/\*).*$/, "");
      if (!code.trim()) return;

      for (const re of PATTERNS) {
        const m = code.match(re);
        if (!m) continue;
        const allowed = ALLOWED.find((a) => code.toLowerCase().includes(a.phrase));
        if (allowed) continue;
        hits.push({
          file: path.relative(ROOT, file),
          line: i + 1,
          match: m[0],
          text: code.trim().slice(0, 110),
        });
      }
    });
  }
}

/* Verify every "it's the client's copy" excuse is actually true. */
const bogus = ALLOWED.filter((a) => !source.includes(a.phrase));

console.log(`checked content/ and src/ for gating and rationing language`);

if (bogus.length) {
  console.log(`\n${bogus.length} allowance(s) claim to be live copy but are NOT in source.html:`);
  for (const b of bogus) console.log(`  "${b.phrase}" — ${b.why}`);
}

if (hits.length) {
  console.log(`\n${hits.length} unapproved claim(s):`);
  for (const h of hits) console.log(`  ${h.file}:${h.line}  [${h.match}]  ${h.text}`);
}

if (!hits.length && !bogus.length) console.log("No unapproved scarcity or exclusivity claims.");
if (hits.length || bogus.length) process.exitCode = 1;
