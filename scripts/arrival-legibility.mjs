/**
 * The arrival's legibility premise — the check that replaced the graffiti one.
 *
 * The scene used to be guarded by a question about CONCEALMENT: is a graffitied
 * rock indistinguishable inside the ink band? That question died with the ink
 * band. On the ivory ground the plate is deliberately visible, so the honest
 * question inverts: **is the type still legible on top of a photograph that is
 * now meant to be seen?**
 *
 * (The rock itself was checked on the real composite before the swap. It sits
 * in the lower band, under the heaviest part of the ivory wash — 0.94 falling
 * to 0.72 — and still does not resolve. It stopped being the interesting risk,
 * which is why this check took its slot rather than joining it.)
 *
 * Assumption-free method. Each subject is rendered twice: once as it is, and
 * once with the type hidden. The second render is sampled inside each text
 * element's own bounding box, so what is measured is the real composite —
 * photograph, grade, wash and ground — rather than a token pair. Every sampled
 * pixel is scored against the text's computed colour and the WORST one is
 * reported, because legibility is decided by the hardest pixel a letter lands
 * on, not the average.
 *
 * Two things make the reading deterministic rather than scroll-dependent. The
 * shipped scene is scrolled to its own top, and its backdrop is then held at
 * the resting 0.62 by hand. Exposure only ever decreases across the pin — the
 * plate settles back to 0.50 as the page reasserts — so 0.62 is the worst case
 * by construction, not a midpoint a scrub could wander past.
 *
 * Usage: node scripts/arrival-legibility.mjs
 */

import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";

/* The shipped scene is the subject that matters; the two study routes are the
   proposals the decision was made from, kept measurable so the comparison that
   produced it stays honest rather than becoming folklore. */
const SUBJECTS = [
  { label: "the shipped arrival", path: "/", live: true, viewports: [[1440, 900], [390, 844]] },
  { label: "study — plate", path: "/study/aegean/arrival/plate", viewports: [[1440, 900]] },
  { label: "study — chapter (runner-up)", path: "/study/aegean/arrival/chapter", viewports: [[1440, 900]] },
];

const TARGETS = [
  ['[data-measure="arrival-word"]', "the word", 3.0], // huge display type — 3:1 is the bar
  ['[data-measure="arrival-prose"]', "the standfirst", 4.5],
  ['[data-measure="arrival-stat"]', "the stat figures", 3.0],
];

const chan = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (r, g, b) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const ratio = (l1, l2) => {
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
};
const parse = (s) => (s.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);

let fails = 0;
let measured = 0;
const browser = await chromium.launch();

console.log("\nARRIVAL LEGIBILITY — the type over the photograph it actually sits on\n");

