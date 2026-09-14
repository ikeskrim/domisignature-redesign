/**
 * Metadata strip — the lossless half of the owner's decision of 2026-09-14.
 *
 * `metadata-audit.mjs` fails any published file that says where it was taken,
 * which camera body took it, or carries a smaller copy of itself. This is the
 * tool that makes those files pass without touching a single pixel or a single
 * video packet: marker surgery on JPEG, chunk surgery on PNG, a stream-copy
 * remux for MP4 / MOV / WebM / Matroska. Nothing is re-encoded.
 *
 * The photographer's credit is kept. Artist and Copyright are carried into one
 * minimal EXIF IFD0 (JPEG), a tEXt/iTXt chunk (PNG) or the container's own
 * artist/copyright tags (video), together with a non-1 Orientation, because
 * dropping that would turn a portrait on its side.
 *
 * Only files the audit fails are rewritten; a clean file is never opened for
 * writing. Every output is verified before it replaces anything:
 *   JPEG / PNG   sharp raw decode (no auto-rotate) of original and output agree
 *                in width, height, channels and every byte
 *   video        ffmpeg streamhash of every stream agrees (decoded and packet),
 *                the remux decodes with no error, and the container's duration
 *                (Matroska Info Duration, MP4/MOV mvhd) and start time are unchanged
 *   all          inspectFile(output) reports no violation, and credit survives
 * A file that fails any check is REFUSED and left exactly as it was.
 *
 * Colour: a JPEG without an ICC profile is refused only when EXIF actually names
 * a non-sRGB space (ColorSpace 0x0002 / 0xFFFD / 0xFFFE, or InteropIndex R03,
 * the DCF Adobe RGB marker). ColorSpace 0xFFFF (Uncalibrated) on its own names
 * no space: browsers render such a file as sRGB with or without the tag, so it
 * is stripped like any other. For a refused Adobe RGB file, re-export it from
 * the photo editor with its colour profile embedded (the ICC then travels in
 * APP2, which this tool keeps) and run the tool again.
 *
 * Replacement is atomic: temp file beside the target, verify, append the ledger
 * line (status "pending"), rename, append the confirmation (status "replaced").
 * The ledger (JSON lines, outside the repository) records hashes, codes removed,
 * credit presence, and camera make/model and capture date — never a coordinate,
 * a serial or a credit value. Nor does anything this prints. A run killed hard
 * can leave a `.<name>.strip-tmp-<pid>.<ext>` beside a target (the original is
 * intact); the next run removes such leftovers (--dry-run only lists them).
 *
 * Usage: node scripts/strip-media-metadata.mjs --dry-run [--ledger <file>] [--allow-untracked] [paths…]
 *        node scripts/strip-media-metadata.mjs --apply --ledger <file outside the repo> [--allow-untracked] [paths…]
 *        Default scope: git-tracked images and videos under public/.
 *        Both modes refuse untracked and gitignored files (--apply refuses the whole
 *        run, --dry-run reports them REFUSED and does not inspect them).
 *        --allow-untracked is the test mode: it lifts that guard for paths OUTSIDE
 *        this repository only (scratch copies, fixtures); files inside it are
 *        still checked. Exit 1 when anything is REFUSED or any violation remains
 *        in scope; 2 on a usage error.
 */

import { createHash } from "node:crypto";
import { createReadStream, unlinkSync } from "node:fs";
import { open, readFile, writeFile, rename, unlink, stat, lstat, readdir, realpath } from "node:fs/promises";
import { execFile, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync, crc32 } from "node:zlib";
import { setTimeout as sleep } from "node:timers/promises";
import sharp from "sharp";
import { inspectFile, sniff } from "./metadata-audit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

/** The scope this tool acts on: stills and video. PDFs are the audit's, not ours. */
const MEDIA_EXT = /\.(jpe?g|jfif|png|webp|avif|heic|heif|tiff?|dng|mp4|m4v|mov|webm|mkv)$/i;
const TEMP_MARK = ".strip-tmp-";
const FFMPEG_TIMEOUT = 15 * 60 * 1000;

/* ------------------------------------------------------------------------ */
/* helpers                                                                   */
/* ------------------------------------------------------------------------ */

class Refused extends Error {}
/** Reasons are structure only: marker names, offsets, counts. Never a value. */
const refuse = (reason) => {
  throw new Refused(reason);
};

const hex = (n, w = 4) => "0x" + n.toString(16).toUpperCase().padStart(w, "0");
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

function sha256File(abs) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha256");
    createReadStream(abs)
      .on("data", (d) => h.update(d))
      .on("error", reject)
      .on("end", () => resolve(h.digest("hex")));
  });
}

/** "Present" in the audit's sense: at least one byte that is not NUL or a space. */
function hasContent(b) {
  for (const x of b) if (x !== 0 && x !== 0x20) return true;
  return false;
}

const utf8 = new TextDecoder("utf-8", { fatal: true });
function bytesToText(b) {
  let e = b.length;
  while (e > 0 && b[e - 1] === 0) e--;
  const t = b.subarray(0, e);
  try {
    return utf8.decode(t);
  } catch {
    return Buffer.from(t).toString("latin1");
  }
}

/** A ledger-safe short string (make, model, date). Credit and serials never pass through here. */
const ledgerText = (b) => (b ? bytesToText(b).replace(/[\0\r\n]+/g, " ").trim().slice(0, 128) || null : null);

const rel = (abs) => {
  const r = path.relative(ROOT, abs);
  return (r.startsWith("..") || path.isAbsolute(r) ? abs : r).split(path.sep).join("/");
};

const keyOf = (p) => (process.platform === "win32" ? path.resolve(p).toLowerCase() : path.resolve(p));
const isInside = (child, parent) => {
  const r = path.relative(parent, child);
  return r === "" || (!r.startsWith("..") && !path.isAbsolute(r));
};

/* ------------------------------------------------------------------------ */
/* reading credit, orientation and camera facts (values stay in memory)      */
/* ------------------------------------------------------------------------ */

const TYPE_SIZE = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8, 4];

/**
 * IFD0 (+ Exif and Interop IFDs) of a TIFF block. Bounds-checked; anything that
 * does not resolve is simply absent. Returns raw value bytes, never strings.
 */
export function readTiffFacts(buf, start, end) {
  // `unreadable` says which facts could not be settled because the structure holding them
  // cannot be walked: the caller refuses rather than guess that absent means "not there".
  const f = { unreadable: { credit: false, orientation: false, colour: false } };
  const lost = (...what) => {
    for (const w of what) f.unreadable[w] = true;
  };
  let settled = false;
  try {
    if (end > buf.length) end = buf.length;
    if (end - start < 8) return lost("credit", "orientation", "colour"), f;
    const order = buf.toString("latin1", start, start + 2);
    if (order !== "II" && order !== "MM") return lost("credit", "orientation", "colour"), f;
    const le = order === "II";
    const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
    const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
    if (u16(start + 2) !== 42) return lost("credit", "orientation", "colour"), f;
    /** null when the IFD itself cannot be walked; entries whose value lies outside the block are listed in `bad`. */
    const ifd = (off) => {
      const m = new Map();
      m.bad = new Set();
      if (off < 8 || start + off + 2 > end) return null;
      const base = start + off;
      const n = u16(base);
      if (base + 2 + n * 12 > end) return null;
      for (let i = 0; i < n; i++) {
        const p = base + 2 + i * 12;
        const type = u16(p + 2);
        const count = u32(p + 4);
        const bytes = (TYPE_SIZE[type] ?? 0) * count;
        const at = bytes <= 4 ? p + 8 : start + u32(p + 8);
        if (at < start || at + bytes > end) {
          m.bad.add(u16(p));
          continue;
        }
        m.set(u16(p), { type, count, p, bytes: buf.subarray(at, at + bytes), short: type === 3 ? u16(p + 8) : type === 4 ? u32(p + 8) : undefined });
      }
      return m;
    };
    const d0 = ifd(u32(start + 4));
    if (!d0) return lost("credit", "orientation", "colour"), f;
    if (d0.bad.has(0x013b) || d0.bad.has(0x8298) || d0.bad.has(0x9c9d)) lost("credit");
    if (d0.bad.has(0x0112)) lost("orientation");
    if (d0.bad.has(0x8769)) lost("colour");
    const get = (m, t) => m.get(t)?.bytes;
    f.make = get(d0, 0x010f);
    f.model = get(d0, 0x0110);
    f.dateTime = get(d0, 0x0132);
    f.artist = d0.has(0x013b) ? get(d0, 0x013b) : undefined;
    f.copyright = d0.has(0x8298) ? get(d0, 0x8298) : undefined;
    f.xpAuthor = d0.has(0x9c9d) ? get(d0, 0x9c9d) : undefined;
    if (d0.has(0x0112)) f.orientation = d0.get(0x0112).short;
    const exifPtr = d0.get(0x8769);
    settled = true; // IFD0 facts (credit, Orientation) are settled; what follows only concerns colour
    if (exifPtr) {
      const ex = ifd(exifPtr.type === 3 ? exifPtr.short : u32(exifPtr.p + 8));
      if (!ex) return lost("colour"), f;
      f.dateTimeOriginal = get(ex, 0x9003);
      if (ex.has(0xa001)) f.colorSpace = ex.get(0xa001).short;
      if (ex.bad.has(0xa001) || ex.bad.has(0xa005)) lost("colour");
      const iop = ex.get(0xa005);
      if (iop) {
        const io = ifd(iop.type === 3 ? iop.short : u32(iop.p + 8));
        if (!io || io.bad.has(0x0001)) return lost("colour"), f;
        const idx = get(io, 0x0001);
        if (idx) f.interopIndex = bytesToText(idx).trim();
      }
    }
  } catch {
    // Truncated or hostile structure: whatever was read so far stands, and what was not is unknown.
    lost(...(settled ? ["colour"] : ["credit", "orientation", "colour"]));
  }
  return f;
}

