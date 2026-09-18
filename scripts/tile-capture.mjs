/**
 * Slice a full-page capture into viewport-sized tiles.
 *
 * A 390-wide capture of the homepage is thirty thousand pixels tall. Nothing
 * reviews that as one image — not a person, not a model — so this cuts it into
 * screens, top to bottom, numbered so a finding can say "tile 07" and mean a
 * place on the page.
 *
 * Usage: node scripts/tile-capture.mjs <capture.png> <out-dir> [tile-height=1200]
 *        node scripts/tile-capture.mjs design-review/stage4/390-home.png design-review/stage4/tiles/390-home
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [, , input, outDir, heightArg] = process.argv;
if (!input || !outDir) {
  console.error("usage: node scripts/tile-capture.mjs <capture.png> <out-dir> [tile-height]");
  process.exit(2);
}

const TILE = Number(heightArg ?? 1200);
const meta = await sharp(input).metadata();
await mkdir(outDir, { recursive: true });

const count = Math.ceil(meta.height / TILE);
for (let i = 0; i < count; i++) {
  const top = i * TILE;
  const height = Math.min(TILE, meta.height - top);
  await sharp(input)
    .extract({ left: 0, top, width: meta.width, height })
    .png()
    .toFile(path.join(outDir, `${String(i + 1).padStart(2, "0")}.png`));
}
console.log(`${path.basename(input)}: ${meta.width}x${meta.height} -> ${count} tiles of ${TILE}px in ${outDir}`);
