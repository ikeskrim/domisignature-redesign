/**
 * A small, dependency-free reader for the WOFF2 fonts next/font writes into
 * .next/static/media: the W3C WOFF2 container (with the glyf/loca transform,
 * version 0, and the hmtx transform), the TrueType tables needed to draw text
 * (head, hhea, maxp, cmap 4/12, loca, glyf simple and composite, hmtx, fvar)
 * and GPOS pair kerning (the `kern` feature, PairPos formats 1 and 2).
 *
 * It exists for one job: drawing the footer's decorative wordmark as vector
 * outlines of the site's own typeface (scripts/wordmark-outline.mjs), so the
 * page carries a drawing rather than low-contrast text. Brotli comes from
 * node:zlib; nothing is installed.
 *
 * Checked on Playfair Display (the build of 2026-09-14): all 318 glyphs, simple
 * and composite, decode to exactly their stored bounding boxes; the kerned
 * positions of DOMISIGNATURE equal Chromium's to the font unit.
 */

import { brotliDecompressSync } from "node:zlib";

/* The WOFF2 known-table index (W3C WOFF2 section 5.1). */
const KNOWN_TAGS = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm",
  "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern",
  "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC",
  "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar",
  "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty",
  "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat",
  "Gloc", "Feat", "Sill",
];

class Reader {
  constructor(buf, pos = 0) {
    this.b = buf;
    this.p = pos;
  }
  u8() { return this.b.readUInt8(this.p++); }
  i8() { return this.b.readInt8(this.p++); }
  u16() { const v = this.b.readUInt16BE(this.p); this.p += 2; return v; }
  i16() { const v = this.b.readInt16BE(this.p); this.p += 2; return v; }
  u32() { const v = this.b.readUInt32BE(this.p); this.p += 4; return v; }
  fixed() { const v = this.b.readInt32BE(this.p); this.p += 4; return v / 65536; }
  tag() { const s = this.b.toString("latin1", this.p, this.p + 4); this.p += 4; return s; }
  bytes(n) { const s = this.b.subarray(this.p, this.p + n); this.p += n; return s; }
  base128() {
    let acc = 0;
    for (let i = 0; i < 5; i++) {
      const d = this.u8();
      if (i === 0 && d === 0x80) throw new Error("UIntBase128 leading zero");
      if (acc & 0xfe000000) throw new Error("UIntBase128 overflow");
      acc = acc * 128 + (d & 0x7f);
      if (!(d & 0x80)) return acc;
    }
    throw new Error("UIntBase128 too long");
  }
  u255() {
    const code = this.u8();
    if (code === 253) return this.u16();
    if (code === 255) return this.u8() + 253;
    if (code === 254) return this.u8() + 253 * 2;
    return code;
  }
}

const withSign = (flag, base) => (flag & 1 ? base : -base);
const bitSet = (bitmap, i) => (bitmap[i >> 3] & (0x80 >> (i & 7))) !== 0;