/** Refuse when EXIF IFD0 could not be walked: a byline or a non-1 Orientation in it would be lost silently. */
function checkExifReadable(exif) {
  if (exif?.unreadable.credit || exif?.unreadable.orientation) {
    refuse("EXIF IFD0 cannot be walked (MALFORMED), so the Artist, Copyright and Orientation it may carry are unknown; repair or re-export the file and run again");
  }
}

/** IPTC-IIM By-line (2:80) and Copyright Notice (2:116), honouring 1:90 UTF-8. */
function readIptcCredit(buf, s, e, out) {
  let p = s;
  let isUtf8 = false;
  const bylines = [];
  while (p + 5 <= e && buf[p] === 0x1c) {
    const rec = buf[p + 1];
    const ds = buf[p + 2];
    let len = buf.readUInt16BE(p + 3);
    p += 5;
    if (len & 0x8000) {
      const n = len & 0x7fff;
      if (n < 1 || n > 4 || p + n > e) return;
      len = buf.readUIntBE(p, n);
      p += n;
    }
    if (p + len > e) return;
    const v = buf.subarray(p, p + len);
    if (rec === 1 && ds === 90 && v.includes(Buffer.from([0x1b, 0x25, 0x47]))) isUtf8 = true;
    if (rec === 2 && ds === 80) {
      out.artistSeen = true;
      if (hasContent(v)) bylines.push(v);
    }
    if (rec === 2 && ds === 116) {
      out.copyrightSeen = true;
      if (hasContent(v) && !out.copyright) out.copyright = v;
    }
    p += len;
  }
  const dec = (b) => (isUtf8 ? Buffer.from(b).toString("utf8") : bytesToText(b));
  if (bylines.length && !out.artist) out.artist = Buffer.from(bylines.map(dec).join("; "), "utf8");
  if (out.copyright && !isUtf8) out.copyright = Buffer.from(dec(out.copyright), "utf8");
}

/** Photoshop IRB: find the IPTC resource (0x0404). */
function readIrbCredit(buf, s, e, out) {
  let p = s;
  while (p + 12 <= e && buf.toString("latin1", p, p + 4) === "8BIM") {
    const id = buf.readUInt16BE(p + 4);
    const q = p + 6 + ((1 + buf[p + 6] + 1) & ~1);
    if (q + 4 > e) return;
    const size = buf.readUInt32BE(q);
    const d = q + 4;
    if (d + size > e) return;
    if (id === 0x0404) readIptcCredit(buf, d, d + size, out);
    p = d + size + (size & 1);
  }
}

function xmlUnescape(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/*
 * XMP text can be up to the 16 MB inflate cap and is hostile input. A backtracking pattern such as
 * `<dc:creator\b[^>]*?(?:/>|>([\s\S]*?)</dc:creator>)` rescans to the end of the text from every
 * opening that never closes: quadratic, an hour for one small PNG. These scanners give the same
 * first match with indexOf only, and each byte is passed a bounded number of times.
 */
const WORD_CHAR = /[A-Za-z0-9_]/;
const SPACE_CHAR = /\s/;

/** Index of `<name` followed by a word boundary, at or after `from`; -1 when there is none. */
function openTagAt(s, name, from) {
  const open = "<" + name;
  for (let i = s.indexOf(open, from); i >= 0; i = s.indexOf(open, i + 1)) {
    const c = s[i + open.length];
    if (c === undefined || !WORD_CHAR.test(c)) return i;
  }
  return -1;
}

/** `<qname …/>` or `<qname …>inner</qname>`, first match: { inner } (undefined when self-closing), or null. */
function findElement(s, qname) {
  const close = `</${qname}>`;
  let closeMissing = false;
  for (let pos = 0; ; ) {
    const i = openTagAt(s, qname, pos);
    if (i < 0) return null;
    const gt = s.indexOf(">", i + 1 + qname.length);
    if (gt < 0) return null; // no '>' after this opening means none after any later one either
    if (s[gt - 1] === "/") return { inner: undefined };
    if (!closeMissing) {
      const c = s.indexOf(close, gt + 1);
      if (c >= 0) return { inner: s.slice(gt + 1, c) };
      closeMissing = true; // a later opening can still match, but only as a self-closing tag
    }
    pos = gt + 1;
  }
}

/** The quoted value (quotes included) of the first ` qname = "…"` or ` qname = '…'`, or null. */
function findAttribute(s, qname) {
  const unclosed = { '"': false, "'": false };
  for (let i = s.indexOf(qname, 1); i >= 0; i = s.indexOf(qname, i + 1)) {
    if (!SPACE_CHAR.test(s[i - 1])) continue;
    let j = i + qname.length;
    while (j < s.length && SPACE_CHAR.test(s[j])) j++;
    if (s[j] !== "=") continue;
    j++;
    while (j < s.length && SPACE_CHAR.test(s[j])) j++;
    const q = s[j];
    if ((q !== '"' && q !== "'") || unclosed[q]) continue;
    const end = s.indexOf(q, j + 1);
    if (end < 0) {
      unclosed[q] = true; // no later value in this quote can close either
      continue;
    }
    return s.slice(j, end + 1);
  }
  return null;
}

/** Every `<rdf:li attrs>content</rdf:li>`, in order, as [attrs, content]. */
function listItems(s) {
  const items = [];
  for (let pos = 0; ; ) {
    const i = openTagAt(s, "rdf:li", pos);
    if (i < 0) return items;
    const gt = s.indexOf(">", i + 7);
    if (gt < 0) return items;
    const c = s.indexOf("</rdf:li>", gt + 1);
    if (c < 0) return items; // later items would need a closing tag after this one's
    items.push([s.slice(i + 7, gt), s.slice(gt + 1, c)]);
    pos = c + 9;
  }
}

/** Tags removed, as `replace(/<[^>]*>/g, "")` would: an unclosed '<' and what follows it stay. */
function stripTags(s) {
  let out = "";
  for (let i = 0; ; ) {
    const lt = s.indexOf("<", i);
    const gt = lt < 0 ? -1 : s.indexOf(">", lt + 1);
    if (gt < 0) return out + s.slice(i);
    out += s.slice(i, lt);
    i = gt + 1;
  }
}

/** dc:creator (rdf:Seq) and dc:rights (rdf:Alt, x-default first) from an XMP packet. */
function readXmpCredit(text, out) {
  const prop = (name) => {
    const el = findElement(text, `dc:${name}`);
    const attr = findAttribute(text, `dc:${name}`);
    if (!el && !attr) return { seen: false, values: [] };
    if (!el) return { seen: true, values: [xmlUnescape(attr.slice(1, -1))] };
    const inner = el.inner ?? "";
    const lis = listItems(inner);
    if (!lis.length) return { seen: true, values: [xmlUnescape(stripTags(inner))] };
    const def = lis.find((m) => /xml:lang\s*=\s*["']x-default["']/.test(m[0]));
    const chosen = name === "rights" ? [def ?? lis[0]] : lis;
    return { seen: true, values: chosen.map((m) => xmlUnescape(stripTags(m[1]))) };
  };
  const c = prop("creator");
  if (c.seen) out.artistSeen = true;
  const cv = c.values.map((v) => v.trim()).filter(Boolean);
  if (cv.length && !out.artist) out.artist = Buffer.from(cv.join("; "), "utf8");
  const r = prop("rights");
  if (r.seen) out.copyrightSeen = true;
  const rv = r.values.map((v) => v.trim()).filter(Boolean);
  if (rv.length && !out.copyright) out.copyright = Buffer.from(rv[0], "utf8");

  const simple = (qname) => {
    const m = new RegExp(`\\s${qname}\\s*=\\s*"([^"]*)"|<${qname}>([^<]*)</${qname}>`).exec(text);
    return m ? Buffer.from(xmlUnescape(m[1] ?? m[2]), "utf8") : undefined;
  };
  out.xmpMake = simple("tiff:Make");
  out.xmpModel = simple("tiff:Model");
  out.xmpDate = simple("exif:DateTimeOriginal") ?? simple("xmp:CreateDate") ?? simple("photoshop:DateCreated");
}

/**
 * Settle credit in the specified precedence: EXIF IFD0 (Artist, then XPAuthor),
 * then IPTC, then XMP. `seen` without a value means the field was there but empty.
 */
function resolveCredit({ exif, iptc, xmp, text }) {
  const credit = { artist: null, copyright: null, artistSeen: false, copyrightSeen: false };
  const take = (field, value) => {
    if (!credit[field] && value && hasContent(value)) credit[field] = value;
  };
  if (exif) {
    if (exif.artist !== undefined || exif.xpAuthor !== undefined) credit.artistSeen = true;
    if (exif.copyright !== undefined) credit.copyrightSeen = true;
    take("artist", exif.artist);
    if (exif.xpAuthor && exif.xpAuthor.length >= 2) {
      const s = Buffer.from(exif.xpAuthor.subarray(0, exif.xpAuthor.length & ~1)).toString("utf16le").replace(/\0+$/, "");
      take("artist", Buffer.from(s, "utf8"));
    }
    take("copyright", exif.copyright);
  }
  for (const src of [text, iptc, xmp]) {
    if (!src) continue;
    if (src.artistSeen) credit.artistSeen = true;
    if (src.copyrightSeen) credit.copyrightSeen = true;
    take("artist", src.artist);
    take("copyright", src.copyright);
  }
  return credit;
}

/** The audit saw credit; can we carry it? Refuse rather than lose a byline silently. */
function checkCreditReadable(audit, credit) {
  if (audit.credit.artist && !credit.artist && !credit.artistSeen) refuse("artist credit is present but its value could not be read");
  if (audit.credit.copyright && !credit.copyright && !credit.copyrightSeen) refuse("copyright credit is present but its value could not be read");
}

/* ------------------------------------------------------------------------ */
/* JPEG: marker surgery                                                      */
/* ------------------------------------------------------------------------ */

const XMP_NS = "http://ns.adobe.com/xap/1.0/\0";
const XMP_EXT_NS = "http://ns.adobe.com/xmp/extension/\0";

function walkJpeg(buf) {
  const len = buf.length;
  if (len < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) refuse("no JPEG start-of-image marker");
  const segs = [];
  let p = 2;
  for (;;) {
    if (p >= len) refuse("no end-of-image marker (truncated)");
    if (buf[p] !== 0xff) refuse(`expected a JPEG marker at offset ${p}`);
    while (p < len && buf[p] === 0xff) p++;
    if (p >= len) refuse("no end-of-image marker (truncated)");
    const at = p - 1; // the 0xFF directly before the marker byte
    const m = buf[p++];
    if (m === 0xd9) return { segs, eoi: p };
    if ((m >= 0xd0 && m <= 0xd7) || m === 0x01) {
      segs.push({ m, at, end: p });
      continue;
    }
    if (m === 0xd8) refuse(`second start-of-image marker at offset ${at}`);
    if (p + 2 > len) refuse(`segment ${hex(0xff00 | m)} at offset ${at} overruns the file`);
    const L = buf.readUInt16BE(p);
    if (L < 2 || p + L > len) refuse(`segment ${hex(0xff00 | m)} at offset ${at} overruns the file`);
    const seg = { m, at, s: p + 2, e: p + L, end: p + L };
    p += L;
    if (m === 0xda) {
      let q = p;
      for (;;) {
        q = buf.indexOf(0xff, q);
        if (q < 0 || q + 1 >= len) refuse(`scan at offset ${p} ends without an end-of-image marker (truncated)`);
        const n = buf[q + 1];
        if (n === 0x00 || (n >= 0xd0 && n <= 0xd7)) q += 2;
        else if (n === 0xff) q += 1;
        else break;
      }
      seg.end = q; // header + entropy-coded data, copied verbatim
      p = q;
    }
    segs.push(seg);
  }
}

/** One minimal EXIF APP1: big-endian IFD0 with Orientation / Artist / Copyright, nothing else. */
export function buildMinimalExif({ orientation, artist, copyright }) {
  const entries = [];
  if (orientation !== undefined && orientation !== 1) {
    const v = Buffer.alloc(4);
    v.writeUInt16BE(orientation, 0);
    entries.push({ tag: 0x0112, type: 3, count: 1, inline: v });
  }
  const ascii = (b) => {
    let e = b.length;
    while (e > 0 && b[e - 1] === 0) e--;
    return Buffer.concat([b.subarray(0, e), Buffer.from([0])]);
  };
  if (artist) entries.push({ tag: 0x013b, type: 2, data: ascii(artist) });
  if (copyright) entries.push({ tag: 0x8298, type: 2, data: ascii(copyright) });
  if (!entries.length) return null;

  const ifdSize = 2 + entries.length * 12 + 4;
  let dataAt = 8 + ifdSize;
  const tiff = [];
  const head = Buffer.from("MM\0*\0\0\0\x08", "latin1");
  const ifd = Buffer.alloc(ifdSize);
  ifd.writeUInt16BE(entries.length, 0);
  const blobs = [];
  entries.forEach((en, i) => {
    const o = 2 + i * 12;
    ifd.writeUInt16BE(en.tag, o);
    ifd.writeUInt16BE(en.type, o + 2);
    if (en.inline) {
      ifd.writeUInt32BE(en.count, o + 4);
      en.inline.copy(ifd, o + 8);
    } else {
      ifd.writeUInt32BE(en.data.length, o + 4);
      if (en.data.length <= 4) en.data.copy(ifd, o + 8);
      else {
        ifd.writeUInt32BE(dataAt, o + 8);
        const padded = en.data.length & 1 ? Buffer.concat([en.data, Buffer.from([0])]) : en.data;
        blobs.push(padded);
        dataAt += padded.length;
      }
    }
  });
  ifd.writeUInt32BE(0, ifdSize - 4); // no IFD1
  tiff.push(head, ifd, ...blobs);
  const payload = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), ...tiff]);
  if (payload.length + 2 > 0xffff) refuse("credit is too long to fit one EXIF APP1 segment");
  const seg = Buffer.alloc(4);
  seg.writeUInt16BE(0xffe1, 0);
  seg.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([seg, payload]);
}

