/**
 * CSP harness — the proposed Content-Security-Policy, measured without shipping it.
 *
 * design-review/BRIEF-AUDIT.md §4.2 proposes a policy and a document header set;
 * §4.3 says how to measure them in stage 7. A shipped Report-Only header writes
 * console errors, and Lighthouse's errors-in-console audit counts those against
 * Best Practices. So the headers never go on the server for this: the harness
 * adds them to documents inside the browser (Playwright context.route, the §4.3
 * snippet) and the Lighthouse baselines never see them.
 *
 * The matrix. Every run is its own fresh browser context:
 *   routes        every prerendered page (each .html under .next/server/app,
 *                 mapped to its URL path; `_`-prefixed internals such as
 *                 _not-found and _global-error are not routes) plus the 404,
 *                 reached through /no-such-page as a11y.mjs and paper-legibility.mjs do
 *   viewports     390x844 (touch, and isMobile where the engine supports it)
 *                 and 1440x900
 *   motion        reducedMotion "reduce" and "no-preference"
 *   engines       ENGINES, default "chromium"; "chromium,firefox,webkit" supported.
 *                 An engine that cannot launch is reported as not measured and
 *                 fails the run: not measured is never a pass.
 *   dispositions  report (Content-Security-Policy-Report-Only) and enforce
 *                 (Content-Security-Policy), both by default
 *
 * On every run:
 *   - violations: an init script in the top document listens for
 *     securitypolicyviolation and keeps the directive, the blocked URI's origin
 *     only (the page's own origin is written 'self') and the sample. Console
 *     errors that mention Content Security Policy are kept beside them, with
 *     every URL cut to its origin.
 *   - embeds: the page is scrolled top to bottom, so each facade mounts the way
 *     a visitor's scroll mounts it (src/lib/deferred-embed.ts). A facade still
 *     unmounted afterwards is scrolled to, then pressed. Every iframe is
 *     scrolled into view, and each embed must produce a frame navigation to
 *     its origin: https://forms.monday.com/forms/embed (content/site.ts:98,
 *     rendered by src/components/contact/MondayForm.tsx:133) or
 *     https://www.google.com/maps/embed (content/venues.ts mapEmbed, rendered
 *     by src/components/ui/MapEmbed.tsx:107). The number to expect is counted
 *     from the facades in the served HTML. A frame whose document fails at the
 *     network (a connection error, never a policy block) is recorded with the
 *     browser's reason and reloaded once; both are counted in the report.
 *   - a dropped connection between the harness and the server is retried up
 *     to twice and counted: it is transport, not a policy result.
 *   - the Monday form is stubbed (a small HTML body) on every run but one:
 *     /contact at 1440x900, no-preference, the first engine that launches, the
 *     last disposition requested (enforce by default), loads it for real.
 *   - positive controls: an img and an iframe pointing at
 *     https://csp-probe.invalid/ must both raise a violation, with the run's
 *     disposition. A run where they do not was not measuring the policy, and
 *     fails.
 *
 * Exit 1, with one line per failure, on: any violation other than the two
 * probes; a control that did not fire; an embed that did not navigate; the
 * designated real Monday run not measured; a route that did not load with its
 * expected status; a script or stylesheet refused under nosniff; a harness
 * route-handler failure; an engine that could not launch.
 *
 * Privacy. SHOTS_BASE is never written: outputs say "local" (a loopback host)
 * or "preview". Off loopback, requests to the base carry
 * x-vercel-skip-toolbar: 1, and no other host receives it. Frame navigations
 * are recorded as origin plus at most two path segments, never a query (a
 * map's query carries coordinates). Error text is scrubbed of the base, home
 * directory, username and machine paths. The probe host is a reserved
 * .invalid name and the harness aborts its requests, so nothing leaves the
 * machine for it. No external scanner.
 *
 * Writes design-review/csp-harness.json and design-review/csp-harness.md.
 *
 * Usage: node scripts/csp-harness.mjs                      (server at SHOTS_BASE)
 *        ENGINES=chromium,firefox,webkit node scripts/csp-harness.mjs
 * Optional:
 *   CSP_DISPOSITIONS=report,enforce   either or both (default both)
 *   CSP_ROUTES=/,/contact             narrow the routes; the report is labelled partial
 *   CSP_CONCURRENCY=N                 contexts at once per engine, 1-8 (default 1)
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "design-review");
const APP_DIR = path.join(ROOT, ".next", "server", "app");

const usage = (reason) => {
  console.error(reason);
  process.exit(2);
};

/* ------------------------------------------------------------------ inputs */

let BASE = "null";
try {
  BASE = new URL(process.env.SHOTS_BASE ?? "http://localhost:3004").origin;
} catch {
  usage("SHOTS_BASE is not a URL");
}
if (!/^https?:\/\//.test(BASE)) usage("SHOTS_BASE must be an http or https URL");
const BASE_HOST = new URL(BASE).host;
const LOOPBACK = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])$/i.test(new URL(BASE).hostname);
const SOURCE = LOOPBACK ? "local" : "preview";

const LAUNCHERS = { chromium, firefox, webkit };
const list = (value) => [...new Set(String(value).split(",").map((s) => s.trim()).filter(Boolean))];

const ENGINES = list(process.env.ENGINES ?? "chromium").map((s) => s.toLowerCase());
if (!ENGINES.length) usage("ENGINES is empty (chromium, firefox, webkit)");
for (const e of ENGINES) if (!(e in LAUNCHERS)) usage(`ENGINES: unknown engine "${e}" (chromium, firefox, webkit)`);

/* §4.3: the header key is selectable, and both run. */
const HEADER_KEYS = {
  report: "Content-Security-Policy-Report-Only",
  enforce: "Content-Security-Policy",
};
const DISPOSITIONS = list(process.env.CSP_DISPOSITIONS ?? "report,enforce").map((s) => s.toLowerCase());
if (!DISPOSITIONS.length) usage("CSP_DISPOSITIONS is empty (report, enforce)");
for (const d of DISPOSITIONS) if (!(d in HEADER_KEYS)) usage(`CSP_DISPOSITIONS: unknown disposition "${d}" (report, enforce)`);