/** The glyf/loca transform, version 0 (W3C WOFF2 section 5.1), back to plain tables. */
function reconstructGlyfLoca(data) {
  const r = new Reader(data);
  r.u16(); // reserved
  const optionFlags = r.u16();
  const numGlyphs = r.u16();
  const indexFormat = r.u16();
  const sizes = Array.from({ length: 7 }, () => r.u32());
  const streams = [];
  let off = r.p;
  for (const size of sizes) {
    streams.push(data.subarray(off, off + size));
    off += size;
  }
  const overlapBitmap = optionFlags & 1 ? data.subarray(off, off + ((numGlyphs + 7) >> 3)) : null;
  const [nContourR, nPointsR, flagR, glyphR, compR] = streams.slice(0, 5).map((s) => new Reader(s));
  const bboxBitmapLength = 4 * Math.floor((numGlyphs + 31) / 32);
  const bboxBitmap = streams[5].subarray(0, bboxBitmapLength);
  const bboxR = new Reader(streams[5], bboxBitmapLength);
  const instR = new Reader(streams[6]);

  const chunks = [];
  const offsets = [0];
  const xMins = new Array(numGlyphs).fill(0);
  let total = 0;

  for (let g = 0; g < numGlyphs; g++) {
    const nContours = nContourR.i16();
    const hasBbox = bitSet(bboxBitmap, g);
    let out;
    if (nContours === 0) {
      if (hasBbox) throw new Error(`empty glyph ${g} has a bounding box`);
      out = Buffer.alloc(0);
    } else if (nContours > 0) {
      const endPts = [];
      let nPoints = 0;
      for (let c = 0; c < nContours; c++) {
        nPoints += nPointsR.u255();
        endPts.push(nPoints - 1);
      }
      const pts = [];
      let x = 0;
      let y = 0;
      for (let i = 0; i < nPoints; i++) {
        let flag = flagR.u8();
        const on = !(flag >> 7);
        flag &= 0x7f;
        let dx;
        let dy;
        if (flag < 10) {
          dx = 0;
          dy = withSign(flag, ((flag & 14) << 7) + glyphR.u8());
        } else if (flag < 20) {
          dx = withSign(flag, (((flag - 10) & 14) << 7) + glyphR.u8());
          dy = 0;
        } else if (flag < 84) {
          const b0 = flag - 20;
          const b1 = glyphR.u8();
          dx = withSign(flag, 1 + (b0 & 0x30) + (b1 >> 4));
          dy = withSign(flag >> 1, 1 + ((b0 & 0x0c) << 2) + (b1 & 0x0f));
        } else if (flag < 120) {
          const b0 = flag - 84;
          const b1 = glyphR.u8();
          const b2 = glyphR.u8();
          dx = withSign(flag, 1 + (Math.floor(b0 / 12) << 8) + b1);
          dy = withSign(flag >> 1, 1 + (((b0 % 12) >> 2) << 8) + b2);
        } else if (flag < 124) {
          const b1 = glyphR.u8();
          const b2 = glyphR.u8();
          const b3 = glyphR.u8();
          dx = withSign(flag, (b1 << 4) + (b2 >> 4));
          dy = withSign(flag >> 1, ((b2 & 0x0f) << 8) + b3);
        } else {
          const b1 = glyphR.u8();
          const b2 = glyphR.u8();
          const b3 = glyphR.u8();
          const b4 = glyphR.u8();
          dx = withSign(flag, (b1 << 8) + b2);
          dy = withSign(flag >> 1, (b3 << 8) + b4);
        }
        x += dx;
        y += dy;
        pts.push({ x, y, on });
      }
      const instLength = glyphR.u255();
      const inst = instR.bytes(instLength);
      let box;
      if (hasBbox) box = [bboxR.i16(), bboxR.i16(), bboxR.i16(), bboxR.i16()];
      else {
        const xs = pts.map((p) => p.x);
        const ys = pts.map((p) => p.y);
        box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      }
      xMins[g] = box[0];
      const overlap = overlapBitmap && bitSet(overlapBitmap, g);
      /* Written unpacked: one flag byte per point and 16-bit deltas. */
      out = Buffer.alloc(10 + 2 * nContours + 2 + instLength + nPoints + 4 * nPoints);
      let p = out.writeInt16BE(nContours, 0);
      for (const v of box) p = out.writeInt16BE(v, p);
      for (const e of endPts) p = out.writeUInt16BE(e, p);
      p = out.writeUInt16BE(instLength, p);
      p += inst.copy(out, p);
      for (let i = 0; i < nPoints; i++) out[p++] = (pts[i].on ? 0x01 : 0) | (i === 0 && overlap ? 0x40 : 0);
      let prev = 0;
      for (const pt of pts) { p = out.writeInt16BE(pt.x - prev, p); prev = pt.x; }
      prev = 0;
      for (const pt of pts) { p = out.writeInt16BE(pt.y - prev, p); prev = pt.y; }
    } else {
      if (!hasBbox) throw new Error(`composite glyph ${g} has no bounding box`);
      const box = [bboxR.i16(), bboxR.i16(), bboxR.i16(), bboxR.i16()];
      xMins[g] = box[0];
      const start = compR.p;
      let haveInstructions = false;
      for (;;) {
        const flags = compR.u16();
        compR.u16(); // glyph index
        compR.p += flags & 0x0001 ? 4 : 2;
        if (flags & 0x0008) compR.p += 2;
        else if (flags & 0x0040) compR.p += 4;
        else if (flags & 0x0080) compR.p += 8;
        if (flags & 0x0100) haveInstructions = true;
        if (!(flags & 0x0020)) break;
      }
      const comp = streams[4].subarray(start, compR.p);
      const inst = haveInstructions ? instR.bytes(glyphR.u255()) : Buffer.alloc(0);
      out = Buffer.alloc(10 + comp.length + (haveInstructions ? 2 + inst.length : 0));
      let p = out.writeInt16BE(-1, 0);
      for (const v of box) p = out.writeInt16BE(v, p);
      p += comp.copy(out, p);
      if (haveInstructions) {
        p = out.writeUInt16BE(inst.length, p);
        inst.copy(out, p);
      }
    }
    const pad = (4 - (out.length % 4)) % 4;
    if (pad) out = Buffer.concat([out, Buffer.alloc(pad)]);
    chunks.push(out);
    total += out.length;
    offsets.push(total);
  }

  const readers = [nContourR, nPointsR, flagR, glyphR, compR, bboxR, instR];
  if (readers.some((rd, i) => rd.p !== streams[i].length)) throw new Error("glyf transform: a stream was not read to its end");

  const loca = Buffer.alloc(indexFormat ? 4 * offsets.length : 2 * offsets.length);
  offsets.forEach((o, i) => (indexFormat ? loca.writeUInt32BE(o, 4 * i) : loca.writeUInt16BE(o / 2, 2 * i)));
  return { glyf: Buffer.concat(chunks), loca, xMins };
}