/** Plan and build the stripped JPEG in memory. Throws Refused. */
export function stripJpeg(buf, audit) {
  const { segs, eoi } = walkJpeg(buf);
  const parts = [];
  const dropped = new Map();
  const drop = (label, n = 1) => dropped.set(label, (dropped.get(label) ?? 0) + n);
  let exif = null;
  const iptc = {};
  let xmpText = "";
  const ext = new Map();
  let icc = false;

  for (const s of segs) {
    const raw = buf.subarray(s.at, s.end);
    if (s.s === undefined) {
      parts.push({ m: s.m, bytes: raw });
      continue;
    }
    const starts = (sig) => s.e - s.s >= sig.length && buf.toString("latin1", s.s, s.s + sig.length) === sig;
    const m = s.m;
    if (m === 0xe0) {
      if (starts("JFXX\0")) drop("APP0 JFXX thumbnail");
      else if (starts("JFIF\0") && s.e - s.s >= 14 && buf[s.s + 12] * buf[s.s + 13] > 0) {
        const payload = Buffer.from(buf.subarray(s.s, s.s + 14));
        payload[12] = 0;
        payload[13] = 0;
        const head = Buffer.from([0xff, 0xe0, 0, 16]);
        parts.push({ m, bytes: Buffer.concat([head, payload]) });
        drop("APP0 JFIF thumbnail");
      } else parts.push({ m, bytes: raw });
    } else if (m === 0xe1) {
      if (starts("Exif\0")) {
        if (!exif) exif = readTiffFacts(buf, s.s + 6, s.e);
        drop("APP1 Exif");
      } else if (starts(XMP_NS)) {
        xmpText += buf.toString("utf8", s.s + XMP_NS.length, s.e);
        drop("APP1 XMP");
      } else if (starts(XMP_EXT_NS)) {
        const h = s.s + XMP_EXT_NS.length;
        if (h + 40 <= s.e) {
          const guid = buf.toString("latin1", h, h + 32);
          if (!ext.has(guid)) ext.set(guid, []);
          ext.get(guid).push({ offset: buf.readUInt32BE(h + 36), data: buf.subarray(h + 40, s.e) });
        }
        drop("APP1 extended XMP");
      } else drop("APP1 other");
    } else if (m === 0xe2) {
      if (starts("ICC_PROFILE\0")) {
        icc = true;
        parts.push({ m, bytes: raw });
      } else drop(starts("MPF\0") ? "APP2 MPF" : "APP2 other");
    } else if (m === 0xee && starts("Adobe")) {
      parts.push({ m, bytes: raw });
    } else if (m === 0xed) {
      if (starts("Photoshop 3.0\0")) readIrbCredit(buf, s.s + 14, s.e, iptc);
      drop("APP13");
    } else if (m >= 0xe3 && m <= 0xef) {
      drop(`APP${m - 0xe0}`);
    } else if (m === 0xfe) {
      drop("COM");
    } else {
      parts.push({ m, bytes: raw });
    }
  }
  const trailing = buf.length - eoi;
  if (trailing > 0) dropped.set(`${trailing} byte(s) after end-of-image`, 1);

  for (const chunks of ext.values()) {
    chunks.sort((a, b) => a.offset - b.offset);
    xmpText += Buffer.concat(chunks.map((c) => c.data)).toString("utf8");
  }
  const xmp = {};
  if (xmpText) readXmpCredit(xmpText, xmp);

  checkExifReadable(exif);
  let uncalibrated = false;
  if (!icc && exif) {
    // DCF: Adobe RGB is ColorSpace 0xFFFF together with InteropIndex "R03"; some bodies write 0x0002, and
    // 0xFFFD / 0xFFFE name a wide-gamut or ICC space whose profile is missing. 0xFFFF alone names no space.
    const REMEDY = "; re-export it with its colour profile embedded (ICC in APP2 is kept) and run again";
    if (exif.unreadable.colour) refuse(`no ICC profile and the EXIF ColorSpace / InteropIndex cannot be read (MALFORMED), so the colour space is unknown${REMEDY}`);
    if ([0x0002, 0xfffd, 0xfffe].includes(exif.colorSpace)) refuse(`no ICC profile and EXIF ColorSpace is ${hex(exif.colorSpace)}, a non-sRGB space${REMEDY}`);
    if (exif.interopIndex === "R03") refuse(`no ICC profile and EXIF InteropIndex R03 marks Adobe RGB${REMEDY}`);
    uncalibrated = exif.colorSpace === 0xffff;
  }

  const credit = resolveCredit({ exif, iptc, xmp });
  checkCreditReadable(audit, credit);
  const orientation = exif?.orientation;
  const app1 = buildMinimalExif({ orientation, artist: credit.artist, copyright: credit.copyright });

  const at = parts.length && parts[0].m === 0xe0 ? 1 : 0;
  const body = parts.map((p) => p.bytes);
  if (app1) body.splice(at, 0, app1);
  const out = Buffer.concat([Buffer.from([0xff, 0xd8]), ...body, Buffer.from([0xff, 0xd9])]);

  const inserted = [];
  if (orientation !== undefined && orientation !== 1) inserted.push("Orientation");
  if (credit.artist) inserted.push("Artist");
  if (credit.copyright) inserted.push("Copyright");

  return {
    out,
    action:
      describe(dropped, inserted.length ? `insert EXIF IFD0 (${inserted.join(", ")})` : null) +
      (uncalibrated ? " (EXIF ColorSpace 0xFFFF without ICC or R03 goes with it: rendered as sRGB either way)" : ""),
    credit: { artist: !!credit.artist, copyright: !!credit.copyright },
    orientation: orientation !== undefined && orientation !== 1 ? orientation : undefined,
    camera: {
      make: ledgerText(exif?.make ?? xmp.xmpMake),
      model: ledgerText(exif?.model ?? xmp.xmpModel),
    },
    captureDate: ledgerText(exif?.dateTimeOriginal ?? exif?.dateTime ?? xmp.xmpDate),
  };
}

