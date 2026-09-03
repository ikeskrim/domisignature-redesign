"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { nav, site, contact } from "@content/site";
import { cn } from "@/lib/utils";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  /* Separate from `open` so the panel can animate out before it unmounts. */
  const [present, setPresent] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  /* The homepage hero is full-bleed imagery, so the header starts transparent
     there and only picks up a surface once the visitor scrolls past it. */
  const overHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = present ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [present]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Opening mounts immediately; closing waits for the wipe to finish. */
  useEffect(() => {
    if (open) setPresent(true);
  }, [open]);

  useIsomorphicLayoutEffect(() => {
    const el = panel.current;
    if (!el) return;
    const reduced = prefersReducedMotion();

    if (open) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline();
        tl.fromTo(
          el,
          reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" },
          reduced
            ? { opacity: 1, duration: 0.2 }
            : { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: EASE },
        );
        if (!reduced) {
          tl.from(
            el.querySelectorAll("[data-menu-item]"),
            { opacity: 0, y: 20, duration: 0.6, ease: EASE, stagger: 0.06 },
            0.18,
          ).from(el.querySelector("[data-menu-foot]"), { opacity: 0, duration: 0.6 }, 0.5);
        }
      }, el);
      return () => ctx.revert();
    }

    /* Closing: wipe back down, then leave the DOM. */
    if (reduced) {
      setPresent(false);
      return;
    }
    const tween = gsap.to(el, {
      clipPath: "inset(0 0 100% 0)",
      duration: 0.55,
      ease: EASE,
      onComplete: () => setPresent(false),
    });
    return () => {
      tween.kill();
    };
  }, [open, present]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          overHero
            ? "border-b border-transparent bg-transparent"
            : "border-b border-hair/60 bg-ink/85 backdrop-blur-xl",
        )}
      >
        <div className="mx-auto flex h-[4.5rem] w-full max-w-[104rem] items-center justify-between px-gutter lg:h-24">
          <Link
            href="/"
            aria-label={`${site.name} — home`}
            className="group flex items-center gap-3.5"
          >
            {/*
              40, not 512. The mark is drawn at 32px (40px from lg up), but it
              used to declare the source file's own 512 and no `sizes`, so
              next/image built a srcset around 512 and every phone preloaded the
              1080-wide variant: 22.7 KB for a 32px logo, on every page, at
              preload priority — competing with the real LCP image for the first
              bytes on the wire.

              `sizes="40px"` lets it pick a candidate that matches the box at the
              device's pixel ratio. The rendered result is identical: the size on
              screen is set by the CSS classes below, not by these attributes.
            */}
            <Image
              src="/assets/img/mark-bone.png"
              alt=""
              width={40}
              height={40}
              sizes="40px"
              priority
              className="h-8 w-8 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[18deg] lg:h-10 lg:w-10"
            />
            <span className="font-sans text-[0.72rem] font-medium uppercase tracking-[0.34em] text-bone">
              {site.name}
            </span>
          </Link>

          {/* Desktop navigation — hovering one item dims its siblings. */}
          <nav aria-label="Primary" className="group/nav hidden items-center gap-9 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "group relative py-2 font-sans text-[0.7rem] font-medium uppercase tracking-[0.18em]",
                  "transition-[color,opacity] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                  "group-hover/nav:opacity-45 hover:!opacity-100",
                  overHero ? "text-bone/80" : "text-muted",
                  isActive(item.href) && "text-bone",
                )}
              >
                {item.label}
                {/*
                  Was bg-ink — an all-but-black rule on an all-but-black header,
                  so the underline never appeared in either state. Collateral
                  from the Phase 6 token rename, fixed in §5.
                */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-0 left-0 h-px w-full origin-right scale-x-0 bg-bone transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:origin-left group-hover:scale-x-100",
                    isActive(item.href) && "scale-x-100",
                  )}
                />
              </Link>
            ))}

            {/* Hairline pill, never a filled colour. */}
            <a
              href={contact.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              data-magnetic
              className={cn(
                "ml-2 rounded-full border px-7 py-3 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em]",
                "transition-[color,background-color,border-color,opacity] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                "group-hover/nav:opacity-45 hover:!opacity-100",
                // The scrolled variant used to hover bone-on-bone — invisible label.
                overHero
                  ? "border-bone/40 text-bone hover:bg-bone hover:text-ink"
                  : "border-hair/35 text-bone hover:bg-bone hover:text-ink",
              )}
            >
              Enquire
            </a>
          </nav>

          {/* Mobile trigger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="-mr-2 flex items-center gap-3 p-2 text-bone lg:hidden"
          >
            <span className="eyebrow">{open ? "Close" : "Menu"}</span>
            <span className="relative block h-3 w-6" aria-hidden>
              <span
                className={cn(
                  "absolute left-0 block h-px w-6 bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  open ? "top-1.5 rotate-45" : "top-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 block h-px w-6 bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  open ? "top-1.5 -rotate-45" : "top-3",
                )}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {present && (
        <div
          ref={panel}
          id="mobile-menu"
          className="fixed inset-0 z-40 flex flex-col bg-graphite lg:hidden"
        >
          <nav
            aria-label="Mobile"
            className="flex flex-1 flex-col justify-center gap-1 px-gutter pt-24"
          >
            {nav.map((item, i) => (
              <div key={item.href} data-menu-item>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex items-baseline gap-4 border-b border-hair/70 py-4 font-display text-[2.25rem] leading-none transition-colors",
                    isActive(item.href) ? "text-bone" : "text-bone/85 hover:text-bone",
                  )}
                >
                  <span className="eyebrow text-faint">{String(i + 1).padStart(2, "0")}</span>
                  {item.label}
                </Link>
              </div>
            ))}
          </nav>

          <div className="px-gutter pb-12" data-menu-foot>
            <div className="rule mb-6" />
            <a href={contact.phone.href} className="block py-1 text-lead text-bone">
              {contact.phone.display}
            </a>
            <a
              href={contact.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 text-lead text-bone"
            >
              WhatsApp {contact.whatsapp.display}
            </a>
            <a href={contact.email.href} className="block py-1 text-lead text-bone">
              {contact.email.display}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
