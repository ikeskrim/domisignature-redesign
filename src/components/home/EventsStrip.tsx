"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { signatureEvents } from "@content/events";
import { gsap, hasFinePointer, prefersReducedMotion } from "@/lib/gsap";

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

  return (
    <div
      ref={scroller}
      data-cursor="drag"
      className="no-scrollbar mt-20 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 lg:mt-28 lg:gap-12"
      /* Bleed the shelf to the viewport edge so it reads as continuing past it. */
      style={{ scrollPaddingInline: "var(--spacing-gutter, 1.5rem)" }}
    >
      {signatureEvents.map((event, i) => (
        <Link
          key={event.slug}
          href={`/events/${event.slug}`}
          className="group block w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw] xl:w-[26rem]"
        >
          <div
            className={`relative overflow-hidden bg-graphite ${
              i % 3 === 0 ? "aspect-[4/5]" : i % 3 === 1 ? "aspect-[4/3]" : "aspect-square"
            }`}
          >
            <Image
              src={event.coverImage}
              alt={`${event.title} — ${event.category}`}
              fill
              sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 30vw"
              loading="lazy"
              draggable={false}
              className="grade object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
            <div aria-hidden className="scrim-bottom absolute inset-0" />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-7">
              <div>
                {/* No index number — a collection, not a sequence. */}
                <h3 className="font-display text-[clamp(1.6rem,2.4vw,2.1rem)] font-light leading-none text-bone">
                  {event.title}
                </h3>
                <p className="mt-2.5 text-[0.6875rem] uppercase tracking-[0.2em] text-bone/60">
                  {event.category}
                </p>
              </div>
              <span
                aria-hidden
                className="shrink-0 pb-1 text-bone/60 transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5"
              >
                &rarr;
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