function describe(dropped, insert) {
  const d = [...dropped].map(([label, n]) => (n > 1 ? `${label} x${n}` : label));
  return [d.length ? `drop ${d.join(", ")}` : null, insert].filter(Boolean).join("; ") || "rewrite";
}

/* ------------------------------------------------------------------------ */
/* PNG: chunk surgery                                                        */
/* ------------------------------------------------------------------------ */

/** Everything that shapes pixels or colour. Every other ancillary chunk goes. */
const PNG_KEEP = new Set([
  "IHDR", "PLTE", "tRNS", "iCCP", "sRGB", "gAMA", "cHRM", "pHYs", "IDAT", "IEND",
  "bKGD", "sBIT", "hIST", "sPLT", "cICP", "mDCv", "cLLI", "acTL", "fcTL", "fdAT",
]);

function pngChunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])) >>> 0, 0);
  return Buffer.concat([head, data, crc]);
}

/** tEXt when the value is Latin-1 without NUL, iTXt (UTF-8) otherwise. */
function pngCreditChunk(keyword, valueBytes) {
  const text = bytesToText(valueBytes).replace(/\0+/g, "; ");
  if (/^[\x01-\xFF]*$/.test(text)) return pngChunk("tEXt", Buffer.concat([Buffer.from(keyword + "\0", "latin1"), Buffer.from(text, "latin1")]));
  return pngChunk("iTXt", Buffer.concat([Buffer.from(keyword + "\0\0\0\0\0", "latin1"), Buffer.from(text, "utf8")]));
}

function decodeRawProfile(bytes) {
  const lines = bytes.toString("latin1").split("\n");
  return Buffer.from(lines.slice(3).join("").replace(/\s+/g, ""), "hex");
}

export function stripPng(buf, audit) {
  const len = buf.length;
  if (len < 8 || buf.readUInt32BE(0) !== 0x89504e47 || buf.readUInt32BE(4) !== 0x0d0a1a0a) refuse("no PNG signature");
  const kept = [];
  const dropped = new Map();
  const drop = (label) => dropped.set(label, (dropped.get(label) ?? 0) + 1);
  let exif = null;
  const text = {};
  const iptc = {};
  let xmpText = "";
  let iend = -1;
  let p = 8;

  const onText = (keyword, value) => {
    const k = keyword.toLowerCase();
    if (k === "xml:com.adobe.xmp") xmpText += value.toString("utf8");
    else if (k === "raw profile type xmp") xmpText += decodeRawProfile(value).toString("utf8");
    else if (k === "raw profile type exif" || k === "raw profile type app1") {
      const b = decodeRawProfile(value);
      if (!exif) exif = readTiffFacts(b, b.toString("latin1", 0, 4) === "Exif" ? 6 : 0, b.length);
    } else if (k === "raw profile type iptc" || k === "raw profile type 8bim") {
      const b = decodeRawProfile(value);
      if (b[0] === 0x1c) readIptcCredit(b, 0, b.length, iptc);
      else readIrbCredit(b, 0, b.length, iptc);
    } else if (k === "author" || k === "artist") {
      text.artistSeen = true;
      if (!text.artist && hasContent(value)) text.artist = value;
    } else if (k === "copyright") {
      text.copyrightSeen = true;
      if (!text.copyright && hasContent(value)) text.copyright = value;
    } else if (value.includes("<x:xmpmeta")) xmpText += value.toString("utf8");
  };

  while (p + 12 <= len) {
    const L = buf.readUInt32BE(p);
    const type = buf.toString("latin1", p + 4, p + 8);
    const d = p + 8;
    if (!/^[A-Za-z]{4}$/.test(type)) refuse(`invalid PNG chunk type at offset ${p}`);
    if (d + L + 4 > len) refuse(`${type} at offset ${p} overruns the file (truncated)`);
    if ((crc32(buf.subarray(p + 4, d + L)) >>> 0) !== buf.readUInt32BE(d + L)) refuse(`${type} at offset ${p} has a bad CRC`);
    const data = buf.subarray(d, d + L);
    const whole = buf.subarray(p, d + L + 4);
    if (PNG_KEEP.has(type)) {
      kept.push({ type, bytes: whole });
    } else if (type[0] === type[0].toUpperCase()) {
      refuse(`unknown critical chunk ${type} at offset ${p}`);
    } else {
      try {
        if (type === "eXIf") {
          if (!exif) exif = readTiffFacts(data, data.toString("latin1", 0, 4) === "Exif" ? 6 : 0, data.length);
        } else if (type === "tEXt") {
          const z = data.indexOf(0);
          if (z > 0) onText(data.toString("latin1", 0, z), Buffer.from(data.subarray(z + 1).toString("latin1"), "utf8"));
        } else if (type === "zTXt") {
          const z = data.indexOf(0);
          if (z > 0) onText(data.toString("latin1", 0, z), Buffer.from(inflateSync(data.subarray(z + 2), { maxOutputLength: 16 << 20 }).toString("latin1"), "utf8"));
        } else if (type === "iTXt") {
          const z = data.indexOf(0);
          const langEnd = z < 0 ? -1 : data.indexOf(0, z + 3);
          const transEnd = langEnd < 0 ? -1 : data.indexOf(0, langEnd + 1);
          if (z > 0 && transEnd > 0) {
            const raw = data.subarray(transEnd + 1);
            onText(data.toString("latin1", 0, z), data[z + 1] === 1 ? inflateSync(raw, { maxOutputLength: 16 << 20 }) : raw);
          }
        }
      } catch {
        // An undecodable text chunk carries nothing we can keep; it is dropped either way.
      }
      drop(type);
    }
    p = d + L + 4;
    if (type === "IEND") {
      iend = p;
      break;
    }
  }
  if (iend < 0) refuse("no IEND chunk (truncated)");
  if (iend < len) dropped.set(`${len - iend} byte(s) after IEND`, 1);

  checkExifReadable(exif);
  const xmp = {};
  if (xmpText) readXmpCredit(xmpText, xmp);
  const credit = resolveCredit({ exif, text, iptc, xmp });
  checkCreditReadable(audit, credit);

  const orientation = exif?.orientation !== undefined && exif.orientation !== 1 ? exif.orientation : undefined;
  const inserted = [];
  const out = [buf.subarray(0, 8)];
  for (const c of kept) {
    if (c.type === "IDAT" && orientation !== undefined && !inserted.includes("eXIf Orientation")) {
      const app1 = buildMinimalExif({ orientation });
      out.push(pngChunk("eXIf", app1.subarray(10))); // TIFF block without APP1 header and "Exif\0\0"
      inserted.push("eXIf Orientation");
    }
    if (c.type === "IEND") {
      if (credit.artist) {
        out.push(pngCreditChunk("Author", credit.artist));
        inserted.push("Author");
      }
      if (credit.copyright) {
        out.push(pngCreditChunk("Copyright", credit.copyright));
        inserted.push("Copyright");
      }
    }
    out.push(c.bytes);
  }
  return {
    out: Buffer.concat(out),
    action: describe(dropped, inserted.length ? `insert ${inserted.join(", ")}` : null),
    credit: { artist: !!credit.artist, copyright: !!credit.copyright },
    orientation,
    camera: { make: ledgerText(exif?.make ?? xmp.xmpMake), model: ledgerText(exif?.model ?? xmp.xmpModel) },
    captureDate: ledgerText(exif?.dateTimeOriginal ?? exif?.dateTime ?? xmp.xmpDate),
  };
}

