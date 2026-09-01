"use client";

import { useEffect, useRef, useState } from "react";

import { contact } from "@content/site";
import { useDeferredEmbed } from "@/lib/deferred-embed";

type State = "loading" | "ready" | "error";

/**
 * The Monday.com enquiry form, embedded exactly as on the live site.
 *
 * A third-party iframe can be blocked by a tracker blocker or simply fail, and
 * on the old site that left a silent grey rectangle. Here it gets a skeleton
 * while loading and a real fallback — phone, WhatsApp, email — if it never
 * arrives, so a visitor is never left with no way to reach anyone.
 */
export function MondayForm() {
  const [state, setState] = useState<State>("loading");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * Facade. The form mounts when the visitor scrolls toward it, or the moment
   * they point at, focus or click the region — never on first paint. The
   * direct contacts above it are plain links in the server HTML, so no lead is
   * ever waiting on third-party script.
   *
   * 200px of margin, not the 800px default. Measured: on a 412x823 phone the form sits
   * 535px below the fold, so an 800px margin fired the observer before the
   * visitor had scrolled at all — 34 third-party requests and 6.7 MB on
   * arrival. The facade was deferring the embed past Lighthouse's window and
   * almost nothing else. At 200px it waits for a real scroll toward the form.
   *
   * On desktop the form sits at 713px in a 900px viewport, so it is already on
   * screen and mounts immediately whatever this value is — correctly.
   */
  const { ref: shell, mounted: mountForm, activate } = useDeferredEmbed<HTMLDivElement>({
    rootMargin: "200px 0px",
  });

  useEffect(() => {
    if (!mountForm) return;
    // `load` never fires on a blocked iframe, so treat a long silence as failure.
    timeout.current = setTimeout(() => {
      setState((current) => (current === "loading" ? "error" : current));
    }, 12000);

    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [mountForm]);

  if (state === "error") {
    return (
      <div role="alert" className="border border-hair bg-graphite p-8 lg:p-12">
        <h3 className="font-display text-heading font-light text-bone">
          The enquiry form did not load
        </h3>
        <p className="mt-4 max-w-lg leading-relaxed text-bone/85">
          It may be blocked by your browser or an extension. Please reach us directly — we answer
          every message personally.
        </p>

        <ul className="mt-8 space-y-4">
          <li>
            <a
              href={contact.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-baseline gap-3"
            >
              <span className="text-xs uppercase tracking-[0.16em] text-faint">WhatsApp</span>
              <span className="font-display text-xl font-light text-bone group-hover:text-gold">
                {contact.whatsapp.display}
              </span>
            </a>
          </li>
          <li>
            <a href={contact.phone.href} className="group inline-flex items-baseline gap-3">
              <span className="text-xs uppercase tracking-[0.16em] text-faint">Call</span>
              <span className="font-display text-xl font-light text-bone group-hover:text-gold">
                {contact.phone.display}
              </span>
            </a>
          </li>
          <li>
            <a href={contact.email.href} className="group inline-flex items-baseline gap-3">
              <span className="text-xs uppercase tracking-[0.16em] text-faint">Email</span>
              <span className="break-all font-display text-xl font-light text-bone group-hover:text-gold">
                {contact.email.display}
              </span>
            </a>
          </li>
        </ul>

        <button
          type="button"
          onClick={() => setState("loading")}
          className="mt-9 border border-hair/35 px-6 py-3 text-[0.6875rem] uppercase tracking-[0.18em] text-bone transition-colors duration-500 hover:bg-bone hover:text-ink"
        >
          Try the form again
        </button>
      </div>
    );
  }

  return (
    <div
      ref={shell}
      className="relative"
      /* Any intent loads it at once — pointer, or a keyboard visitor tabbing
         into the region. The observer usually got there first. */
      onPointerEnter={activate}
      onFocusCapture={activate}
    >
      {mountForm ? (
        <>
          {state === "loading" && (
            <div
              aria-hidden
              className="absolute inset-0 flex flex-col gap-5 border border-hair bg-graphite p-8 lg:p-12"
            >
              <div className="h-3 w-32 animate-pulse bg-hair" />
              <div className="h-12 w-full animate-pulse bg-hair/70" />
              <div className="h-3 w-24 animate-pulse bg-hair" />
              <div className="h-12 w-full animate-pulse bg-hair/70" />
              <div className="h-3 w-28 animate-pulse bg-hair" />
              <div className="h-32 w-full animate-pulse bg-hair/70" />
              <p className="sr-only">Loading the enquiry form</p>
            </div>
          )}

          <iframe
            src={contact.formEmbed}
            title="Domisignature enquiry form"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setState("ready")}
            className="h-[1600px] w-full border border-hair bg-ink"
          />
        </>
      ) : (
        /*
          The facade. Reserves the EXACT final height so mounting the form
          shifts nothing — CLS on this page is 0 and stays there.
        */
        <div className="flex h-[1600px] w-full flex-col border border-hair bg-graphite p-8 lg:p-12">
          <p className="eyebrow text-faint">Enquiry form</p>
          <p className="mt-5 max-w-md leading-relaxed text-bone/85">
            The form loads as you reach it. You can also write to us directly — we answer every
            message ourselves.
          </p>

          <button
            type="button"
            onClick={activate}
            className="mt-8 self-start border border-hair/35 px-6 py-3 text-[0.6875rem] uppercase tracking-[0.18em] text-bone transition-colors duration-500 hover:bg-bone hover:text-ink"
          >
            Load the form now
          </button>

          <ul className="mt-9 space-y-3">
            <li>
              <a href={contact.phone.href} className="text-bone/85 transition-colors hover:text-bone">
                {contact.phone.display}
              </a>
            </li>
            <li>
              <a
                href={contact.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-bone/85 transition-colors hover:text-bone"
              >
                WhatsApp {contact.whatsapp.display}
              </a>
            </li>
            <li>
              <a href={contact.email.href} className="break-all text-bone/85 transition-colors hover:text-bone">
                {contact.email.display}
              </a>
            </li>
          </ul>

          <div aria-hidden className="mt-auto flex flex-col gap-5 opacity-40">
            <div className="h-3 w-32 bg-hair" />
            <div className="h-12 w-full bg-hair/70" />
            <div className="h-3 w-24 bg-hair" />
            <div className="h-12 w-full bg-hair/70" />
          </div>
        </div>
      )}
    </div>
  );
}
