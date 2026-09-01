/**
 * Hero autoplay under iOS-like conditions.
 *
 * iOS refuses to autoplay video unless it is BOTH `muted` and `playsinline`,
 * and it will not play at all until enough data has arrived — so the poster
 * has to carry the scene on its own until then. WebKit is the engine that
 * enforces those rules, so this drives WebKit rather than asserting from
 * documentation.
 *
 * Two passes:
 *   - phone-sized WebKit with touch: the hero must NOT request the film at all
 *     (below 768px it is mostly cropped away and costs more than it gives), and
 *     the poster must be the visible LCP.
 *   - desktop WebKit: the film must mount with muted + playsinline set, and
 *     must actually reach a playing state over the poster.
 *
 * Usage: node scripts/ios-hero-check.mjs
 */

import { webkit } from "playwright";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const problems = [];

async function probe({ label, width, height, touch }) {
  const browser = await webkit.launch();
  const ctx = await browser.newContext({
    viewport: { width, height },
    hasTouch: touch,
    isMobile: touch,
    deviceScaleFactor: touch ? 3 : 1,
  });
  const page = await ctx.newPage();

  const videoBytes = [];
  page.on("response", (r) => {
    if (/\.(mp4|webm)(\?|$)/i.test(r.url())) videoBytes.push(r.url().split("/").pop());
  });

  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(7000);

  const state = await page.evaluate(() => {
    const v = document.querySelector("section video");
    const poster = document.querySelector("section img");
    return {
      videoMounted: !!v,
      muted: v?.muted ?? null,
      playsInline: v?.hasAttribute("playsinline") ?? null,
      readyState: v?.readyState ?? null,
      paused: v?.paused ?? null,
      currentTime: v ? Number(v.currentTime.toFixed(2)) : null,
      posterVisible: poster ? Number(getComputedStyle(poster).opacity) > 0.5 : false,
      posterSrc: (poster?.currentSrc || "").split("/").pop().split("?")[0],
    };
  });

  console.log(`\n### ${label} (${width}x${height}${touch ? ", touch" : ""})`);
  console.log(`  video mounted : ${state.videoMounted}`);
  if (state.videoMounted) {
    console.log(`  muted         : ${state.muted}`);
    console.log(`  playsinline   : ${state.playsInline}`);
    console.log(`  paused        : ${state.paused}   currentTime=${state.currentTime}s`);
  }
  console.log(`  poster visible: ${state.posterVisible}  (${state.posterSrc})`);
  console.log(`  film requests : ${videoBytes.length ? videoBytes.join(", ") : "none"}`);

  await browser.close();
  return { state, videoBytes };
}

/* Phone: the film must not be requested, and the poster must carry the scene. */
const phone = await probe({ label: "WebKit phone", width: 390, height: 844, touch: true });
if (phone.videoBytes.length) {
  problems.push(`phone requested film bytes: ${phone.videoBytes.join(", ")}`);
}
if (!phone.state.posterVisible) problems.push("phone: hero poster is not visible");

/* Desktop: muted + playsinline, and actually playing. */
const desk = await probe({ label: "WebKit desktop", width: 1440, height: 900, touch: false });
if (!desk.state.videoMounted) {
  problems.push("desktop WebKit: film never mounted");
} else {
  if (!desk.state.muted) problems.push("desktop WebKit: video is not muted — iOS would refuse it");
  if (!desk.state.playsInline) problems.push("desktop WebKit: playsinline missing — iOS would go fullscreen");
  if (desk.state.paused) problems.push("desktop WebKit: video mounted but never started");
}

console.log(`\n${problems.length ? `${problems.length} PROBLEM(S):` : "hero autoplay contract holds under WebKit."}`);
for (const p of problems) console.log(`  ${p}`);
if (problems.length) process.exitCode = 1;