/* ------------------------------------------------------------------------ */
/* still verification                                                        */
/* ------------------------------------------------------------------------ */

async function rawDecode(buf) {
  // No .rotate(), no autoOrient: pixels exactly as stored.
  return sharp(buf, { failOn: "error", limitInputPixels: false }).raw().toBuffer({ resolveWithObject: true });
}

async function verifyPixels(before, after) {
  let a;
  let b;
  try {
    a = await rawDecode(before);
  } catch {
    refuse("sharp cannot decode the original");
  }
  try {
    b = await rawDecode(after);
  } catch {
    refuse("sharp cannot decode the stripped output");
  }
  const ia = a.info;
  const ib = b.info;
  if (ia.width !== ib.width || ia.height !== ib.height || ia.channels !== ib.channels) refuse("decoded dimensions or channels differ after stripping");
  if (!a.data.equals(b.data)) refuse("decoded pixels differ after stripping");
}

/* ------------------------------------------------------------------------ */
/* video: stream-copy remux                                                  */
/* ------------------------------------------------------------------------ */

let ffmpegBin;
function ffmpeg() {
  ffmpegBin ??= require("ffmpeg-static");
  if (!ffmpegBin) refuse("ffmpeg-static has no binary for this platform");
  return ffmpegBin;
}

/** Children and temp files of this run, so an interrupt can clean up after itself. */
const liveChildren = new Set();
const liveTemps = new Set();

/** Run ffmpeg. stderr is kept for a line count only: it can quote metadata. */
function runFfmpeg(args) {
  return new Promise((resolve) => {
    const child = execFile(ffmpeg(), ["-hide_banner", "-nostdin", ...args], { encoding: "buffer", maxBuffer: 256 * 1024 * 1024, timeout: FFMPEG_TIMEOUT, windowsHide: true }, (err, stdout, stderr) => {
      liveChildren.delete(child);
      resolve({ code: err ? (typeof err.code === "number" ? err.code : -1) : 0, stdout, stderr: stderr.toString("utf8").trim() });
    });
    liveChildren.add(child);
  });
}

/** Positional reads from an open file handle. */
async function readAt(fh, pos, len) {
  const b = Buffer.alloc(len);
  let got = 0;
  while (got < len) {
    const { bytesRead } = await fh.read(b, got, len - got, pos + got);
    if (!bytesRead) break;
    got += bytesRead;
  }
  return b.subarray(0, got);
}

function ebmlVint(b, o, isId) {
  if (o >= b.length || b[o] === 0) return null;
  const len = Math.clz32(b[o]) - 23;
  if (len > (isId ? 4 : 8) || o + len > b.length) return null;
  if (isId) return { value: b.readUIntBE(o, len), len };
  let v = b[o] & (0xff >> len);
  let allOnes = v === 0xff >> len;
  for (let i = 1; i < len; i++) {
    v = v * 256 + b[o + i];
    if (b[o + i] !== 0xff) allOnes = false;
  }
  return { value: v, len, unknown: allOnes };
}

/**
 * Matroska Segment Info: TimestampScale, Duration (value, file offset, width) and
 * a leading CRC-32 child if any. null when there is no Info before the first Cluster.
 */
async function matroskaInfo(file) {
  const fh = await open(file, "r");
  try {
    const { size } = await fh.stat();
    const header = async (pos) => {
      const b = await readAt(fh, pos, 12);
      const id = ebmlVint(b, 0, true);
      const sz = id && ebmlVint(b, id.len, false);
      return id && sz ? { id: id.value, ds: pos + id.len + sz.len, size: sz.value, unknown: sz.unknown } : null;
    };
    let p = 0;
    while (p < size) {
      const h = await header(p);
      if (!h) return null;
      if (h.id !== 0x18538067) {
        if (h.unknown) return null;
        p = h.ds + h.size;
        continue;
      }
      const segEnd = h.unknown ? size : Math.min(size, h.ds + h.size);
      for (let q = h.ds; q < segEnd; ) {
        const c = await header(q);
        if (!c || c.id === 0x1f43b675 || c.unknown) return null;
        if (c.id === 0x1549a966) {
          if (c.size > 1 << 20 || c.ds + c.size > size) return null;
          const b = await readAt(fh, c.ds, c.size);
          const info = { scale: 1000000, duration: null, durationAt: -1, durationSize: 0, infoAt: c.ds, infoSize: c.size, crcAt: -1 };
          for (let r = 0, first = true; r < b.length; first = false) {
            const id = ebmlVint(b, r, true);
            const sz = id && ebmlVint(b, r + id.len, false);
            if (!id || !sz || sz.unknown) return null;
            const d = r + id.len + sz.len;
            if (d + sz.value > b.length) return null;
            if (id.value === 0x2ad7b1 && sz.value >= 1 && sz.value <= 6) info.scale = b.readUIntBE(d, sz.value);
            if (id.value === 0x4489 && (sz.value === 4 || sz.value === 8)) {
              info.duration = sz.value === 8 ? b.readDoubleBE(d) : b.readFloatBE(d);
              info.durationAt = c.ds + d;
              info.durationSize = sz.value;
            }
            if (id.value === 0xbf && first && sz.value === 4) info.crcAt = c.ds + d;
            r = d + sz.value;
          }
          return info;
        }
        q = c.ds + c.size;
      }
      return null;
    }
    return null;
  } finally {
    await fh.close();
  }
}

/**
 * A stream-copy remux recomputes Segment Duration from packet ends, which moves it
 * by the Opus CodecDelay (villa-party-1: 4395 -> 4408 ms). The packets are the same,
 * so the original's declared Duration is written back in place (same width), and
 * a leading Info CRC-32 is recomputed. Returns true when the output was patched.
 */
async function restoreMatroskaDuration(src, dst) {
  const a = await matroskaInfo(src);
  if (!a || a.duration === null) return false;
  const b = await matroskaInfo(dst);
  if (!b || b.duration === null) refuse("the remux has no Segment Info Duration to carry the original's");
  const want = (a.duration * a.scale) / b.scale;
  if (b.duration === want) return false;
  const value = Buffer.alloc(b.durationSize);
  if (b.durationSize === 8) value.writeDoubleBE(want);
  else if (Math.fround(want) === want) value.writeFloatBE(want);
  else refuse("the original's Duration does not fit the remux's 4-byte Duration element");
  const fh = await open(dst, "r+");
  try {
    await fh.write(value, 0, value.length, b.durationAt);
    if (b.crcAt >= 0) {
      const from = b.crcAt + 4;
      const rest = await readAt(fh, from, b.infoAt + b.infoSize - from);
      const crc = Buffer.alloc(4);
      crc.writeUInt32LE(crc32(rest) >>> 0, 0);
      await fh.write(crc, 0, 4, b.crcAt);
    }
    await fh.datasync();
  } finally {
    await fh.close();
  }
  return true;
}

/** MP4 / MOV movie header: duration in its timescale. null when absent. */
async function movieHeader(file) {
  const fh = await open(file, "r");
  try {
    const { size } = await fh.stat();
    const box = async (pos, end) => {
      const h = await readAt(fh, pos, 16);
      if (h.length < 8) return null;
      let len = h.readUInt32BE(0);
      let hl = 8;
      if (len === 1) {
        if (h.length < 16) return null;
        len = Number(h.readBigUInt64BE(8));
        hl = 16;
      } else if (len === 0) len = end - pos;
      if (len < hl || pos + len > end) return null;
      return { type: h.toString("latin1", 4, 8), d: pos + hl, e: pos + len };
    };
    for (let p = 0; p < size; ) {
      const b = await box(p, size);
      if (!b) return null;
      if (b.type === "moov") {
        for (let q = b.d; q < b.e; ) {
          const c = await box(q, b.e);
          if (!c) return null;
          if (c.type === "mvhd") {
            const m = await readAt(fh, c.d, 32);
            if (m.length < 20) return null;
            if (m[0] === 1) return m.length >= 32 ? { timescale: m.readUInt32BE(20), duration: m.readBigUInt64BE(24) } : null;
            return { timescale: m.readUInt32BE(12), duration: BigInt(m.readUInt32BE(16)) };
          }
          q = c.e;
        }
        return null;
      }
      p = b.e;
    }
    return null;
  } finally {
    await fh.close();
  }
}

/** ffmpeg's format start time, read from its probe line only. Nothing else of stderr is used. */
async function formatStart(file) {
  const r = await runFfmpeg(["-i", file]);
  const m = /\bstart: (-?\d+(?:\.\d+)?)/.exec(r.stderr);
  return m ? m[1] : null;
}

