/**
 * The homepage's scroll choreography, read as numbers at fixed offsets.
 *
 * The Hero's root moved from a plain <section ref={root}> into <Chapter> during
 * stage 4, and its effects now find their scope as the media layer's parent.
 * TypeScript can say that compiles. Only the running page can say whether the
 * parallax scrub and the arrival's pin still land in exactly the same places —
 * so this scrolls the real build to a fixed list of offsets and records, at
 * each one, every value the choreography drives:
 *
 *   hero     position, height, and its clip (the chapter's exit mask)
 *   media    the parallax transform (drifts down 120px across the hero)
 *   copy     the copy's lift and fade (-70px, opacity to 0)
 *   arrival  where the pinned scene sits, whether it is pinned, the spacer
 *   backdrop the plate's exposure and scale during the pin
 *   facts    the stats' arrival (their lift, opacity and, from stage 6, clip)
 *   layers   which of the five photographs is up
 *
 * Run it against two builds and diff the files: identical numbers mean
 * identical behaviour, and any difference is named with the offset it
 * appears at. Screenshots are kept beside the numbers for the eye.
 *
 * `--intended` declares the sample keys a change set out to alter (stage 6:
 * the facts arrive as a clip plus a lift instead of a fade). Those keys may
 * differ and are printed as intended; every other key must still be identical.
 * A key names one sample (`facts.opacity`) or a whole group (`facts`). A
 * capture taken before a sample existed has no value for it, which counts as
 * a difference: compare a stage-5 capture (s5) with that key declared.
 * Without `--intended` the comparison is exactly the old one.
 *
 * Usage: node scripts/hero-states.mjs <label>      -> design-review/stage4/hero/<label>.json
 *        node scripts/hero-states.mjs --compare a b
 *        node scripts/hero-states.mjs --compare s5 s6 --intended facts.opacity,facts.clipPath
 */

import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = "design-review/stage4/hero";
const OFFSETS = [0, 100, 250, 400, 550, 700, 850, 1000, 1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300];

if (process.argv[2] === "--compare") {
  const [a, b] = [process.argv[3], process.argv[4]];
  /* --intended k1,k2 or --intended=k1,k2 */
  const at = process.argv.findIndex((x) => x === "--intended" || x.startsWith("--intended="));
  const intendedArg = at < 0 ? null : process.argv[at].includes("=") ? process.argv[at].split("=")[1] : process.argv[at + 1];
  if (at >= 0 && !intendedArg) {
    console.log("--intended needs a comma-separated list of sample keys, e.g. facts.opacity,facts.clipPath");
    process.exit(2);
  }
  const INTENDED = (intendedArg ?? "").split(",").map((k) => k.trim()).filter(Boolean);
  const isIntended = (key) => INTENDED.some((k) => key === k || key.startsWith(`${k}.`));
  const A = JSON.parse(await readFile(`${OUT}/${a}.json`, "utf8"));
  const B = JSON.parse(await readFile(`${OUT}/${b}.json`, "utf8"));
  const flat = (o, p = "", acc = {}) => {
    for (const [k, v] of Object.entries(o)) {
      const key = p ? `${p}.${k}` : k;
      if (v && typeof v === "object") flat(v, key, acc);
      else acc[key] = v;
    }
    return acc;
  };
  const near = (x, y) => {
    if (typeof x === "number" && typeof y === "number") return Math.abs(x - y) <= 0.5;
    return x === y;
  };
  let behaviour = 0;
  let mask = 0;
  let intended = 0;
  const intendedSeen = new Set();
  console.log(`\nHERO CHOREOGRAPHY — ${a} vs ${b}${INTENDED.length ? `   (intended: ${INTENDED.join(", ")})` : ""}\n`);
  for (let i = 0; i < A.length; i++) {
    const fa = flat(A[i]);
    const fb = flat(B[i]);
    const keys = [...new Set([...Object.keys(fa), ...Object.keys(fb)])];
    const diffs = keys.filter((k) => !near(fa[k], fb[k]));
    const maskDiffs = diffs.filter((k) => k === "hero.clipPath");
    const declared = diffs.filter((k) => k !== "hero.clipPath" && isIntended(k));
    const other = diffs.filter((k) => k !== "hero.clipPath" && !isIntended(k));
    behaviour += other.length;
    mask += maskDiffs.length;
    intended += declared.length;
    for (const k of declared) intendedSeen.add(INTENDED.find((d) => k === d || k.startsWith(`${d}.`)));
    const line = `  offset ${String(A[i].offset).padStart(4)}  ${other.length ? "DIFFERS" : "same   "}`;
    console.log(line + (maskDiffs.length ? `   (clip: ${fa["hero.clipPath"]}  vs  ${fb["hero.clipPath"]})` : ""));
    for (const k of other) console.log(`      ${k}: ${JSON.stringify(fa[k])}  vs  ${JSON.stringify(fb[k])}`);
    for (const k of declared) console.log(`      intended  ${k}: ${JSON.stringify(fa[k])}  vs  ${JSON.stringify(fb[k])}`);
  }
  console.log(`\n${"-".repeat(70)}`);
  console.log(
    behaviour === 0
      ? `pin and scrub identical at all ${A.length} offsets. ${mask ? `The hero's clip differs at ${mask} offsets — that is the chapter exit mask, not the choreography.` : "The clip is identical too."}`
      : `${behaviour} choreography value(s) differ.`,
  );
  if (INTENDED.length) {
    console.log(`${intended} intended difference(s) across ${intendedSeen.size} of ${INTENDED.length} declared key(s).`);
    /* Printed, not failed: a declared change that never shows is worth a look,
       but the rule is only that nothing undeclared moved. */
    for (const k of INTENDED.filter((d) => !intendedSeen.has(d))) console.log(`  declared but identical at every offset: ${k}`);
  }
  if (behaviour) process.exitCode = 1;
  process.exit();
}

