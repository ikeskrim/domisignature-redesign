/**
 * Seal matrix: is every host that is not the live domain still sealed against
 * search engines, response by response?
 *
 * alias-check.mjs asks the production alias two things after a push: the home
 * page's X-Robots-Tag, and a robots.txt regex that also matches a substring
 * such as "#Disallow: /". This is the stage-7 matrix that
 * design-review/BRIEF-AUDIT.md specifies (section 8, "Stage-7 seal matrix", and
 * section 11, stage 7 item 6). It asks the production alias and, when given,
 * one branch preview:
 *
 *   responses   the home page, one route per route family (the deepest route
 *               where the family has one), the sitemap, a 404, a /_next/image
 *               URL at w=640 for a real /media photograph, that /media file and
 *               robots.txt. Each is fetched once with redirect: "manual".
 *   noindex     every response that is not a 3xx carries X-Robots-Tag with
 *               noindex (the 200s and the 404 alike). A 3xx is exempt: a
 *               redirect is not a page, and where it lands is asserted instead.
 *   robots      robots.txt has a "User-Agent: *" line, and the group it opens
 *               holds a line that is exactly "Disallow: /", matched from the
 *               start of the line. No line may be "Allow: /".
 *   markers     <html data-ground="light">, the Aegean light build. Required on
 *               every HTML response from the preview. On the alias it is only
 *               recorded: the alias serves pre-Aegean main until stage 8.
 *   loop guard  the legacy path rows of launch-check.mjs (PATH_ROWS, read from
 *               that file), followed hop by hop, at most 6 requests. A revisited
 *               path fails, more than 5 hops fails, a hop to another host fails,
 *               and the chain must land on the row's destination with a 200.
 *               Chains are reported as paths only.
 *
 * Not asserted: /services?modal (next.config.ts:63) answers a redirect to
 * itself. The fix is the owner's decision (BRIEF-AUDIT.md section 10, item 5),
 * so the matrix neither requests it nor asserts anything about it.
 *
 * Privacy: the preview host is never printed or written. It is labelled
 * "preview", error text is scrubbed of it, redirect targets are reduced to
 * paths, and only a handful of named response headers are recorded, so no
 * deployment id reaches a file. The live domain is never requested: it is still
 * parked on the old host (WAITING-FOR-DNS.md). No /media name on the WITHHELD
 * list in publish-manifest.mjs is ever requested.
 *
 * Usage: node scripts/seal-matrix.mjs                            (production alias only)
 *        SEAL_PREVIEW=<preview host or URL> node scripts/seal-matrix.mjs
 *        ALIAS_URL overrides the production alias, as in alias-check.mjs.
 *
 * Writes design-review/seal-matrix.json and design-review/seal-matrix.md.
 * Exits 1 on any failure, printing one line per failure.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_JSON = "design-review/seal-matrix.json";
const OUT_MD = "design-review/seal-matrix.md";

/** The production alias, named exactly as alias-check.mjs names it. */
const ALIAS_DEFAULT = "https://domisignature-redesign.vercel.app";
/** The live domain (src/middleware.ts CANONICAL_HOST). Never requested here. */
const LIVE_HOST = "domisignature.com";

const TIMEOUT_MS = 30_000;
/** Loop guard: at most this many requests per legacy row... */
const MAX_REQUESTS = 6;
/** ...and more than this many redirects fails. */
const MAX_HOPS = 5;

/* next.config.ts: 640 is in images.deviceSizes and 75 in images.qualities. */
const IMAGE_WIDTH = 640;
const IMAGE_QUALITY = 75;

/** Used when the home page names no usable og:image. Referenced by content/site.ts. */
const FALLBACK_PHOTO = "/media/mdGEOR3108.jpg";
/** No route matches it, so it must answer the site's 404. */
const NOT_FOUND_PATH = "/seal-matrix-no-such-page";

/** One route per route family; the deepest route where the family has one. */
const FAMILIES = [
  ["venues", "/venues/thalasses"],
  ["events", "/events/sunset-by-the-pool"],
  ["services", "/services"],
  ["wedding-guide", "/wedding-guide"],
  ["about", "/about"],
  ["contact", "/contact"],
];