/** The hmtx transform, version 1: left side bearings restored from the glyph boxes. */
function reconstructHmtx(data, numGlyphs, numHMetrics, xMins) {
  const r = new Reader(data);
  const flags = r.u8();
  const advances = Array.from({ length: numHMetrics }, () => r.u16());
  const lsb = [];
  for (let i = 0; i < numHMetrics; i++) lsb.push(flags & 1 ? xMins[i] : r.i16());
  for (let i = numHMetrics; i < numGlyphs; i++) lsb.push(flags & 2 ? xMins[i] : r.i16());
  const out = Buffer.alloc(4 * numHMetrics + 2 * (numGlyphs - numHMetrics));
  let p = 0;
  for (let i = 0; i < numHMetrics; i++) {
    p = out.writeUInt16BE(advances[i], p);
    p = out.writeInt16BE(lsb[i], p);
  }
  for (let i = numHMetrics; i < numGlyphs; i++) p = out.writeInt16BE(lsb[i], p);
  return out;
}

/** WOFF2 bytes -> Map of table tag -> plain sfnt table bytes. */
export function decodeWoff2(buf) {
  const r = new Reader(buf);
  if (r.tag() !== "wOF2") throw new Error("not a WOFF2 file");
  const flavor = r.u32();
  const length = r.u32();
  const numTables = r.u16();
  r.u16();
  r.u32(); // totalSfntSize
  const totalCompressedSize = r.u32();
  r.p += 4 + 20; // version, metadata and private blocks
  if (length !== buf.length) throw new Error("WOFF2 length does not match the file");
  if (flavor === 0x74746366) throw new Error("font collections are not supported");

  const dir = [];
  for (let i = 0; i < numTables; i++) {
    const flags = r.u8();
    const tag = (flags & 0x3f) === 63 ? r.tag() : KNOWN_TAGS[flags & 0x3f];
    const version = flags >> 6;
    const origLength = r.base128();
    const transformed = tag === "glyf" || tag === "loca" ? version !== 3 : version !== 0;
    dir.push({ tag, version, transformed, length: transformed ? r.base128() : origLength });
  }

  const stream = brotliDecompressSync(buf.subarray(r.p, r.p + totalCompressedSize));
  const raw = new Map();
  let off = 0;
  for (const t of dir) {
    raw.set(t.tag, stream.subarray(off, off + t.length));
    off += t.length;
  }
  if (off !== stream.length) throw new Error("WOFF2 table stream has the wrong length");

  const tables = new Map();
  for (const t of dir) if (!t.transformed) tables.set(t.tag, raw.get(t.tag));
  const glyf = dir.find((t) => t.tag === "glyf");
  let xMins = null;
  if (glyf?.transformed) {
    if (glyf.version !== 0) throw new Error(`unknown glyf transform ${glyf.version}`);
    const rebuilt = reconstructGlyfLoca(raw.get("glyf"));
    tables.set("glyf", rebuilt.glyf);
    tables.set("loca", rebuilt.loca);
    xMins = rebuilt.xMins;
  }
  const hmtx = dir.find((t) => t.tag === "hmtx");
  if (hmtx?.transformed) {
    if (hmtx.version !== 1) throw new Error(`unknown hmtx transform ${hmtx.version}`);
    const numGlyphs = tables.get("maxp").readUInt16BE(4);
    const numHMetrics = tables.get("hhea").readUInt16BE(34);
    tables.set("hmtx", reconstructHmtx(raw.get("hmtx"), numGlyphs, numHMetrics, xMins));
  }
  return tables;
}