const CONCURRENCY = Number(process.env.CSP_CONCURRENCY ?? 1);
if (!Number.isInteger(CONCURRENCY) || CONCURRENCY < 1 || CONCURRENCY > 8) {
  usage(`CSP_CONCURRENCY must be a whole number from 1 to 8, got "${process.env.CSP_CONCURRENCY}"`);
}

/* ------------------------------------------------------------- the policy */

/* BRIEF-AUDIT.md §4.2, verbatim, on its production branch (isDev false): the
   harness measures production builds, where the dev-only 'unsafe-eval' is absent. */
const FRAME_ORIGINS = [
  "https://forms.monday.com", // content/site.ts contact.formEmbed
  "https://www.google.com", // content/venues.ts mapEmbed (/maps/embed)
];
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self'",
  `frame-src ${FRAME_ORIGINS.join(" ")}`,
  "worker-src 'none'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/* §4.2's DOCUMENTS header set beside the policy. X-Content-Type-Options is
   /:path* there; nosniff changes behaviour only for script and style
   destinations, so it is also added to same-origin scripts and stylesheets
   below, and nowhere else (photographs and video stay untouched). */
const DOCUMENT_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self "https://www.google.com")',
  "cross-origin-opener-policy": "same-origin",
};

/* Headers dropped from a fetched response before it is fulfilled: route.fetch
   hands back a decoded body, so a passed-through content-encoding or length
   would corrupt it; and any policy the server already sends is replaced, so the
   run measures the proposed policy alone (the run records that it happened). */
const DROP_HEADERS = new Set(["content-encoding", "content-length", "transfer-encoding", "content-security-policy", "content-security-policy-report-only"]);

/* ------------------------------------------------------------- the matrix */

const VIEWPORTS = [
  { name: "390x844", width: 390, height: 844, phone: true },
  { name: "1440x900", width: 1440, height: 900, phone: false },
];
const MOTIONS = ["reduce", "no-preference"];
const NOT_FOUND = { path: "/no-such-page", status: 404 };

const PROBE_ORIGIN = "https://csp-probe.invalid";
const PROBE_DIRECTIVES = { img: ["img-src"], iframe: ["frame-src", "child-src"] };
const PROBE_ALL = new Set([...PROBE_DIRECTIVES.img, ...PROBE_DIRECTIVES.iframe]);

const MONDAY_ORIGIN = "https://forms.monday.com";
const MONDAY_STUB =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Harness stub</title></head><body><p>CSP harness stub for the enquiry form document.</p></body></html>';
/* The one run that loads the real form. The engine is filled in with the first
   engine that launches; the disposition is the last one requested. */
const MONDAY_REAL = { route: "/contact", viewport: "1440x900", motion: "no-preference", disposition: DISPOSITIONS[DISPOSITIONS.length - 1] };
let mondayRealEngine = null;

/* The two embeds. `marker` counts facades in the server HTML: the facade is what
   the server renders (useDeferredEmbed starts unmounted), and its button label is
   frozen copy (MondayForm.tsx:168, MapEmbed.tsx:137). */
const EMBEDS = [
  { kind: "monday", origin: "https://forms.monday.com", path: "/forms/embed", facade: "Load the form now", marker: />\s*Load the form now\s*</g },
  { kind: "maps", origin: "https://www.google.com", path: "/maps/embed", facade: "Show the map", marker: />\s*Show the map\s*</g },
];

/* The intro gate's failsafe resolves after 4 s (src/lib/intro.ts:28); a fresh
   context is a first visit, so the preloader plays on no-preference runs. */
const SETTLE_MS = 4500;
const EMBED_WAIT_MS = 20_000;
/* Network failures an embed document can meet on the way to its origin. A
   policy block (net::ERR_BLOCKED_BY_CSP and the like) is not among them. */
const NET_TRANSIENT = /net::ERR_(CONNECTION_[A-Z_]+|NETWORK_[A-Z_]+|INTERNET_DISCONNECTED|NAME_NOT_RESOLVED|NAME_RESOLUTION_FAILED|TIMED_OUT|ADDRESS_[A-Z_]+|EMPTY_RESPONSE|HTTP2_[A-Z_]+|QUIC_[A-Z_]+|SSL_PROTOCOL_ERROR|SOCKET_[A-Z_]+)/;
const CONTROL_WAIT_MS = 8000;

/* ---------------------------------------------------------------- helpers */

const HOME = os.homedir();
let USER = "";
try {
  USER = os.userInfo().username;
} catch {
  /* no username to scrub */
}

/* Nothing written or printed may carry the base, a machine path or a username. */
function scrub(text) {
  let s = String(text ?? "");
  s = s.split(BASE).join("<base>").split(BASE_HOST).join("<base>");
  if (HOME) s = s.split(HOME).join("<home>");
  /* A drive path is a single drive letter with nothing alphanumeric before it:
     without that guard the pattern matched the "s:/" inside "https://", turned
     every URL (the positive controls' origin included) into "http<path>", and
     the controls could never be matched. */
  s = s.replace(/(^|[^A-Za-z0-9])[A-Za-z]:[\\/][^\s'"`]+/g, "$1<path>").replace(/\/(?:home|Users)\/[^\s'"`]+/g, "<path>");
  if (USER && USER.length > 2) s = s.split(USER).join("<user>");
  return s;
}
const firstLine = (e) => scrub(String(e?.message ?? e).split("\n")[0]).slice(0, 300);

const originOf = (u) => {
  try {
    const o = new URL(u).origin;
    return o === BASE ? "'self'" : o;
  } catch {
    return "(unparsed)";
  }
};
const cutUrls = (text) => String(text).replace(/\b(?:https?|wss?):\/\/[^\s'"<>()]+/g, (u) => originOf(u));
const tidy = (text) => scrub(cutUrls(text)).replace(/\s+/g, " ").slice(0, 300);

/* Origin plus at most two path segments; no query, no fragment. */
function frameLabel(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null; // about:blank, chrome-error:, data:
  const segs = u.pathname.split("/").filter(Boolean).slice(0, 2);
  return `${u.origin === BASE ? "'self'" : u.origin}${segs.length ? `/${segs.join("/")}` : ""}`;
}

const kindOf = (src) => {
  try {
    const u = new URL(src);
    return EMBEDS.find((e) => u.origin === e.origin && u.pathname.startsWith(e.path)) ?? null;
  } catch {
    return null;
  }
};

const label = (r) => `${r.route} ${r.viewport} ${r.motion} ${r.engine} ${r.disposition}`;
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

async function pool(items, n, fn) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    }),
  );
}

