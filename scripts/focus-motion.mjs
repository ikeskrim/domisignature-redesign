/**
 * Focus in motion — a focused element is never hidden, clipped or covered
 * while something moves.
 *
 * The focus audit (focus-ring.mjs) measures every stop under reduced motion,
 * where nothing moves. Stage 6 adds the moments it cannot see: a keyboard
 * visitor Tabs into a block still waiting to settle, presses Enter on a link
 * and a sheet travels over the page, opens the menu while its panel slides,
 * enters a venue while its photograph lifts, reaches the closing chapter
 * while its mask is mid-scrub. Motion stays ON here.
 *
 * Triggers, at 390x844 and 1440x900 unless named:
 *   reveal     Tab into a Reveal below the fold that has not fired yet: the
 *              page is scrolled so the block is still in its start state, the
 *              stop before it is focused without scrolling, and Tab lands in it.
 *              The block's lift is read again after that focus and at the
 *              keydown itself, and must still be more than 4px: a candidate
 *              that settles on the way (on the scroll, or because the stop
 *              before it shares its finishOnFocus root) is passed over for the
 *              next, and a trigger that reaches a settled block fails
 *   nav        1440: Enter on a header nav link (a client navigation under the
 *              page curtain); 390: Enter on a menu link, the same navigation
 *   menu       390: Enter on the menu toggle. The panel slides in with focus
 *              still on the toggle; its first link takes focus only once its
 *              label is at rest (Header's FOCUS_AT = DUR.panel, 0.7 s). Both moments are
 *              sampled: after the keydown, and again after focus arrives in
 *              the panel, where it must be on the panel's first link
 *   venue-row  Enter on a VenueIndex row (Home)
 *   cta        Tab into CtaBlock (Home) while its chapter is mid-scrub: the
 *              page is scrolled to where the entry or the exit scrub is a fifth
 *              to four fifths through its range (the target in view below the
 *              header where the chapter allows it), and the chapter's side
 *              inset, read at the keydown, must lie strictly between zero and
 *              a gutter
 *
 * At 50, 200, 500 and 900 ms after the trigger's keydown (and, for the menu,
 * after focus arrives in the panel) — timed in the page, not over the wire —
 * `document.activeElement` is checked three ways:
 *   hidden     its opacity times every ancestor's is at least 0.99, and it is
 *              visible;
 *   clipped    no ancestor's overflow (hidden, clip, auto, scroll) and no
 *              clip-path, on it or an ancestor, cuts its ring box: the element
 *              grown by 7px (the 3px ring at a 3px offset ends 6px out; the halo is a
 *              7px spread - globals.css :focus-visible),
 *              clamped to the viewport; for `.focus-inset` the ring is inside,
 *              so the box is the element's own;
 *   covered    `elementsFromPoint` on a grid over the ring box, with every
 *              element made hittable for the reading (a curtain is
 *              pointer-events:none and would otherwise be invisible to it):
 *              the topmost painted hit must be the element or its descendant.
 *              An ancestor's own box lies beneath a descendant's ring, so an
 *              ancestor counts as covering only through a painted, positioned
 *              ::before/::after. A hit that paints nothing (transparent, no
 *              text, no media), is at 5% opacity or less, or is the grain is
 *              looked through. A hit in normal flow paints beneath the ring (an
 *              outline is drawn after the flow's backgrounds and text), so only
 *              a positioned or stacking hit above the element's own layer
 *              covers it.
 * With focus on <body> (a navigation removed the link) nothing can be
 * obscured, and the sample is recorded as such. A trigger whose target cannot
 * be found fails; it is never skipped.
 *
 * Usage: node scripts/focus-motion.mjs      (server at SHOTS_BASE)
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = "design-review/focus-motion.json";
const TIMES = [50, 200, 500, 900];
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/* Installed in every document before its own scripts: the probe and the arm. */
function PROBE(FOCUSABLE) {
  try {
    sessionStorage.setItem("domi:intro-seen", "1");
  } catch {}
  const RING = 7;
  window.__fmFocusable = FOCUSABLE;
  window.__fm = { samples: [], fired: false };

  const describe = (n) => {
    if (!n || n.nodeType !== 1) return String(n);
    const id = n.id ? `#${n.id}` : "";
    const marks = ["data-curtain", "data-menu-panel", "data-preloader", "data-word"].filter((a) => n.hasAttribute(a)).map((a) => `[${a}]`).join("");
    const cls = typeof n.className === "string" && n.className.trim() ? `.${n.className.trim().split(/\s+/).slice(0, 2).join(".")}` : "";
    return `<${n.tagName.toLowerCase()}${id}${marks}${cls.slice(0, 50)}>`;
  };
  const alpha = (c) => {
    const m = (c || "").match(/[\d.]+/g);
    if (!m) return 0;
    return m.length > 3 ? Number(m[3]) : 1;
  };

  /* Split a CSS function body at top-level separators. */
  const split = (s, sep) => {
    const out = [];
    let depth = 0;
    let cur = "";
    for (const ch of s) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (depth === 0 && (sep === "," ? ch === "," : /\s/.test(ch))) {
        if (cur.trim()) out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };
  const KEYWORD = { left: "0%", top: "0%", center: "50%", right: "100%", bottom: "100%" };
  /* A length against its reference, calc() and friends resolved by a probe. */
  const resolve = (raw, ref) => {
    const s = KEYWORD[raw] ?? raw;
    let m;
    if ((m = s.match(/^(-?[\d.]+)px$/))) return Number(m[1]);
    if ((m = s.match(/^(-?[\d.]+)%$/))) return (Number(m[1]) / 100) * ref;
    if (/^-?0(\.0+)?$/.test(s)) return 0;
    const host = document.createElement("div");
    host.style.cssText = `position:absolute;left:-99999px;top:0;width:${ref}px;height:${ref}px;visibility:hidden;contain:strict`;
    const probe = document.createElement("div");
    probe.style.width = s;
    if (!probe.style.width) return NaN;
    host.appendChild(probe);
    document.body.appendChild(host);
    const px = probe.getBoundingClientRect().width;
    host.remove();
    return px;
  };

  /* The region a clip-path leaves visible, in viewport pixels (its bounding box
     for polygon, circle and ellipse), or null when it cannot be measured. */
  const clipRect = (a, value) => {
    const v = value.replace(/\b(border-box|padding-box|content-box|margin-box|fill-box|stroke-box|view-box)\b/g, "").trim();
    const b = a.getBoundingClientRect();
    const w = a.offsetWidth || b.width;
    const h = a.offsetHeight || b.height;
    const sx = w ? b.width / w : 1;
    const sy = h ? b.height / h : 1;
    const fn = v.match(/^([a-z-]+)\((.*)\)$/s);
    if (!fn) return null;
    const [, name, body] = fn;
    if (name === "inset") {
      let t = split(body, " ");
      const round = t.indexOf("round");
      if (round >= 0) t = t.slice(0, round);
      const [top, right = top, bottom = top, left = right] = t;
      const T = resolve(top, h);
      const R = resolve(right, w);
      const B = resolve(bottom, h);
      const L = resolve(left, w);
      if ([T, R, B, L].some(Number.isNaN)) return null;
      return { l: b.left + L * sx, t: b.top + T * sy, r: b.right - R * sx, b: b.bottom - B * sy };
    }
    if (name === "polygon") {
      const pts = split(body, ",").filter((p) => !/^(nonzero|evenodd)$/.test(p));
      const xs = [];
      const ys = [];
      for (const p of pts) {
        const [x, y] = split(p, " ");
        xs.push(resolve(x, w));
        ys.push(resolve(y, h));
      }
      if (!xs.length || [...xs, ...ys].some(Number.isNaN)) return null;
      return { l: b.left + Math.min(...xs) * sx, t: b.top + Math.min(...ys) * sy, r: b.left + Math.max(...xs) * sx, b: b.top + Math.max(...ys) * sy };
    }
    if (name === "circle" || name === "ellipse") {
      const [radii, at = "50% 50%"] = body.split(/\s+at\s+/);
      const rs = split(radii || "", " ");
      const [px = "50%", py = "50%"] = split(at, " ");
      const cx = resolve(px, w);
      const cy = resolve(py, h);
      let rx;
      let ry;
      if (name === "circle") {
        rx = ry = resolve(rs[0] ?? "", Math.sqrt(w * w + h * h) / Math.SQRT2);
      } else {
        rx = resolve(rs[0] ?? "", w);
        ry = resolve(rs[1] ?? "", h);
      }
      if ([cx, cy, rx, ry].some(Number.isNaN)) return null;
      return { l: b.left + (cx - rx) * sx, t: b.top + (cy - ry) * sy, r: b.left + (cx + rx) * sx, b: b.top + (cy + ry) * sy };
    }
    return null;
  };

  const containsFixed = (cs) =>
    cs.transform !== "none" ||
    cs.translate !== "none" ||
    cs.scale !== "none" ||
    cs.rotate !== "none" ||
    cs.filter !== "none" ||
    cs.perspective !== "none" ||
    cs.backdropFilter !== "none" ||
    /paint|layout|strict|content/.test(cs.contain) ||
    /transform|filter|perspective/.test(cs.willChange);

  const layered = (n) => {
    const cs = getComputedStyle(n);
    return (
      cs.position !== "static" ||
      containsFixed(cs) ||
      Number(cs.opacity) < 1 ||
      cs.clipPath !== "none" ||
      cs.isolation === "isolate" ||
      cs.mixBlendMode !== "normal" ||
      /opacity/.test(cs.willChange) ||
      (cs.zIndex !== "auto" && !!n.parentElement && /flex|grid/.test(getComputedStyle(n.parentElement).display))
    );
  };
  /* The z-index that orders a branch against its sibling branches: the
     outermost z-indexed layer on it, else 0. */
  const zOf = (chain) => {
    for (const n of chain) {
      const z = getComputedStyle(n).zIndex;
      if (z !== "auto" && layered(n)) return Number(z);
    }
    return 0;
  };
  const pseudoPaints = (n, which) => {
    const ps = getComputedStyle(n, which);
    if (ps.content === "none" || ps.content === "normal" || ps.display === "none" || ps.visibility !== "visible") return false;
    if (Number(ps.opacity) <= 0.05) return false;
    if (ps.position !== "absolute" && ps.position !== "fixed") return false;
    if (ps.zIndex !== "auto" && Number(ps.zIndex) < 0) return false;
    return alpha(ps.backgroundColor) > 0.02 || ps.backgroundImage !== "none" || ps.backdropFilter !== "none";
  };
  const paints = (n) => {
    const cs = getComputedStyle(n);
    if (cs.visibility !== "visible") return false;
    if (n instanceof SVGElement) return true;
    if (/^(IMG|VIDEO|CANVAS|IFRAME|PICTURE|OBJECT|EMBED|INPUT|TEXTAREA|SELECT)$/.test(n.tagName)) return true;
    if (alpha(cs.backgroundColor) > 0.02 || cs.backgroundImage !== "none" || cs.backdropFilter !== "none") return true;
    if ([...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) return true;
    return pseudoPaints(n, "::before") || pseudoPaints(n, "::after");
  };

  const probe = () => {
    const el = document.activeElement;
    const target = document.querySelector("[data-fm-target]");
    const panel = document.querySelector("[data-menu-panel]");
    const base = {
      pathname: location.pathname,
      menuPanel: !!panel,
      inMenu: !!el && !!el.closest?.("[data-menu-panel], #mobile-menu"),
      /* The stop Header focuses on opening: the panel's first link or button. */
      firstInMenu: !!panel && !!el && el === panel.querySelector("a[href], button:not([disabled])"),
      inTarget: !!target && !!el && target.contains(el),
    };
    if (!el || el === document.body || el === document.documentElement) return { ...base, active: null, problems: [] };
    const active = `${describe(el)} ${(el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40)}`;
    const problems = [];
    const vw = innerWidth;
    const vh = innerHeight;

    /* hidden */
    let op = 1;
    let faintest = null;
    for (let a = el; a; a = a.parentElement) {
      const o = Number(getComputedStyle(a).opacity);
      op *= o;
      if (o < 1 && (!faintest || o < faintest.o)) faintest = { o, a };
    }
    if (op < 0.99) problems.push(`hidden: effective opacity ${op.toFixed(2)} (lowest ${faintest.o.toFixed(2)} on ${describe(faintest.a)})`);
    if (getComputedStyle(el).visibility !== "visible") problems.push("hidden: visibility is not visible");

    const rects = [...el.getClientRects()].filter((r) => r.width > 0 || r.height > 0);
    if (!rects.length) return { ...base, active, problems: [...problems, "hidden: not rendered (no box)"] };
    const u = {
      l: Math.min(...rects.map((r) => r.left)),
      t: Math.min(...rects.map((r) => r.top)),
      r: Math.max(...rects.map((r) => r.right)),
      b: Math.max(...rects.map((r) => r.bottom)),
    };
    const g = el.matches(".focus-inset") ? 0 : RING;
    const ring = { l: Math.max(0, u.l - g), t: Math.max(0, u.t - g), r: Math.min(vw, u.r + g), b: Math.min(vh, u.b + g) };
    if (ring.r - ring.l < 1 || ring.b - ring.t < 1) return { ...base, active, problems: [...problems, "hidden: off-screen"] };

    /* clipped */
    const cut = (box) => {
      const sides = [];
      if (ring.l < box.l - 0.5) sides.push(`left ${Math.round(box.l - ring.l)}px`);
      if (ring.r > box.r + 0.5) sides.push(`right ${Math.round(ring.r - box.r)}px`);
      if (ring.t < box.t - 0.5) sides.push(`top ${Math.round(box.t - ring.t)}px`);
      if (ring.b > box.b + 0.5) sides.push(`bottom ${Math.round(ring.b - box.b)}px`);
      return sides;
    };
    const checkClipPath = (a) => {
      const value = getComputedStyle(a).clipPath;
      if (!value || value === "none") return;
      const box = clipRect(a, value);
      if (!box) {
        problems.push(`clipped: clip-path ${value} on ${describe(a)} could not be measured`);
        return;
      }
      const sides = cut(box);
      if (sides.length) problems.push(`clipped: clip-path ${value} on ${describe(a)} cuts the ring (${sides.join(", ")})`);
    };
    checkClipPath(el);
    let pos = getComputedStyle(el).position;
    for (let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      checkClipPath(a);
      /* overflow clips a positioned descendant only from its containing block
         up. `pos` is the position of the last ancestor that was a containing
         block (or the element's own): an ancestor skipped here leaves it as it
         was, so an absolute box's requirement stays pending, past any static
         ancestor and its overflow, until an ancestor meets it. */
      const isBlock = pos === "fixed" ? containsFixed(cs) : pos === "absolute" ? cs.position !== "static" || containsFixed(cs) : true;
      if (!isBlock) continue;
      if (cs.display !== "inline" && cs.display !== "contents" && (cs.overflowX !== "visible" || cs.overflowY !== "visible")) {
        const b = a.getBoundingClientRect();
        const sx = a.offsetWidth ? b.width / a.offsetWidth : 1;
        const sy = a.offsetHeight ? b.height / a.offsetHeight : 1;
        const box = {
          l: cs.overflowX !== "visible" ? b.left + a.clientLeft * sx : -Infinity,
          r: cs.overflowX !== "visible" ? b.left + (a.clientLeft + a.clientWidth) * sx : Infinity,
          t: cs.overflowY !== "visible" ? b.top + a.clientTop * sy : -Infinity,
          b: cs.overflowY !== "visible" ? b.top + (a.clientTop + a.clientHeight) * sy : Infinity,
        };
        const sides = cut(box);
        if (sides.length) problems.push(`clipped: overflow ${cs.overflowX}/${cs.overflowY} on ${describe(a)} cuts the ring (${sides.join(", ")})`);
      }
      pos = cs.position;
    }

    /* covered */
    const style = document.createElement("style");
    style.textContent = "*,*::before,*::after{pointer-events:auto!important}";
    document.head.appendChild(style);
    const coverers = new Map();
    let points = 0;
    const opacityCache = new Map();
    const effOpacity = (n) => {
      if (opacityCache.has(n)) return opacityCache.get(n);
      let o = 1;
      for (let a = n; a; a = a.parentElement) o *= Number(getComputedStyle(a).opacity);
      opacityCache.set(n, o);
      return o;
    };
    const coverAt = (x, y) => {
      for (const h of document.elementsFromPoint(x, y)) {
        if (h === el || el.contains(h)) return null;
        if (h === document.body || h === document.documentElement) return null;
        if (h.contains(el)) return pseudoPaints(h, "::before") || pseudoPaints(h, "::after") ? h : null;
        if (h.closest(".grain")) continue;
        if (effOpacity(h) <= 0.05 || !paints(h)) continue;
        let lca = h.parentElement;
        while (lca && !lca.contains(el)) lca = lca.parentElement;
        const hChain = [];
        for (let a = h; a && a !== lca; a = a.parentElement) hChain.unshift(a);
        const eChain = [];
        for (let a = el; a && a !== lca; a = a.parentElement) eChain.unshift(a);
        if (!hChain.some(layered)) continue;
        const zh = zOf(hChain);
        if (!eChain.some(layered)) {
          if (zh >= 0) return h;
          continue;
        }
        const ze = zOf(eChain);
        if (zh > ze) return h;
        if (zh === ze && eChain[0].compareDocumentPosition(hChain[0]) & Node.DOCUMENT_POSITION_FOLLOWING) return h;
      }
      return null;
    };
    try {
      const w = ring.r - ring.l;
      const hgt = ring.b - ring.t;
      const cols = Math.min(16, Math.max(3, Math.ceil(w / 10)));
      const rows = Math.min(10, Math.max(3, Math.ceil(hgt / 10)));
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = ring.l + ((i + 0.5) * w) / cols;
          const y = ring.t + ((j + 0.5) * hgt) / rows;
          points++;
          const h = coverAt(x, y);
          if (h) coverers.set(h, (coverers.get(h) ?? 0) + 1);
        }
      }
    } finally {
      style.remove();
    }
    for (const [h, n] of coverers) problems.push(`covered: ${describe(h)} over ${n} of ${points} points of the ring box`);

    return { ...base, active, problems };
  };

  /* What the marked block was doing when the key went down: a Reveal's lift
     (its translateY) and, for a chapter, its side inset against its gutter.
     Read in the keydown's capture phase, before the key moves focus. */
  const blockState = () => {
    const n = document.querySelector("[data-fm-block]");
    if (!n) return null;
    const cs = getComputedStyle(n);
    const offset = cs.transform && cs.transform !== "none" ? new DOMMatrixReadOnly(cs.transform).f : 0;
    let chapter = null;
    if (n.classList.contains("chapter")) {
      /* The scrub writes the properties inline; at rest they come from the
         stylesheet, where a plate's --chapter-in is the gutter itself. */
      const px = (prop) => resolve(n.style.getPropertyValue(prop).trim() || cs.getPropertyValue(prop).trim() || "0px", n.offsetWidth);
      const sideIn = px("--chapter-in");
      const sideOut = px("--chapter-out");
      chapter = { in: sideIn, out: sideOut, inset: Math.max(sideIn, sideOut), gutter: resolve("var(--spacing-gutter)", innerWidth) };
    }
    return { offset, chapter };
  };

  /* Arms the samples for the next keydown. With `focusIn`, a second series
     starts when focus first arrives inside an element matching it. */
  window.__fmArm = (times, focusIn = null) => {
    const fm = window.__fm;
    fm.samples = [];
    fm.fired = false;
    fm.atKey = null;
    fm.focusAt = null;
    let t0 = 0;
    const series = (phase, start) => {
      for (const ms of times) {
        setTimeout(() => {
          const s = probe();
          s.phase = phase;
          s.at = ms;
          s.actual = Math.round(performance.now() - start);
          fm.samples.push(s);
        }, ms);
      }
    };
    const onFocus = (e) => {
      if (!(e.target instanceof Element) || !e.target.closest(focusIn)) return;
      document.removeEventListener("focusin", onFocus, true);
      const now = performance.now();
      fm.focusAt = Math.round(now - t0);
      series("focus", now);
    };
    const on = (e) => {
      if (fm.fired) return;
      fm.fired = true;
      fm.key = e.key;
      window.removeEventListener("keydown", on, true);
      fm.atKey = blockState();
      t0 = performance.now();
      if (focusIn) document.addEventListener("focusin", onFocus, true);
      series("key", t0);
    };
    window.addEventListener("keydown", on, true);
  };
}