export class TrueTypeFont {
  constructor(tables) {
    this.t = tables;
    const head = tables.get("head");
    this.unitsPerEm = head.readUInt16BE(18);
    this.indexToLocFormat = head.readInt16BE(50);
    const hhea = tables.get("hhea");
    this.ascender = hhea.readInt16BE(4);
    this.descender = hhea.readInt16BE(6);
    this.numberOfHMetrics = hhea.readUInt16BE(34);
    this.numGlyphs = tables.get("maxp").readUInt16BE(4);
    this.#readFvar();
    this.#readCmap();
    const loca = tables.get("loca");
    this.loca = Array.from({ length: this.numGlyphs + 1 }, (_, i) =>
      this.indexToLocFormat ? loca.readUInt32BE(4 * i) : loca.readUInt16BE(2 * i) * 2,
    );
    const hm = new Reader(tables.get("hmtx"));
    this.advance = [];
    let last = 0;
    for (let i = 0; i < this.numGlyphs; i++) {
      if (i < this.numberOfHMetrics) last = hm.u16();
      hm.i16(); // side bearing: not needed, outlines carry their own x
      this.advance.push(last);
    }
    this.#gpos = this.#readGpos();
  }

  #gpos;

  #readFvar() {
    const b = this.t.get("fvar");
    this.axes = [];
    if (!b) return;
    const r = new Reader(b, 4);
    const axesOffset = r.u16();
    r.u16();
    const axisCount = r.u16();
    const axisSize = r.u16();
    for (let i = 0; i < axisCount; i++) {
      const a = new Reader(b, axesOffset + i * axisSize);
      this.axes.push({ tag: a.tag(), min: a.fixed(), default: a.fixed(), max: a.fixed() });
    }
  }

  #readCmap() {
    const b = this.t.get("cmap");
    const n = b.readUInt16BE(2);
    const subs = Array.from({ length: n }, (_, i) => ({
      platform: b.readUInt16BE(4 + 8 * i),
      encoding: b.readUInt16BE(6 + 8 * i),
      offset: b.readUInt32BE(8 + 8 * i),
    })).map((s) => ({ ...s, format: b.readUInt16BE(s.offset) }));
    const pick =
      subs.find((s) => s.platform === 3 && s.encoding === 10 && s.format === 12) ??
      subs.find((s) => s.platform === 0 && s.format === 12) ??
      subs.find((s) => s.platform === 3 && s.encoding === 1 && s.format === 4) ??
      subs.find((s) => s.platform === 0 && s.format === 4);
    if (!pick) throw new Error("no usable cmap subtable");
    const map = new Map();
    const s = new Reader(b, pick.offset);
    if (pick.format === 4) {
      s.p += 6;
      const segments = s.u16() / 2;
      s.p += 6;
      const ends = Array.from({ length: segments }, () => s.u16());
      s.u16();
      const starts = Array.from({ length: segments }, () => s.u16());
      const deltas = Array.from({ length: segments }, () => s.i16());
      const rangeStart = s.p;
      const ranges = Array.from({ length: segments }, () => s.u16());
      for (let i = 0; i < segments; i++) {
        for (let c = starts[i]; c <= ends[i] && c !== 0xffff; c++) {
          let g;
          if (ranges[i] === 0) g = (c + deltas[i]) & 0xffff;
          else {
            g = b.readUInt16BE(rangeStart + 2 * i + ranges[i] + 2 * (c - starts[i]));
            if (g) g = (g + deltas[i]) & 0xffff;
          }
          if (g) map.set(c, g);
        }
      }
    } else {
      s.p += 12;
      const groups = s.u32();
      for (let i = 0; i < groups; i++) {
        const first = s.u32();
        const lastCode = s.u32();
        const glyph = s.u32();
        for (let c = first; c <= lastCode; c++) map.set(c, glyph + (c - first));
      }
    }
    this.cmap = map;
  }

  /** Pair kerning from the GPOS `kern` feature: a function (left, right) -> x advance adjustment. */
  #readGpos() {
    const b = this.t.get("GPOS");
    if (!b) return () => 0;
    const u16 = (o) => b.readUInt16BE(o);
    const i16 = (o) => b.readInt16BE(o);
    const featureList = u16(6);
    const lookupList = u16(8);
    const lookups = new Set();
    for (let i = 0, n = u16(featureList); i < n; i++) {
      const rec = featureList + 2 + 6 * i;
      if (b.toString("latin1", rec, rec + 4) !== "kern") continue;
      const feature = featureList + u16(rec + 4);
      for (let k = 0, m = u16(feature + 2); k < m; k++) lookups.add(u16(feature + 4 + 2 * k));
    }
    const coverage = (o, g) => {
      if (u16(o) === 1) {
        for (let i = 0, n = u16(o + 2); i < n; i++) if (u16(o + 4 + 2 * i) === g) return i;
        return -1;
      }
      for (let i = 0, n = u16(o + 2); i < n; i++) {
        const r = o + 4 + 6 * i;
        if (g >= u16(r) && g <= u16(r + 2)) return u16(r + 4) + g - u16(r);
      }
      return -1;
    };
    const classOf = (o, g) => {
      if (u16(o) === 1) {
        const start = u16(o + 2);
        return g >= start && g < start + u16(o + 4) ? u16(o + 6 + 2 * (g - start)) : 0;
      }
      for (let i = 0, n = u16(o + 2); i < n; i++) {
        const r = o + 4 + 6 * i;
        if (g >= u16(r) && g <= u16(r + 2)) return u16(r + 4);
      }
      return 0;
    };
    const recordSize = (format) => 2 * [...Array(8).keys()].filter((k) => format & (1 << k)).length;
    /* The x advance of the first value record, if the format carries one. */
    const xAdvance = (o, format) => {
      if (!(format & 0x0004)) return 0;
      return i16(o + 2 * [0, 1].filter((k) => format & (1 << k)).length);
    };
    const pair = (sub, left, right) => {
      const index = coverage(sub + u16(sub + 2), left);
      if (index < 0) return null;
      const f1 = u16(sub + 4);
      const f2 = u16(sub + 6);
      if (u16(sub) === 1) {
        const set = sub + u16(sub + 10 + 2 * index);
        const size = 2 + recordSize(f1) + recordSize(f2);
        for (let i = 0, n = u16(set); i < n; i++) {
          const rec = set + 2 + size * i;
          if (u16(rec) === right) return xAdvance(rec + 2, f1);
        }
        return null;
      }
      const c1 = classOf(sub + u16(sub + 8), left);
      const c2 = classOf(sub + u16(sub + 10), right);
      if (c1 >= u16(sub + 12) || c2 >= u16(sub + 14)) return null;
      return xAdvance(sub + 16 + (recordSize(f1) + recordSize(f2)) * (c1 * u16(sub + 14) + c2), f1);
    };
    return (left, right) => {
      let x = 0;
      for (const li of [...lookups].sort((a, c) => a - c)) {
        const lookup = lookupList + u16(lookupList + 2 + 2 * li);
        const type = u16(lookup);
        for (let s = 0, n = u16(lookup + 4); s < n; s++) {
          let sub = lookup + u16(lookup + 6 + 2 * s);
          let subType = type;
          if (subType === 9) {
            subType = u16(sub + 2);
            sub += b.readUInt32BE(sub + 4);
          }
          if (subType !== 2) continue;
          const v = pair(sub, left, right);
          if (v !== null) {
            x += v;
            break;
          }
        }
      }
      return x;
    };
  }

  glyphId(ch) {
    return this.cmap.get(ch.codePointAt(0)) ?? 0;
  }

  kern(left, right) {
    return this.#gpos(left, right);
  }

  /** Contours of {x, y, on} in font units (y up), composites resolved. */
  contours(gid, depth = 0) {
    if (depth > 16) throw new Error("composite glyphs nest too deep");
    const start = this.loca[gid];
    if (this.loca[gid + 1] <= start) return [];
    const r = new Reader(this.t.get("glyf"), start);
    const nContours = r.i16();
    r.p += 8;
    if (nContours >= 0) {
      const endPts = Array.from({ length: nContours }, () => r.u16());
      const nPoints = nContours ? endPts[nContours - 1] + 1 : 0;
      /* Two statements: `r.p += r.u16()` would add to the position read before the length. */
      const instructions = r.u16();
      r.p += instructions;
      const flags = [];
      while (flags.length < nPoints) {
        const f = r.u8();
        flags.push(f);
        if (f & 8) for (let k = r.u8(); k > 0; k--) flags.push(f);
      }
      const read = (short, same) => {
        const out = [];
        let v = 0;
        for (const f of flags) {
          if (f & short) {
            const d = r.u8();
            v += f & same ? d : -d;
          } else if (!(f & same)) v += r.i16();
          out.push(v);
        }
        return out;
      };
      const xs = read(2, 16);
      const ys = read(4, 32);
      const contours = [];
      let s = 0;
      for (const e of endPts) {
        const c = [];
        for (let i = s; i <= e; i++) c.push({ x: xs[i], y: ys[i], on: (flags[i] & 1) === 1 });
        contours.push(c);
        s = e + 1;
      }
      return contours;
    }
    const out = [];
    for (;;) {
      const flags = r.u16();
      const child = r.u16();
      let a1;
      let a2;
      if (flags & 0x0001) [a1, a2] = flags & 0x0002 ? [r.i16(), r.i16()] : [r.u16(), r.u16()];
      else [a1, a2] = flags & 0x0002 ? [r.i8(), r.i8()] : [r.u8(), r.u8()];
      const f2dot14 = () => r.i16() / 16384;
      let m = [1, 0, 0, 1];
      if (flags & 0x0008) {
        const s = f2dot14();
        m = [s, 0, 0, s];
      } else if (flags & 0x0040) m = [f2dot14(), 0, 0, f2dot14()];
      else if (flags & 0x0080) m = [f2dot14(), f2dot14(), f2dot14(), f2dot14()];
      const apply = (p) => ({ x: m[0] * p.x + m[2] * p.y, y: m[1] * p.x + m[3] * p.y, on: p.on });
      const parts = this.contours(child, depth + 1).map((c) => c.map(apply));
      let dx;
      let dy;
      if (flags & 0x0002) {
        [dx, dy] = [a1, a2];
        if (flags & 0x0800 && !(flags & 0x1000)) ({ x: dx, y: dy } = apply({ x: dx, y: dy }));
      } else {
        const parent = out.flat()[a1];
        const own = parts.flat()[a2];
        [dx, dy] = [parent.x - own.x, parent.y - own.y];
      }
      for (const c of parts) out.push(c.map((p) => ({ x: p.x + dx, y: p.y + dy, on: p.on })));
      if (!(flags & 0x0020)) break;
    }
    return out;
  }
}