/** Duration and start time of the remux must equal the original's. */
async function verifyTiming(src, dst, fmt) {
  if (fmt === "webm" || fmt === "matroska") {
    const a = await matroskaInfo(src);
    const b = await matroskaInfo(dst);
    if (a?.duration != null && (b?.duration == null || a.duration * a.scale !== b.duration * b.scale)) refuse("container duration changed after the remux (Segment Info Duration)");
  } else {
    const a = await movieHeader(src);
    const b = await movieHeader(dst);
    if (a && (!b || a.duration * BigInt(b.timescale) !== b.duration * BigInt(a.timescale))) refuse("container duration changed after the remux (mvhd)");
  }
  const sa = await formatStart(src);
  const sb = await formatStart(dst);
  if (sa === null || sa !== sb) refuse(sa === null ? "ffmpeg reports no start time for the original" : "stream start time changed after the remux");
}

/** Global section of `-f ffmetadata`: key → value, with the format's backslash escapes undone. */
function parseFfmetadata(text) {
  const map = new Map();
  const lines = [];
  let cur = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\" && i + 1 < text.length) cur += "\\" + text[++i];
    else if (ch === "\n") {
      lines.push(cur);
      cur = "";
    } else if (ch !== "\r") cur += ch;
  }
  lines.push(cur);
  for (const line of lines) {
    if (line.startsWith("[")) break;
    if (!line || line.startsWith(";") || line.startsWith("#")) continue;
    let key = "";
    let value = null;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "\\") {
        const n = line[++i];
        if (value === null) key += n;
        else value += n;
      } else if (ch === "=" && value === null) value = "";
      else if (value === null) key += ch;
      else value += ch;
    }
    if (value !== null && !map.has(key.toLowerCase())) map.set(key.toLowerCase(), value);
  }
  return map;
}

const VIDEO_ARTIST_KEYS = ["artist", "author", "com.apple.quicktime.artist", "com.apple.quicktime.author"];
const VIDEO_COPYRIGHT_KEYS = ["copyright", "com.apple.quicktime.copyright"];

async function videoFacts(abs, audit) {
  const r = await runFfmpeg(["-v", "error", "-i", abs, "-f", "ffmetadata", "-"]);
  if (r.code !== 0) refuse("ffmpeg cannot read the container's metadata");
  const meta = parseFfmetadata(r.stdout.toString("utf8"));
  const pick = (keys) => {
    let seen = false;
    for (const k of keys) {
      if (!meta.has(k)) continue;
      seen = true;
      const v = meta.get(k).trim();
      if (v) return { value: v, seen };
    }
    return { value: null, seen };
  };
  const artist = pick(VIDEO_ARTIST_KEYS);
  const copyright = pick(VIDEO_COPYRIGHT_KEYS);
  checkCreditReadable(audit, { artist: artist.value, copyright: copyright.value, artistSeen: artist.seen, copyrightSeen: copyright.seen });
  const first = (...keys) => keys.map((k) => meta.get(k)).find((v) => v && v.trim());
  const small = (v) => (v ? v.replace(/[\r\n]+/g, " ").trim().slice(0, 128) : null);
  return {
    artist: artist.value,
    copyright: copyright.value,
    camera: { make: small(first("com.apple.quicktime.make", "make")), model: small(first("com.apple.quicktime.model", "model")) },
    captureDate: small(first("com.apple.quicktime.creationdate", "creation_time", "date_recorded", "date")),
  };
}

function videoFormat(kind, abs) {
  if (kind === "mov") return "mov";
  if (kind === "mp4") return "mp4";
  return /\.webm$/i.test(abs) ? "webm" : "matroska";
}

async function streamHashes(file, copy) {
  const r = await runFfmpeg(["-v", "error", "-i", file, "-map", "0", ...(copy ? ["-c", "copy"] : []), "-f", "streamhash", "-hash", "sha256", "-"]);
  if (r.code !== 0 || r.stderr) return null;
  return r.stdout.toString("latin1").trim();
}

/** Build the remux args. Credit values go to ffmpeg's argv only, never to our output. */
function remuxArgs(src, dst, fmt, facts) {
  const args = ["-v", "error", "-y", "-i", src, "-map", "0", "-c", "copy", "-map_metadata", "-1", "-map_chapters", "-1"];
  if (facts.artist) args.push("-metadata", `artist=${facts.artist}`);
  if (facts.copyright) args.push("-metadata", `copyright=${facts.copyright}`);
  args.push("-fflags", "+bitexact");
  if (fmt === "mp4" || fmt === "mov") args.push("-movflags", "+faststart");
  // Matroska: keep timestamps as stored (an Opus CodecDelay start of -7 ms would otherwise become 0).
  else args.push("-copyts");
  args.push("-f", fmt, dst);
  return args;
}

/* ------------------------------------------------------------------------ */
/* git scope and guards                                                      */
/* ------------------------------------------------------------------------ */

const topCache = new Map();
function gitTop(dir) {
  if (!topCache.has(dir)) {
    let top = null;
    try {
      top = path.resolve(execFileSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { stdio: ["ignore", "pipe", "ignore"] }).toString("utf8").trim());
    } catch {
      top = null;
    }
    topCache.set(dir, top);
  }
  return topCache.get(dir);
}

const trackedCache = new Map();
function trackedFiles(top) {
  if (!trackedCache.has(top)) {
    trackedCache.set(
      top,
      new Set(
        execFileSync("git", ["-C", top, "ls-files", "-z"], { maxBuffer: 64 * 1024 * 1024 })
          .toString("utf8")
          .split("\0")
          .filter(Boolean)
          .map((f) => keyOf(path.join(top, f))),
      ),
    );
  }
  return trackedCache.get(top);
}

/** Every target must be in its work tree's index and match no ignore rule. Returns [{ abs, reason }]. */
function trackingProblems(files) {
  const byTop = new Map();
  const problems = [];
  for (const abs of files) {
    const top = gitTop(path.dirname(abs));
    if (!top) {
      problems.push({ abs, reason: "not inside a git work tree" });
      continue;
    }
    if (!byTop.has(top)) byTop.set(top, []);
    byTop.get(top).push(abs);
  }
  for (const [top, list] of byTop) {
    const tracked = trackedFiles(top);
    const rels = list.map((abs) => path.relative(top, abs).split(path.sep).join("/"));
    let ignored = new Set();
    try {
      const out = execFileSync("git", ["-C", top, "check-ignore", "--no-index", "-z", "--stdin"], { input: rels.join("\0") + "\0", stdio: ["pipe", "pipe", "ignore"] });
      ignored = new Set(out.toString("utf8").split("\0").filter(Boolean).map((f) => keyOf(path.join(top, f))));
    } catch (err) {
      if (err.status !== 1) for (const abs of list) problems.push({ abs, reason: "git check-ignore failed" });
    }
    for (const abs of list) {
      if (!tracked.has(keyOf(abs))) problems.push({ abs, reason: "not tracked by git" });
      else if (ignored.has(keyOf(abs))) problems.push({ abs, reason: "matches a .gitignore rule" });
    }
  }
  return problems;
}

/** `.<name>.strip-tmp-<pid>.<ext>` as written by tempBeside(). */
const TEMP_NAME = /^\..+\.strip-tmp-(\d+)(\.[^.]*)?$/;

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
}

/**
 * Leftovers of a run that was killed before its finally could unlink: temps beside
 * the targets whose writer is gone and that git does not track. --apply removes
 * them, --dry-run lists them.
 */
async function sweepStaleTemps(dirs, apply) {
  const lines = [];
  let failed = 0;
  for (const dir of dirs) {
    let ents;
    try {
      ents = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of ents) {
      const m = ent.isFile() && TEMP_NAME.exec(ent.name);
      if (!m) continue;
      const abs = path.join(dir, ent.name);
      const pid = Number(m[1]);
      if (pid === process.pid || pidAlive(pid)) {
        lines.push(`${rel(abs)}  temp of a running process ${pid}: left alone`);
        continue;
      }
      const top = gitTop(dir);
      if (top && trackedFiles(top).has(keyOf(abs))) {
        lines.push(`${rel(abs)}  looks like a stale temp but is tracked by git: left alone`);
        continue;
      }
      if (!apply) {
        lines.push(`${rel(abs)}  stale temp from an interrupted run: would remove`);
        continue;
      }
      try {
        await unlink(abs);
        lines.push(`${rel(abs)}  stale temp from an interrupted run: removed`);
      } catch (err) {
        failed++;
        lines.push(`${rel(abs)}  stale temp from an interrupted run: could not remove (${err?.code ?? "error"})`);
      }
    }
  }
  return { lines, failed };
}

/** On Ctrl+C / termination: stop ffmpeg and remove this run's temp before exiting. */
function cleanupAndExit(code) {
  for (const c of liveChildren) {
    try {
      c.kill();
    } catch {
      // already gone
    }
  }
  const pause = new Int32Array(new SharedArrayBuffer(4));
  for (const t of liveTemps) {
    for (let i = 0; i < 20; i++) {
      try {
        unlinkSync(t);
        break;
      } catch (err) {
        if (err.code === "ENOENT") break;
        Atomics.wait(pause, 0, 0, 100); // a killed ffmpeg can hold the file for a moment on Windows
      }
    }
  }
  process.exit(code);
}

/**
 * The long, link-free spelling of an existing path. fs/promises' realpath is the native
 * resolver (it has no `.native`): it removes junctions and symlinks and expands 8.3 names.
 * A path that does not exist comes back resolved but otherwise as given.
 */
