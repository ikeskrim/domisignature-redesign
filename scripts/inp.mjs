/**
 * INP under a 4x CPU throttle — the stage-6 gate for "INP green".
 *
 * Lighthouse's navigation run cannot measure Interaction to Next Paint: it
 * makes no interactions. This one drives the real ones on a phone viewport
 * with the CPU slowed 4x (the multiplier Lighthouse's mobile preset
 * simulates): the menu, route navigations from the menu and the header, the
 * events filter chips, the wedding guide's FAQ, a /venues plate, a gallery
 * tile and its lightbox, a video poster. Each interaction's latency comes from
 * the browser's own Event Timing entries — the source web-vitals reads —
 * grouped by interactionId. A route's INP is its worst interaction (a page
 * with fewer than 50 interactions drops no outlier). Green is <= 200 ms, the
 * "good" line.
 *
 * Motion stays ON: the point is to measure the choreography stage 6 tunes.
 *
 * Nothing passes silently:
 *   - each route waits for hydration, keyed on React itself (the control
 *     carries a `__reactProps$` key), never on a fixed timeout — a tap before
 *     hydration measures nothing, and a timeout long enough for a slow machine
 *     hides a slow page on a fast one;
 *   - a missing target fails its action;
 *   - `performance.interactionCount` is read around every action, and an
 *     action that registered no interaction fails. Where the browser does not
 *     expose it (Chromium ships it only behind a flag in some builds), the
 *     fallback counts the distinct interactionIds the Event Timing observer saw
 *     and the pointerdown/keydown events that reached the document; an action
 *     with neither fails, and the console says the fallback was used;
 *   - a route where no interaction registered fails.
 *
 * Recorded beside the numbers, because INP is machine-dependent (and so is
 * outside the gate): the pointer type the page sees, html[data-drop], and a
 * short CPU benchmark at 1x and at the throttle. A scroll pass on each route
 * reports long animation frames and layout shifts (reported, not gated).
 *
 * Usage: node scripts/inp.mjs      (server at SHOTS_BASE)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const GOOD = 200;
const CPU = 4;

const settle = (page, ms) => page.waitForTimeout(ms);

const missing = (what) => new Error(`target missing: ${what}`);

/* Waits until React has hydrated the control: it carries a props key. */
async function hydrated(page, locator, what) {
  if (!(await locator.count())) throw missing(what);
  const handle = await locator.elementHandle();
  await page.waitForFunction((el) => Object.keys(el).some((k) => k.startsWith("__reactProps$")), handle, { timeout: 30_000 });
  return handle;
}

/* A client navigation keeps the document; a hard one would wipe the Event
   Timing entries this measures, so it is a failure, not a quirk. */
async function markDocument(page) {
  await page.evaluate(() => {
    window.__inpDocument = true;
  });
}
async function sameDocument(page) {
  if (!(await page.evaluate(() => window.__inpDocument === true))) throw new Error("hard navigation: the document was replaced");
}

const pathnameIs = (href) => (u) => new URL(u).pathname === href;

/* Each action taps what a visitor taps and returns a label for the report. */
async function menu(page) {
  const button = page.locator("button[aria-controls='mobile-menu']").first();
  await hydrated(page, button, "menu toggle");
  if (!(await button.isVisible())) throw missing("menu toggle (not visible)");
  await button.tap();
  await page.waitForSelector("button[aria-controls='mobile-menu'][aria-expanded='true']", { timeout: 5000 });
  await page.locator("[data-menu-panel]").waitFor({ state: "visible", timeout: 5000 });
  await settle(page, 900);
  await button.tap();
  await page.waitForSelector("button[aria-controls='mobile-menu'][aria-expanded='false']", { timeout: 5000 });
  await page.locator("[data-menu-panel]").waitFor({ state: "detached", timeout: 5000 });
  await settle(page, 900);
  return "menu open + close";
}

