"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { signatureEvents } from "@content/events";
import { gsap, hasFinePointer, prefersReducedMotion } from "@/lib/gsap";
import { Plate } from "@/components/ui/Plate";

/**
 * The horizontal events strip — the seven galleries as one long shelf you pull
 * sideways.
 *
 * This is a REAL scroll container (`overflow-x: auto`) with drag layered on
 * top, not a pinned section that hijacks vertical scroll. That choice is
 * deliberate and it is an accessibility one: a scroll-hijacked strip strands
 * keyboard users, because tabbing to the seventh card moves focus somewhere the
 * page has no idea it needs to scroll to. With a native scroll container the
 * browser scrolls a focused card into view for free, touch gets its own
 * momentum from the OS, and the drag behaviour below is pure enhancement that
 * can fail without taking the content with it.
 *
 * Drag is bound only on fine pointers — on touch the native scroll is already
 * better than anything reimplemented here. `data-cursor="drag"` lights the
 * cursor label; the brief asks for a Drag state, and this is the thing that
 * earns it.
 *
 * A drag is distinguished from a click by distance: past 6px of travel the
 * click that ends the gesture is swallowed, so pulling the shelf never
 * accidentally opens a gallery, while a genuine click still navigates.
 */
export function EventsStrip() {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el || !hasFinePointer()) return;

    let down = false;
    let startX = 0;
    let startScroll = 0;
    let travelled = 0;

    const onDown = (e: PointerEvent) => {
      /* Never steal the gesture from a real interactive target's keyboard or
         middle-click behaviour; only the primary button drags. */
      if (e.button !== 0) return;
      down = true;
      travelled = 0;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      gsap.killTweensOf(el);
    };

    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      travelled = Math.max(travelled, Math.abs(dx));
      if (travelled > 6) {
        el.setPointerCapture?.(e.pointerId);
        el.scrollLeft = startScroll - dx;
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      el.releasePointerCapture?.(e.pointerId);

      /* A little glide out of the gesture, unless motion is turned down. */
      if (travelled > 6 && !prefersReducedMotion()) {
        const dx = e.clientX - startX;
        gsap.to(el, {
          scrollLeft: gsap.utils.clamp(
            0,
            el.scrollWidth - el.clientWidth,
            el.scrollLeft - dx * 0.22,
          ),
          duration: 0.7,
          ease: "power3.out",
        });
      }
    };

    /* Swallow the click that ends a drag, but never a genuine one. */
    const onClick = (e: MouseEvent) => {
      if (travelled > 6) {
        e.preventDefault();
        e.stopPropagation();
        travelled = 0;
      }
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  /* A card focused from the keyboard lands on its own snap position. The
     browser scrolls a focused card to the NEAREST edge, then the mandatory snap
     re-aligns the shelf to whichever card start is closest - measured at 1440,
     that was the previous card's, which left the focused card and its ring 36px
     past the viewport. Run a frame later, after the browser's own scroll and
     snap, and only when the card is not already whole in view. Every device:
     a keyboard can be attached to anything. */
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    let frame = 0;
    const onFocus = (e: FocusEvent) => {
      const card = e.target as HTMLElement;
      if (card.parentElement !== el || !card.matches(":focus-visible")) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = el.getBoundingClientRect();
        const r = card.getBoundingClientRect();
        const room = 8; // the ring and its halo reach 7px beyond the card
        /* The shelf runs to the window's edge, so "in view" is the scroller
           clipped to the window. */
        const left = Math.max(box.left, 0);
        const right = Math.min(box.right, window.innerWidth);
        if (r.left - room >= left && r.right + room <= right) return;
        const inset = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
        el.scrollTo({
          left: gsap.utils.clamp(0, el.scrollWidth - el.clientWidth, el.scrollLeft + r.left - box.left - inset),
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
      });
    };

    el.addEventListener("focusin", onFocus);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("focusin", onFocus);
    };
  }, []);

  return (
    <div
      ref={scroller}
      data-cursor="drag"
      className="no-scrollbar -ml-3 mt-[4.25rem] flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 pl-3 pr-[calc(var(--spacing-gutter,1.5rem)+0.75rem)] pt-3 lg:mt-[6.25rem] lg:gap-12"
      /* The shelf runs to the viewport's right edge so it reads as continuing
         past it (EventsPreview gives it the gutter on the left only). A
         scroller clips everything outside its padding box, and a focused card's
         ring and halo reach 7px beyond the card - measured, the ring was cut off
         at the top and on the first card's left side. So the scroller carries
         0.75rem of padding, takes it back on the left with a negative margin,
         and the snap inset grows by the same amount: the shelf starts exactly
         where it did, with room for the indicator. Nothing is taken back on the
         right - the shelf already ends at the window's edge, and a -mx-3 once
         pushed it 12px past, widening the whole page (stage-5 review). The far
         end carries a gutter and 0.75rem of padding, so the last card, scrolled
         fully home, rests a gutter from the edge with its ring inside the
         window. The caption now
         sits beneath each plate, inside the link, so the tallest card's ring
         ends below its caption, and pb-4 (16px) still clears the 7px halo. */
      style={{ scrollPaddingInline: "calc(var(--spacing-gutter, 1.5rem) + 0.75rem)" }}
    >
      {signatureEvents.map((event, i) => (
        /* self-start: the cards are flex items, and a stretched link is as tall
           as the tallest card - a focused 4:3 or square card's ring outlined
           empty paper beneath it. Now the ring hugs the plate and its caption. */
        <Link
          key={event.slug}
          href={`/events/${event.slug}`}
          className="group block w-[78vw] shrink-0 snap-start self-start sm:w-[46vw] lg:w-[30vw] xl:w-[26rem]"
        >
          {/*
            The events-index idiom: the photograph is a plate on the shelf and
            the title and category are its caption, set beneath on paper. With
            no type on the photograph there is nothing to declare a dark ground
            for, so the frame's data-ground and its wash are gone, and the grade
            is the light-ground one. A div, not a figure: the plate sits inside
            a link, and the link's name is its content, as before.
          */}
          <Plate
            as="div"
            frameClassName={i % 3 === 0 ? "aspect-[4/5]" : i % 3 === 1 ? "aspect-[4/3]" : "aspect-square"}
          >
            <Image
              src={event.coverImage}
              alt={`${event.title} — ${event.category}`}
              fill
              sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 30vw"
              loading="lazy"
              draggable={false}
              className="grade-b object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
          </Plate>

          {/* The caption, set here rather than in Plate's caption slot because
              the title is a heading and the slot is one eyebrow span. Its side
              padding matches the mat's, so the words align with the
              photograph's edge - the same caption as the events index. */}
          <div className="mt-5 flex items-end justify-between gap-4 px-3 sm:px-4 lg:mt-6 lg:px-5">
            <div>
              {/* No index number — a collection, not a sequence. */}
              <h3 className="font-display text-[clamp(1.6rem,2.4vw,2.1rem)] font-light leading-none text-[var(--text-primary)]">
                {event.title}
              </h3>
              <p className="mt-2.5 text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                {event.category}
              </p>
            </div>
            <span
              aria-hidden
              className="shrink-0 pb-1 text-[var(--text-secondary)] transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5"
            >
              &rarr;
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