/* ------------------------------------------------------------------ routes */

async function walk(dir, rel = "") {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await walk(path.join(dir, e.name), r)));
    else if (e.isFile() && e.name.endsWith(".html")) out.push(r);
  }
  return out;
}

/* index.html is "/"; events/villa-party.html is "/events/villa-party". A segment
   starting with "_" is an App Router internal or private folder, never a route. */
function toRoute(rel) {
  const segs = rel.replace(/\.html$/, "").split("/");
  if (segs.some((s) => s.startsWith("_"))) return null;
  if (segs.length === 1 && segs[0] === "index") return "/";
  return `/${segs.join("/")}`;
}

const discovered = [...new Set((await walk(APP_DIR)).map(toRoute).filter(Boolean))].sort();
if (!discovered.length) {
  console.log("no prerendered pages under .next/server/app: run npm run build first");
  process.exit(1);
}

let ROUTES = [...discovered.map((p) => ({ path: p, status: 200 })), NOT_FOUND];
const PARTIAL = process.env.CSP_ROUTES !== undefined;
if (PARTIAL) {
  const wanted = list(process.env.CSP_ROUTES);
  for (const w of wanted) if (!ROUTES.some((r) => r.path === w)) usage(`CSP_ROUTES: "${w}" is not a prerendered route or ${NOT_FOUND.path}`);
  ROUTES = ROUTES.filter((r) => wanted.includes(r.path));
}

let framework = "unknown";
try {
  framework = JSON.parse(await readFile(path.join(ROOT, "node_modules", "next", "package.json"), "utf8")).version;
} catch {
  /* labelled unknown rather than guessed */
}
let buildId = null;
try {
  buildId = (await readFile(path.join(ROOT, ".next", "BUILD_ID"), "utf8")).trim();
} catch {
  /* no BUILD_ID: the label says so */
}

/* ------------------------------------------------------------- in the page */

/* Runs in every document before the page's own scripts; only the top document
   records. Serialised by Playwright, so it must be self-contained. */
function listenForViolations() {
  if (window !== window.top) return;
  window.__cspHarnessBuffer = [];
  const reduce = (uri) => {
    if (!uri) return "";
    if (!/^[a-z][a-z0-9+.-]*:/i.test(uri)) return uri; // inline, eval, wasm-eval, trusted-types-*
    try {
      const u = new URL(uri);
      if (u.origin === location.origin) return "'self'";
      if (u.origin === "null") return u.protocol; // data:, about:
      return u.origin;
    } catch {
      return "(unparsed)";
    }
  };
  addEventListener(
    "securitypolicyviolation",
    (e) => {
      const v = {
        directive: e.effectiveDirective || e.violatedDirective || "",
        blocked: reduce(e.blockedURI),
        sample: String(e.sample || "").slice(0, 80),
        disposition: e.disposition || null,
      };
      if (typeof window.__cspHarnessReport === "function") {
        Promise.resolve(window.__cspHarnessReport(v)).catch(() => window.__cspHarnessBuffer.push(v));
      } else {
        window.__cspHarnessBuffer.push(v);
      }
    },
    true,
  );
}

const clean = (v, phase) => ({
  directive: String(v?.directive ?? "").slice(0, 40),
  blocked: scrub(String(v?.blocked ?? "")).slice(0, 120),
  sample: scrub(String(v?.sample ?? "")).slice(0, 80),
  disposition: v?.disposition ?? null,
  phase,
});

/* Violations the binding could not deliver wait in the page; take them. */
async function drain(page, run) {
  const buffered = await page.evaluate(() => (window.__cspHarnessBuffer ?? []).splice(0)).catch(() => []);
  for (const v of buffered) run._events.push(clean(v, run._phase));
}

/* ---------------------------------------------------------------- routing */

/* A dropped connection between the harness and the server is transport, not
   policy: the full matrix of 2026-09-16 lost three of 248 runs to it. Up to two
   more attempts, each counted on the run and in the report. */
const TRANSPORT = /ECONNRESET|socket hang up/i;

async function fetchBase(route, options, run) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await route.fetch(options);
    } catch (e) {
      if (attempt >= 2 || !TRANSPORT.test(String(e?.message ?? e))) throw e;
      run.transportRetries++;
    }
  }
}