const browser = await chromium.launch();
const report = [];
const failures = [];

const fail = (width, trigger, reason) => {
  failures.push(`${width} ${trigger}: ${reason}`);
};

async function open(width, height, route) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await ctx.addInitScript(PROBE, FOCUSABLE);
  const page = await ctx.newPage();
  await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60000 });
  /* Keyboard navigation needs React: wait for it to own the header. */
  await page.waitForFunction(
    () => {
      const el = document.querySelector("header a[href='/']");
      return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps$"));
    },
    null,
    { timeout: 30000 },
  );
  await page.waitForTimeout(1200);
  return { ctx, page };
}

/* Focuses the stop before [data-fm-target] without scrolling, so the next Tab
   lands on the target the way a keyboard visitor's would. */
async function stopBefore(page) {
  return page.evaluate(() => {
    const target = document.querySelector("[data-fm-target]");
    if (!target) return "no target marked";
    const usable = (n) =>
      n.getClientRects().length > 0 && getComputedStyle(n).visibility === "visible" && !n.closest("[inert]") && n.tabIndex >= 0 && n.tagName !== "IFRAME";
    const list = [...document.querySelectorAll(window.__fmFocusable)].filter(usable);
    const at = list.indexOf(target);
    if (at < 0) return "the target is not in the tab order";
    const prev = list[at - 1];
    if (!prev) {
      document.activeElement?.blur?.();
      return "ok";
    }
    prev.focus({ preventScroll: true });
    return document.activeElement === prev ? "ok" : "the stop before the target would not take focus";
  });
}

