/**
 * Is the public Vercel alias still sealed against search engines?
 *
 * Run 2 found a fully crawlable second copy of the site at the project's
 * production alias: pushing to `main` makes Vercel build a *production*
 * deployment, so VERCEL_ENV said "production" and the app declared itself
 * indexable — on a domain that is not the site. `src/middleware.ts` closed it
 * by deciding on the request host rather than the build environment.
 *
 * This is the outside check on that fix: it asks the real deployed alias, over
 * the real internet, after a push. `launch-check.mjs` proves the same rule
 * against a local build; this proves it actually shipped.
 *
 * Usage: npm run check:alias
 */

const ALIAS = process.env.ALIAS_URL ?? "https://domisignature-redesign.vercel.app";

let failed = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${detail ? `  ${detail}` : ""}`);
  if (!ok) failed++;
};

console.log(`\nalias seal — ${ALIAS}\n`);

const page = await fetch(`${ALIAS}/`, { redirect: "manual" });
const tag = page.headers.get("x-robots-tag") ?? "";
check("page carries X-Robots-Tag: noindex", /noindex/.test(tag), tag || "(no header)");

const robots = await (await fetch(`${ALIAS}/robots.txt`)).text();
check(
  "robots.txt disallows everything",
  /Disallow:\s*\/\s*$/m.test(robots) && !/Allow:\s*\/\s*$/m.test(robots),
  robots.trim().replace(/\n/g, " | "),
);

/* The real domain must NOT be caught by the same rule — a seal that blocks the
   live site would be worse than no seal at all. Checked against the local build
   in launch-check.mjs; here we only confirm the alias is not the live host. */
check("the alias is not the live domain", !ALIAS.includes("domisignature.com"));

console.log(`\n${failed === 0 ? "sealed." : `${failed} check(s) failed — the alias is exposed.`}`);
if (failed) process.exitCode = 1;
