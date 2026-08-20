/**
 * Builds the looping hero background clip from the existing drone footage.
 *
 * The two dusk aerials over the seaside pool party are the most cinematic
 * footage on the site, but they are only 11.3 s and 7.7 s long — too short to
 * loop on their own. This joins them with a cross-fade, then fades in from and
 * out to black so the loop seam reads as a deliberate cut rather than a jump.
 *
 * Audio is stripped: the hero is muted by definition, so shipping a soundtrack
 * would be dead weight.
 *
 * Usage: npm run media:hero
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA = path.join(ROOT, "public", "media");
const OUT = path.join(MEDIA, "video");

/** [file, trim start, trim end] — both are the same scene, minutes apart. */
const SEGMENTS = [
  ["paDJI_2282.mp4", 0.5, 11.0],
  ["paDJI_2288.MP4", 0.3, 7.5],
];

/**
 * The right fifth of these aerials is a car park. Both source clips are
 * 1920×1080 and carry, at the right edge, a red car, a liveried white van,
 * beachgoers on the shore behind, and the tip of a thatched parasol. On the
 * first screen a visitor sees, a parked delivery van is not set dressing.
 *
 * So the frame is recomposed, not repaired: a hard crop that simply excludes
 * that side of the scene. Nothing is retouched out — every pixel that ships is
 * a real pixel from the footage, which is the only honest way to fix this.
 *
 * 1390×782 (16:9) from x=0, y=180. Chosen by cropping and inspecting EVERY
 * second of both segments rather than one frame: the drone drifts, and a crop
 * that is clean at 1.3s let the parasol back into the corner at 10.1s. This one
 * is clean across the whole loop. 1390 is also every horizontal pixel available
 * after the crop, so the poster is written at native size — upscaling it back
 * to 1920 would only invent detail.
 */
const CROP = "crop=1390:782:0:180";
const POSTER_WIDTH = 1390;

const XFADE = 1.2;
const FADE = 0.8;
const WIDTH = 1280;
const BUDGET_MB = 8;

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);

async function ffmpeg(args) {
  await run(ffmpegPath, args, { maxBuffer: 1024 * 1024 * 64 });
}

/** Builds the trim/scale/xfade/fade graph and returns [filter, totalDuration]. */
function buildFilter() {
  const lengths = SEGMENTS.map(([, from, to]) => to - from);
  const parts = SEGMENTS.map(
    ([, from, to], i) =>
      `[${i}:v]trim=start=${from}:end=${to},setpts=PTS-STARTPTS,` +
      `${CROP},scale=${WIDTH}:-2:flags=lanczos,fps=30[s${i}]`,
  );

  // Chain the segments together with cross-fades.
  let label = "s0";
  let elapsed = lengths[0];
  for (let i = 1; i < SEGMENTS.length; i++) {
    const offset = (elapsed - XFADE).toFixed(3);
    parts.push(`[${label}][s${i}]xfade=transition=fade:duration=${XFADE}:offset=${offset}[x${i}]`);
    label = `x${i}`;
    elapsed = elapsed + lengths[i] - XFADE;
  }

  const fadeOutStart = (elapsed - FADE).toFixed(3);
  parts.push(`[${label}]fade=t=in:st=0:d=${FADE},fade=t=out:st=${fadeOutStart}:d=${FADE}[v]`);

  return [parts.join(";"), elapsed];
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const [filter, duration] = buildFilter();
  const inputs = SEGMENTS.flatMap(([file]) => ["-i", path.join(MEDIA, file)]);

  const mp4 = path.join(OUT, "hero.mp4");
  const webm = path.join(OUT, "hero.webm");
  const poster = path.join(OUT, "hero.jpg");

  console.log(`hero loop: ${duration.toFixed(1)}s from ${SEGMENTS.length} segments\n`);

  console.log("encoding hero.mp4 ...");
  await ffmpeg([
    "-y", ...inputs,
    "-filter_complex", filter, "-map", "[v]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "24",
    "-maxrate", "3000k", "-bufsize", "6000k",
    "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-an", "-movflags", "+faststart",
    mp4,
  ]);

  console.log("encoding hero.webm ...");
  await ffmpeg([
    "-y", ...inputs,
    "-filter_complex", filter, "-map", "[v]",
    "-c:v", "libvpx-vp9", "-crf", "33", "-b:v", "2600k", "-row-mt", "1",
    "-an",
    webm,
  ]);

  /*
   * The poster is the LCP element. It is pulled from the SOURCE at full
   * resolution (not from the encoded loop) so it stays crisp, and it matches
   * the first visible frame after the fade-in.
   */
  console.log("extracting poster ...");
  await ffmpeg([
    "-y", "-ss", String(SEGMENTS[0][1] + FADE), "-i", path.join(MEDIA, SEGMENTS[0][0]),
    "-vframes", "1", "-vf", `${CROP},scale=${POSTER_WIDTH}:-2:flags=lanczos`, "-q:v", "3",
    poster,
  ]);

  const sizes = await Promise.all(
    [mp4, webm, poster].map(async (f) => [path.basename(f), (await stat(f)).size]),
  );
  for (const [name, size] of sizes) console.log(`  ${name.padEnd(12)} ${mb(size).padStart(6)} MB`);

  const heaviest = Math.max(sizes[0][1], sizes[1][1]);
  if (heaviest > BUDGET_MB * 1024 * 1024) {
    console.error(`\nOVER BUDGET: ${mb(heaviest)} MB > ${BUDGET_MB} MB`);
    process.exitCode = 1;
  } else {
    console.log(`\nwithin the ${BUDGET_MB} MB budget.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
