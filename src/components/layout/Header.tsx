"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { nav, site, contact } from "@content/site";
import { cn } from "@/lib/utils";
import {
  gsap,
  CURTAIN,
  DUR,
  EASE,
  STAGGER,
  finishOnFocus,
  prefersReducedMotion,
} from "@/lib/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* Body children the open menu never makes inert. They are not page content,
   and Next's route announcer has to stay live so that a navigation made from
   the menu is still announced. */
const NEVER_INERT = new Set(["SCRIPT", "STYLE", "LINK", "TEMPLATE", "NOSCRIPT", "NEXT-ROUTE-ANNOUNCER"]);

/* The menu's choreography, in seconds from the panel starting to move. The row
   hairlines and labels start together. Each label rises for LABEL_RISE, so the
   first one is at rest the instant the panel arrives (DUR.panel), and that is
   when the first link takes focus. The later labels, the hairlines and the
   foot carry on after it; none of them is the focused element. Focus lands at
   about 0.7s after the toggle is pressed — inside the focus-in-motion gate's
   900ms reading (scripts/focus-motion.mjs, the menu trigger). */
const ROWS_AT = 0.15;
const LABEL_RISE = DUR.panel - ROWS_AT;
const FOOT_RULE_AT = 0.45;
const FOOT_AT = 0.5;
const FOCUS_AT = DUR.panel;
/* Closing is quicker than opening: the visitor has already chosen to leave. */
const CLOSE = 0.5;

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  /* Separate from `open` so the panel can animate out before it unmounts. */
  const [present, setPresent] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  /* Where the panel stands, in yPercent, when one direction hands over to the
     other: a close during the slide in (or a reopen during the slide out)
     leaves from there instead of jumping. -100 is fully above the viewport. */
  const panelY = useRef(-100);

  /* The homepage hero and the venue title card are the two page openers that
     are designated dark chapters — full-bleed imagery the header floats over —
     so the header starts transparent there and only picks up a surface once
     the visitor scrolls past. The same flag sets the header's ground: over the
     opener it floats on a dark photograph and its roles resolve to the night
     ladder; scrolled, it takes the page. Every other route opens on paper.
     Nothing below names a colour — the ground answers.

     While the menu is present the header floats on the menu's raised paper,
     not on the photograph, so it takes the page there too. Left on the night
     ladder it set bone on ivory — 1.07:1 by the tokens — and the Close control,
     the dialog's one visible way out, all but vanished. It keeps the page
     ground until the panel has fully left, then returns to the hero. */
  const overHero =
    (pathname === "/" || /^\/venues\/[^/]+$/.test(pathname)) && !scrolled && !present;

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

  /*
   * The open menu is a modal dialog, and behaves as one. Until this only Escape
   * was real: Tab walked straight out of a full-screen panel into the page it
   * covers.
   *
   * - Opening moves focus to the first link — once the panel has arrived and
   *   that link's label has risen (the open animation below does it; at once
   *   under reduced motion), so a focus ring never travels with the sheet.
   * - Tab and Shift+Tab cycle the panel's links and the Close control. Close is
   *   the same toggle, which lives in the header above the panel rather than in
   *   the dialog's DOM, so the cycle is kept by hand: the toggle, then the panel
   *   in document order — which is also the order on screen.
   * - Everything behind the panel (the page, the footer, the skip link) is
   *   inert while it is open, so no click, screen-reader cursor or stray focus()
   *   reaches what the panel hides. Only attributes set here are taken off.
   * - Escape closes. Closing returns focus to the toggle, unless something has
   *   already taken it on purpose (a route's own focus handling).
   * - The panel and toggle exist below lg only. A tablet turned to landscape
   *   crosses lg with the menu open; the panel goes display:none, and the page
   *   would be left inert and scroll-locked under nothing. Crossing lg closes it.
   */
  useEffect(() => {
    const el = panel.current;
    const btn = toggle.current;
    if (!open || !present || !el || !btn) return;

    const behind = Array.from(document.body.children).filter(
      (n): n is HTMLElement =>
        n instanceof HTMLElement &&
        !n.contains(el) &&
        !n.contains(btn) &&
        !n.hasAttribute("inert") &&
        !NEVER_INERT.has(n.tagName),
    );
    behind.forEach((n) => n.setAttribute("inert", ""));

    const stops = () => [
      btn,
      ...Array.from(el.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")),
    ];

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      const list = stops();
      const at = list.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (at <= 0 ? list.length - 1 : at - 1) : (at + 1) % list.length;
      list[next]?.focus({ preventScroll: true });
    };

    const desktop = window.matchMedia("(min-width: 64rem)");
    const onDesktop = () => {
      if (desktop.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
      behind.forEach((n) => n.removeAttribute("inert"));
      const active = document.activeElement;
      if (!active || active === document.body || el.contains(active)) {
        btn.focus({ preventScroll: true });
      }
    };
  }, [open, present]);

  /* Opening mounts immediately; closing waits for the slide out to finish. */
  useEffect(() => {
    if (open) setPresent(true);
  }, [open]);

  /*
   * The panel is a sheet of raised paper: it slides down over the page and
   * back up, on the sheet's own ease. Nothing on it fades. The row hairlines
   * draw from the left, each label rises from behind its line inside its own
   * link, the foot rule draws and the foot links settle.
   *
   * Focus: the first link is focused the moment the panel has arrived, when its
   * label has just come to rest. Any other focus arriving in the panel
   * mid-choreography (a Tab during the slide) finishes it first, so a focused
   * link is never moving or under a mask. Reduced motion: the final state, at
   * once.
   */
  useIsomorphicLayoutEffect(() => {
    const el = panel.current;
    if (!el) return;
    const reduced = prefersReducedMotion();

    if (open) {
      const first = el.querySelector<HTMLElement>("a[href], button:not([disabled])");
      if (reduced) {
        first?.focus({ preventScroll: true });
        return;
      }

      let releaseFinish = () => {};
      const ctx = gsap.context(() => {
        const tl = gsap.timeline();
        tl.fromTo(
          el,
          { yPercent: panelY.current },
          { yPercent: 0, duration: DUR.panel, ease: CURTAIN },
          0,
        )
          .from(
            "[data-menu-rule]",
            { scaleX: 0, duration: DUR.draw, ease: EASE, stagger: STAGGER.tight },
            ROWS_AT,
          )
          /* 120, not 110: the mask carries padding below the line for the
             descenders, and the label has to clear that too. */
          .from(
            "[data-menu-label]",
            { yPercent: 120, duration: LABEL_RISE, ease: EASE, stagger: STAGGER.tight },
            ROWS_AT,
          )
          .from("[data-menu-foot-rule]", { scaleX: 0, duration: DUR.draw, ease: EASE }, FOOT_RULE_AT)
          .from(
            "[data-menu-foot] a",
            { y: 12, duration: DUR.settle, ease: EASE, stagger: STAGGER.tight },
            FOOT_AT,
          )
          .call(
            () => {
              if (el.contains(document.activeElement)) return;
              /* Our own focus must not cut the choreography short. */
              releaseFinish();
              first?.focus({ preventScroll: true });
              releaseFinish = finishOnFocus(el, tl);
            },
            undefined,
            FOCUS_AT,
          );
        releaseFinish = finishOnFocus(el, tl);
      }, el);

      return () => {
        releaseFinish();
        panelY.current = Number(gsap.getProperty(el, "yPercent")) || 0;
        ctx.revert();
      };
    }

    /* Closing: slide back up, then leave the DOM. */
    if (reduced) {
      panelY.current = -100;
      setPresent(false);
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: panelY.current },
        {
          yPercent: -100,
          duration: CLOSE,
          ease: CURTAIN,
          onComplete: () => {
            /* Parked above the viewport, the sheet's edge gradient would
               still hang under the header until React unmounts it. */
            gsap.set(el, { visibility: "hidden" });
            setPresent(false);
          },
        },
      );
    }, el);
    return () => {
      panelY.current = Number(gsap.getProperty(el, "yPercent"));
      ctx.revert();
    };
  }, [open, present]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        data-ground={overHero ? "dark" : "light"}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          overHero
            ? "border-b border-transparent bg-transparent"
            : "border-b border-[var(--rule)] bg-[rgb(var(--wash)/0.85)] backdrop-blur-xl",
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

              Two files, one shown. A PNG cannot ask for a role, so the mark is
              the one thing here that must be swapped rather than resolved: the
              ink mark on paper, the bone mark over the hero, toggled by the same
              flag that sets the ground. Only the first carries `priority` —
              two preloads would double the cost the note above just removed.
              Both are decorative (the link is named by its aria-label), and the
              hidden one is display:none, so assistive technology meets neither.
            */}
            <Image
              src="/assets/img/mark-ink.png"
              alt=""
              width={40}
              height={40}
              sizes="40px"
              priority
              className={cn(
                "h-8 w-8 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[18deg] lg:h-10 lg:w-10",
                overHero && "hidden",
              )}
            />
            <Image
              src="/assets/img/mark-bone.png"
              alt=""
              width={40}
              height={40}
              sizes="40px"
              className={cn(
                "h-8 w-8 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[18deg] lg:h-10 lg:w-10",
                !overHero && "hidden",
              )}
            />
            <span className="font-sans text-[0.72rem] font-medium uppercase tracking-[0.34em] text-[var(--text-primary)]">
              {site.name}
            </span>
          </Link>

          {/* Desktop navigation — hovering one item steps its siblings down to
              tertiary. It was a 45% opacity fade, which on paper took the ink
              under AA for as long as the pointer stayed; a solved step holds it.
              Same 600ms and ease. The active underline keeps its primary ink,
              so the current page still reads while a sibling is hovered. */}
          <nav aria-label="Primary" className="group/nav hidden items-center gap-9 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "group relative py-2 font-sans text-[0.7rem] font-medium uppercase tracking-[0.18em]",
                  "transition-[color] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                  // Siblings step down to tertiary while one link is hovered - on
                  // paper only. Over the unveiled hero nothing below primary
                  // holds (secondary ~2.5:1, tertiary ~2.2:1 on open sky), so
                  // there the underline alone marks the hovered link.
                  !overHero && "group-hover/nav:text-[var(--text-tertiary)] hover:!text-[var(--text-primary)]",
                  // Over the hero there is no veil: the night ladder's secondary
                  // floats on open sky at ~2.5:1 and reads as faded beside the
                  // primary wordmark, so the links rest on primary there.
                  // Scrolled, on the paper wash, secondary holds 7.65:1 and keeps
                  // its step.
                  overHero ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]",
                  isActive(item.href) && "text-[var(--text-primary)]",
                )}
              >
                {item.label}
                {/*
                  Drawn in the link's own primary ink, so it reads on either
                  ground. It was once bg-ink — an all-but-black rule on an
                  all-but-black header, invisible in both states — collateral
                  from the Phase 6 token rename, fixed in §5.

                  The active one is anchored on the left, so on a route change
                  the new page's rule draws in from the left while the old one
                  retracts to the right, on the same CSS transition as hover.
                */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-0 left-0 h-px w-full origin-right scale-x-0 bg-[var(--text-primary)] transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:origin-left group-hover:scale-x-100",
                    isActive(item.href) && "origin-left scale-x-100",
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
                "transition-[color,background-color,border-color] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                // A sibling of the links, so it takes the same step down while
                // one of them is hovered - on paper only, as the links do; its
                // --rule-strong border stays, since that boundary has to be seen.
                !overHero && "group-hover/nav:text-[var(--text-tertiary)]",
                // Hover inverts: the fill is the other ladder's ground and the
                // label its primary, so the label can never sink into the fill
                // (the scrolled variant once hovered bone-on-bone).
                "border-[var(--rule-strong)] text-[var(--text-primary)] hover:bg-[var(--inverse)] hover:!text-[var(--text-on-inverse)]",
              )}
            >
              Enquire
            </a>
          </nav>

          {/* Mobile trigger */}
          <button
            ref={toggle}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="-mr-2 flex items-center gap-3 p-2 text-[var(--text-primary)] lg:hidden"
          >
            {/* `.eyebrow` rests on tertiary; over the unveiled hero that is
                ~2.2:1 on sky, so the control label says primary itself. */}
            <span className={cn("eyebrow", overHero && "text-[var(--text-primary)]")}>
              {open ? "Close" : "Menu"}
            </span>
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

      {/* Mobile menu — outside the header, so it sits on the page's own ground:
          a raised paper panel, whatever the header is floating over. Modal in
          behaviour (focus trap, inert page, focus restore: see the effect
          above), named by the toggle's own "Menu". No aria-modal: the Close
          toggle lives in the header, outside this panel, and aria-modal lets a
          screen reader (VoiceOver on iOS) hide everything outside the dialog -
          the one way out included. The inert page already takes everything
          behind the panel out of reach for every assistive technology. */}
      {present && (
        <div
          ref={panel}
          id="mobile-menu"
          role="dialog"
          aria-label="Menu"
          data-menu-panel
          className="panel-edge fixed inset-0 z-40 flex flex-col bg-[var(--surface-raised)] lg:hidden"
        >
          <nav
            aria-label="Mobile"
            className="flex flex-1 flex-col justify-center gap-1 px-gutter pt-24"
          >
            {nav.map((item, i) => (
              <div key={item.href} className="relative isolate pb-px">
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="block py-4 font-display text-[2.25rem] leading-none text-[var(--text-primary)] transition-colors"
                >
                  {/* The mask is inside the link, never around it: the link's
                      box is where the focus ring draws, and a mask there would
                      cut it. The padding below the line, cancelled by an equal
                      negative margin, keeps the descenders inside the mask. */}
                  <span className="-mb-[0.2em] block overflow-hidden pb-[0.2em]">
                    <span data-menu-label className="flex items-baseline gap-4">
                      <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
                      {item.label}
                    </span>
                  </span>
                </Link>
                {/* The row's hairline, drawn in from the left as the panel
                    arrives. It was the link's own bottom border, which painted
                    under the focus ring; a positioned line paints after the
                    link's halo and outline and would run through them. So the
                    row is its own stacking context and the line sits behind
                    it (-z-10): the link's ring and halo cover this row's line,
                    and the next row, painted after this one, covers it too. */}
                <span
                  aria-hidden
                  data-menu-rule
                  className="absolute inset-x-0 bottom-0 -z-10 h-px origin-left bg-[var(--rule)]"
                />
              </div>
            ))}
          </nav>

          <div className="px-gutter pb-12" data-menu-foot>
            <div aria-hidden data-menu-foot-rule className="rule mb-6 origin-left" />
            <a href={contact.phone.href} className="block py-1 text-lead text-[var(--text-primary)]">
              {contact.phone.display}
            </a>
            <a
              href={contact.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 text-lead text-[var(--text-primary)]"
            >
              WhatsApp {contact.whatsapp.display}
            </a>
            <a href={contact.email.href} className="block py-1 text-lead text-[var(--text-primary)]">
              {contact.email.display}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