async function tabToTarget(page) {
  const ready = await stopBefore(page);
  if (ready !== "ok") return ready;
  await page.keyboard.press("Tab");
  await page.waitForTimeout(150);
  const on = await page.evaluate(() => !!document.querySelector("[data-fm-target]")?.contains(document.activeElement));
  return on ? "ok" : "Tab did not land on the target";
}

/* Presses the key and collects the samples. With `focusIn`, it also waits for
   the series that starts when focus arrives there; if focus never arrives,
   that series is simply missing and the trigger's own check says so. */
async function trigger(page, key, focusIn = null) {
  const expected = TIMES.length * (focusIn ? 2 : 1);
  await page.evaluate(([times, f]) => window.__fmArm(times, f), [TIMES, focusIn]);
  await page.keyboard.press(key);
  await page.waitForFunction((n) => (window.__fm?.samples?.length ?? 0) >= n, expected, { timeout: focusIn ? 6000 : 5000 }).catch(() => {});
  const got = await page.evaluate(() => ({ samples: window.__fm?.samples ?? [], atKey: window.__fm?.atKey ?? null, focusAt: window.__fm?.focusAt ?? null }));
  got.samples.sort((a, b) => (a.phase === b.phase ? a.at - b.at : a.phase === "key" ? -1 : 1));
  return got;
}