for (const subject of SUBJECTS) {
  for (const [vw, vh] of subject.viewports) {
    const ctx = await browser.newContext({
      viewport: { width: vw, height: vh },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}${subject.path}`, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2600);

    /*
     * States, not one reading.
     *
     * The scrub brings five photographs up in turn, so measuring the scene as
     * it first rests would only ever guard the opening frame — and the frame
     * that broke the old graffiti check was the closing one. Each frame is
     * therefore raised on its own, at the resting 0.62, and the WORST result
     * across all of them is what a target is scored on. Below 1024px only the
     * opening frame mounts, so there is exactly one state to read.
     */
    let states = [{ frame: null }];

    if (subject.live) {
      const count = await page.evaluate(async () => {
        const el = document.querySelector('[data-measure="arrival-word"]');
        const section = el?.closest("section");
        if (!section) return 0;
        section.scrollIntoView();
        await new Promise((r) => setTimeout(r, 900));
        const backdrop = section.querySelector(".absolute.inset-0");
        if (!backdrop) return 0;
        window.__arrivalBackdrop = backdrop;
        return backdrop.children.length;
      });
      if (!count) {
        console.log(`${subject.label} @ ${vw}x${vh}`);
        console.log("  FAIL  the arrival was not found on this page\n");
        fails++;
        await ctx.close();
        continue;
      }
      states = Array.from({ length: count }, (_, frame) => ({ frame }));
    }

    const plural = states.length > 1 ? "s" : "";
    console.log(
      `${subject.label} @ ${vw}x${vh}` +
        (subject.live ? `  (${states.length} frame${plural})` : ""),
    );

    for (const [sel, label, bar] of TARGETS) {
      let worstOverall = Infinity;
      let worstFrame = null;
      let clipNote = "";
      let sampled = false;
      let missing = false;

      for (const state of states) {
        if (state.frame !== null) {
          /* Raise one frame and hold the plate at its resting exposure. */
          await page.evaluate((i) => {
            const backdrop = window.__arrivalBackdrop;
            backdrop.style.opacity = "0.62";
            [...backdrop.children].forEach((layer, n) => {
              layer.style.opacity = n === i ? "1" : "0";
            });
          }, state.frame);
          await page.waitForTimeout(220);
        }

        const info = await page.evaluate((s) => {
          const el = document.querySelector(s);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            color: getComputedStyle(el).color,
            box: {
              x: Math.max(0, Math.round(r.x)),
              y: Math.max(0, Math.round(r.y)),
              w: Math.round(r.width),
              h: Math.round(r.height),
            },
          };
        }, sel);

        if (!info) {
          missing = true;
          break;
        }
        if (info.box.w < 2 || info.box.h < 2 || info.box.y >= vh) {
          break;
        }

        /* Hide the type, photograph what is behind it, put it back. */
        await page.evaluate((s) => {
          document.querySelectorAll(s).forEach((el) => (el.style.visibility = "hidden"));
        }, sel);
        await page.waitForTimeout(180);
        const clip = {
          x: info.box.x,
          y: info.box.y,
          width: Math.min(info.box.w, vw - info.box.x),
          height: Math.min(info.box.h, vh - info.box.y),
        };
        const shot = await page.screenshot({ clip });
        await page.evaluate((s) => {
          document.querySelectorAll(s).forEach((el) => (el.style.visibility = ""));
        }, sel);

        const { data, info: meta } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
        const [tr, tg, tb] = parse(info.color);
        const tl = lum(tr, tg, tb);

        let worst = Infinity;
        for (let i = 0; i < data.length; i += meta.channels) {
          const r = ratio(tl, lum(data[i], data[i + 1], data[i + 2]));
          if (r < worst) worst = r;
        }

        sampled = true;
        clipNote = `${clip.width}x${clip.height}px`;
        if (worst < worstOverall) {
          worstOverall = worst;
          worstFrame = state.frame;
        }
      }

      /*
       * A missing target is a FAILURE, not a skip.
       *
       * These hooks travel through `TextReveal` and `CountUp`, and TypeScript
       * does not check hyphenated JSX attributes on a component — so a hook
       * that never reaches the DOM compiles perfectly. Reporting that as "not
       * on screen" would let the check quietly stop checking anything.
       */
      if (missing) {
        console.log(`  FAIL  ${label.padEnd(16)} measurement hook is not in the DOM`);
        fails++;
        continue;
      }
      if (!sampled) {
        console.log(`  --    ${label}: off screen at this scroll position`);
        continue;
      }

      measured++;
      const ok = worstOverall >= bar;
      if (!ok) fails++;
      console.log(
        `  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(16)} worst pixel ${worstOverall.toFixed(2)}:1` +
          `  (needs ${bar.toFixed(1)})` +
          (worstFrame === null ? "" : `  on frame ${worstFrame + 1}`) +
          `  over ${clipNote}`,
      );
    }

    console.log("");
    await ctx.close();
  }
}

await browser.close();
console.log("-".repeat(70));
console.log(
  fails === 0
    ? `${measured} text blocks measured; every one holds over its photograph.`
    : `${fails} problem(s) across ${measured} measured text blocks.`,
);
if (fails) process.exitCode = 1;