async function nativeReal(p) {
  try {
    return await realpath(p);
  } catch {
    return path.resolve(p);
  }
}

/** Volume and file id: the same file or folder whatever spelling, junction or hard link names it. null if unknown. */
async function fileId(p) {
  try {
    const s = await stat(p, { bigint: true });
    return s.ino ? `${s.dev}:${s.ino}` : null;
  } catch {
    return null;
  }
}

/** The ids of a folder and every folder above it. */
async function ancestorIds(dir) {
  const ids = new Set();
  for (let p = path.resolve(dir); ; p = path.dirname(p)) {
    const id = await fileId(p);
    if (id) ids.add(id);
    if (path.dirname(p) === p) break;
  }
  return ids;
}

/**
 * The same file spelled under ROOT when it lives inside this repository, whatever path named it:
 * a UNC admin share (\\localhost\C$\…), a \\?\ prefix, a junction, 8.3 names or case. realpath keeps a
 * UNC form, so "inside" is decided by folder identity (volume + file id) of every ancestor of the
 * real path, not by comparing strings. Returns null when the file is outside the repository.
 */
async function repoSpelling(p, rootId) {
  const real = await nativeReal(p);
  const rootReal = await nativeReal(ROOT);
  if (isInside(keyOf(real), keyOf(rootReal))) return path.join(ROOT, path.relative(rootReal, real));
  if (!rootId) return null;
  for (let d = path.dirname(real); ; d = path.dirname(d)) {
    if ((await fileId(d)) === rootId) return path.join(ROOT, path.relative(d, real));
    if (path.dirname(d) === d) return null;
  }
}

/* ------------------------------------------------------------------------ */
/* per-file work                                                             */
/* ------------------------------------------------------------------------ */

function tempBeside(abs) {
  const ext = path.extname(abs);
  return path.join(path.dirname(abs), `.${path.basename(abs, ext)}${TEMP_MARK}${process.pid}${ext}`);
}

async function appendLedger(ledger, entry) {
  const fh = await open(ledger, "a");
  try {
    await fh.write(JSON.stringify(entry) + "\n");
    await fh.datasync();
  } finally {
    await fh.close();
  }
}

async function renameOver(tmp, abs) {
  for (let i = 0; ; i++) {
    try {
      return await rename(tmp, abs);
    } catch (err) {
      if (i >= 5 || !["EPERM", "EBUSY", "EACCES"].includes(err.code)) throw err;
      await sleep(200 * (i + 1));
    }
  }
}

/** Verify a written temp with the audit, and confirm credit survived. */
async function auditOutput(tmp, expectCredit) {
  const r = await inspectFile(tmp);
  if (r.violations.length) refuse(`output still fails the audit: ${[...new Set(r.violations.map((v) => v.code))].join(", ")}`);
  if (expectCredit.artist && !r.credit.artist) refuse("artist credit did not survive");
  if (expectCredit.copyright && !r.credit.copyright) refuse("copyright credit did not survive");
}

async function processFile(abs, opts) {
  const audit = await inspectFile(abs);
  const codes = [...new Set(audit.violations.map((v) => v.code))];
  const rec = { path: rel(abs), kind: audit.kind, codes, credit: { ...audit.credit }, status: "clean" };
  if (!codes.length) return rec;

  let tmp = null;
  try {
    // A file the gate cannot walk end to end is not rewritten: its structure could not be verified.
    if (codes.includes("UNPARSEABLE")) refuse("the audit cannot walk this file end to end (UNPARSEABLE); repair or re-export it and run again");
    if (["webp", "avif", "heif", "tiff"].includes(audit.kind)) refuse(`${audit.kind} is not stripped by this tool; convert or strip it by hand`);
    if (audit.kind === "pdf" || audit.kind === "other") refuse(`${audit.kind === "pdf" ? "PDF" : "unidentified file"} is not handled by this tool`);

    if (audit.kind === "jpeg" || audit.kind === "png") {
      const before = await readFile(abs);
      const shaBefore = sha256(before);
      const plan = audit.kind === "jpeg" ? stripJpeg(before, audit) : stripPng(before, audit);
      await verifyPixels(before, plan.out);
      if (plan.orientation !== undefined) {
        const m = await sharp(plan.out).metadata();
        if (m.orientation !== plan.orientation) refuse("Orientation did not survive");
      }
      Object.assign(rec, { action: plan.action, creditKept: plan.credit });
      if (!opts.apply) return { ...rec, status: "planned" };

      tmp = tempBeside(abs);
      liveTemps.add(tmp);
      await writeFile(tmp, plan.out, { flag: "wx" });
      await auditOutput(tmp, plan.credit);
      await commit(abs, tmp, opts, { shaBefore, shaAfter: sha256(plan.out), rec, plan });
      tmp = null;
      return { ...rec, status: "stripped" };
    }

    // mp4, mov, matroska
    const fmt = videoFormat(audit.kind, abs);
    const facts = await videoFacts(abs, audit);
    const creditKept = { artist: !!facts.artist, copyright: !!facts.copyright };
    const credits = [creditKept.artist && "artist", creditKept.copyright && "copyright"].filter(Boolean);
    Object.assign(rec, { action: `remux ${fmt}: stream copy, drop container metadata and chapters${credits.length ? `; re-add ${credits.join(", ")}` : ""}`, creditKept });
    if (!opts.apply) return { ...rec, status: "planned" };

    const shaBefore = await sha256File(abs);
    tmp = tempBeside(abs);
    liveTemps.add(tmp);
    const mux = await runFfmpeg(remuxArgs(abs, tmp, fmt, facts));
    if (mux.code !== 0) refuse(`stream-copy remux failed (ffmpeg exit ${mux.code}, ${mux.stderr ? mux.stderr.split("\n").length : 0} error line(s))`);
    if ((fmt === "webm" || fmt === "matroska") && (await restoreMatroskaDuration(abs, tmp))) rec.action += "; keep the original Segment Duration";
    for (const copy of [false, true]) {
      const a = await streamHashes(abs, copy);
      if (a === null) refuse(`ffmpeg cannot hash the original's streams${copy ? " (packets)" : ""}`);
      const b = await streamHashes(tmp, copy);
      if (b === null || a !== b) refuse(`stream hashes differ after the remux${copy ? " (packets)" : " (decoded)"}`);
    }
    const dec = await runFfmpeg(["-v", "error", "-i", tmp, "-f", "null", "-"]);
    if (dec.code !== 0 || dec.stderr) refuse(`remux does not decode cleanly (${dec.stderr ? dec.stderr.split("\n").length : 0} error line(s))`);
    await verifyTiming(abs, tmp, fmt);
    await auditOutput(tmp, creditKept);
    await commit(abs, tmp, opts, { shaBefore, shaAfter: await sha256File(tmp), rec, plan: { ...facts, credit: creditKept, action: rec.action } });
    tmp = null;
    return { ...rec, status: "stripped" };
  } catch (err) {
    const reason = err instanceof Refused ? err.message : `unexpected error: ${err?.code ?? err?.name ?? "error"}`;
    if (opts.apply && opts.ledger) {
      await appendLedger(opts.ledger, { time: new Date().toISOString(), path: rec.path, kind: rec.kind, status: "refused", codes, reason }).catch(() => {});
    }
    return { ...rec, status: "refused", reason };
  } finally {
    if (tmp) await unlink(tmp).catch(() => {});
    liveTemps.clear();
  }
}

async function commit(abs, tmp, opts, { shaBefore, shaAfter, rec, plan }) {
  if ((await sha256File(abs)) !== shaBefore) refuse("the original changed while it was being stripped");
  const entry = {
    time: new Date().toISOString(),
    path: rec.path,
    kind: rec.kind,
    status: "pending",
    sha256Before: shaBefore,
    sha256After: shaAfter,
    codesRemoved: rec.codes,
    creditKept: plan.credit,
    camera: plan.camera,
    captureDate: plan.captureDate,
    action: rec.action ?? plan.action,
  };
  // Recorded before anything is replaced; "replaced" is only claimed once the rename has happened.
  await appendLedger(opts.ledger, entry);
  try {
    await renameOver(tmp, abs);
  } catch (err) {
    await appendLedger(opts.ledger, { time: new Date().toISOString(), path: rec.path, status: "rename-failed", sha256Before: shaBefore, error: err?.code ?? "error" }).catch(() => {});
    refuse(`could not replace the original (${err?.code ?? "error"}); it is unchanged`);
  }
  try {
    await appendLedger(opts.ledger, { ...entry, time: new Date().toISOString(), status: "replaced" });
  } catch (err) {
    console.error(`${rec.path}: replaced, but the ledger confirmation could not be written (${err?.code ?? "error"}); its "pending" line carries both hashes`);
    process.exitCode = 1;
  }
}

/* ------------------------------------------------------------------------ */
/* CLI                                                                       */
/* ------------------------------------------------------------------------ */

/**
 * Files under a given path. A path named on the command line is taken as given; inside a
 * directory, a junction or symbolic link is followed only when its real path stays inside that
 * directory. One that leads out is not followed and is collected in `out.escaped`.
 */