const NOT_ASSERTED = [
  "/services?modal (next.config.ts:63) redirects to itself. Its fix is an owner decision " +
    "(BRIEF-AUDIT.md section 10, item 5), so it is not requested and nothing about it is asserted.",
];

/* ------------------------------------------------------------------------ */
/* privacy: the preview host never leaves this process                       */
/* ------------------------------------------------------------------------ */

const SECRETS = [];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Replace every spelling of the preview host with a label. Applied to all output. */
function scrub(text) {
  let t = String(text ?? "");
  for (const s of [...SECRETS].sort((a, b) => b.length - a.length)) {
    if (s) t = t.replace(new RegExp(escapeRe(s), "gi"), "<preview>");
  }
  return t;
}

/* ------------------------------------------------------------------------ */
/* bookkeeping                                                               */
/* ------------------------------------------------------------------------ */

let passed = 0;
const failures = [];

function check(label, ok, detail = "") {
  const d = scrub(detail);
  if (ok) {
    passed++;
    console.log(`  ok    ${label}${d ? `  ${d}` : ""}`);
  } else {
    failures.push(scrub(`${label}${d ? ` — ${d}` : ""}`));
    console.log(`  FAIL  ${label}${d ? `  ${d}` : ""}`);
  }
  return ok;
}

function note(label, detail = "") {
  console.log(`  note  ${label}${detail ? `  ${scrub(detail)}` : ""}`);
}

/** A check that also marks a matrix row as failed, with its reason. */
function verify(host, row, what, ok, detail = "") {
  const good = check(`${host.label} ${row.id} (${row.path}): ${what}`, ok, detail);
  if (!good) {
    row.ok = false;
    row.reasons.push(scrub(`${what}${detail ? ` — ${detail}` : ""}`));
  }
  return good;
}

/* ------------------------------------------------------------------------ */
/* hosts                                                                     */
/* ------------------------------------------------------------------------ */

function parseOrigin(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u : null;
  } catch {
    return null;
  }
}

const isLiveDomain = (hostname) => hostname === LIVE_HOST || hostname.endsWith(`.${LIVE_HOST}`);

/* ------------------------------------------------------------------------ */
/* inputs read from the repository                                           */
/* ------------------------------------------------------------------------ */

/**
 * PATH_ROWS from launch-check.mjs, read as text. Importing that script would run
 * it (it launches a browser at top level), so its rows are parsed instead, which
 * keeps one list of legacy paths in the repository.
 */
