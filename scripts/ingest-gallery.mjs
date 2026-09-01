/**
 * Gallery ingest — turn a folder of photographs into everything the site needs,
 * except the two things a person has to supply.
 *
 *   npm run ingest:gallery -- <folder> --slug <slug> [--prefix <px>] [--force]
 *
 * What it does:
 *   1. Web derivatives. Every frame resized to fit 2560px on the long edge and
 *      re-encoded as progressive JPEG at q82, written to public/media/ under a
 *      numbered prefix. Originals are never modified and never copied in — the
 *      raw masters stay out of the repository, as they always have.
 *   2. ALL metadata stripped. Wedding photographs carry EXIF, and EXIF carries
 *      GPS. Publishing the coordinates of a private client's venue because it
 *      rode along inside a JPEG is a privacy failure the audits cannot see.
 *      sharp drops it unless asked to keep it; this never asks.
 *   3. A numbered contact sheet, so the gallery can be titled by looking at it.
 *   4. A content stub with TODO markers for the title and for every frame's alt
 *      text.
 *
 * What it deliberately does NOT do: write a title or a word of alt text. Both
 * require eyes on the photograph — the standing rule for this project — and a
 * plausible sentence generated from a filename is exactly the invented content
 * the rules forbid. The tool prepares the judgement; it never makes it.
 *
 * The stub lands in design-review/ingest/, not in content/, so ingesting cannot
 * break a build. The moment its TODO markers are pasted into content/, the QA
 * gate fails until they are filled in — see scripts/ingest-guard.mjs. That is
 * the "refuses to publish" half, and it is enforced by CI rather than by
 * remembering.
 */

import sharp from "sharp";
import { mkdir, readdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA = path.join(ROOT, "public", "media");
const OUT = path.join(ROOT, "design-review", "ingest");

const MAX_EDGE = 2560;
const QUALITY = 82;
const CELL = 300;
const COLS = 5;
const PAD = 6;
const LABEL_H = 22;
const EXT = /\.(jpe?g|png|tiff?|webp)$/i;

/* ---------- arguments ---------- */
const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? null : argv[i + 1];
};
/* The folder is the first bare argument — anything not a flag and not the value
   of one. Walking the list once is clearer than pattern-matching positions. */
let folder = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) {
    i++; // skip this flag's value
    continue;
  }
  folder = argv[i];
  break;
}
const slug = flag("slug");
const force = argv.includes("--force");

if (!folder || !slug) {
  console.log(`
  npm run ingest:gallery -- <folder> --slug <slug> [--prefix <px>] [--force]

    <folder>   a directory of original photographs
    --slug     the gallery's URL slug, e.g. olive-stories
    --prefix   filename prefix in public/media (default: first two letters of slug)
    --force    overwrite derivatives that already exist
`);
  process.exit(1);
}

const prefix = flag("prefix") ?? slug.replace(/[^a-z]/g, "").slice(0, 2);