async function navigate(page) {
  const button = page.locator("button[aria-controls='mobile-menu']").first();
  await hydrated(page, button, "menu toggle");
  await markDocument(page);
  await button.tap();
  await settle(page, 900);
  const here = new URL(page.url()).pathname;
  const links = page.locator("[data-menu-panel] a[href^='/'], #mobile-menu a[href^='/']");
  const hrefs = await links.evaluateAll((els) => els.map((a) => a.getAttribute("href")));
  const href = hrefs.find((h) => h && h !== here);
  if (!href) throw missing("a menu link to another route");
  const link = page.locator(`[data-menu-panel] a[href="${href}"], #mobile-menu a[href="${href}"]`).first();
  await hydrated(page, link, `menu link ${href}`);
  await link.tap();
  await page.waitForURL(pathnameIs(href), { timeout: 15_000 });
  await settle(page, 1500);
  await sameDocument(page);
  return `menu -> ${href} (client navigation)`;
}

async function logoHome(page) {
  const link = page.locator("header a[href='/']").first();
  await hydrated(page, link, "header home link");
  await markDocument(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page, 400);
  await link.tap();
  await page.waitForURL(pathnameIs("/"), { timeout: 15_000 });
  await settle(page, 1500);
  await sameDocument(page);
  return "header mark -> / (client navigation)";
}

async function chips(page) {
  const all = page.locator("button[aria-pressed]");
  const n = await all.count();
  if (n < 2) throw missing(`filter chips (found ${n})`);
  await hydrated(page, all.first(), "filter chip");
  for (const i of [1, Math.min(2, n - 1), 0]) {
    await all.nth(i).scrollIntoViewIfNeeded();
    await all.nth(i).tap();
    await page.waitForFunction((k) => document.querySelectorAll("button[aria-pressed]")[k]?.getAttribute("aria-pressed") === "true", i, { timeout: 5000 });
    await settle(page, 700);
  }
  return `filter chips x3 (of ${n})`;
}

async function faq(page) {
  const all = page.locator("button[aria-expanded][aria-controls^='accordion-panel']");
  const n = await all.count();
  if (n < 3) throw missing(`FAQ questions (found ${n})`);
  await hydrated(page, all.first(), "FAQ question");
  for (const i of [1, 2, 2]) {
    await all.nth(i).scrollIntoViewIfNeeded();
    await settle(page, 300);
    await all.nth(i).tap();
    await settle(page, 800);
  }
  return "FAQ taps x3 (open, open another, close it)";
}

async function plate(page) {
  const row = page
    .locator("main li")
    .filter({ has: page.locator("img") })
    .filter({ has: page.locator("a[href^='/venues/']") })
    .first();
  if (!(await row.count())) throw missing("a /venues plate row");
  const link = row.locator("a[href^='/venues/']").first();
  const href = await link.getAttribute("href");
  await hydrated(page, link, "plate link");
  const img = row.locator("img").first();
  await img.scrollIntoViewIfNeeded();
  await settle(page, 500);
  const box = await img.boundingBox();
  if (!box) throw missing("the plate's photograph (no box)");
  await markDocument(page);
  /* A tap on the photograph, where a visitor taps: the row's link is stretched
     over it, so the element under the finger is the link, not the image. */
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForURL(pathnameIs(href), { timeout: 15_000 });
  await settle(page, 1500);
  await sameDocument(page);
  return `/venues plate -> ${href}`;
}