async function readPathRows() {
  const src = await readFile(path.join(ROOT, "scripts", "launch-check.mjs"), "utf8");
  const block = /const PATH_ROWS = \[([\s\S]*?)\n\];/.exec(src)?.[1] ?? "";
  return [...block.matchAll(/^\s*\[\s*"([^"]+)"\s*,\s*"([^"]+)"/gm)].map(([, from, to]) => ({ from, to }));
}

/**
 * WITHHELD keys from publish-manifest.mjs, read as text. Importing it would run
 * the whole manifest walk and could set this process's exit code.
 */
async function readWithheld() {
  const src = await readFile(path.join(ROOT, "scripts", "publish-manifest.mjs"), "utf8");
  const block = /export const WITHHELD = new Map\(\[([\s\S]*?)\]\);/.exec(src)?.[1] ?? "";
  return new Set([...block.matchAll(/\[\s*"([^"]+)"/g)].map((m) => m[1]));
}

/* ------------------------------------------------------------------------ */
/* HTTP                                                                      */
/* ------------------------------------------------------------------------ */

async function request(host, pathAndQuery) {
  /* The toolbar header keeps a preview response free of injected markup. */
  const headers = host.label === "preview" ? { "x-vercel-skip-toolbar": "1" } : {};
  try {
    const res = await fetch(host.origin + pathAndQuery, {
      redirect: "manual",
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { res };
  } catch (err) {
    const why = err?.name === "TimeoutError" ? `no response within ${TIMEOUT_MS / 1000} s` : err?.message ?? String(err);
    const cause = err?.cause ? ` (${err.cause.code ?? err.cause.message ?? "unknown cause"})` : "";
    return { error: scrub(`${why}${cause}`) };
  }
}

const header = (res, name) => res.headers.get(name) ?? "";
const isRedirect = (status) => status >= 300 && status < 400;
const TEXTUAL = /^(text\/|application\/(xml|xhtml\+xml|json)\b|[a-z]+\/[a-z0-9.+-]*\+xml\b)/i;

async function discardBody(res) {
  try {
    await res.body?.cancel();
  } catch {
    /* already consumed or closed */
  }
}

/** A Location header as a path on this host, or marked as leaving it. Never a host name. */
function locationOf(host, from, loc) {
  try {
    const next = new URL(loc, host.origin + from);
    const p = next.pathname + next.search;
    return next.origin === host.origin ? { path: p, sameHost: true } : { path: `(another host)${p}`, sameHost: false };
  } catch {
    return { path: "(unparseable Location)", sameHost: false };
  }
}

/** The data-ground attribute of the document's <html> tag. */
function groundOf(html) {
  const tag = /<html\b[^>]*>/i.exec(html)?.[0];
  if (!tag) return { tag: false, ground: null };
  const m = /\sdata-ground\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
  return { tag: true, ground: m ? (m[1] ?? m[2] ?? m[3]) : null };
}

function buildOf(g) {
  if (!g) return "unknown (the home page was not read)";
  if (!g.tag) return "unknown (no <html> tag in the home page)";
  if (g.ground === "light") return 'Aegean light build (<html data-ground="light">)';
  if (g.ground === null) return "pre-Aegean build (no data-ground on <html>)";
  return `unknown (<html data-ground="${g.ground}">)`;
}

/* ------------------------------------------------------------------------ */
/* robots.txt                                                                */
/* ------------------------------------------------------------------------ */

/**
 * Groups as RFC 9309 reads them: consecutive User-Agent lines open a group, and
 * the rules after them belong to it until the next User-Agent line. Rules are
 * compared as whole lines, so "#Disallow: /" or "XDisallow: /" never count.
 */
function analyseRobots(text) {
  const lines = text.split(/\r?\n/);
  const groups = [];
  let current = null;
  let inAgentRun = false;
  for (const line of lines) {
    const agent = /^user-agent:\s*(.*?)\s*$/i.exec(line);
    if (agent) {
      if (!current || !inAgentRun) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(agent[1]);
      inAgentRun = true;
      continue;
    }
    if (line.trim() === "") continue;
    inAgentRun = false;
    if (current) current.rules.push(line);
  }
  return {
    userAgentStar: lines.some((l) => /^user-agent:\s*\*\s*$/i.test(l)),
    disallowAllInStarGroup: groups.some((g) => g.agents.includes("*") && g.rules.includes("Disallow: /")),
    allowAllLine: lines.some((l) => /^allow:\s*\/\s*$/i.test(l)),
    lines: lines.filter((l) => l.trim() !== ""),
  };
}

/* ------------------------------------------------------------------------ */
/* one matrix row                                                            */
/* ------------------------------------------------------------------------ */

async function probe(host, spec) {
  const row = {
    id: spec.id,
    kind: spec.kind,
    path: spec.path,
    expect: spec.expect,
    status: null,
    contentType: null,
    xRobotsTag: null,
    cacheControl: null,
    location: null,
    noindex: null,
    ground: undefined,
    ok: true,
    reasons: [],
  };
  const { res, error } = await request(host, spec.path);
  if (error) {
    verify(host, row, "responds", false, error);
    return { row, text: "", g: null };
  }

  row.status = res.status;
  row.contentType = header(res, "content-type").split(";")[0].trim() || null;
  row.xRobotsTag = header(res, "x-robots-tag") || null;
  row.cacheControl = header(res, "cache-control") || null;
  if (isRedirect(res.status) && header(res, "location")) {
    row.location = locationOf(host, spec.path, header(res, "location")).path;
  }

  const text = row.contentType && TEXTUAL.test(row.contentType) ? await res.text() : (await discardBody(res), "");

  const statusOk = verify(host, row, `status ${spec.expect}`, res.status === spec.expect, `${res.status}${row.location ? ` -> ${row.location}` : ""}`);

  if (isRedirect(res.status)) {
    row.noindex = "exempt (3xx)";
    note(`${host.label} ${row.id} (${row.path}): noindex not asserted`, `${res.status} is a redirect`);
  } else {
    const has = /\bnoindex\b/i.test(row.xRobotsTag ?? "");
    verify(host, row, "X-Robots-Tag carries noindex", has, row.xRobotsTag ?? "(no header)");
    row.noindex = has ? "ok" : "missing";
  }

  if (!statusOk) return { row, text, g: null };

  let g = null;
  if (spec.kind === "page") {
    verify(host, row, "is an HTML document", row.contentType === "text/html", row.contentType ?? "(no content-type)");
    g = groundOf(text);
    row.ground = g.tag ? g.ground : "(no <html> tag)";
    const shown = !g.tag ? "no <html> tag" : g.ground === null ? "no data-ground on <html>" : `data-ground="${g.ground}"`;
    if (host.requireLight) verify(host, row, 'markup marker <html data-ground="light">', g.ground === "light", shown);
  } else if (spec.kind === "sitemap") {
    verify(host, row, "is XML", /xml/i.test(row.contentType ?? ""), row.contentType ?? "(no content-type)");
    verify(host, row, "holds a <urlset>", /<urlset\b/.test(text));
  } else if (spec.kind === "image" || spec.kind === "media") {
    verify(host, row, "is an image", /^image\//i.test(row.contentType ?? ""), row.contentType ?? "(no content-type)");
  } else if (spec.kind === "robots") {
    verify(host, row, "is plain text", row.contentType === "text/plain", row.contentType ?? "(no content-type)");
  }
  return { row, text, g };
}

/* ------------------------------------------------------------------------ */
/* the loop guard                                                            */
/* ------------------------------------------------------------------------ */

async function followChain(host, legacy) {
  const out = { from: legacy.from, to: legacy.to, chain: [], hops: 0, landed: null, finalStatus: null, ok: true, reasons: [] };
  const fail = (why) => {
    out.ok = false;
    out.reasons.push(scrub(why));
  };
  const visited = new Set();
  let current = legacy.from;

  for (let n = 1; n <= MAX_REQUESTS; n++) {
    visited.add(current);
    const { res, error } = await request(host, current);
    if (error) {
      out.chain.push({ path: current, status: null });
      fail(`no response at ${current}: ${error}`);
      break;
    }
    await discardBody(res);
    out.chain.push({ path: current, status: res.status });

    if (!isRedirect(res.status)) {
      out.landed = current;
      out.finalStatus = res.status;
      const tag = header(res, "x-robots-tag");
      if (!/\bnoindex\b/i.test(tag)) fail(`${current} (${res.status}) has no X-Robots-Tag noindex (${tag || "no header"})`);
      break;
    }

    out.hops++;
    const loc = header(res, "location");
    if (!loc) {
      fail(`${res.status} at ${current} has no Location`);
      break;
    }
    const next = locationOf(host, current, loc);
    if (!next.sameHost) {
      out.chain.push({ path: next.path, status: null });
      fail(`hop ${out.hops} leaves the host`);
      break;
    }
    if (visited.has(next.path)) {
      out.chain.push({ path: next.path, status: null, revisit: true });
      fail(`loop: hop ${out.hops} revisits ${next.path}`);
      break;
    }
    if (out.hops > MAX_HOPS) {
      out.chain.push({ path: next.path, status: null });
      fail(`more than ${MAX_HOPS} hops`);
      break;
    }
    current = next.path;
  }

  if (out.ok && out.landed === null) fail(`still redirecting after ${MAX_REQUESTS} requests`);
  if (out.ok && out.hops === 0) fail(`${legacy.from} does not redirect (${out.finalStatus})`);
  if (out.ok && out.landed !== legacy.to) fail(`lands on ${out.landed}, expected ${legacy.to}`);
  if (out.ok && out.finalStatus !== 200) fail(`${out.landed} answers ${out.finalStatus}, expected 200`);

  check(`${host.label} legacy ${legacy.from} -> ${legacy.to}: no loop, lands with a 200`, out.ok, out.ok ? chainText(out) : `${out.reasons.join("; ")}  [${chainText(out)}]`);
  return out;
}

function chainText(out) {
  return out.chain.map((h) => (h.status == null ? h.path : `${h.path} (${h.status})`)).join(" -> ");
}

/* ------------------------------------------------------------------------ */
/* one host                                                                  */
/* ------------------------------------------------------------------------ */

async function runHost(host, withheld, pathRows) {
  console.log(`\n${host.label}`);
  const result = { label: host.label, build: null, photo: null, probes: [], robots: null, legacy: [] };

  const home = await probe(host, { id: "home", kind: "page", path: "/", expect: 200 });
  result.probes.push(home.row);
  result.build = buildOf(home.g);
  if (host.label === "alias") {
    note("alias serves", `${result.build}; pre-Aegean main is expected until stage 8 (recorded, never failed)`);
  }

  for (const [id, p] of FAMILIES) {
    result.probes.push((await probe(host, { id, kind: "page", path: p, expect: 200 })).row);
  }

  result.probes.push((await probe(host, { id: "sitemap", kind: "sitemap", path: "/sitemap.xml", expect: 200 })).row);
  result.probes.push((await probe(host, { id: "not-found", kind: "page", path: NOT_FOUND_PATH, expect: 404 })).row);

  /* A real photograph this build publishes: the home page's og:image when it is a
     /media still, otherwise the fallback. A withheld name is never requested. */
  let photo = { path: FALLBACK_PHOTO, source: "fallback (content/site.ts)" };
  const og = /<meta property="og:image" content="([^"]*)"/.exec(home.text)?.[1];
  if (og && withheld.size > 0) {
    try {
      const p = new URL(og, "https://og.invalid").pathname;
      if (/^\/media\/[^/]+\.(jpe?g|png|webp)$/i.test(p) && !withheld.has(p)) photo = { path: p, source: "og:image of the home page" };
    } catch {
      /* keep the fallback */
    }
  }
  result.photo = photo;

  if (withheld.has(photo.path)) {
    check(`${host.label}: the probe photograph is not withheld`, false, "the fallback is on the WITHHELD list; image probes skipped");
  } else {
    const imageUrl = `/_next/image?url=${encodeURIComponent(photo.path)}&w=${IMAGE_WIDTH}&q=${IMAGE_QUALITY}`;
    result.probes.push((await probe(host, { id: "next-image", kind: "image", path: imageUrl, expect: 200 })).row);
    result.probes.push((await probe(host, { id: "media", kind: "media", path: photo.path, expect: 200 })).row);
  }

  const robots = await probe(host, { id: "robots", kind: "robots", path: "/robots.txt", expect: 200 });
  result.probes.push(robots.row);
  if (robots.row.status === 200) {
    const r = analyseRobots(robots.text);
    result.robots = r;
    verify(host, robots.row, 'has a "User-Agent: *" line', r.userAgentStar);
    verify(host, robots.row, 'the "User-Agent: *" group has a line that is exactly "Disallow: /"', r.disallowAllInStarGroup, r.lines.join(" | "));
    verify(host, robots.row, 'no line is "Allow: /"', !r.allowAllLine);
  }

  for (const legacy of pathRows) result.legacy.push(await followChain(host, legacy));
  return result;
}

/* ------------------------------------------------------------------------ */
/* report                                                                    */
/* ------------------------------------------------------------------------ */

const cell = (v) => (v == null || v === "" ? "—" : String(v).replace(/\|/g, "\\|").replace(/\r?\n/g, " "));
const code = (v) => (v == null || v === "" ? "—" : "`" + String(v).replace(/`/g, "'").replace(/\|/g, "\\|") + "`");

function markdown(report) {
  const out = [];
  const verdict = report.failed === 0 ? "**sealed**" : `**${report.failed} failure(s)**`;
  out.push(
    "# Seal matrix",
    "",
    `Stage 7, as specified in \`design-review/BRIEF-AUDIT.md\` section 8. Generated ${report.generated} by ` +
      "`node scripts/seal-matrix.mjs`. " +
      `Result: ${verdict} (${report.passed} checks passed).`,
    "",
    "Hosts appear as labels only. `alias` is the production alias (`ALIAS_URL`, defaulting to the alias " +
      "`scripts/alias-check.mjs` checks). `preview` is the host passed in `SEAL_PREVIEW`, which is never " +
      "recorded. Redirect targets are paths.",
    "",
    "What is asserted: every response that is not a 3xx carries `X-Robots-Tag` with `noindex` (a 3xx is " +
      'exempt); robots.txt has a `User-Agent: *` line whose group holds a line that is exactly `Disallow: /` ' +
      "and no `Allow: /` line; on the preview every HTML response carries `<html data-ground=\"light\">` (on the " +
      `alias the build is recorded, never failed); /_next/image is requested at \`w=${IMAGE_WIDTH}\`; each legacy ` +
      `path row of \`scripts/launch-check.mjs\` is followed hop by hop, at most ${MAX_REQUESTS} requests, and fails on a ` +
      `revisit, on more than ${MAX_HOPS} hops or on leaving the host, and must land on its destination with a 200.`,
    "",
  );

  for (const h of report.hosts) {
    if (h.skipped) {
      out.push(`## ${h.label}: not run`, "", h.skipped, "");
      continue;
    }
    out.push(`## ${h.label}`, "", `Build served: ${cell(h.build)}.`, "");
    if (h.photo) out.push(`Probe photograph: ${code(h.photo.path)} (${h.photo.source}).`, "");
    out.push(
      "| Probe | Path | Status | Content-Type | X-Robots-Tag | noindex | `<html data-ground>` | Result |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const p of h.probes) {
      const ground = p.ground === undefined ? "n/a" : p.ground === null ? "(none)" : p.ground;
      const status = p.status == null ? "no response" : `${p.status}${p.location ? ` -> ${p.location}` : ""}`;
      out.push(
        `| ${cell(p.id)} | ${code(p.path)} | ${cell(status)} | ${cell(p.contentType)} | ${cell(p.xRobotsTag)} | ${cell(p.noindex)} | ${cell(ground)} | ${p.ok ? "ok" : `FAIL: ${cell(p.reasons.join("; "))}`} |`,
      );
    }
    out.push("");

    out.push("### robots.txt", "");
    if (h.robots) {
      out.push(
        `- \`User-Agent: *\` line: ${h.robots.userAgentStar ? "yes" : "**no**"}`,
        `- a line that is exactly \`Disallow: /\` in that group: ${h.robots.disallowAllInStarGroup ? "yes" : "**no**"}`,
        `- an \`Allow: /\` line: ${h.robots.allowAllLine ? "**yes**" : "none"}`,
        "",
        "```text",
        ...h.robots.lines.map((l) => l.replace(/```/g, "'''")),
        "```",
        "",
      );
    } else {
      out.push("Not read (see the robots row above).", "");
    }

    out.push(
      "### Legacy path rows: loop guard",
      "",
      "| From | Expected | Chain | Hops | Result |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const l of h.legacy) {
      out.push(`| ${code(l.from)} | ${code(l.to)} | ${cell(chainText(l))} | ${l.hops} | ${l.ok ? "ok" : `FAIL: ${cell(l.reasons.join("; "))}`} |`);
    }
    out.push("");
  }

  out.push("## Not asserted", "", ...report.notAsserted.map((n) => `- ${n}`), "");
  out.push("## Failures", "");
  out.push(...(report.failures.length ? report.failures.map((f) => `- ${cell(f)}`) : ["None."]), "");
  out.push("Regenerate with `node scripts/seal-matrix.mjs` (and `SEAL_PREVIEW` for the branch preview).", "");
  return out.join("\n");
}

/* ------------------------------------------------------------------------ */
/* main                                                                      */
/* ------------------------------------------------------------------------ */

async function main() {
  console.log("\nSEAL MATRIX");

  const hosts = [];
  const results = [];

  const alias = parseOrigin(process.env.ALIAS_URL ?? ALIAS_DEFAULT);
  if (!alias) check("alias: ALIAS_URL is a host or URL", false, "could not be parsed");
  else if (isLiveDomain(alias.hostname)) {
    check("alias: is not the live domain", false, "the live domain is parked and is never requested");
    results.push({ label: "alias", skipped: "ALIAS_URL names the live domain; not requested." });
  } else hosts.push({ label: "alias", origin: alias.origin, hostname: alias.hostname, requireLight: false });

  const previewRaw = (process.env.SEAL_PREVIEW ?? "").trim();
  if (!previewRaw) {
    note("preview", "SEAL_PREVIEW is not set; only the alias is checked");
    results.push({ label: "preview", skipped: "`SEAL_PREVIEW` was not set, so no preview was checked." });
  } else {
    SECRETS.push(previewRaw);
    const preview = parseOrigin(previewRaw);
    if (!preview) {
      check("preview: SEAL_PREVIEW is a host or URL", false, "could not be parsed (value not shown)");
      results.push({ label: "preview", skipped: "`SEAL_PREVIEW` could not be parsed." });
    } else {
      SECRETS.push(preview.origin, preview.host, preview.hostname);
      if (isLiveDomain(preview.hostname)) {
        check("preview: is not the live domain", false, "the live domain is parked and is never requested");
        results.push({ label: "preview", skipped: "`SEAL_PREVIEW` names the live domain; not requested." });
      } else if (alias && preview.origin === alias.origin) {
        check("preview: is not the production alias", false, "SEAL_PREVIEW names the alias, which serves main");
        results.push({ label: "preview", skipped: "`SEAL_PREVIEW` names the production alias; not checked as a preview." });
      } else {
        hosts.push({ label: "preview", origin: preview.origin, hostname: preview.hostname, requireLight: true });
      }
    }
  }

  console.log("\nrepository inputs");
  const withheld = await readWithheld();
  check("WITHHELD names read from publish-manifest.mjs", withheld.size > 0, `${withheld.size} names`);
  const allRows = await readPathRows();
  /* Owner decision pending: a ?modal row is never followed, even if one is added. */
  const pathRows = allRows.filter((r) => !/[?&]modal\b/.test(r.from));
  check("PATH_ROWS read from launch-check.mjs: the three legacy path rows", pathRows.length === 3, pathRows.map((r) => r.from).join(", ") || "(none found)");

  for (const host of hosts) results.push(await runHost(host, withheld, pathRows));

  const order = { alias: 0, preview: 1 };
  results.sort((a, b) => order[a.label] - order[b.label]);

  const report = {
    generated: new Date().toISOString(),
    spec: "design-review/BRIEF-AUDIT.md section 8 (stage-7 seal matrix); section 11, stage 7 item 6",
    limits: { imageWidth: IMAGE_WIDTH, imageQuality: IMAGE_QUALITY, maxRequestsPerLegacyRow: MAX_REQUESTS, maxHops: MAX_HOPS },
    hosts: results,
    notAsserted: NOT_ASSERTED,
    passed,
    failed: failures.length,
    failures,
  };

  await mkdir(path.join(ROOT, "design-review"), { recursive: true });
  /* scrub() once more over the finished text: nothing names the preview host. */
  await writeFile(path.join(ROOT, OUT_JSON), scrub(JSON.stringify(report, null, 2)) + "\n", "utf8");
  await writeFile(path.join(ROOT, OUT_MD), scrub(markdown(report)), "utf8");
}

try {
  await main();
} catch (err) {
  failures.push(scrub(`seal-matrix stopped: ${err?.message ?? err}`));
  console.log(`\n  FAIL  ${failures[failures.length - 1]}`);
}

console.log(`\n${"-".repeat(64)}`);
console.log(`${passed} checks passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.log(`  ! ${f}`);
  process.exitCode = 1;
} else {
  console.log("sealed.");
}
console.log(`-> ${OUT_JSON}`);
console.log(`-> ${OUT_MD}`);
