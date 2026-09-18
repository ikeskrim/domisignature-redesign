import Image from "next/image";
import Link from "next/link";

import { nav } from "@content/site";
import { Button } from "@/components/ui/Button";

/*
 * No `metadata` export here on purpose: App Router does not run generateMetadata
 * for not-found.tsx, and exporting a static object leaves the page with no
 * <title> at all. Inheriting the root layout's title is the correct behaviour.
 */

export default function NotFound() {
  /*
   * An inner page, so it is paper: the photograph sits faintly under an ivory
   * wash on the light surface, and the page's own ladder answers every role
   * below it. Not a chapter — the designated dark chapters are listed in
   * design-review/SEMANTIC-TOKENS.md and this is not one of them.
   */
  return (
    <section className="relative flex min-h-[85svh] items-center overflow-hidden bg-[var(--surface)] text-[var(--text-primary)]">
      <Image
        src="/media/mdGEOR3108.jpg"
        alt=""
        fill
        sizes="100vw"
        className="grade-b object-cover opacity-25"
        priority
      />
      {/*
       * Two veils on one layer: the left-to-right wash the type sits on, and
       * under it a vertical fade that lands on solid ground at the bottom, so the
       * photograph dissolves into the page before the section's clipped edge
       * meets the footer — paper does not present a join.
       */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgb(var(--wash)) 0%, rgb(var(--wash) / 0.85) 50%, rgb(var(--wash) / 0.4) 100%), linear-gradient(to bottom, rgb(var(--wash) / 0) 55%, rgb(var(--wash)) 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[104rem] px-gutter py-32">
        <span className="eyebrow">Error 404</span>

        <h1 className="mt-8 max-w-3xl font-display text-display font-light leading-[0.95]">
          This page has slipped away
        </h1>

        <p className="mt-8 max-w-lg text-lead leading-relaxed text-[var(--text-secondary)]">
          The link may be old, or the page may have moved when the site was rebuilt. Everything is
          still here — just somewhere new.
        </p>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button href="/" variant="solid" size="lg">
            Back to home
          </Button>
          <Button
            href="/contact"
            className="border-[var(--rule-strong)] text-[var(--text-primary)] hover:bg-[var(--inverse)] hover:text-[var(--text-on-inverse)]"
            size="lg"
          >
            Contact us
          </Button>
        </div>

        <nav aria-label="Site sections" className="mt-16 border-t border-[var(--rule)] pt-8">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-[var(--text-secondary)] transition-colors duration-300 hover:text-[var(--text-primary)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