async function handle(route, run) {
  try {
    const req = route.request();
    const url = req.url();
    /* The probe host never resolves (.invalid); abort so not even a lookup leaves. */
    if (url.startsWith(`${PROBE_ORIGIN}/`)) return await route.abort();
    if (run.monday === "stub" && url.startsWith(`${MONDAY_ORIGIN}/`)) {
      return await route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: MONDAY_STUB });
    }
    if (!url.startsWith(`${BASE}/`)) return await route.continue();

    /* Off loopback only, and only to the base. */
    const headers = LOOPBACK ? undefined : { ...(await req.allHeaders()), "x-vercel-skip-toolbar": "1" };
    const type = req.resourceType();

    if (type === "document") {
      /* §4.3. maxRedirects 0: a 3xx reaches the browser as a 3xx, so the next
         document is requested (and intercepted) at its own URL. */
      const HEADER_KEY = HEADER_KEYS[run.disposition];
      const res = await fetchBase(route, { headers, maxRedirects: 0 }, run);
      const served = res.headers();
      if ("content-security-policy" in served || "content-security-policy-report-only" in served) run.servedPolicyReplaced = true;
      if (run.expectedEmbeds === null && new URL(url).pathname === run.route && /text\/html/i.test(served["content-type"] ?? "")) {
        const html = await res.text();
        run.expectedEmbeds = Object.fromEntries(EMBEDS.map((e) => [e.kind, (html.match(e.marker) ?? []).length]));
      }
      const kept = Object.fromEntries(Object.entries(served).filter(([k]) => !DROP_HEADERS.has(k.toLowerCase())));
      return await route.fulfill({ response: res, headers: { ...kept, ...DOCUMENT_HEADERS, [HEADER_KEY]: CSP } });
    }

    if (type === "script" || type === "stylesheet") {
      const res = await fetchBase(route, { headers, maxRedirects: 0 }, run);
      const kept =Object.fromEntries(Object.entries(res.headers()).filter(([k]) => !DROP_HEADERS.has(k.toLowerCase())));
      return await route.fulfill({ response: res, headers: { ...kept, "x-content-type-options": "nosniff" } });
    }

    return await route.continue(headers ? { headers } : undefined);
  } catch (e) {
    const message = String(e?.message ?? e);
    if (!/has been closed|Target closed|disposed|already handled/i.test(message) && run.handlerErrors.length < 10) {
      run.handlerErrors.push(firstLine(e));
    }
    try {
      await route.abort();
    } catch {
      /* the context is gone or the route was handled */
    }
  }
}

/* ------------------------------------------------------------------ phases */

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = Math.max(240, Math.round(innerHeight * 0.6));
    for (let y = 0, i = 0; i < 400 && y <= document.documentElement.scrollHeight; y += step, i++) {
      window.scrollTo(0, y);
      await wait(160);
    }
    await wait(800);
  });
}

async function checkEmbeds(page, run, frames) {
  const expected = run.expectedEmbeds ?? Object.fromEntries(EMBEDS.map((e) => [e.kind, 0]));
  const pressed = Object.fromEntries(EMBEDS.map((e) => [e.kind, 0]));

  /* A facade the scroll pass did not mount: into view first, then a press. */
  for (const e of EMBEDS) {
    for (let guard = 0; guard < 8; guard++) {
      const handleEl = await page.getByRole("button", { name: e.facade, exact: true }).first().elementHandle({ timeout: 1000 }).catch(() => null);
      if (!handleEl) break;
      await handleEl.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const still = await handleEl.evaluate((el) => el.isConnected).catch(() => false);
      if (still) {
        try {
          await handleEl.click({ timeout: 5000 });
          pressed[e.kind]++;
        } catch {
          break;
        }
        await page.waitForTimeout(500);
      }
    }
  }

  const mounted = Object.fromEntries(EMBEDS.map((e) => [e.kind, 0]));
  const elements = Object.fromEntries(EMBEDS.map((e) => [e.kind, []]));
  const unknown = new Map();
  const handles = await page.locator("iframe:not([data-csp-probe])").elementHandles();
  for (const el of handles) {
    const src = (await el.getAttribute("src").catch(() => null)) ?? "";
    const kind = kindOf(src);
    if (kind) {
      mounted[kind.kind]++;
      elements[kind.kind].push(el);
    } else {
      const key = frameLabel(src) ?? (src ? "(unparsed src)" : "(no src)");
      unknown.set(key, (unknown.get(key) ?? 0) + 1);
    }
    await el.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
  }

  const navigatedTo = (e) => [...frames.values()].filter((set) => set.has(`${e.origin}${e.path}`)).length;
  const results = [];
  for (const e of EMBEDS) {
    const want = Math.max(expected[e.kind] ?? 0, mounted[e.kind]);
    if (want === 0) continue;
    const target = `${e.origin}${e.path}`;
    const waitFor = async () => {
      const deadline = Date.now() + EMBED_WAIT_MS;
      while (navigatedTo(e) < want && Date.now() < deadline) await page.waitForTimeout(250);
    };
    await waitFor();
    const netErrors = () => run.embedNetErrors.filter((x) => x.startsWith(`${target}:`));
    /* A frame whose document failed at the network never reached the policy
       under test: it is reloaded once, counted, and must then navigate. */
    let reloaded = 0;
    if (navigatedTo(e) < want && netErrors().some((x) => NET_TRANSIENT.test(x))) {
      for (const el of elements[e.kind]) {
        const frame = await el.contentFrame().catch(() => null);
        if (frame && frameLabel(frame.url()) === target) continue;
        const done = await el
          .evaluate((f) => {
            f.src = f.src;
            return true;
          })
          .catch(() => false);
        if (done) reloaded++;
      }
      run.embedReloads += reloaded;
      if (reloaded) await waitFor();
    }
    const navigated = navigatedTo(e);
    results.push({
      kind: e.kind,
      origin: target,
      expected: expected[e.kind] ?? 0,
      mounted: mounted[e.kind],
      pressed: pressed[e.kind],
      navigated,
      ...(e.kind === "monday" ? { load: run.monday } : {}),
      ...(reloaded ? { reloaded } : {}),
      ...(netErrors().length ? { netErrors: netErrors() } : {}),
      ok: navigated >= want,
    });
  }
  for (const [origin, count] of unknown) {
    results.push({ kind: "unknown", origin, expected: 0, mounted: count, pressed: 0, navigated: null, ok: false });
  }
  run.embeds = results;
}