async function tile(page) {
  const t = page.locator("[data-tile]").first();
  if (!(await t.count())) throw missing("gallery tile");
  await t.scrollIntoViewIfNeeded();
  await settle(page, 600);
  const button = t.locator("button").first();
  await hydrated(page, (await button.count()) ? button : t, "gallery tile");
  await t.tap();
  await page.locator('[role="dialog"]').first().waitFor({ state: "visible", timeout: 5000 });
  await settle(page, 700);
  const next = page.getByRole("button", { name: "Next image" });
  if (!(await next.isVisible())) throw missing("lightbox Next image button (not visible)");
  await next.tap();
  await page.locator('[role="dialog"][aria-label^="Image 2 of"]').waitFor({ state: "visible", timeout: 5000 });
  await settle(page, 700);
  await page.keyboard.press("Escape");
  await page.locator('[role="dialog"][aria-modal="true"]').waitFor({ state: "detached", timeout: 5000 });
  await settle(page, 900);
  return "gallery tile -> lightbox, next, Escape";
}

async function video(page) {
  const play = page.locator('button[aria-label^="Play video"]').first();
  if (!(await play.count())) throw missing("video poster play button");
  await play.scrollIntoViewIfNeeded();
  await settle(page, 500);
  await hydrated(page, play, "video poster play button");
  const posters = await page.locator('button[aria-label^="Play video"]').count();
  await play.tap();
  await page.waitForFunction((n) => document.querySelectorAll('button[aria-label^="Play video"]').length === n - 1, posters, { timeout: 5000 });
  await settle(page, 1200);
  return "video poster play";
}

/* Scrolls the whole page in 200px steps and reports what the frames cost. */
async function scrollPass(page) {
  const since = await page.evaluate(() => performance.now());
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight - innerHeight; y += 200) {
      window.scrollTo(0, y);
      await wait(100);
    }
    await wait(600);
  });
  const report = await page.evaluate((t0) => {
    const loaf = (window.__loaf ?? []).filter((e) => e.start >= t0);
    const shifts = (window.__shifts ?? []).filter((e) => e.start >= t0);
    return {
      supported: { longAnimationFrame: window.__loafSupported === true, layoutShift: window.__shiftSupported === true },
      longAnimationFrames: {
        count: loaf.length,
        blockingMs: Math.round(loaf.reduce((n, e) => n + e.blocking, 0)),
        worstMs: loaf.length ? Math.round(Math.max(...loaf.map((e) => e.duration))) : 0,
        worst: [...loaf].sort((a, b) => b.duration - a.duration).slice(0, 3),
      },
      layoutShift: {
        count: shifts.length,
        sum: Number(shifts.reduce((n, e) => n + e.value, 0).toFixed(4)),
        max: shifts.length ? Number(Math.max(...shifts.map((e) => e.value)).toFixed(4)) : 0,
      },
    };
  }, since);
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page, 800);
  return report;
}

/* A fixed workload, timed in the page: the same number on two machines means
   the throttle is comparable; different numbers say by how much it is not. */
const bench = (page) =>
  page.evaluate(() => {
    const t = performance.now();
    let x = 0;
    for (let i = 0; i < 3e6; i++) x = (x + Math.sqrt(i) * 1.0001) % 1e9;
    const a = Array.from({ length: 2e5 }, (_, i) => (i * 7919) % 100003);
    a.sort((p, q) => p - q);
    return Math.round(performance.now() - t);
  });

/* The wedding guide's FAQ is built but renders nothing until real answers
   land in content/pending.ts: the page mounts the section only when
   faqs.length > 0, and copy is frozen, so an empty list is the content's
   state, not a regression. With the list empty the faq action is left out and
   the report says so; with any answer in it the action runs, and a missing
   accordion fails it. A declaration this pattern does not recognise counts as
   answers present, so the gate fails loudly rather than skipping. */
const FAQ_PENDING = /export const faqs:\s*FaqItem\[\]\s*=\s*\[\s*\];/.test(await readFile(path.join(ROOT, "content", "pending.ts"), "utf8"));

