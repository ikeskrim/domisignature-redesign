/**
 * Media pixel guard — never publish different pixels under an existing name.
 *
 * `/media` is served `public, max-age=31536000, immutable` (next.config.ts), so
 * a browser that has fetched a name never asks for it again for a year. New
 * pixels under an old name reach some visitors and not others, silently. The
 * aegean-bone law (SKILL.md §2) therefore forbids it, with one exception: a
 * lossless metadata-only rewrite proven pixel-identical (the metadata strip,
 * `c40de6c`). This is the boundary-gate check that holds the law between two
 * revisions, with human verdicts for the rare change the owner accepts
 * (BRIEF-AUDIT.md §10, stage 7 item 4).
 *
 * Scope. Every path under public/ that `git diff --raw -M` (the --name-status
 * classification, plus both blob ids in the same call) reports as MODIFIED or
 * TYPE-CHANGED between the two revisions. Added, deleted, renamed and copied
 * paths are counted, not checked: they publish nothing new under a name the
 * base already served.
 *
 * Method, per file (both blobs read with `git cat-file`; nothing is checked out):
 *   same blob     byte-identical (a mode change only): passes
 *   jpg jpeg png  sharp decodes both sides with EXIF orientation honoured the
 *   webp avif gif same way (`rotate()` without arguments), every frame of an
 *                 animation, alpha added, to raw RGBA (16 bits per sample when
 *                 either side is deeper than 8, so no low byte is cast away).
 *                 Dimensions, frames and every byte must agree, and so must an
 *                 animation's frame delays and loop count. sharp applies an
 *                 embedded ICC profile on the way to sRGB, so a swapped
 *                 profile counts as a pixel change: it changes what is shown.
 *   mp4 webm mov  ffmpeg-static, `-map 0 -c copy -f streamhash -hash sha256`:
 *                 the sha256 of every stream's copied packets must agree, and
 *                 so must what the container says about showing them:
 *                 - the framehash header (extradata, codec, dimensions, sample
 *                   aspect, sample rate, channel layout);
 *                 - each stream's description in ffmpeg's input dump (codec
 *                   tag, pixel format with colour range, matrix, primaries,
 *                   transfer and field order, dimensions, SAR/DAR, disposition)
 *                   and its stream side data (display matrix, stereo3d,
 *                   spherical, mastering display, light level, ICC);
 *                 - every packet's pts and duration under `-copyts`, in seconds,
 *                   to within one tick of the coarser time base (a lossless
 *                   remux may change a time base, not move a frame or the
 *                   edit-list start);
 *                 - the first decoded frame of each video stream after ffmpeg's
 *                   default autorotate (display matrix rotation and flips) and
 *                   edit list, hashed as raw pixels. The side-data line alone
 *                   cannot tell a horizontal flip from a half turn; this can.
 *   anything else byte-identical, or "needs a verdict" (PDF, ico, text, a
 *                 symbolic link, a file under an unrecognised extension).
 * Not checked: a name deleted before the base and re-added in the range shows
 * as added; PNG gAMA/cHRM/cICP chunks that a browser applies and sharp's decode
 * does not; container metadata that no player reads (titles, dates, encoders).
 * Identical pixels or packets pass as "metadata-only". Different ones fail
 * unless design-review/media-pixel-verdicts.json holds an entry for that exact
 * path with both blob ids and verdict "approved" (plus who and when). A file
 * that cannot be decoded fails whatever the verdicts say: a browser could not
 * show it either. The verdicts file is read, never written; a malformed entry
 * fails the run.
 *
 * Blobs are decoded in memory; videos go to a private temp folder inside the
 * OS temp directory, removed after each file and on interrupt. Nothing is
 * written into the repository except the report, and nothing printed or
 * reported carries a machine path, ffmpeg's stderr (it can quote metadata) or
 * a metadata value.
 *
 * Usage: node scripts/media-pixel-guard.mjs <base-rev> [<head-rev>=HEAD] [--out <file>]
 *        e.g. node scripts/media-pixel-guard.mjs c40de6c~1 c40de6c
 *        (write `~1` rather than `^` where cmd.exe parses the line: it eats `^`)
 *        --out writes the report elsewhere, outside the repository only;
 *        default design-review/media-pixel-guard.json.
 *        Exit 1 on any unapproved change, any file that could not be decoded
 *        or read, or a malformed verdicts file; 2 on a usage error.
 */

