/**
 * Transcodes the seven source videos into web-ready MP4 + WebM with poster frames.
 *
 * The three .MOV files are QuickTime containers that Chrome and Firefox will not
 * play reliably; the live site serves them mislabelled as video/mp4. The four
 * .mp4/.MP4 files are 18–25 MB straight off a drone. All seven get the same
 * treatment so playback is consistent and fast everywhere.
 *
 * Originals are left untouched in public/media/.
 *
 * Usage: npm run media:video          (skips anything already produced)
 *        npm run media:video -- --force
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA = path.join(ROOT, "public", "media");
const OUT = path.join(MEDIA, "video");
const FORCE = process.argv.includes("--force");

/** source file in public/media  ->  output basename in public/media/video */
const JOBS = [
  ["deIMG_8840.MOV", "party-germans-1"],
  ["deIMG_8845.MOV", "party-germans-2"],
  ["jdIMG_8749.MOV", "dinner-celebration-1"],
  ["paDJI_2282.mp4", "party-drone-1"],
  ["paDJI_2288.MP4", "party-drone-2"],
  ["Wedding clip.mp4", "wedding-rituals-olive-1"],
  ["xorafi.mp4", "olive-stories"],
];

const exists = async (p) => {
  try {
    return (await stat(p)).size > 0;
  } catch {
    return false;
  }
};

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);

async function ffmpeg(args) {
  // maxBuffer bumped: ffmpeg is chatty on stderr for long clips.
  await run(ffmpegPath, args, { maxBuffer: 1024 * 1024 * 64 });
}

/**
 * Reads the source video bitrate in kb/s by parsing `ffmpeg -i` (ffmpeg-static
 * ships no ffprobe). ffmpeg exits non-zero with no output file, so the useful
 * information arrives on stderr via the thrown error.
 */
async function sourceBitrate(file) {
  let stderr = "";
  try {
    const r = await run(ffmpegPath, ["-hide_banner", "-i", file], { maxBuffer: 1024 * 1024 * 8 });
    stderr = r.stderr;
  } catch (err) {
    stderr = err.stderr ?? "";
  }
  const match = stderr.match(/Video:.*?, (\d+) kb\/s/);
  return match ? Number(match[1]) : null;
}

async function transcode(source, base) {
  const src = path.join(MEDIA, source);
  if (!(await exists(src))) {
    console.log(`  SKIP  ${source} — not found`);
    return null;
  }

  const mp4 = path.join(OUT, `${base}.mp4`);
  const webm = path.join(OUT, `${base}.webm`);
  const poster = path.join(OUT, `${base}.jpg`);
  const before = (await stat(src)).size;

  // Cap the long edge at 1280 and keep dimensions even (H.264 requires it).
  const scale = "scale='min(1280,iw)':-2";

  /*
   * Some sources are already low-bitrate (Wedding clip.mp4 is 2m46s at
   * 1152 kb/s). CRF alone would spend *more* bits than the original and produce
   * a bigger file, so cap the peak at the source rate — never re-inflate.
   */
  const srcKbps = await sourceBitrate(src);
  const capKbps = srcKbps ? Math.min(2400, Math.round(srcKbps * 0.85)) : 2400;
  const cap = ["-maxrate", `${capKbps}k`, "-bufsize", `${capKbps * 2}k`];

  if (FORCE || !(await exists(mp4))) {
    await ffmpeg([
      "-y", "-i", src,
      "-vf", scale,
      "-c:v", "libx264", "-preset", "slow", "-crf", "24",
      ...cap,
      "-profile:v", "high", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "128k",
      "-movflags", "+faststart",
      mp4,
    ]);
  }

  if (FORCE || !(await exists(webm))) {
    /*
     * VP9 constrained quality: `-crf N -b:v <cap>`. Note that `-b:v 0` (pure
     * constant quality) is mutually exclusive with a rate cap — libvpx-vp9
     * aborts at frame 0 if you pass -maxrate alongside it.
     */
    await ffmpeg([
      "-y", "-i", src,
      "-vf", scale,
      "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", `${capKbps}k`, "-row-mt", "1",
      "-c:a", "libopus", "-b:a", "96k",
      webm,
    ]);
  }

  if (FORCE || !(await exists(poster))) {
    // Grab a frame a second in — frame zero is often a black fade-in.
    await ffmpeg(["-y", "-ss", "1", "-i", src, "-vframes", "1", "-vf", scale, "-q:v", "3", poster]);
  }

  const after = (await stat(mp4)).size;

  /*
   * VP9 does not always win. When the WebM ends up larger than the MP4 the
   * browser would pick the heavier file first, so drop it and let MP4 serve
   * everyone. Callers must treat `webm` as optional.
   */
  let droppedWebm = false;
  if (await exists(webm)) {
    const webmSize = (await stat(webm)).size;
    if (webmSize >= after) {
      await rm(webm);
      droppedWebm = true;
    }
  }

  console.log(
    `  OK    ${source.padEnd(22)} ${mb(before).padStart(6)} MB -> ${mb(after).padStart(6)} MB  (${base})` +
      (droppedWebm ? "  [webm dropped — larger than mp4]" : ""),
  );
  return { before, after, droppedWebm, base };
}

async function main() {
  if (!ffmpegPath) throw new Error("ffmpeg-static did not provide a binary");
  await mkdir(OUT, { recursive: true });

  console.log(`Transcoding ${JOBS.length} videos -> public/media/video/\n`);
  let before = 0;
  let after = 0;

  for (const [source, base] of JOBS) {
    try {
      const r = await transcode(source, base);
      if (r) {
        before += r.before;
        after += r.after;
      }
    } catch (err) {
      console.error(`  FAIL  ${source}: ${err.message?.split("\n").slice(-3).join(" ")}`);
      process.exitCode = 1;
    }
  }

  console.log(`\ntotal ${mb(before)} MB -> ${mb(after)} MB (mp4 only; webm and posters extra)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
