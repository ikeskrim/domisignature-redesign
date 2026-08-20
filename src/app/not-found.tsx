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
  return (
    <section className="relative flex min-h-[85svh] items-center overflow-hidden bg-ink text-bone">
      <Image
        src="/media/mdGEOR3108.jpg"
        alt=""
        fill
        sizes="100vw"
        className="grade object-cover opacity-25"
        priority
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />

      <div className="relative mx-auto w-full max-w-[104rem] px-gutter py-32">
        <span className="eyebrow text-bone/60">Error 404</span>

        <h1 className="mt-8 max-w-3xl font-display text-display font-light leading-[0.95]">
          This page has slipped away
        </h1>

        <p className="mt-8 max-w-lg text-lead leading-relaxed text-bone/70">
          The link may be old, or the page may have moved when the site was rebuilt. Everything is
          still here — just somewhere new.
        </p>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button href="/" variant="solid" size="lg">
            Back to home
          </Button>
          <Button
            href="/contact"
            className="border-bone/40 text-bone hover:bg-bone hover:text-ink"
            size="lg"
          >
            Contact us
          </Button>
        </div>

        <nav aria-label="Site sections" className="mt-16 border-t border-bone/15 pt-8">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-bone/60 transition-colors duration-300 hover:text-bone"
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