async function expand(given, out) {
  const s = await stat(given);
  if (!s.isDirectory()) {
    if (!path.basename(given).includes(TEMP_MARK)) out.files.push(given);
    return;
  }
  const top = await nativeReal(given);
  const seen = new Set();
  const walk = async (dir) => {
    const key = keyOf(await nativeReal(dir));
    if (seen.has(key)) return;
    seen.add(key);
    for (const ent of await readdir(dir, { withFileTypes: true })) {
      if (ent.name === "node_modules" || ent.name === ".git" || ent.name === ".next") continue;
      const p = path.join(dir, ent.name);
      let st = await lstat(p);
      if (st.isSymbolicLink()) {
        let real = null;
        try {
          real = await realpath(p);
          st = await stat(p);
        } catch {
          real = null;
        }
        if (!real || !isInside(real, top)) {
          out.escaped.push({ abs: p, reason: real ? "link leads outside the directory that was given; not followed" : "link cannot be resolved; not followed" });
          continue;
        }
      }
      if (st.isDirectory()) await walk(p);
      else if (st.isFile() && !ent.name.includes(TEMP_MARK)) out.files.push(p);
    }
  };
  await walk(given);
}

/** In this tool's scope: a media extension, or magic bytes of a still or video (a renamed file is what it is). */
async function isMediaCandidate(abs) {
  if (MEDIA_EXT.test(abs)) return true;
  let fh;
  try {
    fh = await open(abs, "r");
    const kind = sniff(await readAt(fh, 0, 256));
    return kind !== "other" && kind !== "pdf";
  } catch {
    return false;
  } finally {
    await fh?.close();
  }
}

const USAGE = [
  "Usage: node scripts/strip-media-metadata.mjs (--dry-run | --apply) --ledger <file outside the repository> [--allow-untracked] [paths...]",
  "  --allow-untracked  test mode: accept untracked files, but only at paths outside this repository",
  "                     (scratch fixture copies); files inside the repository must still be tracked and not ignored.",
].join("\n");

function usage(msg) {
  console.error(`${msg}\n${USAGE}`);
  process.exit(2);
}

async function main() {
  const args = process.argv.slice(2);
  let apply = false;
  let dry = false;
  let allowUntracked = false;
  let ledgerArg = null;
  const given = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--apply") apply = true;
    else if (a === "--dry-run") dry = true;
    else if (a === "--allow-untracked") allowUntracked = true;
    else if (a === "--ledger") {
      ledgerArg = args[++i];
      if (!ledgerArg || ledgerArg.startsWith("--")) usage("--ledger needs a file path.");
    } else if (a.startsWith("--ledger=")) ledgerArg = a.slice(9);
    else if (a.startsWith("--")) usage(`Unknown option: ${a}`);
    else given.push(a);
  }
  if (apply === dry) usage("Choose exactly one of --dry-run or --apply.");
  if (apply && !ledgerArg) usage("--apply refuses to run without --ledger: every replacement must be recorded first.");

  let targets = [];
  let missing = 0;
  let skipped = 0;
  const escaped = [];
  if (given.length) {
    const found = { files: [], escaped };
    for (const g of given) {
      try {
        await expand(path.resolve(g), found);
      } catch {
        console.error(`Cannot read ${g}`);
        process.exit(2);
      }
    }
    // Scope first, guards second: a non-media file is skipped, never withheld or counted as media.
    // A file inside this repository is carried under its ROOT spelling from here on, so no spelling
    // of the path (UNC share, \\?\, junction) can make it look like an outside fixture to the guards.
    const rootId = await fileId(ROOT);
    const keys = new Set();
    for (const named of found.files) {
      const f = (await repoSpelling(named, rootId)) ?? named;
      const k = keyOf(await nativeReal(f));
      if (keys.has(k)) continue;
      keys.add(k);
      if (await isMediaCandidate(f)) targets.push(f);
      else skipped++;
    }
  } else {
    let listing;
    try {
      listing = execFileSync("git", ["ls-files", "-z", "--", "public"], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
    } catch {
      console.error("git ls-files failed: the default scope needs a git checkout (or pass paths).");
      process.exit(2);
    }
    for (const f of listing.split("\0").filter((x) => x && MEDIA_EXT.test(x))) {
      const abs = path.join(ROOT, f);
      try {
        if ((await stat(abs)).isFile()) targets.push(abs);
      } catch {
        missing++;
      }
    }
  }

  let ledger = null;
  if (ledgerArg) {
    const abs = path.resolve(ledgerArg);
    const dir = await nativeReal(path.dirname(abs));
    try {
      if (!(await stat(dir)).isDirectory()) throw new Error();
    } catch {
      usage("The ledger's folder does not exist.");
    }
    ledger = path.join(dir, path.basename(abs));
    const repos = new Set([await nativeReal(ROOT)]);
    for (const t of targets) {
      const top = gitTop(path.dirname(t));
      if (top) repos.add(await nativeReal(top));
    }
    // Compared both as real paths and by folder identity, so no spelling (8.3, junction, case) slips past.
    const above = await ancestorIds(dir);
    let inRepo = false;
    for (const r of repos) {
      const id = await fileId(r);
      if (isInside(ledger, r) || isInside(abs, r) || (id && above.has(id))) inRepo = true;
    }
    if (inRepo) usage("The ledger must live outside the repository: it names private files and camera details.");
    const ledgerReal = keyOf(await nativeReal(ledger));
    const ledgerId = await fileId(ledger);
    for (const t of [...targets, ...escaped.map((e) => e.abs)]) {
      if (keyOf(await nativeReal(t)) === ledgerReal || (ledgerId && (await fileId(t)) === ledgerId)) usage("The ledger cannot be one of the files in scope.");
    }
  }

  // The tracked-and-not-ignored guard holds in both modes, so a preview never lists a withheld file as
  // strippable. --allow-untracked lifts it only for paths outside this repository (test fixtures).
  const guardRootId = await fileId(ROOT);
  const guarded = [];
  for (const t of targets) {
    if (!allowUntracked || (await repoSpelling(t, guardRootId)) !== null) guarded.push(t);
  }
  const problems = trackingProblems(guarded);
  const hint = allowUntracked ? "" : " (scratch copies outside the repository: add --allow-untracked)";
  if (problems.length && apply) {
    for (const p of problems) console.error(`${rel(p.abs)}: ${p.reason}`);
    console.error(`\n--apply refused: ${problems.length} file(s) are untracked or gitignored${hint}. Nothing was changed.`);
    process.exit(2);
  }
  const withheld = new Map(problems.map((p) => [keyOf(p.abs), p.reason]));

  const sweep = await sweepStaleTemps([...new Set(targets.filter((t) => !withheld.has(keyOf(t))).map((t) => path.dirname(t)))], apply);
  for (const line of sweep.lines) console.log(line);
  if (sweep.lines.length) console.log("");

  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) {
    try {
      process.on(sig, () => cleanupAndExit(130));
    } catch {
      // signal not supported on this platform
    }
  }

  const opts = { apply, ledger };
  const results = [];
  for (const e of escaped) {
    const r = { path: rel(e.abs), kind: "not inspected", codes: [], status: "refused", reason: e.reason };
    results.push(r);
    console.log(`${r.path}  ${r.kind}  REFUSED: ${r.reason}`);
  }
  for (const abs of targets) {
    if (withheld.has(keyOf(abs))) {
      const r = { path: rel(abs), kind: "not inspected", codes: [], status: "refused", reason: `${withheld.get(keyOf(abs))}; untracked and gitignored files are out of scope${hint}` };
      results.push(r);
      console.log(`${r.path}  ${r.kind}  REFUSED: ${r.reason}`);
      continue;
    }
    const r = await processFile(abs, opts);
    if (r.kind === "other" && r.status === "clean") {
      skipped++;
      continue;
    }
    results.push(r);
    if (r.status === "clean") continue;
    const credit = r.creditKept ? [r.creditKept.artist && "artist", r.creditKept.copyright && "copyright"].filter(Boolean) : [];
    const creditText = credit.length ? `credit kept: ${credit.join(", ")}` : "no credit to keep";
    if (r.status === "refused") console.log(`${r.path}  ${r.kind}  ${r.codes.join(", ")}  REFUSED: ${r.reason}`);
    else console.log(`${r.path}  ${r.kind}  ${r.codes.join(", ")}  ${r.status === "planned" ? "would strip" : "stripped"} (${creditText}): ${r.action}`);
  }

  const count = (s) => results.filter((r) => r.status === s).length;
  const clean = count("clean");
  const changed = count(apply ? "stripped" : "planned");
  const refused = count("refused");
  if (results.length > clean) console.log("");
  console.log(
    `${results.length} media files in scope${skipped ? `, ${skipped} other files skipped` : ""}${missing ? `, ${missing} tracked files missing from the working tree` : ""}: ` +
      `${clean} already clean (untouched), ${changed} ${apply ? "stripped" : "would be stripped"}, ${refused} refused.`,
  );
  if (apply && changed) console.log(`Ledger: ${ledger}`);
  if (!apply && changed) console.log("Dry run: nothing was written. Video remuxes are verified only under --apply.");

  const remaining = apply ? refused : changed + refused;
  if (remaining === 0) console.log("No GPS, serial numbers or embedded thumbnails remain in scope.");
  if (refused || remaining || sweep.failed) process.exitCode = 1;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (invoked) await main();
