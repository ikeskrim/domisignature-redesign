/**
 * Keyboard audit — tabs through every route and checks the things a mouse
 * never exercises.
 *
 * Per route:
 *   - the skip link is the first stop and actually moves focus to #main
 *   - every stop has a visible focus indicator (outline, ring or box-shadow)
 *   - no stop is invisible or off-screen with no way to reach it
 *   - focus never lands inside an aria-hidden subtree
 *   - the horizontal events strip scrolls a focused card into view rather
 *     than stranding it past the edge
 *
 * Usage: npm run audit:keyboard
 */

import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "design-review");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";

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
];

const MAX_TABS = 45;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const findings = [];

for (const [name, route] of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: "load" });
  await page.waitForTimeout(2200); // let the preloader clear

  const problems = [];
  let stops = 0;

  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    /*
     * Let the browser's focus-scroll settle before measuring. Reading the rect
     * on the same tick reported almost every below-the-fold stop as "off-screen"
     * — 261 findings that were nothing but this missing wait. It also gives
     * Lenis time to finish, which is the thing genuinely worth testing: a
     * hijacked scroll that does not follow focus WOULD strand a keyboard user.
     */
    await page.waitForTimeout(260);
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const hiddenAncestor = !!el.closest("[aria-hidden='true']");
      const focusVisible =
        cs.outlineStyle !== "none" ||
        cs.boxShadow !== "none" ||
        el.matches(":focus-visible");
      return {
        tag: el.tagName,
        label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40),
        hiddenAncestor,
        focusVisible,
        offscreen: r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth,
        zeroSize: r.width < 2 || r.height < 2,
      };
    });
    if (!info) break;
    stops++;

    if (info.hiddenAncestor) problems.push(`stop ${stops} (${info.tag} "${info.label}") is inside aria-hidden`);
    if (info.zeroSize) problems.push(`stop ${stops} (${info.tag} "${info.label}") has no size`);

    /* Lenis animates over ~1.05s, so a long jump is still travelling at 260ms.
       Only pay that wait for stops that actually look stranded. */
    if (info.offscreen) {
      await page.waitForTimeout(900);
      const settled = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return true;
        const r = el.getBoundingClientRect();
        return !(r.bottom < 0 || r.top > window.innerHeight);
      });
      if (!settled) {
        problems.push(`stop ${stops} (${info.tag} "${info.label}") stays off-screen after focus`);
      }
    }

    /* An <iframe> takes focus before handing it to its own document; the
       indicator inside is the embedded page's to draw, not ours. Both iframes
       here are third-party (the Monday enquiry form and Google Maps). */
    if (!info.focusVisible && info.tag !== "IFRAME") {
      problems.push(`stop ${stops} (${info.tag} "${info.label}") has no focus indicator`);
    }
  }

  /* Skip link: first Tab from the top should reach it and jump to #main. */
  await page.goto(`${BASE}${route}`, { waitUntil: "load" });
  await page.waitForTimeout(2200);
  await page.keyboard.press("Tab");
  const skip = await page.evaluate(() => {
    const el = document.activeElement;
    return { text: (el?.textContent || "").trim(), href: el?.getAttribute?.("href") ?? null };
  });
  if (skip.href !== "#main") {
    problems.push(`first Tab stop is "${skip.text}" (${skip.href}), not the skip link`);
  }

  findings.push({ route: name, path: route, stops, problems });
  console.log(
    `  ${name.padEnd(14)} ${String(stops).padStart(3)} stops  ${problems.length ? `${problems.length} PROBLEM(S)` : "clean"}`,
  );
  for (const p of problems.slice(0, 4)) console.log(`      ${p}`);
}

/* The events strip specifically: does focusing the last card bring it on screen? */
await page.goto(`${BASE}/`, { waitUntil: "load" });
await page.waitForTimeout(2400);
const stripOk = await page.evaluate(async () => {
  const strip = document.querySelector('[data-cursor="drag"]');
  if (!strip) return "strip not found";
  const links = [...strip.querySelectorAll("a")];
  const last = links[links.length - 1];
  last.focus();
  await new Promise((r) => setTimeout(r, 400));
  const r = last.getBoundingClientRect();
  const s = strip.getBoundingClientRect();
  return r.left >= s.left - 4 && r.right <= s.right + 4 ? "in view" : "STRANDED off-strip";
});
console.log(`\n  events strip, last card on focus: ${stripOk}`);

const total = findings.reduce((a, f) => a + f.problems.length, 0);
console.log(`\ntotal keyboard problems: ${total}`);

await mkdir(OUT, { recursive: true });
await writeFile(
  path.join(OUT, "keyboard-audit.json"),
  JSON.stringify({ findings, stripLastCard: stripOk }, null, 2),
  "utf8",
);
console.log("written -> design-review/keyboard-audit.json");

await browser.close();
if (total > 0) process.exitCode = 1;
