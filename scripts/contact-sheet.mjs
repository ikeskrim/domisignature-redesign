/**
 * Contact sheets — one montage per gallery, so every frame can actually be
 * looked at before it is titled or re-sequenced.
 *
 * Titling ~107 photographs means seeing ~107 photographs. Viewing them one at a
 * time is not feasible, and titling from filenames is exactly the invented
 * content the standing laws forbid. This composites each gallery into a single
 * numbered sheet instead: every frame present, in order, at a size where the
 * subject is unambiguous.
 *
 * Usage: node scripts/contact-sheet.mjs            (all galleries + venues)
 *        node scripts/contact-sheet.mjs party-dance
 */

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "design-review", "contact-sheets");
const PUBLIC = path.join(ROOT, "public");

const ONLY = process.argv[2] ?? null;

const CELL = 300; // px per frame — big enough to read the subject
const COLS = 5;
const PAD = 6;
const LABEL_H = 22;

/** Pull the gallery arrays straight out of the content files as text. */
async function readGalleries() {
  const { readFile } = await import("node:fs/promises");
  const events = await readFile(path.join(ROOT, "content", "events.ts"), "utf8");
  const venues = await readFile(path.join(ROOT, "content", "venues.ts"), "utf8");

  const out = [];
  for (const [ts, kind] of [
    [events, "event"],
    [venues, "venue"],
  ]) {
    const re = /slug: "([^"]+)"([\s\S]*?)(?=\n  \{\n    (?:\/\/ [^\n]*\n    )?slug: "|\n\];)/g;
    for (const m of ts.matchAll(re)) {
      const slug = m[1];
      const block = m[2];
      const galleryMatch = block.match(/gallery: \[([\s\S]*?)\]/);
      if (!galleryMatch) continue;
      const images = [...galleryMatch[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
      out.push({ slug, kind, images });
    }
  }
  return out;
}

/** A small numbered caption strip under each frame. */
function labelSvg(text, width) {
  return Buffer.from(
    `<svg width="${width}" height="${LABEL_H}">
       <rect width="100%" height="100%" fill="#131316"/>
       <text x="6" y="15" font-family="monospace" font-size="12" fill="#c9c3b6">${text}</text>
     </svg>`,
  );
}

async function sheet({ slug, kind, images }) {
  const rows = Math.ceil(images.length / COLS);
  const cellH = CELL + LABEL_H;
  const width = COLS * (CELL + PAD) + PAD;
  const height = rows * (cellH + PAD) + PAD + 34;

  const composites = [];

  // Sheet title
  composites.push({
    input: Buffer.from(
      `<svg width="${width}" height="34">
         <rect width="100%" height="100%" fill="#0a0a0b"/>
         <text x="8" y="23" font-family="monospace" font-size="16" fill="#f3efe7">${kind}: ${slug} — ${images.length} frames</text>
       </svg>`,
    ),
    left: 0,
    top: 0,
  });

  for (let i = 0; i < images.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const left = PAD + col * (CELL + PAD);
    const top = 34 + PAD + row * (cellH + PAD);

    const file = path.join(PUBLIC, decodeURIComponent(images[i]));
    try {
      const buf = await sharp(file)
        .resize(CELL, CELL, { fit: "cover", position: "attention" })
        .toBuffer();
      composites.push({ input: buf, left, top });
    } catch {
      composites.push({
        input: Buffer.from(
          `<svg width="${CELL}" height="${CELL}"><rect width="100%" height="100%" fill="#2b2b30"/></svg>`,
        ),
        left,
        top,
      });
    }

    composites.push({
      input: labelSvg(`${String(i + 1).padStart(2, "0")} ${path.basename(images[i]).slice(0, 26)}`, CELL),
      left,
      top: top + CELL,
    });
  }

  const file = path.join(OUT, `${kind}-${slug}.png`);
  await sharp({ create: { width, height, channels: 3, background: { r: 10, g: 10, b: 11 } } })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(file);

  console.log(`  ${kind}-${slug}.png  (${images.length} frames)`);
  return { slug, kind, count: images.length, file };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const galleries = await readGalleries();
  const wanted = ONLY ? galleries.filter((g) => g.slug === ONLY) : galleries;

  const made = [];
  for (const g of wanted) made.push(await sheet(g));

  await writeFile(
    path.join(OUT, "index.json"),
    JSON.stringify(made.map(({ slug, kind, count }) => ({ slug, kind, count })), null, 2),
    "utf8",
  );

  const total = made.reduce((n, m) => n + m.count, 0);
  console.log(`\n${made.length} sheets, ${total} frames -> design-review/contact-sheets/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