/**
 * Contours to absolute SVG path commands (M, L, Q, Z) with y flipped:
 * a font point (x, y) lands at (ox + x * scale, oy - y * scale).
 */
export function contoursToCommands(contours, ox, oy, scale) {
  const cmds = [];
  const at = (p) => [ox + p.x * scale, oy - p.y * scale];
  for (const c of contours) {
    if (!c.length) continue;
    const n = c.length;
    const first = c.findIndex((p) => p.on);
    const start = first === -1 ? { x: (c[0].x + c[1 % n].x) / 2, y: (c[0].y + c[1 % n].y) / 2, on: true } : c[first];
    const from = first === -1 ? 1 : first + 1;
    cmds.push(["M", ...at(start)]);
    let off = null;
    for (let i = 0; i < n; i++) {
      const p = c[(from + i) % n];
      if (p.on) {
        cmds.push(off ? ["Q", ...at(off), ...at(p)] : ["L", ...at(p)]);
        off = null;
      } else {
        if (off) cmds.push(["Q", ...at(off), ...at({ x: (off.x + p.x) / 2, y: (off.y + p.y) / 2 })]);
        off = p;
      }
    }
    if (off) cmds.push(["Q", ...at(off), ...at(start)]);
    cmds.push(["Z"]);
  }
  return cmds;
}