/* A sample's moment: "@200ms" after the keydown, "focus+200ms" after focus arrived. */
const when = (s) => `${s.phase === "focus" ? "focus+" : "@"}${s.at}ms`;

/* Scores the samples; `expect` adds the trigger's own conditions. Returns the
   report entry, so the caller can note what it measured. */
function score(width, name, samples, expect = () => []) {
  const entry = { width, trigger: name, samples };
  const keyed = samples.filter((s) => s.phase !== "focus").length;
  if (keyed < TIMES.length) {
    fail(width, name, `only ${keyed} of ${TIMES.length} samples came back after the keydown — the document was replaced (a hard navigation?)`);
  }
  for (const s of samples) {
    for (const p of s.problems) fail(width, name, `${when(s)} (${s.actual}ms) ${s.active}: ${p}`);
  }
  for (const reason of expect(samples)) fail(width, name, reason);
  report.push(entry);
  const bad = failures.filter((f) => f.startsWith(`${width} ${name}:`));
  console.log(`  ${bad.length ? "FAIL" : "ok  "}  ${String(width).padEnd(4)} ${name.padEnd(10)} ${samples.map((s) => `${when(s)} ${s.active ? s.active.split(" ")[0] : "<body>"}`).join("  ")}`);
  for (const f of bad.slice(0, 6)) console.log(`          - ${f.slice(`${width} ${name}: `.length)}`);
  return entry;
}