import { execFile, execFileSync, spawn } from "node:child_process";
import { createWriteStream, rmSync } from "node:fs";
import { mkdir, mkdtemp, readFile, realpath, rm, stat, unlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const REPORT = "design-review/media-pixel-guard.json";
const VERDICTS = "design-review/media-pixel-verdicts.json";
const SCOPE = "public/";

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;
const REGULAR = new Set(["100644", "100755"]);
const BLOB_ID = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/;
const FFMPEG_TIMEOUT = 15 * 60 * 1000;

sharp.cache(false);

/* ------------------------------------------------------------------------ */
/* helpers                                                                   */
/* ------------------------------------------------------------------------ */

class Undecodable extends Error {}

const USAGE = [
  "Usage: node scripts/media-pixel-guard.mjs <base-rev> [<head-rev>=HEAD] [--out <file outside the repository>]",
  "  e.g. node scripts/media-pixel-guard.mjs c40de6c~1 c40de6c",
].join("\n");

function usage(msg) {
  console.error(`${msg}\n${USAGE}`);
  process.exit(2);
}

const short = (id) => id.slice(0, 7);
const n = (x) => x.toLocaleString("en-US");
const keyOf = (p) => (process.platform === "win32" ? p.toLowerCase() : p);
const isInside = (child, parent) => {
  const r = path.relative(parent, child);
  return r === "" || (!r.startsWith("..") && !path.isAbsolute(r));
};
/**
 * One line, no paths. System and child-process errors quote the path or the full
 * command line (which holds the repository path) in their message, so only their
 * code or exit status is shown; sharp's own messages carry no path.
 */
const reason = (err) => {
  if (err && typeof err === "object" && (err.syscall || err.path || typeof err.status === "number" || "signal" in err)) {
    if (typeof err.code === "string") return err.code;
    return typeof err.status === "number" ? `exit ${err.status}` : "system error";
  }
  return String(err?.message ?? err?.code ?? "error").split(/\r?\n/)[0].slice(0, 160);
};

async function real(p) {
  try {
    return await realpath(p);
  } catch {
    return path.resolve(p);
  }
}

function git(args) {
  return execFileSync("git", ["-C", ROOT, ...args], { maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"], windowsHide: true });
}

/** Children and the temp folder of this run, so an interrupt can clean up after itself. */
const liveChildren = new Set();
let tempDir = null;

function cleanupAndExit(code) {
  for (const c of liveChildren) {
    try {
      c.kill();
    } catch {
      // already gone
    }
  }
  if (tempDir) {
    for (let i = 0; i < 20; i++) {
      try {
        rmSync(tempDir, { recursive: true, force: true });
        break;
      } catch {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100); // a killed ffmpeg can hold a file for a moment on Windows
      }
    }
  }
  process.exit(code);
}

/* ------------------------------------------------------------------------ */
/* git                                                                       */
/* ------------------------------------------------------------------------ */

function resolveCommit(rev) {
  if (!rev || rev.startsWith("-")) usage(`Not a revision: ${rev ?? "(none)"}`);
  try {
    const id = git(["rev-parse", "--verify", "--quiet", "--end-of-options", `${rev}^{commit}`]).toString("utf8").trim();
    if (!/^[0-9a-f]{40,64}$/.test(id)) throw new Error();
    return id;
  } catch {
    usage(`Not a commit in this repository: ${rev}`);
  }
}

/** `git diff --raw -z` records: { srcMode, dstMode, srcBlob, dstBlob, status, src, dst }. */
function changedUnderPublic(base, head) {
  const out = git(["diff", "--raw", "-z", "-M", "--no-abbrev", "--no-color", "--no-ext-diff", base, head, "--", SCOPE]).toString("utf8");
  const t = out.split("\0");
  const records = [];
  for (let i = 0; i < t.length; ) {
    const header = t[i++];
    if (!header) continue;
    const m = /^:(\d{6}) (\d{6}) ([0-9a-f]+) ([0-9a-f]+) ([A-Z])(\d*)$/.exec(header);
    if (!m) throw new Error("unexpected record in git diff --raw output");
    const [, srcMode, dstMode, srcBlob, dstBlob, status] = m;
    const src = t[i++];
    const dst = status === "R" || status === "C" ? t[i++] : src;
    if (src === undefined || dst === undefined) throw new Error("truncated git diff --raw output");
    records.push({ srcMode, dstMode, srcBlob, dstBlob, status, src, dst });
  }
  return records;
}

function spawnCatFile(id) {
  const child = spawn("git", ["-C", ROOT, "cat-file", "blob", id], { stdio: ["ignore", "pipe", "ignore"], windowsHide: true });
  liveChildren.add(child);
  const exited = new Promise((resolve) => {
    child.on("error", () => resolve(-1));
    child.on("close", (code) => resolve(code));
  }).finally(() => liveChildren.delete(child));
  return { child, exited };
}

async function blobToBuffer(id) {
  const { child, exited } = spawnCatFile(id);
  const chunks = [];
  child.stdout.on("data", (c) => chunks.push(c));
  const code = await exited;
  if (code !== 0) throw new Error(`git cat-file could not read blob ${short(id)} (exit ${code})`);
  return Buffer.concat(chunks);
}

async function blobToFile(id, dest) {
  const { child, exited } = spawnCatFile(id);
  await pipeline(child.stdout, createWriteStream(dest, { flags: "wx" }));
  const code = await exited;
  if (code !== 0) throw new Error(`git cat-file could not read blob ${short(id)} (exit ${code})`);
}

/* ------------------------------------------------------------------------ */
/* images                                                                    */
/* ------------------------------------------------------------------------ */

async function decodeImage(buf, side, depth) {
  try {
    return await sharp(buf, { failOn: "error", limitInputPixels: false, pages: -1 }).rotate().ensureAlpha().raw({ depth }).toBuffer({ resolveWithObject: true });
  } catch (err) {
    throw new Undecodable(`sharp cannot decode the ${side} blob (${reason(err)})`);
  }
}

async function imageMeta(buf, side) {
  try {
    return await sharp(buf, { failOn: "error", limitInputPixels: false, pages: -1 }).metadata();
  } catch (err) {
    throw new Undecodable(`sharp cannot read the ${side} blob (${reason(err)})`);
  }
}

/** Differing pixels and the largest per-sample delta; only called once the buffers are known to differ. */
function pixelDelta(a, b, info) {
  const wide = info.depth === "ushort";
  const bytes = wide ? 2 : 1;
  const le = os.endianness() === "LE";
  const stride = bytes * info.channels;
  let pixels = 0;
  let maxDelta = 0;
  for (let p = 0; p < a.length; p += stride) {
    let differs = false;
    for (let c = 0; c < stride; c += bytes) {
      const x = wide ? (le ? a.readUInt16LE(p + c) : a.readUInt16BE(p + c)) : a[p + c];
      const y = wide ? (le ? b.readUInt16LE(p + c) : b.readUInt16BE(p + c)) : b[p + c];
      if (x !== y) {
        differs = true;
        const d = Math.abs(x - y);
        if (d > maxDelta) maxDelta = d;
      }
    }
    if (differs) pixels++;
  }
  return { pixels, maxDelta };
}

async function compareImages(rec) {
  const [a, b] = [await blobToBuffer(rec.baseBlob), await blobToBuffer(rec.headBlob)];
  const [ma, mb] = [await imageMeta(a, "base"), await imageMeta(b, "head")];
  const depth = ma.depth === "uchar" && mb.depth === "uchar" ? "uchar" : "ushort";
  const da = await decodeImage(a, "base", depth);
  const db = await decodeImage(b, "head", depth);
  const shape = (m, i) => `${m.format} ${i.width}x${i.pageHeight ?? i.height}${(i.pages ?? 1) > 1 ? ` (${i.pages} frames)` : ""}`;
  const ia = da.info;
  const ib = db.info;
  const format = ma.format === mb.format ? "" : `, format ${ma.format} -> ${mb.format}`;
  const bits = depth === "ushort" ? "16-bit " : "";
  rec.pixels = {
    base: { format: ma.format, width: ia.width, height: ia.height, frames: ia.pages ?? 1, orientation: ma.orientation ?? null },
    head: { format: mb.format, width: ib.width, height: ib.height, frames: ib.pages ?? 1, orientation: mb.orientation ?? null },
    depth,
  };
  const sameShape = ia.width === ib.width && ia.height === ib.height && ia.channels === ib.channels && ia.depth === ib.depth && (ia.pages ?? 1) === (ib.pages ?? 1) && (ia.pageHeight ?? ia.height) === (ib.pageHeight ?? ib.height);
  if (!sameShape) {
    rec.result = "pixels-differ";
    rec.detail = `dimensions differ: ${shape(ma, ia)} -> ${shape(mb, ib)} after EXIF orientation`;
    return;
  }
  const framesA = ia.pages ?? 1;
  if (framesA > 1) {
    // An animation shows its frames for as long as the file says: same delays, same loop count.
    const timing = (m) => JSON.stringify({ delay: m.delay ?? null, loop: m.loop ?? null });
    if (timing(ma) !== timing(mb)) {
      rec.result = "pixels-differ";
      rec.detail = `animation timing differs (frame delays or loop count), ${shape(mb, ib)}${format}`;
      return;
    }
  }
  if (da.data.equals(db.data)) {
    rec.result = "metadata-only";
    rec.detail = `${shape(mb, ib)}, every ${bits}RGBA byte identical after EXIF orientation${format}`;
    return;
  }
  const { pixels, maxDelta } = pixelDelta(da.data, db.data, ia);
  const total = ia.width * ia.height;
  Object.assign(rec.pixels, { differingPixels: pixels, totalPixels: total, maxSampleDelta: maxDelta });
  rec.result = "pixels-differ";
  rec.detail = `pixels differ: ${n(pixels)} of ${n(total)} (${shape(mb, ib)}), largest ${bits}sample delta ${maxDelta}${format}`;
}

/* ------------------------------------------------------------------------ */
/* videos                                                                    */
/* ------------------------------------------------------------------------ */

let ffmpegBin;
function ffmpeg() {
  ffmpegBin ??= require("ffmpeg-static");
  if (!ffmpegBin) throw new Undecodable("ffmpeg-static has no binary for this platform");
  return ffmpegBin;
}

/**
 * stdout as text; stderr is counted, and handed back only to be parsed when asked
 * for (`keepStderr`). It is never shown: it quotes container metadata and paths.
 */
function runFfmpeg(args, { keepStderr = false } = {}) {
  return new Promise((resolve) => {
    const child = execFile(ffmpeg(), ["-hide_banner", "-nostdin", ...args], { encoding: "buffer", maxBuffer: 256 * 1024 * 1024, timeout: FFMPEG_TIMEOUT, windowsHide: true }, (err, stdout, stderr) => {
      liveChildren.delete(child);
      const text = (stderr ?? Buffer.alloc(0)).toString("utf8").trim();
      resolve({
        code: err ? (typeof err.code === "number" ? err.code : -1) : 0,
        stdout: (stdout ?? Buffer.alloc(0)).toString("latin1"),
        errorLines: text ? text.split("\n").length : 0,
        ...(keepStderr ? { stderr: text } : {}),
      });
    });
    liveChildren.add(child);
  });
}

/** Header keys that describe the stream itself; time bases and the muxer's own version are left out. */
const PARAM_LINE = /^#(extradata|media_type|codec_id|dimensions|sar|sample_rate|channel_layout_name) /;

/** Split a stream description at top-level ", " (commas inside () and [] belong to their field). */
function topLevelFields(s) {
  const fields = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(" || c === "[") depth++;
    else if ((c === ")" || c === "]") && depth > 0) depth--;
    else if (c === "," && depth === 0 && s[i + 1] === " ") {
      fields.push(s.slice(start, i));
      start = i + 2;
    }
  }
  fields.push(s.slice(start));
  return fields.map((f) => f.trim()).filter(Boolean);
}

/**
 * ffmpeg's input dump, per stream: the description fields that shape what is shown
 * or heard (codec and tag, pixel format with colour range, matrix, primaries,
 * transfer and field order, dimensions with SAR/DAR, sample rate, layout, sample
 * format, disposition), and the stream side data (display matrix, stereo3d,
 * spherical, mastering display, light level, ICC...). Bitrate and frame-rate or
 * time-base fields are left out: timing is compared packet by packet instead.
 */
function parseInputDump(text) {
  const streams = new Map();
  let inInput = false;
  let cur = null;
  let section = null;
  for (const line of text.split(/\r?\n/)) {
    if (/^Input #0,/.test(line)) {
      inInput = true;
      continue;
    }
    if (!inInput) continue;
    if (/^\S/.test(line)) break; // the next top-level block: output, or ffmpeg's closing remark
    const s = /^ {2}Stream #0:(\d+)[^:]*: (\w+): (.*)$/.exec(line);
    if (s) {
      const fields = topLevelFields(s[3]);
      let disposition = "";
      if (fields.length) {
        const last = fields[fields.length - 1];
        const d = /(?: \([a-z_ ]+\))+$/.exec(last);
        if (d) {
          disposition = d[0].trim();
          fields[fields.length - 1] = last.slice(0, d.index).trim();
        }
      }
      const kept = fields.filter((f) => f && !/(?:\bkb\/s|\bfps|\btbr|\btbn|\btbc)$/.test(f));
      cur = { type: s[2], fields: [...kept, disposition].join(" | "), sideData: [] };
      streams.set(s[1], cur);
      section = null;
      continue;
    }
    if (/^ {2}\S/.test(line)) {
      cur = null; // container-level lines: duration, chapters, programs
      continue;
    }
    if (!cur) continue;
    const h = /^ {4}(\w[\w ]*):$/.exec(line);
    if (h) {
      section = h[1];
      continue;
    }
    if (section === "Side data" && /^ {6}\S/.test(line)) cur.sideData.push(line.trim().replace(/\s+/g, " "));
  }
  return streams;
}

/** pts and duration of every copied packet, per stream, with that stream's time base. */
function parsePacketTiming(frameText) {
  const tb = new Map();
  const timing = new Map();
  for (const line of frameText.split(/\r?\n/)) {
    const t = /^#tb (\d+): (\d+)\/(\d+)\s*$/.exec(line);
    if (t) {
      tb.set(t[1], [BigInt(t[2]), BigInt(t[3])]);
      continue;
    }
    const p = /^(\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*\d+,/.exec(line);
    if (!p) continue;
    if (!timing.has(p[1])) timing.set(p[1], []);
    timing.get(p[1]).push([BigInt(p[3]), BigInt(p[4])]);
  }
  return { tb, timing };
}

/**
 * Same presentation times, stream by stream: the same number of packets, and each
 * packet's pts and duration equal in seconds to within one tick of the coarser
 * time base (a lossless remux may change the time base; it may not move a frame).
 */
function timingDiffers(a, b, id) {
  const ta = a.timing.get(id) ?? [];
  const tb = b.timing.get(id) ?? [];
  const ra = a.tb.get(id);
  const rb = b.tb.get(id);
  if (!ra || !rb) return ta.length !== 0 || tb.length !== 0;
  if (ta.length !== tb.length) return true;
  const [na, da] = ra;
  const [nb, db] = rb;
  const tolerance = na * db > nb * da ? na * db : nb * da;
  const abs = (x) => (x < 0n ? -x : x);
  for (let i = 0; i < ta.length; i++) {
    for (let k = 0; k < 2; k++) {
      if (abs(ta[i][k] * na * db - tb[i][k] * nb * da) > tolerance) return true;
    }
  }
  return false;
}

async function videoSignature(file, side) {
  const packets = await runFfmpeg(["-v", "error", "-i", file, "-map", "0", "-c", "copy", "-f", "streamhash", "-hash", "sha256", "-"]);
  if (packets.code !== 0 || packets.errorLines || !packets.stdout.trim()) {
    throw new Undecodable(`ffmpeg cannot hash the ${side} blob's copied packets (exit ${packets.code}, ${packets.errorLines} error line(s))`);
  }
  // -copyts: keep the container's own timestamps (edit-list start, offsets) instead of rebasing them to zero.
  const frames = await runFfmpeg(["-v", "error", "-copyts", "-i", file, "-map", "0", "-c", "copy", "-f", "framehash", "-hash", "sha256", "-"]);
  if (frames.code !== 0 || frames.errorLines) {
    throw new Undecodable(`ffmpeg cannot read the ${side} blob's stream parameters (exit ${frames.code}, ${frames.errorLines} error line(s))`);
  }
  const streams = new Map();
  for (const line of packets.stdout.split(/\r?\n/)) {
    const m = /^(\d+),(\w),SHA256=([0-9a-f]{64})$/.exec(line.trim());
    if (m) streams.set(m[1], { type: m[2], hash: m[3] });
  }
  if (!streams.size) throw new Undecodable(`ffmpeg printed no stream hash for the ${side} blob`);
  const params = new Map();
  for (const line of frames.stdout.split(/\r?\n/)) {
    if (!PARAM_LINE.test(line)) continue;
    const colon = line.search(/[:,]/);
    params.set(line.slice(1, colon).trim(), line.slice(colon + 1).replace(/\s+/g, " ").trim());
  }
  const timing = parsePacketTiming(frames.stdout);

  // The input dump ends in "At least one output file must be specified" (exit 1): only the dump is wanted.
  const dump = await runFfmpeg(["-v", "info", "-i", file], { keepStderr: true });
  const probe = parseInputDump(dump.stderr ?? "");
  if (probe.size !== streams.size) throw new Undecodable(`ffmpeg's stream description of the ${side} blob does not match its packets (${probe.size} vs ${streams.size} stream(s))`);

  // What the container asks a player to show first: the first decoded frame of each
  // video stream after ffmpeg's default autorotate (display matrix: rotation and
  // flips) and the container's edit list, hashed as raw pixels.
  const firstFrames = new Map();
  if ([...streams.values()].some((s) => s.type === "v")) {
    const first = await runFfmpeg(["-v", "error", "-i", file, "-map", "0:v", "-frames:v", "1", "-f", "framehash", "-hash", "sha256", "-"]);
    if (first.code !== 0 || first.errorLines) {
      throw new Undecodable(`ffmpeg cannot decode the first frame of the ${side} blob (exit ${first.code}, ${first.errorLines} error line(s))`);
    }
    for (const line of first.stdout.split(/\r?\n/)) {
      const d = /^#dimensions (\d+): (\d+x\d+)\s*$/.exec(line);
      if (d) firstFrames.set(d[1], { ...(firstFrames.get(d[1]) ?? {}), dimensions: d[2] });
      const f = /^(\d+),.*,\s*([0-9a-f]{64})\s*$/.exec(line);
      if (f && !firstFrames.get(f[1])?.hash) firstFrames.set(f[1], { ...(firstFrames.get(f[1]) ?? {}), hash: f[2] });
    }
    if (![...firstFrames.values()].some((x) => x.hash)) throw new Undecodable(`ffmpeg decoded no frame from the ${side} blob`);
  }
  return { streams, params, timing, probe, firstFrames };
}

async function compareVideos(rec, index) {
  const ext = path.extname(rec.path).toLowerCase();
  const fa = path.join(tempDir, `${index}-base${ext}`);
  const fb = path.join(tempDir, `${index}-head${ext}`);
  try {
    await blobToFile(rec.baseBlob, fa);
    await blobToFile(rec.headBlob, fb);
    const a = await videoSignature(fa, "base");
    const b = await videoSignature(fb, "head");
    const kinds = (s) => [...s.values()].map((x) => x.type).join("");
    rec.packets = { baseStreams: kinds(a.streams), headStreams: kinds(b.streams) };
    const differing = [];
    for (const id of new Set([...a.streams.keys(), ...b.streams.keys()])) {
      const x = a.streams.get(id);
      const y = b.streams.get(id);
      if (!x || !y) differing.push(`stream ${id} ${x ? "removed" : "added"}`);
      else if (x.type !== y.type || x.hash !== y.hash) differing.push(`stream ${id} (${y.type})`);
    }
    if (differing.length) {
      rec.result = "pixels-differ";
      rec.detail = `copied packets differ: ${differing.join(", ")}`;
      return;
    }
    // Everything below names only what differs (a key, a side-data kind), never a value.
    const presentation = [];
    const paramDiff = [...new Set([...a.params.keys(), ...b.params.keys()])].filter((k) => a.params.get(k) !== b.params.get(k));
    if (paramDiff.length) presentation.push(`stream parameters (${paramDiff.join(", ")})`);
    for (const id of a.streams.keys()) {
      const x = a.probe.get(id);
      const y = b.probe.get(id);
      if (!x || !y || x.type !== y.type || x.fields !== y.fields) presentation.push(`stream ${id} description (codec, pixel format, colour, dimensions or disposition)`);
      if (!x || !y || x.sideData.join("\n") !== y.sideData.join("\n")) {
        const kindOf = (l) => l.split(":")[0];
        const linesOf = (s, k) => (s ? s.sideData.filter((l) => kindOf(l) === k).join("\n") : "");
        const kinds = new Set([...(x?.sideData ?? []), ...(y?.sideData ?? [])].map(kindOf));
        const changed = [...kinds].filter((k) => linesOf(x, k) !== linesOf(y, k));
        presentation.push(`stream ${id} side data (${changed.join(", ") || "order"})`);
      }
      if (timingDiffers(a.timing, b.timing, id)) presentation.push(`stream ${id} packet timing (pts or duration)`);
    }
    for (const id of new Set([...a.firstFrames.keys(), ...b.firstFrames.keys()])) {
      const x = a.firstFrames.get(id);
      const y = b.firstFrames.get(id);
      if (!x || !y || x.dimensions !== y.dimensions || x.hash !== y.hash) {
        presentation.push(`video stream ${id} first decoded frame (${x?.dimensions === y?.dimensions ? "pixels" : "dimensions"}: display matrix or edit list)`);
      }
    }
    if (presentation.length) {
      rec.result = "pixels-differ";
      rec.detail = `copied packets identical, but presentation differs: ${presentation.join(", ")}`;
      return;
    }
    rec.result = "metadata-only";
    rec.detail = `${a.streams.size} stream(s) (${kinds(b.streams)}): copied-packet sha256, stream parameters and description, side data, packet timing and first decoded frame identical`;
  } finally {
    await unlink(fa).catch(() => {});
    await unlink(fb).catch(() => {});
  }
}

/* ------------------------------------------------------------------------ */
/* verdicts                                                                  */
/* ------------------------------------------------------------------------ */

async function loadVerdicts() {
  const abs = path.join(ROOT, VERDICTS);
  let text;
  try {
    text = await readFile(abs, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return { list: [], problems: [], note: `${VERDICTS} not found: no change can be approved` };
    return { list: [], problems: [`${VERDICTS} cannot be read (${err.code ?? "error"})`] };
  }
  let data;
  try {
    data = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text); // a byte-order mark from a Windows editor
  } catch {
    return { list: [], problems: [`${VERDICTS} is not valid JSON`] };
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.verdicts)) return { list: [], problems: [`${VERDICTS} has no "verdicts" array`] };
  const list = [];
  const problems = [];
  const seen = new Map();
  data.verdicts.forEach((v, i) => {
    const where = `${VERDICTS} verdicts[${i}]`;
    const bad = [];
    if (!v || typeof v !== "object") return problems.push(`${where}: not an object`);
    if (typeof v.path !== "string" || !v.path.startsWith(SCOPE)) bad.push(`"path" must name a file under ${SCOPE}`);
    for (const k of ["baseBlob", "headBlob"]) if (typeof v[k] !== "string" || !BLOB_ID.test(v[k].toLowerCase())) bad.push(`"${k}" must be a full blob id`);
    if (v.verdict !== "approved" && v.verdict !== "rejected") bad.push(`"verdict" must be "approved" or "rejected"`);
    if (typeof v.who !== "string" || !v.who.trim()) bad.push(`"who" is required`);
    if (typeof v.when !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(v.when) || Number.isNaN(Date.parse(v.when))) bad.push(`"when" must be a date (YYYY-MM-DD)`);
    if (bad.length) return problems.push(`${where}: ${bad.join("; ")}`);
    const entry = { path: v.path, baseBlob: v.baseBlob.toLowerCase(), headBlob: v.headBlob.toLowerCase(), verdict: v.verdict, who: v.who.trim(), when: v.when, note: typeof v.note === "string" ? v.note : undefined };
    const key = `${entry.path}\0${entry.baseBlob}\0${entry.headBlob}`;
    if (seen.has(key)) return problems.push(`${where}: repeats verdicts[${seen.get(key)}] for the same path and blobs`);
    seen.set(key, i);
    list.push(entry);
  });
  return { list, problems };
}

/* ------------------------------------------------------------------------ */
/* CLI                                                                       */
/* ------------------------------------------------------------------------ */

async function main() {
  const args = process.argv.slice(2);
  const revs = [];
  let outArg = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--help" || a === "-h") {
      console.log(USAGE);
      return;
    }
    if (a === "--out") {
      outArg = args[++i];
      if (!outArg || outArg.startsWith("--")) usage("--out needs a file path.");
    } else if (a.startsWith("--out=")) outArg = a.slice(6);
    else if (a.startsWith("-")) usage(`Unknown option: ${a}`);
    else revs.push(a);
  }
  if (revs.length < 1 || revs.length > 2) usage("Give a base revision, and optionally a head revision.");

  try {
    git(["rev-parse", "--git-dir"]);
  } catch {
    usage("Not a git checkout: the guard reads both revisions from git.");
  }
  const baseRev = revs[0];
  const headRev = revs[1] ?? "HEAD";
  const base = resolveCommit(baseRev);
  const head = resolveCommit(headRev);

  // The report goes to its one place in the repository, or anywhere outside it.
  const rootReal = await real(ROOT);
  const defaultOut = path.join(rootReal, REPORT);
  let out = defaultOut;
  if (outArg) {
    const dir = await real(path.dirname(path.resolve(outArg)));
    try {
      if (!(await stat(dir)).isDirectory()) throw new Error();
    } catch {
      usage("The --out folder does not exist.");
    }
    out = path.join(dir, path.basename(outArg));
    if (isInside(keyOf(out), keyOf(rootReal)) && keyOf(out) !== keyOf(defaultOut)) usage(`Inside the repository the report is written only to ${REPORT}.`);
  }
  const outLabel = keyOf(out) === keyOf(defaultOut) ? REPORT : "the --out file";
  try {
    if (!(await stat(out)).isFile()) usage(`The report path (${outLabel}) exists and is not a regular file.`);
  } catch (err) {
    if (err?.code !== "ENOENT") usage(`The report path (${outLabel}) cannot be used (${err?.code ?? "error"}).`);
  }

  let records;
  try {
    records = changedUnderPublic(base, head);
  } catch (err) {
    console.error(`git diff failed: ${reason(err)}`);
    process.exit(2);
  }

  const verdicts = await loadVerdicts();

  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) {
    try {
      process.on(sig, () => cleanupAndExit(130));
    } catch {
      // signal not supported on this platform
    }
  }

  console.log(`media pixel guard: ${SCOPE} from ${short(base)} (${baseRev}) to ${short(head)} (${headRev})`);
  if (verdicts.note) console.log(`  note  ${verdicts.note}`);

  const notChecked = { added: 0, deleted: 0, renamed: 0, copied: 0, other: 0 };
  const files = [];
  const failures = [];

  try {
    let index = 0;
    for (const r of records) {
      if (r.status !== "M" && r.status !== "T") {
        const k = { A: "added", D: "deleted", R: "renamed", C: "copied" }[r.status] ?? "other";
        notChecked[k]++;
        continue;
      }
      index++;
      const rec = { path: r.dst, change: r.status === "M" ? "modified" : "type-changed", kind: "other", baseBlob: r.srcBlob, headBlob: r.dstBlob, result: null, ok: false, detail: "" };
      if (IMAGE_EXT.test(rec.path)) rec.kind = "image";
      else if (VIDEO_EXT.test(rec.path)) rec.kind = "video";
      try {
        if (!REGULAR.has(r.srcMode) || !REGULAR.has(r.dstMode)) {
          rec.result = "needs-verdict";
          rec.detail = `not a regular file on both sides (mode ${r.srcMode} -> ${r.dstMode})`;
        } else if (r.srcBlob === r.dstBlob) {
          rec.result = "byte-identical";
          rec.detail = `same blob (mode ${r.srcMode} -> ${r.dstMode})`;
        } else if (rec.kind === "image") {
          await compareImages(rec);
        } else if (rec.kind === "video") {
          tempDir ??= await mkdtemp(path.join(os.tmpdir(), "media-pixel-guard-"));
          await compareVideos(rec, index);
        } else {
          rec.result = "needs-verdict";
          rec.detail = `bytes differ, and ${path.extname(rec.path).toLowerCase() || "an extensionless file"} is not decoded by this guard`;
        }
      } catch (err) {
        rec.result = "undecodable";
        rec.detail = err instanceof Undecodable ? err.message : `could not be checked: ${reason(err)}`;
      }

      if (rec.result === "metadata-only" || rec.result === "byte-identical") rec.ok = true;
      else if (rec.result === "pixels-differ" || rec.result === "needs-verdict") {
        const match = verdicts.list.find((v) => v.path === rec.path && v.baseBlob === rec.baseBlob && v.headBlob === rec.headBlob);
        if (match?.verdict === "approved") {
          rec.ok = true;
          rec.verdict = { verdict: match.verdict, who: match.who, when: match.when, ...(match.note ? { note: match.note } : {}) };
          rec.detail += `; approved by ${match.who} on ${match.when}`;
        } else if (match) {
          rec.verdict = { verdict: match.verdict, who: match.who, when: match.when };
          rec.detail += `; verdict "${match.verdict}" by ${match.who} on ${match.when}`;
        } else {
          const other = verdicts.list.some((v) => v.path === rec.path);
          rec.detail += `; no verdict for base ${rec.baseBlob} head ${rec.headBlob}${other ? " (a verdict exists for this path, but for other blobs)" : ""}`;
        }
      }
      files.push(rec);
      console.log(`  ${rec.ok ? "ok  " : "FAIL"}  ${rec.path}  ${rec.result}: ${rec.detail}`);
      if (!rec.ok) failures.push(`${rec.path}: ${rec.result}`);
    }
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    tempDir = null;
  }

  for (const p of verdicts.problems) {
    console.log(`  FAIL  ${p}`);
    failures.push(p);
  }

  const matched = new Set(files.filter((f) => f.verdict).map((f) => `${f.path}\0${f.baseBlob}\0${f.headBlob}`));
  const unused = verdicts.list.filter((v) => !matched.has(`${v.path}\0${v.baseBlob}\0${v.headBlob}`)).length;
  const count = (fn) => files.filter(fn).length;
  const summary = {
    checked: files.length,
    metadataOnly: count((f) => f.result === "metadata-only"),
    byteIdentical: count((f) => f.result === "byte-identical"),
    approved: count((f) => f.ok && f.verdict),
    unapproved: count((f) => !f.ok && (f.result === "pixels-differ" || f.result === "needs-verdict")),
    undecodable: count((f) => f.result === "undecodable"),
    verdictProblems: verdicts.problems.length,
    verdictsNotUsedInThisRange: unused,
    notChecked,
  };

  const report = {
    about: "Modified and type-changed files under public/ between two revisions, compared by decoded pixels and animation timing (images, after EXIF orientation) or copied packets, stream parameters and description, side data, packet timing and first decoded frame (videos); written by scripts/media-pixel-guard.mjs.",
    base: { rev: baseRev, commit: base },
    head: { rev: headRev, commit: head },
    verdictsFile: VERDICTS,
    summary,
    files,
    failures,
  };
  let writeProblem = null;
  try {
    if (keyOf(out) === keyOf(defaultOut)) await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, JSON.stringify(report, null, 2) + "\n");
  } catch (err) {
    writeProblem = err?.code ?? "error";
  }

  const skipped = Object.entries(notChecked).filter(([, v]) => v).map(([k, v]) => `${v} ${k}`);
  console.log(`\n${"-".repeat(72)}`);
  console.log(
    `${summary.checked} modified file(s) under ${SCOPE}: ${summary.metadataOnly} metadata-only, ${summary.byteIdentical} byte-identical, ` +
      `${summary.approved} approved by verdict, ${summary.unapproved} unapproved, ${summary.undecodable} undecodable` +
      `${skipped.length ? ` (${skipped.join(", ")}: not checked)` : ""}.`,
  );
  console.log(failures.length ? `${failures.length} failure(s): different pixels would be published under an existing name, or the check could not prove otherwise.` : "no different pixels published under an existing name.");
  if (writeProblem) {
    console.error(`report not written: ${outLabel} could not be written (${writeProblem})`);
    process.exitCode = 2;
    return;
  }
  console.log(`written -> ${outLabel}`);
  if (failures.length) process.exitCode = 1;
}

try {
  await main();
} catch (err) {
  // Never let a stack trace (it carries absolute paths) reach the console.
  console.error(`media pixel guard stopped: ${reason(err)}`);
  cleanupAndExit(2);
}