async function positiveControls(page, run) {
  const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await page.evaluate(
    ({ origin, token: t }) => {
      const hide = (el) => {
        Object.assign(el.style, { position: "fixed", left: "0", top: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none", border: "0" });
        el.setAttribute("data-csp-probe", "");
        el.setAttribute("aria-hidden", "true");
      };
      const img = document.createElement("img");
      hide(img);
      img.alt = "";
      img.src = `${origin}/img?${t}`;
      const frame = document.createElement("iframe");
      hide(frame);
      frame.tabIndex = -1;
      frame.title = "CSP probe";
      frame.src = `${origin}/frame?${t}`;
      document.body.append(img, frame);
    },
    { origin: PROBE_ORIGIN, token },
  );

  const fired = (which) => run._events.filter((v) => v.blocked === PROBE_ORIGIN && PROBE_DIRECTIVES[which].includes(v.directive));
  const deadline = Date.now() + CONTROL_WAIT_MS;
  while ((!fired("img").length || !fired("iframe").length) && Date.now() < deadline) {
    await page.waitForTimeout(200);
    await drain(page, run);
  }

  const img = fired("img");
  const iframe = fired("iframe");
  const dispositions = [...new Set([...img, ...iframe].map((v) => v.disposition))];
  /* An engine that does not expose `disposition` reports null; that is not a mismatch. */
  const dispositionOk = dispositions.every((d) => d === null || d === run.disposition);
  run.controls = {
    img: img.length > 0,
    iframe: iframe.length > 0,
    directives: [...new Set([...img, ...iframe].map((v) => v.directive))],
    dispositions,
    ok: img.length > 0 && iframe.length > 0 && dispositionOk,
  };

  await page.evaluate(() => document.querySelectorAll("[data-csp-probe]").forEach((el) => el.remove())).catch(() => {});
}

/* -------------------------------------------------------------------- run */

function newRun(spec) {
  return {
    route: spec.route,
    viewport: spec.viewport,
    motion: spec.motion,
    engine: spec.engine,
    disposition: spec.disposition,
    headerKey: HEADER_KEYS[spec.disposition],
    monday: spec.monday,
    expectStatus: spec.expectStatus,
    status: null,
    landedOn: null,
    error: null,
    expectedEmbeds: null,
    servedPolicyReplaced: false,
    handlerErrors: [],
    transportRetries: 0,
    embedNetErrors: [],
    embedReloads: 0,
    console: { violations: [], probe: [], notices: [], mimeRefusals: [], foreignFrameCspMessages: 0 },
    pageErrors: 0,
    frameNavigations: [],
    embeds: null,
    controls: null,
    _order: spec.order,
    _events: [],
    _phase: "setup",
  };
}

async function measure(browser, spec) {
  const run = newRun(spec);
  const vp = VIEWPORTS.find((v) => v.name === spec.viewport);
  const options = { viewport: { width: vp.width, height: vp.height }, reducedMotion: spec.motion };
  if (vp.phone) {
    options.hasTouch = true;
    /* Firefox has no isMobile emulation (Playwright refuses the option there). */
    if (spec.engine !== "firefox") {
      options.isMobile = true;
      options.deviceScaleFactor = 1.75;
    }
  }

  let context;
  try {
    context = await browser.newContext(options);
  } catch (e) {
    run.error = `context: ${firstLine(e)}`;
    return run;
  }

  /* Child frames of the top document -> the labels each one navigated to. */
  const frames = new Map();
  try {
    await context.exposeBinding("__cspHarnessReport", (source, v) => {
      if (source.page && source.frame !== source.page.mainFrame()) return;
      run._events.push(clean(v, run._phase));
    });
    await context.addInitScript(listenForViolations);
    await context.route("**/*", (route) => handle(route, run));

    const page = await context.newPage();
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame() || frame.parentFrame() !== page.mainFrame()) return;
      const where = frameLabel(frame.url());
      if (!where || where.startsWith(PROBE_ORIGIN)) return;
      if (!frames.has(frame)) frames.set(frame, new Set());
      frames.get(frame).add(where);
    });
    /* A child frame's document that fails to load, with the browser's reason. A
       frame that fails this way navigates to an error page, which no label records. */
    page.on("requestfailed", (req) => {
      let frame;
      try {
        frame = req.frame();
      } catch {
        return;
      }
      if (req.resourceType() !== "document" || frame === page.mainFrame()) return;
      const where = frameLabel(req.url());
      if (!where || where.startsWith(PROBE_ORIGIN) || run.embedNetErrors.length >= 10) return;
      run.embedNetErrors.push(`${where}: ${scrub(req.failure()?.errorText ?? "failed")}`);
    });
    page.on("console", (msg) => {
      const type = msg.type();
      if (type !== "error" && type !== "warning") return;
      const text = msg.text();
      const at = msg.location()?.url ?? "";
      const foreign = /^https?:/i.test(at) && originOf(at) !== "'self'";
      if (/strict MIME type checking|X-Content-Type-Options/i.test(text)) {
        if (!foreign) run.console.mimeRefusals.push(tidy(text));
        return;
      }
      if (!/content[\s-]security[\s-]policy/i.test(text)) return;
      /* An embedded document's own policy is not the policy under test. */
      if (foreign) {
        run.console.foreignFrameCspMessages++;
        return;
      }
      if (type === "error" && /refused|violat|blocked/i.test(text)) {
        (/csp-probe\.invalid/i.test(text) ? run.console.probe : run.console.violations).push(tidy(text));
      } else {
        run.console.notices.push(tidy(text));
      }
    });
    page.on("pageerror", () => {
      run.pageErrors++;
    });

    run._phase = "load";
    const response = await page.goto(`${BASE}${spec.route}`, { waitUntil: "load", timeout: 90_000 });
    run.status = response ? response.status() : null;
    run.landedOn = new URL(page.url()).pathname;
    await page.waitForTimeout(SETTLE_MS);
    await drain(page, run);

    run._phase = "scroll";
    await scrollThrough(page);
    await drain(page, run);

    run._phase = "embeds";
    await checkEmbeds(page, run, frames);
    await drain(page, run);

    run._phase = "controls";
    await positiveControls(page, run);

    run._phase = "collect";
    await page.waitForTimeout(300);
    await drain(page, run);
  } catch (e) {
    run.error = firstLine(e);
  } finally {
    run.frameNavigations = [...new Set([...frames.values()].flatMap((s) => [...s]))].sort();
    await context.close().catch(() => {});
  }
  return run;
}