/* ---------- read the folder ---------- */
let entries;
try {
  entries = (await readdir(folder)).filter((f) => EXT.test(f)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
} catch {
  console.error(`  cannot read ${folder}`);
  process.exit(1);
}
if (!entries.length) {
  console.error(`  no photographs in ${folder} (looked for jpg, png, tif, webp)`);
  process.exit(1);
}

await mkdir(MEDIA, { recursive: true });
await mkdir(OUT, { recursive: true });

console.log(`\ningesting ${entries.length} frames from ${folder}\n`);

/* ---------- 1. derivatives ---------- */
const made = [];
for (const [i, name] of entries.entries()) {
  const n = String(i + 1).padStart(2, "0");
  const outName = `${prefix}${n}.jpg`;
  const outPath = path.join(MEDIA, outName);

  if (!force) {
    try {
      await stat(outPath);
      console.error(`  ${outName} already exists — pass --force to overwrite, or pick another --prefix`);
      process.exit(1);
    } catch {
      /* good: nothing there */
    }
  }

  const src = path.join(folder, name);
  const meta = await sharp(src).metadata();
  await sharp(src)
    .rotate() // honour EXIF orientation before the metadata is dropped
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
    .toFile(outPath);

  const after = await stat(outPath);
  made.push({ n, outName, from: name, w: meta.width, h: meta.height, kb: Math.round(after.size / 1024) });
  console.log(
    `  ${n}  ${name.slice(0, 34).padEnd(34)} ${String(meta.width)}x${meta.height} -> ${outName}  ${Math.round(after.size / 1024)} KB`,
  );
}

/* ---------- 2. contact sheet ---------- */
const rows = Math.ceil(made.length / COLS);
const sheetW = COLS * (CELL + PAD) + PAD;
const sheetH = rows * (CELL + LABEL_H + PAD) + PAD;

const tiles = [];
for (const [i, f] of made.entries()) {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const buf = await sharp(path.join(MEDIA, f.outName))
    .resize(CELL, CELL, { fit: "cover" })
    .jpeg({ quality: 70 })
    .toBuffer();
  tiles.push({ input: buf, left: PAD + col * (CELL + PAD), top: PAD + row * (CELL + LABEL_H + PAD) });

  const label = Buffer.from(
    `<svg width="${CELL}" height="${LABEL_H}" xmlns="http://www.w3.org/2000/svg">
       <rect width="100%" height="100%" fill="#0b0b0c"/>
       <text x="4" y="15" font-family="monospace" font-size="13" fill="#e8e4de">${f.n}  ${f.outName}</text>
     </svg>`,
  );
  tiles.push({
    input: label,
    left: PAD + col * (CELL + PAD),
    top: PAD + row * (CELL + LABEL_H + PAD) + CELL,
  });
}

const sheetPath = path.join(OUT, `${slug}-contact.jpg`);
await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: "#0b0b0c" } })
  .composite(tiles)
  .jpeg({ quality: 80 })
  .toFile(sheetPath);

/* ---------- 3. content stub ---------- */
const stub = `/*
 * INGEST STUB — ${slug}
 *
 * Generated by \`npm run ingest:gallery\`. Nothing here is live yet.
 *
 * HOW TO FINISH IT
 *   1. Open design-review/ingest/${slug}-contact.jpg and look at the frames.
 *   2. Replace every TODO below with what you can SEE in that photograph.
 *      Not what the filename says, not what it probably is — what is in it.
 *   3. Paste the finished block into content/venues.ts or content/events.ts.
 *
 * The QA gate fails while any TODO( marker remains anywhere in content/, so
 * this cannot reach the site half-filled. That is on purpose.
 */

// title of the gallery — written by looking at the contact sheet
title: "TODO(title) — name this gallery from the photographs",

gallery: [
${made.map((f) => `  "/media/${f.outName}",`).join("\n")}
],

/*
 * Alt text, one line per frame, numbered to match the contact sheet.
 *
 * Galleries currently take a single shared description, so these are not wired
 * to anything yet — they are written now, while someone is looking at the
 * pictures, so they exist when per-frame alt lands. Describe the frame to
 * someone who cannot see it: subject, setting, light.
 *
${made.map((f) => ` * TODO(alt) ${f.n}  ${f.outName}`).join("\n")}
 */
`;

const stubPath = path.join(OUT, `${slug}.stub.ts`);
await writeFile(stubPath, stub, "utf8");

/* ---------- done ---------- */
const totalKb = made.reduce((a, f) => a + f.kb, 0);
console.log(`\n  ${made.length} frames, ${(totalKb / 1024).toFixed(1)} MB, all metadata stripped`);
console.log(`\n  contact sheet -> ${path.relative(ROOT, sheetPath)}`);
console.log(`  stub          -> ${path.relative(ROOT, stubPath)}`);
console.log(`\n  Next: look at the sheet, fill in every TODO, paste into content/.`);
console.log(`  \`npm run qa\` will refuse to pass while a TODO( remains in content/.\n`);
