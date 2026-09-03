/**
 * Media audit — validates every image path the content layer asserts.
 *
 * Written in Phase 6 §4 after finding that the "Under the shade sail" gallery
 * listed `dinner-celebration-1.mp4` and `jdIMG_8749.MOV` among its photographs,
 * so `next/image` was being handed video files. Nothing caught it: the content
 * audit counted gallery entries without asking what they pointed at.
 *
 * Checks, per gallery:
 *   - every entry resolves to a file that exists in /public
 *   - every entry is a still image, not a video or a poster frame
 *   - no entry appears twice in the same gallery
 *   - the coverImage is the gallery's first frame
 *   - no removed frame has crept back in
 *   - flags PNGs with no EXIF/ICC, the signature of non-camera origin
 *
 * Usage: npm run audit:media
 */

import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");

const STILL = /\.(jpe?g|png|webp|avif)$/i;

/**
 * Frames withdrawn from display in Phase 6 §4. The files remain in /public/media
 * so any of these is one line away from returning, but none may ship without a
 * fresh decision. Rationale for each is in design-review/imagery-report.md.
 */
const WITHDRAWN = new Set([
  "/media/stHARLEY.jpg",
  "/media/blDSC_9849.jpg",
  "/media/olLK_LD_072.jpg",
  "/media/ae9Z8A4481-Edit.jpg",
  "/media/aeIMG_2133.jpg",
  "/media/thspire2.png",
  "/media/spire2.png",
]);

const problems = [];
let galleries = 0;
let frames = 0;
/** slug -> displayed frame count, used to check the contact sheets are current. */
const galleryCounts = new Map();

for (const [file, nameKey] of [
  ["content/events.ts", "title"],
  ["content/venues.ts", "name"],
]) {
  const ts = await readFile(path.join(ROOT, file), "utf8");
  const re = new RegExp(
    `slug: "([^"]+)",[\\s\\S]*?${nameKey}: "([^"]+)",[\\s\\S]*?coverImage: "([^"]+)",\\s*\\n\\s*gallery: \\[([\\s\\S]*?)\\n    \\],`,
    "g",
  );

  for (const m of ts.matchAll(re)) {
    const [, slug, name, cover, body] = m;
    const images = [...body.matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    galleries++;
    frames += images.length;
    galleryCounts.set(slug, images.length);

    const fail = (msg) => problems.push(`${name}: ${msg}`);

    if (images[0] !== cover) fail(`coverImage ${cover} is not the first frame (${images[0]} is)`);
    if (WITHDRAWN.has(cover)) fail(`coverImage ${cover} is on the withdrawn list`);

    const seen = new Set();
    for (const src of images) {
      if (seen.has(src)) fail(`${src} appears twice`);
      seen.add(src);

      if (WITHDRAWN.has(src)) fail(`${src} is on the withdrawn list but is still displayed`);
      if (!STILL.test(src)) fail(`${src} is not a still image — galleries render through next/image`);
      if (src.includes("/video/")) fail(`${src} is a video asset sitting in a photo gallery`);

      const abs = path.join(PUBLIC, src.replace(/^\//, ""));
      try {
        await access(abs);
      } catch {
        fail(`${src} does not exist on disk`);
        continue;
      }

      if (/\.png$/i.test(src)) {
        const meta = await sharp(abs).metadata();
        if (!meta.exif && !meta.icc) {
          fail(
            `${src} is a PNG with no EXIF and no ICC profile — verify it is a photograph before shipping it`,
          );
        }
      }
    }
  }
}

/*
 * Galleries are not the only place a frame can appear. `stHARLEY.jpg` survived
 * its own withdrawal because it was also the CTA image on the events index —
 * hard-coded in a component, invisible to any check that only reads content/.
 * So sweep every source file for /media/ references too.
 */
const SRC = path.join(ROOT, "src");
async function* walk(dir) {
  const { readdir } = await import("node:fs/promises");
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(tsx?|mjs)$/.test(entry.name)) yield full;
  }
}

let refs = 0;
for await (const file of walk(SRC)) {
  const code = await readFile(file, "utf8");
  for (const m of code.matchAll(/"(\/media\/[^"]+)"/g)) {
    const src = m[1];
    refs++;
    const rel = path.relative(ROOT, file);
    if (WITHDRAWN.has(src)) problems.push(`${rel}: references withdrawn frame ${src}`);
    try {
      await access(path.join(PUBLIC, src.replace(/^\//, "")));
    } catch {
      problems.push(`${rel}: ${src} does not exist on disk`);
    }
  }
}

/*
 * Video posters are raw `<video poster>` attributes, so they never pass through
 * next/image and nothing optimises them. That is how a 2,967 KB PNG shipped as
 * the poster on /events — three quarters of the page's entire weight, invisible
 * to every check here because it was not a gallery frame. Anything served
 * unoptimised now has a ceiling.
 */
const POSTER_LIMIT_KB = 400;
const posters = new Set();
for (const f of ["content/events.ts", "content/venues.ts"]) {
  const ts = await readFile(path.join(ROOT, f), "utf8");
  for (const m of ts.matchAll(/poster: "([^"]+)"/g)) posters.add(m[1]);
}

const { stat } = await import("node:fs/promises");
for (const p of posters) {
  const abs = path.join(PUBLIC, p.replace(/^\//, ""));
  try {
    const kb = Math.round((await stat(abs)).size / 1024);
    if (kb > POSTER_LIMIT_KB) {
      problems.push(
        `${p} is a ${kb} KB video poster — served raw, never optimised (limit ${POSTER_LIMIT_KB} KB)`,
      );
    }
  } catch {
    problems.push(`${p} is referenced as a video poster but does not exist on disk`);
  }
}

/*
 * Contact sheets are COMPOSITES of gallery frames, and they are published.
 * Excluding a withheld photograph from the repository does nothing if its
 * pixels are already baked into a montage that ships — and that is exactly what
 * happened: a stale sheet still carried the chalkboard with a couple's names,
 * and another carried the image withdrawn for reading as AI-generated.
 *
 * There is no cheap way to prove a PNG does not contain a given photograph, but
 * staleness is a reliable proxy: a sheet regenerated from the current galleries
 * cannot contain a frame those galleries no longer list. So this checks the
 * generated index against the live content and fails when they disagree.
 */
try {
  const sheetIndex = JSON.parse(
    await readFile(path.join(ROOT, "design-review", "contact-sheets", "index.json"), "utf8"),
  );
  const bySlug = new Map(sheetIndex.map((s) => [s.slug, s.count]));

  for (const [slug, count] of galleryCounts) {
    if (!bySlug.has(slug)) {
      problems.push(
        `contact sheet missing for "${slug}" — sheets are stale, run npm run contact-sheets`,
      );
    } else if (bySlug.get(slug) !== count) {
      problems.push(
        `contact sheet for "${slug}" shows ${bySlug.get(slug)} frames but the gallery has ${count} — it may still contain withdrawn frames; run npm run contact-sheets`,
      );
    }
  }
  for (const slug of bySlug.keys()) {
    if (!galleryCounts.has(slug)) {
      problems.push(`contact sheet "${slug}" is for a gallery that no longer exists`);
    }
  }
} catch {
  problems.push("design-review/contact-sheets/index.json is missing or unreadable");
}

console.log(
  `${galleries} galleries, ${frames} frames, ${refs} component references, ${posters.size} video posters, ${galleryCounts.size} contact sheets checked.`,
);
if (problems.length === 0) {
  console.log("No problems found.");
} else {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  ${p}`);
  process.exitCode = 1;
}
