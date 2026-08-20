/**
 * Cross-engine check — Chromium, WebKit and Firefox against the production
 * build. Screenshots plus the specific capabilities the design leans on.
 *
 * Checks per engine:
 *   - 100svh actually resolves (the hero and footer are sized on it)
 *   - backdrop-filter support (the sticky header blur)
 *   - flex `gap` support
 *   - CSS `color-mix()` — every scrim and hairline is built on it
 *   - the hero video: muted + playsinline autoplay under iOS-like conditions,
 *     with the poster carrying the frame until it plays
 *
 * Usage: node scripts/cross-browser.mjs
 */

import { chromium, webkit, firefox } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = path.join(ROOT, "design-review", "cross-browser");

const ENGINES = [
  ["chromium", chromium],
  ["webkit", webkit],
  ["firefox", firefox],
];

const PAGES = [
  ["home", "/"],
  ["venues", "/venues"],
  ["venue-detail", "/venues/thalasses"],
  ["contact", "/contact"],
];

async function probe(page) {
  return page.evaluate(() => {
    const supports = (prop, value) => {
      try {
        return CSS.supports(prop, value);
      } catch {
        return false;
      }
    };

    // Resolve 100svh by measuring a probe element rather than trusting support().
    const probeEl = document.createElement("div");
    probeEl.style.cssText = "position:fixed;top:0;height:100svh;width:1px;pointer-events:none;";
    document.body.appendChild(probeEl);
    const svh = probeEl.getBoundingClientRect().height;
    probeEl.remove();

    const video = document.querySelector("section video");

    return {
      svhResolvedPx: Math.round(svh),
      innerHeight: window.innerHeight,
      svhWorks: Math.abs(svh - window.innerHeight) < 2,
      backdropFilter: supports("backdrop-filter", "blur(4px)") || supports("-webkit-backdrop-filter", "blur(4px)"),
      flexGap: supports("gap", "1rem"),
      colorMix: supports("color", "color-mix(in srgb, red 50%, blue)"),
      clipPath: supports("clip-path", "inset(0 0 100% 0)"),
      aspectRatio: supports("aspect-ratio", "16 / 9"),
      video: video
        ? {
            present: true,
            muted: video.muted,
            playsInline: video.playsInline,
            autoplay: video.autoplay,
            loop: video.loop,
            poster: !!video.poster,
            paused: video.paused,
            readyState: video.readyState,
            currentTime: Number(video.currentTime.toFixed(2)),
          }
        : { present: false },
      // Poster must be a real <img> painted before the film arrives.
      heroPosterImg: !!document.querySelector('section img[fetchpriority="high"], section img[fetchPriority="high"]'),
    };
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const report = [];

  for (const [engineName, engine] of ENGINES) {
    let browser;
    try {
      browser = await engine.launch();
    } catch (err) {
      report.push({ engine: engineName, error: `launch failed: ${err.message.split("\n")[0]}` });
      console.log(`${engineName}: LAUNCH FAILED`);
      continue;
    }

    // iOS-ish: mobile viewport, touch, reduced-motion off so the film is allowed.
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      hasTouch: true,
    });
    const page = await context.newPage();

    for (const [name, route] of PAGES) {
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60_000 });
        await page.waitForTimeout(name === "home" ? 6000 : 1500);

        if (name === "home") {
          report.push({ engine: engineName, ...(await probe(page)) });
        }

        await page.screenshot({
          path: path.join(OUT, `${engineName}-${name}.png`),
          timeout: 60_000,
        });
      } catch (err) {
        report.push({ engine: engineName, page: name, error: err.message.split("\n")[0] });
      }
    }

    await context.close();
    await browser.close();

    const r = report.find((x) => x.engine === engineName && x.svhWorks !== undefined);
    if (r) {
      console.log(
        `${engineName.padEnd(9)} svh:${r.svhWorks ? "ok" : "FAIL"}  backdrop:${r.backdropFilter}  gap:${r.flexGap}  color-mix:${r.colorMix}  clip-path:${r.clipPath}` +
          (r.video.present
            ? `  video: muted=${r.video.muted} inline=${r.video.playsInline} playing=${!r.video.paused} t=${r.video.currentTime}s`
            : "  video: not mounted (stills fallback)"),
      );
    }
  }

  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log("\nwritten -> design-review/cross-browser/report.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
