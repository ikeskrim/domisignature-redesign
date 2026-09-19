/**
 * Security headers, asserted against a running build.
 *
 * `next.config.ts` is where they are declared; this is where they are proven,
 * because a header rule is a path regex and a path regex is the kind of thing
 * that silently matches nothing. It asks a real server for a document, a build
 * asset, an optimised image and a photograph, and checks what came back.
 *
 * What it asserts (design-review/BRIEF-AUDIT.md section 4.2):
 *   everywhere     X-Content-Type-Options: nosniff, and HSTS **without**
 *                  includeSubDomains or preload — `webmail`, `ftp` and `mail`
 *                  are independent records still on the old host, and that
 *                  promise would take them down with it (owner, 2026-09-19).
 *   documents      X-Frame-Options DENY, Referrer-Policy, Permissions-Policy,
 *                  Cross-Origin-Opener-Policy.
 *   assets/media   none of those four: they are not documents, and a header
 *                  rule that reaches them is a rule matching more than it says.
 *   nowhere        X-Powered-By.
 *
 *   CSP            documents carry Content-Security-Policy-Report-Only, exactly
 *                  the policy next.config.ts exports, and **no** enforcing
 *                  Content-Security-Policy: enforcing is the owner's word,
 *                  after a week of clean reports.
 *   the optimiser  /_next/image keeps the sandbox CSP Next sets on it (an
 *                  enforcing one, and not ours). It is why DOCUMENTS excludes
 *                  the optimiser, and clobbering it would be a real
 *                  regression, so it is asserted present rather than absent.
 *
 * The expected values are imported from next.config.ts's SECURITY export, so
 * the config and this check cannot drift apart into two different truths.
 *
 * Usage: npm run audit:headers        (SHOTS_BASE, or the gate's own server)
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";

/* The values the site actually ships, read from the config that ships them. */
let SECURITY;
try {
  ({ SECURITY } = await import(pathToFileURL(path.join(ROOT, "next.config.ts")).href));
} catch (err) {
  console.error(`headers: could not read SECURITY from next.config.ts — ${err?.message ?? err}`);
  process.exit(1);
}

/** Every response, whatever it is. */
const EVERY = [
  ["x-content-type-options", "nosniff"],
  ["strict-transport-security", SECURITY.HSTS_VALUE],
];

/** Documents only. */
const DOCUMENT = [
  ["content-security-policy-report-only", SECURITY.CSP],
  ["x-frame-options", "DENY"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["permissions-policy", 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self "https://www.google.com")'],
  ["cross-origin-opener-policy", "same-origin"],
];

/*
 * Next's image optimiser sets this on every optimised image, in `next start`
 * and on Vercel alike. It is Next's, not ours, and it is the reason the
 * DOCUMENTS rule in next.config.ts excludes `_next/image`.
 */
const OPTIMISER = `/_next/image?url=${encodeURIComponent("/media/mdGEOR3108.jpg")}&w=640&q=75`;
const IMAGE_SANDBOX_CSP = "script-src 'none'; frame-src 'none'; sandbox;";

const DOCUMENTS = [
  ["home", "/"],
  ["venues", "/venues"],
  ["venue", "/venues/thalasses"],
  ["contact", "/contact"],
  ["404", "/headers-audit-no-such-page"],
  ["robots", "/robots.txt"],
];

const NOT_DOCUMENTS = [
  ["media", "/media/mdGEOR3108.jpg"],
  ["optimised image", OPTIMISER],
];

let passed = 0;
const failures = [];

const check = (label, ok, detail = "") => {
  if (ok) {
    passed++;
    console.log(`  ok    ${label}${detail ? `  ${detail}` : ""}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL  ${label}${detail ? `  ${detail}` : ""}`);
  }
};

async function head(pathAndQuery) {
  const res = await fetch(BASE + pathAndQuery, { redirect: "manual" });
  await res.body?.cancel().catch(() => {});
  return res;
}

console.log(`HEADERS  ${BASE}\n`);

/* The build asset is whatever this build actually shipped. */
let asset = null;
try {
  const home = await fetch(BASE + "/");
  const html = await home.text();
  const found = /\/_next\/static\/[^"']+\.(?:js|css)/.exec(html)?.[0];
  if (found) asset = ["build asset", found];
} catch {
  /* reported below */
}
if (!asset) {
  check("a build asset to test", false, "no /_next/static URL found in the home page");
} else {
  NOT_DOCUMENTS.push(asset);
}

for (const [label, route] of [...DOCUMENTS, ...NOT_DOCUMENTS]) {
  const isDocument = DOCUMENTS.some(([, p]) => p === route);
  let res;
  try {
    res = await head(route);
  } catch (err) {
    check(`${label} responds`, false, String(err?.message ?? err));
    continue;
  }
  const expected = route === "/headers-audit-no-such-page" ? 404 : 200;
  check(`${label} (${route}): status ${expected}`, res.status === expected, String(res.status));

  for (const [key, value] of EVERY) {
    const got = res.headers.get(key);
    check(`${label}: ${key}`, got === value, got ?? "(absent)");
  }
  /* The promise that would take the old host's subdomains down with it. */
  const hsts = res.headers.get("strict-transport-security") ?? "";
  check(`${label}: HSTS has no includeSubDomains or preload`, !/includesubdomains|preload/i.test(hsts), hsts || "(absent)");
  check(`${label}: no X-Powered-By`, !res.headers.get("x-powered-by"), res.headers.get("x-powered-by") ?? "absent");
  /* Enforcing OUR policy is the owner's word, after a week of clean reports.
     The optimiser's own sandbox is a different header from a different author:
     it must survive, so it is checked for rather than checked against. */
  const enforcing = res.headers.get("content-security-policy");
  if (route === OPTIMISER) {
    check(`${label}: Next's sandbox CSP is intact`, enforcing === IMAGE_SANDBOX_CSP, enforcing ?? "(absent)");
  } else {
    check(`${label}: the policy is Report-Only, not enforcing`, enforcing === null, enforcing ?? "absent");
  }

  for (const [key, value] of DOCUMENT) {
    const got = res.headers.get(key);
    if (isDocument) check(`${label}: ${key}`, got === value, got ?? "(absent)");
    else check(`${label}: no ${key} (not a document)`, got === null, got ?? "absent");
  }
}

/* The compiled rule, not the intention: a regex that matches nothing passes
   every request above and still protects nothing. */
try {
  const manifest = JSON.parse(await readFile(path.join(ROOT, ".next", "routes-manifest.json"), "utf8"));
  const rules = manifest.headers ?? [];
  const documentRule = rules.find((r) => r.headers?.some((h) => h.key === "X-Frame-Options"));
  check("the document rule is compiled into routes-manifest.json", Boolean(documentRule), documentRule?.regex ?? "(absent)");
  if (documentRule?.regex) {
    const re = new RegExp(documentRule.regex);
    check("it matches a document", re.test("/venues"), "/venues");
    check("it does not match a build asset", !re.test("/_next/static/chunks/main.js"), "/_next/static/chunks/main.js");
    check("it does not match a photograph", !re.test("/media/mdGEOR3108.jpg"), "/media/mdGEOR3108.jpg");
    check("it does not match the optimiser", !re.test("/_next/image"), "/_next/image");
  }
} catch (err) {
  check("routes-manifest.json is readable", false, String(err?.message ?? err));
}

console.log(`\n${"-".repeat(72)}`);
if (failures.length) {
  console.log(`${passed} ok, ${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
console.log(`${passed}/${passed} green — every response carries what it should, and nothing else does.`);
