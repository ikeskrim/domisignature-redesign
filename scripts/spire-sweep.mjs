/**
 * Origin sweep for spire2.png — the frame withdrawn in Phase 6 §4 for reading
 * as AI-generated rather than photographed.
 *
 * It shipped twice under two names (spire2.png and thspire2.png, byte
 * identical), which is exactly why a name-based search is not good enough. This
 * looks for the BYTES, and then for the picture inside container formats where
 * the bytes would have been re-encoded and so cannot match.
 *
 * Three passes:
 *   1. Exact — SHA-256 of every file in the repo, excluding node_modules.
 *   2. Embedded — the raw PNG stream searched for verbatim inside every served
 *      binary (PDF, video), which catches an image dropped in without recompression.
 *   3. Perceptual — a 16x16 average hash of every raster in /public compared
 *      against the target, which catches a resized, recropped or requantised
 *      copy that no byte comparison can see. Also enumerates the image XObjects
 *      inside the Wedding Brochure PDF and flags any whose aspect ratio matches.
 *
 * Read-only. It never edits the PDF or anything else.
 *
 * Usage: npm run sweep:spire
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = path.join(ROOT, "public", "media", "spire2.png");

const targetBytes = await readFile(TARGET);
const targetHash = createHash("sha256").update(targetBytes).digest("hex");
const targetMeta = await sharp(TARGET).metadata();

/** 16x16 greyscale average hash — tolerant of scale, crop-free re-encodes. */
async function aHash(input) {
  const buf = await sharp(input)
    .greyscale()
    .resize(16, 16, { fit: "fill" })
    .raw()
    .toBuffer();
  const mean = buf.reduce((a, b) => a + b, 0) / buf.length;
  let bits = "";
  for (const px of buf) bits += px > mean ? "1" : "0";
  return bits;
}

const distance = (a, b) => {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
};