/* Navigations come last on a route: after them the page is another route. */
const ROUTES = [
  { name: "home", path: "/", actions: [menu, navigate] },
  { name: "venues", path: "/venues", actions: [menu, plate] },
  { name: "events", path: "/events", actions: [chips, menu] },
  { name: "venue-detail", path: "/venues/thalasses", actions: [tile, menu, logoHome] },
  { name: "event-detail", path: "/events/villa-party", actions: [tile, video] },
  {
    name: "wedding-guide",
    path: "/wedding-guide",
    actions: FAQ_PENDING ? [menu, navigate] : [faq, menu, navigate],
    skipped: FAQ_PENDING ? ["faq: content/pending.ts has no answers, so /wedding-guide renders no accordion"] : [],
  },
];

const browser = await chromium.launch();
const results = [];
let failed = false;

for (const route of ROUTES) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1.75,
    isMobile: true,
    hasTouch: true,
  });
  /* The preloader is a once-a-session curtain; the interactions measured here
     are the ones a visitor makes after it. */
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("domi:intro-seen", "1");
    } catch {}
    window.__events = [];
    /* The fallback's second witness: an input that reached the document. The
       observer below only sees interactions of 16 ms or more (the spec's floor
       for durationThreshold), so a fast tap leaves no entry at all. */
    window.__inputs = 0;
    for (const type of ["pointerdown", "keydown"]) {
      addEventListener(
        type,
        () => {
          window.__inputs++;
        },
        { capture: true, passive: true },
      );
    }
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (!e.interactionId) continue;
        const t = e.target;
        window.__events.push({
          id: e.interactionId,
          type: e.name,
          duration: e.duration,
          target: t ? `${t.tagName.toLowerCase()}${t.getAttribute?.("aria-label") ? ` "${t.getAttribute("aria-label")}"` : ""} ${(t.textContent || "").trim().slice(0, 30)}` : "?",
        });
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
    window.__loaf = [];
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__loaf.push({
            start: e.startTime,
            duration: e.duration,
            blocking: e.blockingDuration ?? 0,
            scripts: (e.scripts ?? []).slice(0, 3).map((s) => ({
              invoker: s.invoker,
              source: (s.sourceURL || "").replace(location.origin, ""),
              duration: Math.round(s.duration),
            })),
          });
        }
      }).observe({ type: "long-animation-frame", buffered: true });
      window.__loafSupported = true;
    } catch {}
    window.__shifts = [];
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__shifts.push({ start: e.startTime, value: e.value });
      }).observe({ type: "layout-shift", buffered: true });
      window.__shiftSupported = true;
    } catch {}
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  await page.goto(`${BASE}${route.path}`, { waitUntil: "load", timeout: 90_000 });

  const did = [];
  let scroll = null;
  let environment = null;
  try {
    await hydrated(page, page.locator("header a[href='/']").first(), "header home link (hydration probe)");

    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    const bench1x = await bench(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    const benchThrottled = await bench(page);
    environment = {
      ...(await page.evaluate(() => ({
        pointer: matchMedia("(pointer: coarse)").matches ? "coarse" : matchMedia("(pointer: fine)").matches ? "fine" : "none",
        hover: matchMedia("(hover: hover)").matches,
        dataDrop: document.documentElement.getAttribute("data-drop"),
        hardwareConcurrency: navigator.hardwareConcurrency,
        interactionCount: typeof performance.interactionCount === "number",
      }))),
      benchMs: { "1x": bench1x, [`${CPU}x`]: benchThrottled },
    };

    scroll = await scrollPass(page);
  } catch (e) {
    did.push({ action: "setup", failed: String(e.message).split("\n")[0] });
  }

  if (!did.length) {
    /* A navigation keeps the document (a hard one fails the action), so the
       counters below carry across actions on one route. */
    const count = () =>
      page.evaluate(() => ({
        native: typeof performance.interactionCount === "number" ? performance.interactionCount : null,
        ids: [...new Set((window.__events ?? []).map((e) => e.id))],
        inputs: window.__inputs ?? 0,
      }));
    let warned = false;
    for (const action of route.actions) {
      const before = await count().catch(() => null);
      const entry = { action: action.name };
      try {
        entry.label = await action(page);
      } catch (e) {
        entry.failed = String(e.message).split("\n")[0];
      }
      await settle(page, 300);
      const after = await count().catch(() => null);
      if (before === null || after === null) {
        entry.interactions = null;
        if (!entry.failed) entry.failed = "the interaction counters could not be read (the page was replaced or closed)";
      } else if (before.native !== null && after.native !== null) {
        entry.interactions = after.native - before.native;
        entry.counted = "performance.interactionCount";
        if (!entry.failed && entry.interactions === 0) entry.failed = "no interaction registered (performance.interactionCount unchanged)";
      } else {
        const seen = new Set(before.ids);
        const slow = after.ids.filter((id) => !seen.has(id)).length;
        const inputs = after.inputs - before.inputs;
        /* A slow interaction's id is proof; with none, an input that reached the
           document is: the interaction was made and was under 16 ms. */
        entry.interactions = slow || null;
        entry.slowInteractions = slow;
        entry.inputEvents = inputs;
        entry.counted = "fallback: Event Timing interactionIds and input events";
        if (!warned) {
          console.log(`  WARN ${route.name.padEnd(14)} performance.interactionCount is not exposed; counting interactionIds and input events instead`);
          warned = true;
        }
        if (!entry.failed && slow === 0 && inputs === 0) entry.failed = "no interaction registered (no Event Timing interaction and no input event reached the document)";
      }
      did.push(entry);
    }
  }
  await settle(page, 600);

  const events = await page.evaluate(() => window.__events ?? []);
  const byId = new Map();
  for (const e of events) {
    const cur = byId.get(e.id);
    if (!cur || e.duration > cur.duration) byId.set(e.id, e);
  }
  const interactions = [...byId.values()].sort((a, b) => b.duration - a.duration);
  const worst = interactions[0];
  const inp = worst ? Math.round(worst.duration) : null;
  const ok = inp !== null && inp <= GOOD && !did.some((d) => d.failed);
  if (!ok) failed = true;
  results.push({ route: route.name, path: route.path, inp, ok, actions: did, skipped: route.skipped ?? [], interactions: interactions.length, worst: worst ?? null, environment, scroll });
  console.log(
    `  ${ok ? "ok  " : "FAIL"} ${route.name.padEnd(14)} INP ${inp === null ? "none recorded" : `${inp} ms`}  (${interactions.length} slow interactions; worst: ${worst ? `${worst.type} on ${worst.target}` : "-"})`,
  );
  for (const d of did) if (d.failed) console.log(`       ${d.action} FAILED: ${d.failed}`);
  for (const s of route.skipped ?? []) console.log(`       SKIPPED ${s}`);
  if (scroll) {
    console.log(
      `       scroll: ${scroll.longAnimationFrames.count} long frames (worst ${scroll.longAnimationFrames.worstMs} ms, blocking ${scroll.longAnimationFrames.blockingMs} ms), layout shift ${scroll.layoutShift.sum}`,
    );
  }
  if (environment) console.log(`       env: pointer ${environment.pointer}, data-drop ${environment.dataDrop ?? "none"}, bench ${environment.benchMs["1x"]} ms at 1x / ${environment.benchMs[`${CPU}x`]} ms at ${CPU}x`);
  await context.close();
}

const browserVersion = browser.version();
await browser.close();
await mkdir(path.join(ROOT, "design-review"), { recursive: true });
await writeFile(
  path.join(ROOT, "design-review", "inp.json"),
  JSON.stringify({ cpu: CPU, good: GOOD, browser: `chromium ${browserVersion}`, results }, null, 2) + "\n",
);
console.log(`\nINP at ${CPU}x CPU, 390px: ${failed ? "FAILED" : `all routes <= ${GOOD} ms`} -> design-review/inp.json`);
process.exit(failed ? 1 : 0);