const label = process.argv[2] ?? "current";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await ctx.addInitScript(() => {
  try {
    sessionStorage.setItem("domi:intro-seen", "1");
  } catch {}
});
const page = await ctx.newPage();
await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(3800);

const measure = () =>
  page.evaluate(() => {
    const r2 = (n) => Math.round(n * 100) / 100;
    const tf = (el) => {
      const cs = getComputedStyle(el);
      const m = cs.transform.match(/matrix(3d)?\(([^)]+)\)/);
      const v = m ? m[2].split(",").map(Number) : null;
      const out = { opacity: r2(Number(cs.opacity)) };
      if (!v) return { ...out, tx: 0, ty: 0, scale: 1 };
      return m[1]
        ? { ...out, tx: r2(v[12]), ty: r2(v[13]), scale: r2(v[0]) }
        : { ...out, tx: r2(v[4]), ty: r2(v[5]), scale: r2(v[0]) };
    };
    const hero = document.querySelector("main section");
    const media = hero.querySelector(":scope > div");
    const line = hero.querySelector("[data-hero-line]");
    const copy = [...hero.children].find((c) => c.contains(line));
    const arr = document.querySelector('[data-measure="arrival-word"]').closest("section");
    const backdrop = arr.querySelector(".absolute.inset-0");
    const facts = arr.querySelector("dl").parentElement;
    const hr = hero.getBoundingClientRect();
    const ar = arr.getBoundingClientRect();
    const spacer = arr.parentElement.classList.contains("pin-spacer") ? arr.parentElement : null;
    return {
      scrollY: Math.round(scrollY),
      docHeight: document.documentElement.scrollHeight,
      hero: { top: r2(hr.top), height: r2(hr.height), clipPath: getComputedStyle(hero).clipPath },
      media: tf(media),
      copy: tf(copy),
      arrival: {
        top: r2(ar.top),
        height: r2(ar.height),
        position: getComputedStyle(arr).position,
        spacer: spacer ? r2(spacer.getBoundingClientRect().height) : null,
      },
      backdrop: tf(backdrop),
      /* Stage 6: the facts arrive as a clip plus a lift, so the clip is read
         beside the opacity it replaces. */
      facts: { ...tf(facts), clipPath: getComputedStyle(facts).clipPath },
      layers: [...backdrop.children].map((c) => r2(Number(getComputedStyle(c).opacity))).join(" "),
    };
  });

const samples = [];
for (const offset of OFFSETS) {
  await page.evaluate((y) => window.scrollTo(0, y), offset);
  /* Settle: Lenis eases the scroll and the arrival scrubs with a 0.6s lag, so
     read until two consecutive samples agree rather than after a fixed wait. */
  let prev = "";
  let sample;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(250);
    sample = await measure();
    const s = JSON.stringify(sample);
    if (s === prev) break;
    prev = s;
  }
  await page.screenshot({ path: `${OUT}/${label}-${String(offset).padStart(4, "0")}.png` });
  samples.push({ offset, ...sample });
  console.log(
    `  ${String(offset).padStart(4)}  scrollY ${sample.scrollY}  media.ty ${sample.media.ty}  copy ${sample.copy.ty}/${sample.copy.opacity}` +
      `  arrival ${sample.arrival.position} top ${sample.arrival.top}  plate ${sample.backdrop.opacity}×${sample.backdrop.scale}`,
  );
}

await browser.close();
await writeFile(`${OUT}/${label}.json`, JSON.stringify(samples, null, 2));
console.log(`written -> ${OUT}/${label}.json`);
