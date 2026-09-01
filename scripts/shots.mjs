/**
 * Screenshot harness — my only way to actually see this build.
 *
 * Captures every route full-page at 390 / 768 / 1440, plus a 1920 viewport shot
 * of the hero, into /design-review/<label>/.
 *
 * Reveal animations are driven by `whileInView`, and every motion component
 * checks `useReducedMotion`. Emulating reduced motion therefore renders each
 * section in its FINAL state, which is exactly what needs reviewing — otherwise
 * half the page screenshots as blank.
 *
 * The hero shot is captured with motion enabled so the video is visible.
 *
 * Usage: npm run shots              -> design-review/latest
 *        npm run shots -- round-2   -> design-review/round-2
 *        npm run shots -- final     -> design-review/final
 */

import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const LABEL = process.argv[2] ?? "latest";
const OUT = path.join(ROOT, "design-review", LABEL);

/**
 * Optional `--only=390` / `--only=hero` so a single run fits inside a
 * foreground command window. Playwright cannot spawn Chromium from a
 * backgrounded task in this environment, so the full sweep is run one
 * viewport at a time.
 */
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) ?? "").split("=")[1] || null;

/**
 * Optional `--routes=home,venues` to narrow the sweep. Mobile full-page shots
 * of a 30,000px page are slow, so the narrow viewports run a representative
 * subset rather than all fourteen routes.
 */
const ROUTE_FILTER = (process.argv.find((a) => a.startsWith("--routes=")) ?? "")
  .split("=")[1]
  ?.split(",")
  .filter(Boolean) ?? null;

const ROUTES = [
  ["home", "/"],
  ["venues", "/venues"],
  ["venue-mountain-escape", "/venues/mountain-escape"],
  ["venue-thalasses", "/venues/thalasses"],
  ["venue-olive-stories", "/venues/olive-stories"],
  ["events", "/events"],
  ["event-sunset-by-the-pool", "/events/sunset-by-the-pool"],
  ["event-villa-party", "/events/villa-party"],
  ["services", "/services"],
  ["wedding-guide", "/wedding-guide"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["404", "/no-such-page"],
];

const WIDTHS = [
  { w: 390, h: 844, tag: "390" },
  { w: 768, h: 1024, tag: "768" },
  { w: 1440, h: 900, tag: "1440" },
];

/** Walk the page so lazy images decode and in-view reveals settle. */
async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.75);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 250));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  });

  /*
   * Wait for every <img> to finish decoding before the shutter — but bounded.
   * next/image optimises on demand at runtime, so the first visit to a new
   * viewport can queue dozens of sharp jobs; an unbounded wait lets one page
   * consume an entire run. Shoot with whatever has arrived after the cap.
   */
  await page
    .evaluate(
      () =>
        Promise.race([
          Promise.all(
            Array.from(document.images)
              .filter((img) => !img.complete)
              .map(
                (img) =>
                  new Promise((res) => {
                    img.addEventListener("load", res, { once: true });
                    img.addEventListener("error", res, { once: true });
                  }),
              ),
          ),
          new Promise((res) => setTimeout(res, 25_000)),
        ]),
    )
    .catch(() => {});

  /*
   * A cold next/image cache will happily resolve `load` on images that have not
   * actually decoded, and the shutter then fires on a page of empty tiles. This
   * cost a full review cycle in Phase 6 §4: the events index screenshotted as a
   * black void and looked like a broken grid, when the page was perfectly fine
   * and sharp was simply still working. So verify decode, not just load.
   */
  for (let attempt = 0; attempt < 3; attempt++) {
    const undecoded = await page.evaluate(
      () => Array.from(document.images).filter((img) => img.naturalWidth === 0).length,
    );
    if (undecoded === 0) break;
    await page.waitForTimeout(2500);
  }

  await page.waitForTimeout(400);
}

async function main() {
  // Only wipe the folder on a full sweep; per-viewport runs accumulate into it.
  if (!ONLY) await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  let captured = 0;
  const failures = [];

  const widths = ONLY ? WIDTHS.filter((x) => x.tag === ONLY) : WIDTHS;

  for (const { w, h, tag } of widths) {
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    const routes =
      ROUTE_FILTER && ROUTE_FILTER.length
        ? ROUTES.filter(([name]) => ROUTE_FILTER.includes(name))
        : ROUTES;

    for (const [name, route] of routes) {
      try {
        const response = await page.goto(`${BASE}${route}`, {
          // "load", not "networkidle": a looping <video> and streamed range
          // requests keep the network busy forever, so networkidle never fires.
          // settle() below does the real waiting.
          waitUntil: "load",
          timeout: 60_000,
        });
        // /no-such-page legitimately returns 404; anything else must be 200.
        const status = response?.status() ?? 0;
        if (name !== "404" && status !== 200) {
          failures.push(`${name} @${tag}: HTTP ${status}`);
        }

        await settle(page);
        // fullPage on a very tall page can stall; cap it so one route cannot
        // take the whole run down with it.
        await page.screenshot({
          path: path.join(OUT, `${tag}-${name}.png`),
          fullPage: true,
          timeout: 60_000,
        });
        captured++;
      } catch (err) {
        failures.push(`${name} @${tag}: ${err.message.split("\n")[0]}`);
      }
    }

    await context.close();
    console.log(`captured ${tag}px`);
  }

  // Hero at 1920, motion ON so the background video actually plays.
  if (ONLY && ONLY !== "hero") {
    await browser.close();
    console.log(`\n${captured} screenshots -> design-review/${LABEL}/`);
    if (failures.length) {
      console.log(`\n${failures.length} FAILURES:`);
      for (const f of failures) console.log(`  ${f}`);
      process.exitCode = 1;
    }
    return;
  }

  const heroContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const heroPage = await heroContext.newPage();
  try {
    await heroPage.goto(BASE, { waitUntil: "load", timeout: 60_000 });
    // Long enough for the film to reach canplay and fade in over the poster.
    await heroPage.waitForTimeout(6000);
    await heroPage.screenshot({ path: path.join(OUT, "1920-hero.png") });
    captured++;
  } catch (err) {
    failures.push(`hero @1920: ${err.message.split("\n")[0]}`);
  }
  await heroContext.close();

  await browser.close();

  console.log(`\n${captured} screenshots -> design-review/${LABEL}/`);
  if (failures.length) {
    console.log(`\n${failures.length} FAILURES:`);
    for (const f of failures) console.log(`  ${f}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