/** Absolute commands to the shortest relative path text this serializer knows (m, l, h, v, q, z). */
export function compactPath(cmds, digits = 1) {
  const q = 10 ** digits;
  const round = (v) => Math.round(v * q) / q;
  const fmt = (v) => {
    const s = String(round(v) === 0 ? 0 : round(v));
    return s.replace(/^(-?)0\./, "$1.");
  };
  let out = "";
  let last = "";
  let prev = null;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  const emit = (cmd, nums) => {
    if (cmd !== last || cmd === "m") {
      out += cmd;
      prev = null;
    }
    for (const v of nums) {
      const t = fmt(v);
      const glue = prev !== null && !t.startsWith("-") && !(t.startsWith(".") && prev.includes("."));
      out += (glue ? " " : "") + t;
      prev = t;
    }
    last = cmd === "m" ? "l" : cmd;
  };
  /* Work in rounded absolute coordinates so relative steps never accumulate error. */
  for (const [c, ...a] of cmds) {
    const v = a.map(round);
    if (c === "M") {
      emit("m", [v[0] - cx, v[1] - cy]);
      [cx, cy, sx, sy] = [v[0], v[1], v[0], v[1]];
    } else if (c === "L") {
      if (v[1] === cy) emit("h", [v[0] - cx]);
      else if (v[0] === cx) emit("v", [v[1] - cy]);
      else emit("l", [v[0] - cx, v[1] - cy]);
      [cx, cy] = v;
    } else if (c === "Q") {
      emit("q", [v[0] - cx, v[1] - cy, v[2] - cx, v[3] - cy]);
      [cx, cy] = [v[2], v[3]];
    } else {
      out += "z";
      last = "z";
      prev = null;
      [cx, cy] = [sx, sy];
    }
  }
  return out;
}