/* Verdict for one run: every reason is one line. */
function finalise(run) {
  const events = run._events;
  delete run._events;
  delete run._phase;

  const isProbe = (v) => v.blocked === PROBE_ORIGIN && PROBE_ALL.has(v.directive);
  const unexpected = events.filter((v) => !isProbe(v));
  const byDirective = {};
  for (const v of unexpected) {
    const rows = (byDirective[v.directive || "(none)"] ??= []);
    const row = rows.find((r) => r.blocked === v.blocked && r.sample === v.sample && r.disposition === v.disposition);
    if (row) {
      row.count++;
      if (!row.phases.includes(v.phase)) row.phases.push(v.phase);
    } else {
      rows.push({ blocked: v.blocked, sample: v.sample, disposition: v.disposition, phases: [v.phase], count: 1 });
    }
  }
  run.violations = { total: events.length, probe: events.length - unexpected.length, unexpected: unexpected.length, byDirective };

  const reasons = [];
  if (run.error) reasons.push(`did not complete: ${run.error}`);
  if (run.status !== null && run.status !== run.expectStatus) reasons.push(`served ${run.status}, expected ${run.expectStatus}`);
  if (run.landedOn !== null && run.landedOn !== run.route) reasons.push(`landed on ${run.landedOn}`);
  for (const [directive, rows] of Object.entries(byDirective)) {
    const n = rows.reduce((s, r) => s + r.count, 0);
    reasons.push(`unexpected ${directive} violation x${n}: ${[...new Set(rows.map((r) => r.blocked || "(no blocked URI)"))].join(", ")}`);
  }
  if (run.console.violations.length) reasons.push(`console reports ${run.console.violations.length} CSP violation(s): ${run.console.violations[0]}`);
  if (!run.controls) reasons.push("positive controls did not run");
  else {
    if (!run.controls.img) reasons.push("positive control did not fire: img -> csp-probe.invalid");
    if (!run.controls.iframe) reasons.push("positive control did not fire: iframe -> csp-probe.invalid");
    if (run.controls.img && run.controls.iframe && !run.controls.ok) {
      reasons.push(`positive controls fired with disposition ${run.controls.dispositions.join("/")}, expected ${run.disposition}`);
    }
  }
  if (!run.error && run.embeds === null) reasons.push("embed checks did not run");
  for (const e of run.embeds ?? []) {
    if (e.ok) continue;
    if (e.kind === "unknown") reasons.push(`an iframe outside the two known embed origins: ${e.origin} (x${e.mounted})`);
    else {
      const cause = e.netErrors?.length ? `network: ${e.netErrors.map((x) => x.slice(e.origin.length + 2)).join(", ")}` : "no network error recorded";
      reasons.push(`${e.kind}: ${e.navigated} of ${Math.max(e.expected, e.mounted)} frame(s) navigated to ${e.origin}${e.reloaded ? ` after ${e.reloaded} reload(s)` : ""} (${cause})`);
    }
  }
  /* A guard on the facade markers: if their label ever changes, every route
     would expect zero embeds and the check would pass on nothing. /contact
     renders both (src/app/contact/page.tsx:163 and :186). */
  if (run.route === "/contact" && run.status === 200 && run.expectedEmbeds && (!run.expectedEmbeds.monday || !run.expectedEmbeds.maps)) {
    reasons.push("facade markers not found in /contact's HTML (did MondayForm.tsx or MapEmbed.tsx change?)");
  }
  if (run.console.mimeRefusals.length) reasons.push(`nosniff refused ${run.console.mimeRefusals.length} same-origin response(s): ${run.console.mimeRefusals[0]}`);
  if (run.handlerErrors.length) reasons.push(`harness route handler failed: ${run.handlerErrors[0]}`);

  run.reasons = reasons;
  run.ok = reasons.length === 0;
  return run;
}

function printRun(run) {
  const controls = run.controls ? `img ${run.controls.img ? "yes" : "NO"} / iframe ${run.controls.iframe ? "yes" : "NO"}` : "not run";
  const embeds = (run.embeds ?? []).map((e) => `${e.kind} ${e.navigated ?? "-"}/${Math.max(e.expected, e.mounted)}`).join(", ") || "none";
  console.log(`  ${run.ok ? "ok  " : "FAIL"} ${label(run).padEnd(58)} unexpected ${run.violations.unexpected}, controls ${controls}, embeds ${embeds}`);
  for (const r of run.reasons) console.log(`       ${r}`);
}

/* ------------------------------------------------------------------- main */

console.log(`CSP HARNESS  ${new Date().toISOString().slice(0, 16).replace("T", " ")}  source: ${SOURCE}  next ${framework}`);
console.log(`  ${ROUTES.length} routes x ${VIEWPORTS.length} viewports x ${MOTIONS.length} motion x ${DISPOSITIONS.join("+")} on ${ENGINES.join(", ")}${PARTIAL ? "  (partial: CSP_ROUTES)" : ""}`);

const engines = [];
const runs = [];
const failures = [];
let order = 0;

