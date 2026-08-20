/**
 * Captures the enquiry-form study and measures what the native form would buy.
 *
 * Two things the owner needs to decide with:
 *   - the two forms side by side at 1440 and 390, plus the native form's
 *     validation and success states, so the choice can be made by looking;
 *   - a payload and request comparison, so "no third-party JavaScript" is a
 *     number rather than a claim.
 *
 * Usage: node scripts/study-capture.mjs
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = "design-review/study";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

/* ---------- 1. Side-by-side captures ---------- */
for (const [tag, w, h] of [["1440", 1440, 900], ["390", 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/study/enquiry`, { waitUntil: "load" });
  await page.waitForTimeout(2600);
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 160));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${tag}-study.png`, fullPage: true });
  console.log(`  captured ${tag}`);
  await ctx.close();
}

/* ---------- 2. The native form's states ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/study/enquiry`, { waitUntil: "load" });
  await page.waitForTimeout(2600);

  const form = page.locator("form").first();
  await form.scrollIntoViewIfNeeded();

  /* Submit empty -> the error summary and inline messages. */
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await page.waitForTimeout(700);
  await form.screenshot({ path: `${OUT}/native-errors.png` });
  const errorText = await page.locator('[role="alert"]').first().innerText();
  console.log(`  validation: ${errorText.split("\n")[0]}`);

  /* Fill and submit -> the success stub. */
  await page.fill('input[name="name"]', "Elena Petrakis");
  await page.fill('input[name="email"]', "elena@example.com");
  await page.fill('input[name="phone"]', "+30 697 000 0000");
  await page.fill('input[name="guests"]', "80");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await page.waitForTimeout(700);
  const ok = await page.locator('[role="status"]').first();
  await ok.screenshot({ path: `${OUT}/native-success.png` });
  console.log(`  success:    ${(await ok.innerText()).split("\n")[1] ?? ""}`);

  await ctx.close();
}

/* ---------- 3. What the embed actually costs ---------- */
async function measure(label, url, waitForEmbed) {
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 823 },
    deviceScaleFactor: 1.75,
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();

  let bytes = 0;
  let requests = 0;
  let thirdParty = 0;
  let thirdPartyBytes = 0;
  page.on("response", async (r) => {
    try {
      const b = await r.body();
      bytes += b.length;
      requests++;
      if (!r.url().startsWith(BASE)) {
        thirdParty++;
        thirdPartyBytes += b.length;
      }
    } catch {}
  });

  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1500);

  if (waitForEmbed) {
    /* Scroll so the facade upgrades, then let the embed settle. */
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
    });
    await page.waitForTimeout(6000);
  }

  console.log(
    `  ${label.padEnd(28)} ${String(requests).padStart(3)} requests, ${String(Math.round(bytes / 1024)).padStart(5)} KB` +
      `   third-party: ${String(thirdParty).padStart(3)} / ${Math.round(thirdPartyBytes / 1024)} KB`,
  );
  await ctx.close();
  return { requests, kb: Math.round(bytes / 1024), thirdParty, thirdPartyKb: Math.round(thirdPartyBytes / 1024) };
}

console.log("\n--- cost of the embed, mobile ---");
const before = await measure("/contact, no scroll", `${BASE}/contact`, false);
const after = await measure("/contact, embed loaded", `${BASE}/contact`, true);

console.log(
  `\n  the embed costs ${after.thirdParty - before.thirdParty} extra third-party requests ` +
    `and ${after.thirdPartyKb - before.thirdPartyKb} KB once it loads.`,
);
console.log(`  a native form would cost 0 of both.`);

await browser.close();
console.log(`\n-> ${OUT}/`);