const onTarget = (samples) => samples.filter((s) => !s.inTarget).map((s) => `${when(s)} focus is not on the target (${s.active ?? "<body>"})`);

console.log("\nFOCUS IN MOTION — the focused element at 50/200/500/900 ms after each trigger, motion on\n");

for (const [vw, vh] of [
  [390, 844],
  [1440, 900],
]) {
  /* reveal: the first unrevealed block holding a focusable, below the fold,
     that is still unrevealed when Tab is pressed. A candidate that settles on
     the way is passed over, with its reason kept for the report. */
  {
    const name = "reveal";
    const MAX_CANDIDATES = 6;
    const passedOver = [];
    let done = false;
    for (const route of ["/", "/services", "/about", "/wedding-guide", "/venues/thalasses"]) {
      const { ctx, page } = await open(vw, vh, route);
      const count = await page.evaluate(() => {
        const offset = (n) => {
          const t = getComputedStyle(n).transform;
          if (!t || t === "none") return false;
          const m = new DOMMatrixReadOnly(t);
          return Math.abs(m.a - 1) < 0.001 && Math.abs(m.d - 1) < 0.001 && m.f > 4;
        };
        const usable = (n) => n.getClientRects().length > 0 && getComputedStyle(n).visibility === "visible" && n.tabIndex >= 0;
        let i = 0;
        for (const n of document.querySelectorAll('main [style*="transform"], footer [style*="transform"]')) {
          if (!offset(n)) continue;
          const r = n.getBoundingClientRect();
          if (r.top + scrollY < innerHeight * 1.2) continue;
          const f = [...n.querySelectorAll(window.__fmFocusable)].find(usable);
          if (!f) continue;
          n.setAttribute("data-fm-cand", String(i));
          f.setAttribute("data-fm-cand-target", String(i));
          i++;
        }
        return i;
      });
      /* How far the marked block still sits below its rest. */
      const lift = () =>
        page.evaluate(() => {
          const n = document.querySelector("[data-fm-block]");
          const t = n ? getComputedStyle(n).transform : "none";
          return t && t !== "none" ? new DOMMatrixReadOnly(t).f : 0;
        });
      for (let i = 0; i < Math.min(count, MAX_CANDIDATES) && !done; i++) {
        const top = await page.evaluate((i) => {
          document.querySelectorAll("[data-fm-block]").forEach((n) => n.removeAttribute("data-fm-block"));
          document.querySelectorAll("[data-fm-target]").forEach((n) => n.removeAttribute("data-fm-target"));
          const n = document.querySelector(`[data-fm-cand="${i}"]`);
          const f = document.querySelector(`[data-fm-cand-target="${i}"]`);
          if (!n || !f) return null;
          n.setAttribute("data-fm-block", "");
          f.setAttribute("data-fm-target", "");
          return n.getBoundingClientRect().top + scrollY;
        }, i);
        if (top === null) continue;
        const where = `${route} candidate ${i + 1}`;
        await page.evaluate((t) => window.scrollTo(0, Math.max(0, t - innerHeight * 1.3)), top);
        await page.waitForTimeout(900);
        if ((await lift()) <= 4) {
          passedOver.push(`${where}: settled on the scroll, before focus`);
          continue;
        }
        const ready = await stopBefore(page);
        if (ready !== "ok") {
          passedOver.push(`${where}: ${ready}`);
          continue;
        }
        if ((await lift()) <= 4) {
          passedOver.push(`${where}: focusing the stop before it finished it (they share a finishOnFocus root)`);
          continue;
        }
        done = true;
        const { samples, atKey } = await trigger(page, "Tab");
        const entry = score(vw, name, samples, (s) => [
          ...onTarget(s),
          ...(atKey && atKey.offset > 4
            ? []
            : [`the block had settled (translateY ${atKey ? `${atKey.offset.toFixed(1)}px` : "unread"}) when Tab was pressed; the unrevealed case was not exercised`]),
        ]);
        entry.route = route;
        entry.atKey = atKey;
        entry.passedOver = [...passedOver];
      }
      await ctx.close();
      if (done) break;
    }
    if (!done) {
      fail(
        vw,
        name,
        passedOver.length
          ? `no candidate block was still unrevealed when Tab could be pressed (${passedOver.slice(-4).join("; ")})`
          : "no unrevealed block holding a focusable below the fold on any candidate route",
      );
      report.push({ width: vw, trigger: name, samples: [], passedOver });
      console.log(`  FAIL  ${String(vw).padEnd(4)} ${name}`);
    }
  }

  /* nav: a client navigation from the keyboard, under the page curtain. */
  {
    const name = "nav";
    const { ctx, page } = await open(vw, vh, "/");
    let ready;
    if (vw >= 1024) {
      ready = await page.evaluate(() => {
        const link = [...document.querySelectorAll("header nav a[href^='/']")].find(
          (a) => a.getAttribute("href") !== "/" && a.getClientRects().length > 0,
        );
        if (!link) return "no header nav link";
        link.setAttribute("data-fm-target", "");
        return "ok";
      });
      if (ready === "ok") ready = await tabToTarget(page);
    } else {
      const toggle = await page.evaluate(() => {
        const t = document.querySelector("button[aria-controls='mobile-menu']");
        if (!t || !t.getClientRects().length) return false;
        t.setAttribute("data-fm-target", "");
        return true;
      });
      ready = toggle ? await tabToTarget(page) : "no menu toggle";
      if (ready === "ok") {
        await page.keyboard.press("Enter");
        await page.waitForTimeout(1300);
        ready = await page.evaluate(() => {
          document.querySelector("[data-fm-target]")?.removeAttribute("data-fm-target");
          const a = document.activeElement;
          if (!a?.closest?.("[data-menu-panel], #mobile-menu")) return "opening the menu did not move focus into it";
          if (a.matches("a[href^='/']") && a.getAttribute("href") !== "/") {
            a.setAttribute("data-fm-target", "");
            return "ok";
          }
          return "the focused menu stop is not a link to another route";
        });
      }
    }
    if (ready !== "ok") {
      fail(vw, name, ready);
      report.push({ width: vw, trigger: name, samples: [] });
      console.log(`  FAIL  ${String(vw).padEnd(4)} ${name}`);
    } else {
      await page.waitForTimeout(400);
      const { samples } = await trigger(page, "Enter");
      await page.waitForFunction(() => location.pathname !== "/", null, { timeout: 4000 }).catch(() => {});
      const moved = await page.evaluate(() => location.pathname !== "/");
      score(vw, name, samples, () => (moved ? [] : ["Enter did not navigate"]));
    }
    await ctx.close();
  }

  /* menu: 390 only — the toggle and panel do not exist from lg up. */
  if (vw < 1024) {
    const name = "menu";
    const { ctx, page } = await open(vw, vh, "/");
    const has = await page.evaluate(() => {
      const t = document.querySelector("button[aria-controls='mobile-menu']");
      if (!t || !t.getClientRects().length) return false;
      t.setAttribute("data-fm-target", "");
      return true;
    });
    const ready = has ? await tabToTarget(page) : "no menu toggle";
    if (ready !== "ok") {
      fail(vw, name, ready);
      report.push({ width: vw, trigger: name, samples: [] });
      console.log(`  FAIL  ${String(vw).padEnd(4)} ${name}`);
    } else {
      /* Focus stays on the toggle (in the header, outside the panel) until
         Header's FOCUS_AT; the second series starts when it reaches the panel.
         Where focus sits is asserted only on that series. */
      const { samples, focusAt } = await trigger(page, "Enter", "[data-menu-panel], #mobile-menu");
      const entry = score(vw, name, samples, (s) => {
        const focus = s.filter((x) => x.phase === "focus");
        if (!focus.length) {
          const last = s[s.length - 1];
          return [
            `focus never arrived in [data-menu-panel] after Enter (last sample: ${last?.active ?? "<body>"}${last && !last.menuPanel ? "; no [data-menu-panel] in the document" : ""})`,
          ];
        }
        const out = [];
        if (focus.length < TIMES.length) out.push(`only ${focus.length} of ${TIMES.length} samples came back after focus arrived in the menu`);
        for (const x of focus) {
          if (!x.inMenu) out.push(`${when(x)} focus is not in the menu (${x.active ?? "<body>"})`);
          else if (!x.firstInMenu) out.push(`${when(x)} focus is in the menu but not on its first link (${x.active})`);
        }
        return out;
      });
      entry.focusAt = focusAt;
      if (focusAt !== null) console.log(`          focus reached the panel ${focusAt}ms after Enter`);
    }
    await ctx.close();
  }

  /* venue-row: Enter on a VenueIndex row, which renders on Home. */
  {
    const name = "venue-row";
    const { ctx, page } = await open(vw, vh, "/");
    const has = await page.evaluate(() => {
      const section = document.getElementById("venue-index-heading")?.closest("section");
      const row = section && [...section.querySelectorAll("a[href^='/venues/']")].find((a) => a.getClientRects().length > 0);
      if (!row) return false;
      row.setAttribute("data-fm-target", "");
      return true;
    });
    const ready = has ? await tabToTarget(page) : "no VenueIndex row on Home";
    if (ready !== "ok") {
      fail(vw, name, ready);
      report.push({ width: vw, trigger: name, samples: [] });
      console.log(`  FAIL  ${String(vw).padEnd(4)} ${name}`);
    } else {
      await page.waitForTimeout(1000);
      const { samples } = await trigger(page, "Enter");
      await page.waitForFunction(() => location.pathname.startsWith("/venues/"), null, { timeout: 4000 }).catch(() => {});
      const moved = await page.evaluate(() => location.pathname.startsWith("/venues/"));
      score(vw, name, samples, () => (moved ? [] : ["Enter did not navigate to the venue"]));
    }
    await ctx.close();
  }

  /* cta: Tab into the closing chapter while its scrub is running. */
  {
    const name = "cta";
    const { ctx, page } = await open(vw, vh, "/");
    const found = await page.evaluate(() => {
      const chapters = [...document.querySelectorAll("main [data-ground='dark']")].filter(
        (c) => c.querySelector("a[href='/contact']") && c.querySelector("dl"),
      );
      const cta = chapters[chapters.length - 1];
      if (!cta) return null;
      const f = [...cta.querySelectorAll(window.__fmFocusable)].find((n) => n.getClientRects().length > 0 && n.tabIndex >= 0);
      if (!f) return null;
      cta.setAttribute("data-fm-block", "");
      f.setAttribute("data-fm-target", "");
      /* Where to stand. Chapter.tsx scrubs the entry as the top edge travels
         92% -> 40% of the viewport and the exit as the bottom edge travels
         60% -> 8%. A position a fifth to four fifths through either range is
         mid-scrub; among those, one with the target already in view (its ring
         clear of the fixed header and the viewport's foot) is preferred, so
         Tab does not scroll the chapter out of its scrub before the samples. */
      const vh = innerHeight;
      const c = cta.getBoundingClientRect();
      const t = f.getBoundingClientRect();
      const cTop = c.top + scrollY;
      const cBot = c.bottom + scrollY;
      const fTop = t.top + scrollY;
      const fBot = t.bottom + scrollY;
      const head = document.querySelector("header");
      const clear = Math.max(0, head ? head.getBoundingClientRect().bottom : 0) + 13;
      const maxY = document.documentElement.scrollHeight - vh;
      const mid = (p) => p >= 0.2 && p <= 0.8;
      let best = null;
      for (let y = Math.max(0, Math.floor(cTop - vh)); y <= Math.min(maxY, Math.ceil(cBot)); y += 4) {
        const pIn = (0.92 * vh - (cTop - y)) / (0.52 * vh);
        const pOut = (0.6 * vh - (cBot - y)) / (0.52 * vh);
        if (!mid(pIn) && !mid(pOut)) continue;
        const p = mid(pIn) ? pIn : pOut;
        const inView = fTop - y >= clear && fBot - y <= vh - 13;
        const rank = (inView ? 0 : 10) + Math.abs(p - 0.5);
        if (!best || rank < best.rank) best = { y, rank, inView, scrub: mid(pIn) ? "entry" : "exit", progress: Number(p.toFixed(2)) };
      }
      return best ?? { y: Math.max(0, Math.round(cTop - vh * 0.6)), rank: null, inView: false, scrub: "no mid-scrub position in range", progress: null };
    });
    if (found === null) {
      fail(vw, name, "no CtaBlock chapter with a focusable on Home");
      report.push({ width: vw, trigger: name, samples: [] });
      console.log(`  FAIL  ${String(vw).padEnd(4)} ${name}`);
    } else {
      await page.evaluate((y) => window.scrollTo(0, y), found.y);
      /* The scrub trails the scroll by 0.4 s; let it catch up to the position. */
      await page.waitForTimeout(900);
      const ready = await stopBefore(page);
      if (ready !== "ok") {
        fail(vw, name, ready);
        report.push({ width: vw, trigger: name, samples: [] });
        console.log(`  FAIL  ${String(vw).padEnd(4)} ${name}`);
      } else {
        const { samples, atKey } = await trigger(page, "Tab");
        /* Mid-scrub is what the chapter itself was doing at the keydown: a side
           inset strictly between zero (full bleed) and a gutter (a plate). */
        const ch = atKey?.chapter ?? null;
        const readable = !!ch && Number.isFinite(ch.inset) && Number.isFinite(ch.gutter);
        const midScrub = readable && ch.inset > 0.5 && ch.inset < ch.gutter - 0.5;
        const entry = score(vw, name, samples, (s) => [
          ...onTarget(s),
          ...(midScrub
            ? []
            : [
                `the chapter was not mid-scrub when Tab was pressed (side inset ${readable ? `${ch.inset.toFixed(1)}px of a ${ch.gutter.toFixed(1)}px gutter` : "unreadable"}; ${found.progress === null ? found.scrub : `stood ${found.progress} through the ${found.scrub} scrub by its rect`})`,
              ]),
        ]);
        entry.atKey = atKey;
        entry.position = found;
      }
    }
    await ctx.close();
  }
}

await browser.close();
await mkdir("design-review", { recursive: true });
await writeFile(OUT, JSON.stringify({ times: TIMES, report, failures }, null, 2));
console.log(`\n${"-".repeat(72)}`);
console.log(failures.length ? `${failures.length} focus-in-motion failure(s).` : "no focused element was hidden, clipped or covered at any sample.");
console.log(`written -> ${OUT}`);
if (failures.length) process.exitCode = 1;