for (const name of ENGINES) {
  let browser;
  try {
    browser = await LAUNCHERS[name].launch();
  } catch (e) {
    const reason = `launch failed: ${firstLine(e)}`;
    engines.push({ name, measured: false, reason });
    failures.push(`${name}: not measured (${reason})`);
    console.log(`\n${name}: NOT MEASURED (${reason})`);
    continue;
  }
  const version = browser.version();
  if (mondayRealEngine === null) mondayRealEngine = name;
  engines.push({ name, measured: true, version });
  console.log(`\n${name} ${version}`);

  const specs = [];
  for (const r of ROUTES) {
    for (const vp of VIEWPORTS) {
      for (const motion of MOTIONS) {
        for (const disposition of DISPOSITIONS) {
          const real =
            r.path === MONDAY_REAL.route && vp.name === MONDAY_REAL.viewport && motion === MONDAY_REAL.motion && disposition === MONDAY_REAL.disposition && name === mondayRealEngine;
          specs.push({ order: order++, route: r.path, expectStatus: r.status, viewport: vp.name, motion, engine: name, disposition, monday: real ? "real" : "stub" });
        }
      }
    }
  }

  /* A browser that dies mid-matrix is relaunched once per death; a relaunch that
     fails fails the runs that needed it, never skips them. */
  let relaunching = null;
  const current = async () => {
    if (browser.isConnected()) return browser;
    relaunching ??= LAUNCHERS[name].launch().then(
      (b) => {
        browser = b;
        relaunching = null;
        return b;
      },
      (e) => {
        relaunching = null;
        throw e;
      },
    );
    return relaunching;
  };

  await pool(specs, CONCURRENCY, async (spec) => {
    let run;
    try {
      run = await measure(await current(), spec);
    } catch (e) {
      run = newRun(spec);
      run.error = `browser unavailable: ${firstLine(e)}`;
    }
    runs.push(finalise(run));
    printRun(run);
  });

  await browser.close().catch(() => {});
}

runs.sort((a, b) => a._order - b._order);
for (const r of runs) delete r._order;
for (const r of runs) for (const reason of r.reasons) failures.push(`${label(r)}: ${reason}`);

const realRun = runs.find((r) => r.monday === "real");
const realLabel = `${MONDAY_REAL.route} ${MONDAY_REAL.viewport} ${MONDAY_REAL.motion} ${mondayRealEngine ?? "(no engine launched)"} ${MONDAY_REAL.disposition}`;
if (!realRun) {
  failures.push(`the real Monday form load was not measured (designated run: ${realLabel})`);
} else if (!realRun.embeds?.some((e) => e.kind === "monday" && e.ok)) {
  failures.push(`the real Monday form did not navigate on ${label(realRun)}`);
}

const verdict = failures.length ? "fail" : "pass";

/* ----------------------------------------------------------------- output */

await mkdir(OUT, { recursive: true });

const json = {
  generated: new Date().toISOString(),
  source: SOURCE,
  framework: `next ${framework}`,
  routesFrom: { dir: ".next/server/app", buildId },
  partial: PARTIAL,
  policy: {
    csp: CSP,
    headerKeys: HEADER_KEYS,
    documentHeaders: DOCUMENT_HEADERS,
    nosniffAlsoOn: ["same-origin script", "same-origin stylesheet"],
    source: "design-review/BRIEF-AUDIT.md §4.2 (production branch, isDev false)",
  },
  matrix: {
    routes: ROUTES.map((r) => ({ path: r.path, status: r.status })),
    viewports: VIEWPORTS.map((v) => v.name),
    motion: MOTIONS,
    engines: ENGINES,
    dispositions: DISPOSITIONS,
  },
  mondayRealRun: realLabel,
  probe: PROBE_ORIGIN,
  engines,
  summary: { runs: runs.length, ok: runs.filter((r) => r.ok).length, failed: runs.filter((r) => !r.ok).length },
  verdict,
  failures,
  runs,
};
await writeFile(path.join(OUT, "csp-harness.json"), `${JSON.stringify(json, null, 2)}\n`, "utf8");

const engineLine = engines.map((e) => (e.measured ? `${e.name} ${e.version} (measured)` : `${e.name} (not measured: ${e.reason})`)).join("; ");

const runRows = runs.map((r) => {
  const unexpected = Object.entries(r.violations.byDirective)
    .map(([d, rows]) => `${d} x${rows.reduce((s, x) => s + x.count, 0)}`)
    .join(", ");
  const controls = r.controls ? `${r.controls.img ? "yes" : "NO"} / ${r.controls.iframe ? "yes" : "NO"}` : "not run";
  const embeds = (r.embeds ?? []).map((e) => `${e.kind} ${e.navigated ?? "-"}/${Math.max(e.expected, e.mounted)}${e.load ? ` (${e.load})` : ""}`).join(", ") || "none";
  return `| \`${cell(r.route)}\` | ${r.viewport} | ${r.motion} | ${r.engine} | ${r.disposition} | ${r.status ?? "-"} | ${cell(unexpected || "0")} | ${controls} | ${cell(embeds)} | ${r.ok ? "ok" : "**FAIL**"} |`;
});