const targetAHash = await aHash(TARGET);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") continue;
    if (entry.name.startsWith(".next-")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const exact = [];
const embedded = [];
const perceptual = [];

/* A distinctive slice from deep inside the PNG's compressed data. Taken well
   past the header so it cannot match another PNG by coincidence. */
const needle = targetBytes.subarray(2000, 2064);

for await (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const info = await stat(file);
  if (info.size === 0) continue;

  const bytes = await readFile(file);
  const hash = createHash("sha256").update(bytes).digest("hex");

  if (hash === targetHash) {
    exact.push(rel);
    continue;
  }

  /* Pass 2 — look for the PNG verbatim inside containers. */
  if (/\.(pdf|mp4|webm|mov|zip)$/i.test(file) && bytes.includes(needle)) {
    embedded.push(rel);
  }

  /* Pass 3 — perceptual, rasters only. */
  if (/\.(png|jpe?g|webp|avif)$/i.test(file)) {
    try {
      const d = distance(targetAHash, await aHash(file));
      if (d <= 24) perceptual.push({ rel, distance: d });
    } catch {
      /* unreadable as an image — nothing to compare */
    }
  }
}

/* PDF image inventory — dimensions of every embedded raster, no extraction. */
const pdfPath = path.join(ROOT, "public", "assets", "files", "Weddingbrochure.pdf");
const pdfImages = [];
try {
  const pdf = await readFile(pdfPath);
  const text = pdf.toString("latin1");
  const re = /\/Subtype\s*\/Image[\s\S]{0,400}?/g;
  for (const m of text.matchAll(re)) {
    const seg = text.slice(Math.max(0, m.index - 400), m.index + 400);
    const w = seg.match(/\/Width\s+(\d+)/);
    const h = seg.match(/\/Height\s+(\d+)/);
    const f = seg.match(/\/Filter\s*\/(\w+)/);
    if (w && h) {
      pdfImages.push({ w: +w[1], h: +h[1], filter: f?.[1] ?? "?" });
    }
  }
} catch {
  pdfImages.push({ error: true });
}

/*
 * Pass 4 — actually compare the brochure's pictures.
 *
 * Aspect ratio on its own is close to worthless here: 3:2 is the standard
 * camera ratio, so most real photographs "match" and the signal is nearly all
 * false positives. Every image in this PDF is DCTDecode, which means the stream
 * IS a complete JPEG, so they can be pulled out by scanning for SOI/EOI markers
 * and hashed like any other file. That turns a guess into an answer.
 */
const pdfJpegs = [];
try {
  const pdf = await readFile(pdfPath);
  let i = 0;
  while (i < pdf.length - 3) {
    if (pdf[i] === 0xff && pdf[i + 1] === 0xd8 && pdf[i + 2] === 0xff) {
      /* Walk to the matching end-of-image marker. */
      let j = i + 2;
      while (j < pdf.length - 1 && !(pdf[j] === 0xff && pdf[j + 1] === 0xd9)) j++;
      if (j < pdf.length - 1) {
        const slice = pdf.subarray(i, j + 2);
        if (slice.length > 2048) {
          try {
            const meta = await sharp(slice).metadata();
            pdfJpegs.push({
              dims: `${meta.width}x${meta.height}`,
              distance: distance(targetAHash, await aHash(slice)),
            });
          } catch {
            /* not decodable standalone — skip */
          }
        }
        i = j + 2;
        continue;
      }
    }
    i++;
  }
} catch {
  /* handled by the inventory block above */
}

const targetAspect = targetMeta.width / targetMeta.height;

console.log(`target        public/media/spire2.png  ${targetMeta.width}x${targetMeta.height}`);
console.log(`sha256        ${targetHash}`);
console.log(`\n--- 1. exact byte matches (${exact.length}) ---`);
for (const f of exact) console.log(`  ${f}`);

console.log(`\n--- 2. PNG stream found verbatim inside a container (${embedded.length}) ---`);
if (!embedded.length) console.log("  none");
for (const f of embedded) console.log(`  ${f}`);

const near = perceptual.filter((p) => !exact.includes(p.rel)).sort((a, b) => a.distance - b.distance);
console.log(`\n--- 3. perceptually similar rasters, hamming <= 24 of 256 (${near.length}) ---`);
if (!near.length) console.log("  none");
for (const p of near.slice(0, 12)) console.log(`  d=${String(p.distance).padStart(3)}  ${p.rel}`);

console.log(`\n--- 4. Wedding Brochure PDF — pictures extracted and compared (${pdfJpegs.length}) ---`);
if (!pdfJpegs.length) {
  console.log("  no decodable images extracted");
} else {
  const sorted = [...pdfJpegs].sort((a, b) => a.distance - b.distance);
  const hits = sorted.filter((p) => p.distance <= 24);
  console.log(`  closest match d=${sorted[0].distance} of 256 (${sorted[0].dims})`);
  console.log(
    hits.length
      ? `  ${hits.length} image(s) within threshold — INSPECT`
      : `  none within threshold — spire2.png is not in the brochure`,
  );
}

console.log(`\n--- aspect-ratio inventory (weak signal, kept for completeness) ---`);
if (pdfImages[0]?.error) {
  console.log("  could not read the PDF");
} else if (!pdfImages.length) {
  console.log("  no image XObjects found");
} else {
  const uniq = new Map();
  for (const im of pdfImages) {
    const k = `${im.w}x${im.h}/${im.filter}`;
    uniq.set(k, (uniq.get(k) ?? 0) + 1);
  }
  for (const [k, n] of uniq) {
    const [dims] = k.split("/");
    const [w, h] = dims.split("x").map(Number);
    const aspectMatch = Math.abs(w / h - targetAspect) < 0.02;
    console.log(`  ${k.padEnd(24)} x${n}${aspectMatch ? "   <-- ASPECT MATCHES spire2.png" : ""}`);
  }
}
