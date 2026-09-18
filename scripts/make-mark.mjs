/**
 * The supplied logo (assets/img/logo.png) pairs the teal ring mark with a very
 * pale mint wordmark — it only works on dark backgrounds, and is invisible on
 * the warm bone canvas.
 *
 * This crops the ring mark out on its own so the header and footer can set the
 * wordmark in type and keep the mark at any size on any surface. The original
 * logo.png is left untouched.
 */

import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public", "assets", "img", "logo.png");
const OUT = path.join(ROOT, "public", "assets", "img", "mark.png");

// The ring occupies roughly the top-centre of the 2641x1509 source.
await sharp(SRC)
  .extract({ left: 770, top: 0, width: 1120, height: 1100 })
  .trim({ threshold: 1 })
  .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`mark.png written: ${meta.width}x${meta.height}`);

/*
 * Cretan Noir keeps exactly one accent — gold. The supplied mark is teal, which
 * on the dark ground reads as a second, competing accent. This writes a
 * monochrome bone version by keeping the mark's alpha channel and filling the
 * colour channels with the palette's text tone.
 */
const BONE = { r: 0xf3, g: 0xef, b: 0xe7 };
const MONO = path.join(ROOT, "public", "assets", "img", "mark-bone.png");

const alpha = await sharp(OUT).ensureAlpha().extractChannel("alpha").toBuffer();

await sharp({
  create: { width: 512, height: 512, channels: 3, background: BONE },
})
  .joinChannel(alpha)
  .png()
  .toFile(MONO);

console.log("mark-bone.png written: 512x512");

/*
 * Aegean Bone. The same ring on the light ground, filled with the light
 * ladder's primary. A bone mark on ivory would vanish; a teal one would be a
 * second accent; gold at 2.52:1 is permitted for the mark but reads faint. The
 * near-black is what the header and footer set the wordmark in, so the mark and
 * the name are one colour, as on paper. Same alpha, same crop - only the fill
 * changes, exactly as mark-bone.png was made.
 */
const INK = { r: 0x27, g: 0x21, b: 0x1b };
const INK_OUT = path.join(ROOT, "public", "assets", "img", "mark-ink.png");

await sharp({
  create: { width: 512, height: 512, channels: 3, background: INK },
})
  .joinChannel(alpha)
  .png()
  .toFile(INK_OUT);

console.log("mark-ink.png written: 512x512");