const grouped = new Map();
for (const r of runs) {
  for (const [directive, rows] of Object.entries(r.violations.byDirective)) {
    for (const row of rows) {
      const key = `${directive}|${row.blocked}|${row.sample}`;
      const g = grouped.get(key) ?? { directive, blocked: row.blocked, sample: row.sample, count: 0, runs: [] };
      g.count += row.count;
      g.runs.push(label(r));
      grouped.set(key, g);
    }
  }
}
const directives = [...new Set([...grouped.values()].map((g) => g.directive))].sort();
const violationSection = directives.length
  ? directives
      .map((d) => {
        const rows = [...grouped.values()].filter((g) => g.directive === d).sort((a, b) => b.count - a.count);
        return [
          `### \`${cell(d)}\``,
          "",
          "| Blocked (origin) | Sample | Count | Runs |",
          "|---|---|---|---|",
          ...rows.map((g) => `| ${cell(g.blocked || "-")} | ${g.sample ? `\`${cell(g.sample)}\`` : "-"} | ${g.count} | ${cell(g.runs.slice(0, 6).join("; "))}${g.runs.length > 6 ? ` and ${g.runs.length - 6} more` : ""} |`),
        ].join("\n");
      })
      .join("\n\n")
  : "None. Every violation recorded came from the two positive-control probes.";

const embedRows = runs.flatMap((r) =>
  (r.embeds ?? []).map(
    (e) =>
      `| \`${cell(r.route)}\` | ${r.viewport} | ${r.motion} | ${r.engine} | ${r.disposition} | ${e.kind}${e.load ? ` (${e.load})` : ""} | ${cell(e.origin)} | ${e.expected} | ${e.mounted} | ${e.pressed} | ${e.navigated ?? "-"} | ${e.ok ? "ok" : "**FAIL**"} |`,
  ),
);

const notices = new Map();
for (const r of runs) for (const n of r.console.notices) notices.set(n, (notices.get(n) ?? 0) + 1);
const noticeRows = [...notices.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
const replaced = runs.filter((r) => r.servedPolicyReplaced).length;
const retried = runs.filter((r) => r.transportRetries);
const reloadedRuns = runs.filter((r) => r.embedReloads);
const netFailedRuns = runs.filter((r) => r.embedNetErrors.length);
const foreign = runs.reduce((s, r) => s + r.console.foreignFrameCspMessages, 0);
const pageErrors = runs.reduce((s, r) => s + r.pageErrors, 0);
const navigations = [...new Set(runs.flatMap((r) => r.frameNavigations))].sort();

const md = `# CSP harness

The policy and document headers proposed in \`design-review/BRIEF-AUDIT.md\` §4.2,
injected into documents by the harness as §4.3 describes. Nothing is shipped:
the server's responses are unchanged, and the Lighthouse baselines never see
these headers.

- Source: ${SOURCE}. Framework: next ${framework} (local node_modules). Routes from the local \`.next/server/app\` (BUILD_ID ${buildId ? `\`${buildId}\`` : "not found"}).
- Engines: ${engineLine}.
- Matrix: ${ROUTES.length} routes x ${VIEWPORTS.length} viewports x ${MOTIONS.length} motion modes x ${engines.filter((e) => e.measured).length} measured engine(s) x ${DISPOSITIONS.length} disposition(s) = ${runs.length} runs.${PARTIAL ? " **Partial:** CSP_ROUTES narrowed the routes." : ""}
- Monday form: stubbed on every run except \`${realLabel}\`, which loads it for real.
- Positive controls: an img and an iframe to \`${PROBE_ORIGIN}/\` on every page, after the embed checks.
- Transport retries (a dropped connection to the server, retried by the harness): ${retried.length ? `${retried.reduce((s, r) => s + r.transportRetries, 0)} on ${retried.length} run(s): ${retried.map((r) => `\`${cell(label(r))}\``).join(", ")}` : "none"}.
- Embed documents that failed at the network: ${netFailedRuns.length ? `${netFailedRuns.length} run(s): ${netFailedRuns.map((r) => `\`${cell(label(r))}\` (${cell(r.embedNetErrors.join("; "))})`).join(", ")}` : "none"}. Frames reloaded once after such a failure: ${reloadedRuns.length ? `${reloadedRuns.reduce((s, r) => s + r.embedReloads, 0)} on ${reloadedRuns.length} run(s)` : "none"}.
- Generated: ${json.generated}.

**Verdict: ${verdict.toUpperCase()}**. ${json.summary.ok} of ${runs.length} runs clean; ${failures.length} failure line(s).

## The injected policy

\`\`\`text
${CSP}
\`\`\`

Report disposition: \`${HEADER_KEYS.report}\`. Enforce disposition: \`${HEADER_KEYS.enforce}\`.
Also on every document: ${Object.entries(DOCUMENT_HEADERS)
  .map(([k, v]) => `\`${k}: ${v}\``)
  .join(", ")}. \`x-content-type-options: nosniff\` is also added to same-origin scripts and stylesheets.
${replaced ? `\nThe server already sent a policy on ${replaced} run(s); the harness replaced it, so these runs measure the proposed policy alone.\n` : ""}
## Failures

${failures.length ? failures.map((f) => `- ${cell(f)}`).join("\n") : "None."}

## Runs

| Route | Viewport | Motion | Engine | Disposition | Status | Unexpected violations | Controls (img / iframe) | Embeds navigated | Result |
|---|---|---|---|---|---|---|---|---|---|
${runRows.join("\n")}

## Unexpected violations, by directive

${violationSection}

## Embeds

${
  embedRows.length
    ? `Expected = facades in the served HTML; mounted = iframes present at the check; pressed = facades the scroll did not mount and the harness pressed; navigated = child frames that navigated to the origin.

| Route | Viewport | Motion | Engine | Disposition | Embed | Origin | Expected | Mounted | Pressed | Navigated | Result |
|---|---|---|---|---|---|---|---|---|---|---|---|
${embedRows.join("\n")}`
    : "No run found an embed."
}

Child-frame destinations seen across all runs (origin and at most two path segments): ${navigations.length ? navigations.map((n) => `\`${cell(n)}\``).join(", ") : "none"}.

## Console notices (recorded, not failures)

${
  noticeRows.length
    ? `Console messages that mention Content Security Policy without reporting a violation, such as policy-delivery warnings.

| Message (URLs cut to origins) | Runs |
|---|---|
${noticeRows.map(([t, n]) => `| ${cell(t)} | ${n} |`).join("\n")}`
    : "None."
}

CSP messages from embedded documents' own policies (not the policy under test): ${foreign}. Uncaught page errors across all runs (not failures): ${pageErrors}.

Raw output: \`design-review/csp-harness.json\`.
`;

await writeFile(path.join(OUT, "csp-harness.md"), md, "utf8");

console.log(`\n${"-".repeat(72)}`);
console.log(`${json.summary.ok}/${runs.length} runs clean${engines.some((e) => !e.measured) ? `; not measured: ${engines.filter((e) => !e.measured).map((e) => e.name).join(", ")}` : ""}`);
if (failures.length) {
  for (const f of failures) console.log(`FAIL ${f}`);
  console.log("\nCSP harness: FAILED -> design-review/csp-harness.md");
  process.exit(1);
}
console.log("\nCSP harness: clean -> design-review/csp-harness.md");
process.exit(0);
