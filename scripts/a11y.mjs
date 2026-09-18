/**
 * Automated accessibility pass — axe-core over every route, at mobile and
 * desktop, against the PRODUCTION build.
 *
 * Writes design-review/a11y-axe.json for the report to summarise.
 *
 * Usage: node scripts/a11y.mjs
 */

import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = path.join(ROOT, "design-review");

const ROUTES = [
  ["home", "/"],
  ["venues", "/venues"],
  ["venue-detail", "/venues/thalasses"],
  ["events", "/events"],
  ["event-detail", "/events/villa-party"],
  ["services", "/services"],
  ["wedding-guide", "/wedding-guide"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["404", "/no-such-page"],
];

const VIEWPORTS = [
  { tag: "mobile", width: 390, height: 844 },
  { tag: "desktop", width: 1440, height: 900 },
];

/** WCAG 2.1 A + AA only — that is the bar the brief sets. */
/*
 * The WCAG tags, plus axe's own best-practice set (stage 8). Without it this run
 * could not see `heading-order`, which is not a WCAG failure but is one of the
 * audits Lighthouse's accessibility score counts: /wedding-guide set its chapter
 * titles as h3 under the page's h1 and scored 98 for it while this check stayed
 * green. Measured before widening: zero best-practice violations on every route
 * at both widths, so the standard does not move — only what the gate can see.
 */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      // Audit the state most visitors see; reduced motion is swept separately.
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    for (const [name, route] of ROUTES) {
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60_000 });
        await page.waitForTimeout(900);

        const scan = await new AxeBuilder({ page })
          .withTags(TAGS)
          // The Monday.com and Google Maps iframes are third-party documents we
          // cannot fix; auditing them would only produce noise we cannot act on.
          .exclude("iframe")
          /*
           * Nothing else is excluded. The footer wordmark was, as a WCAG 1.4.3
           * logotype exemption, until stage 8 made it a drawing: it holds no
           * text now, so there is nothing to exempt (design-review/a11y.md).
           */
          .analyze();

        /*
         * Contrast axe could not compute. The paper lamp is a background layer,
         * and axe will not guess a colour over a gradient, so text on paper
         * comes back "needs review" rather than pass or fail. Printed, never
         * hidden: that coverage moved to scripts/paper-legibility.mjs, which
         * reads the actual pixels behind every glyph on paper.
         */
        const needsReview = scan.incomplete
          .filter((i) => i.id === "color-contrast")
          .reduce((n, i) => n + i.nodes.length, 0);

        results.push({
          route: name,
          path: route,
          viewport: vp.tag,
          contrastNeedsReview: needsReview,
          violations: scan.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.length,
            targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
          })),
        });

        const count = scan.violations.length;
        console.log(
          `  ${vp.tag.padEnd(8)} ${name.padEnd(14)} ${count === 0 ? "clean" : `${count} violation(s)`}` +
            (needsReview ? `   (${needsReview} contrast checks need review — measured by audit:paper)` : ""),
        );
      } catch (err) {
        results.push({ route: name, path: route, viewport: vp.tag, error: err.message.split("\n")[0] });
        console.log(`  ${vp.tag.padEnd(8)} ${name.padEnd(14)} ERROR`);
      }
    }

    await context.close();
  }

  await browser.close();
  await writeFile(path.join(OUT, "a11y-axe.json"), JSON.stringify(results, null, 2), "utf8");

  const total = results.reduce((n, r) => n + (r.violations?.length ?? 0), 0);
  const review = results.reduce((n, r) => n + (r.contrastNeedsReview ?? 0), 0);
  console.log(`\ntotal violations: ${total}`);
  console.log(`contrast checks axe could not compute: ${review} (covered on pixels by audit:paper)`);
  console.log("written -> design-review/a11y-axe.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
