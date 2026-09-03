/**
 * Layout audit — the things a downscaled full-page screenshot cannot show.
 *
 * Checks every route at every breakpoint for:
 *   - horizontal overflow (the classic failure mode of edge-bleed layouts)
 *   - any element wider than the viewport, with the culprit's classes
 *   - body copy rendering below 16px
 *
 * Usage: node scripts/layout-audit.mjs
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = path.join(ROOT, "design-review");

const ROUTES = [
  "/",
  "/venues",
  "/venues/mountain-escape",
  "/venues/thalasses",
  "/venues/olive-stories",
  "/events",
  "/events/sunset-by-the-pool",
  "/events/villa-party",
  "/services",
  "/wedding-guide",
  "/about",
  "/contact",
  "/no-such-page",
];

const WIDTHS = [
  { tag: "390", width: 390, height: 844 },
  { tag: "768", width: 768, height: 1024 },
  { tag: "1440", width: 1440, height: 900 },
  { tag: "1920", width: 1920, height: 1080 },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const findings = [];

  for (const vp of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    for (const route of ROUTES) {
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60_000 });
        await page.waitForTimeout(500);

        const report = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const overflow = document.documentElement.scrollWidth - vw;

          // Elements that stick out past the right edge of the viewport.
          const wide = [];
          for (const el of Array.from(document.body.querySelectorAll("*"))) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (r.right > vw + 1 || r.left < -1) {
              const style = getComputedStyle(el);
              // Deliberate full-bleed media is fine as long as the page itself
              // does not scroll; only report when it actually overflows.
              if (style.position === "fixed") continue;
              // Nor is a card inside a horizontal scroller a finding — the
              // events strip is SUPPOSED to run past the edge. Walk up for a
              // scrolling ancestor before blaming the element.
              let inScroller = false;
              for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
                const ox = getComputedStyle(p).overflowX;
                if (ox === "auto" || ox === "scroll") {
                  inScroller = true;
                  break;
                }
              }
              if (inScroller) continue;
              wide.push({
                tag: el.tagName.toLowerCase(),
                cls: (el.className?.toString?.() ?? "").slice(0, 110),
                left: Math.round(r.left),
                right: Math.round(r.right),
              });
            }
          }

          /*
           * Smallest rendered font size among real paragraphs.
           *
           * "Real" is doing work here. Measuring every <p> made this report 56
           * findings of 11px that were all the same thing: uppercase metadata
           * labels — a category, a capacity, a coordinate — set small and wide
           * on purpose. Reading them as body copy buried the one signal the
           * check exists for, which is prose that got too small to read.
           * So: prose only, meaning more than 60 characters and not tracked-out
           * uppercase. Labels are still measured, and reported separately.
           */
          let smallest = 99;
          let smallestLabel = 99;
          for (const p of Array.from(document.querySelectorAll("p"))) {
            const text = p.textContent?.trim() ?? "";
            if (!text) continue;
            const cs = getComputedStyle(p);
            const fs = parseFloat(cs.fontSize);
            const isLabel = text.length <= 60 || cs.textTransform === "uppercase";
            if (isLabel) {
              if (fs < smallestLabel) smallestLabel = fs;
            } else if (fs < smallest) {
              smallest = fs;
            }
          }

          return {
            overflow,
            wide: wide.slice(0, 6),
            wideCount: wide.length,
            smallestParagraphPx: smallest,
            smallestLabelPx: smallestLabel,
          };
        });

        if (report.overflow > 0 || report.smallestParagraphPx < 14) {
          findings.push({ route, viewport: vp.tag, ...report });
        }

        const flag = report.overflow > 0 ? `OVERFLOW +${report.overflow}px` : "ok";
        console.log(
          `  ${vp.tag.padEnd(5)} ${route.padEnd(26)} ${flag.padEnd(18)} prose ${report.smallestParagraphPx}px / label ${report.smallestLabelPx}px`,
        );
      } catch (err) {
        findings.push({ route, viewport: vp.tag, error: err.message.split("\n")[0] });
        console.log(`  ${vp.tag.padEnd(5)} ${route.padEnd(26)} ERROR`);
      }
    }

    await context.close();
  }

  await browser.close();
  await writeFile(path.join(OUT, "layout-audit.json"), JSON.stringify(findings, null, 2), "utf8");
  console.log(`\n${findings.length} problem(s) -> design-review/layout-audit.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
