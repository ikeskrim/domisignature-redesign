"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Facade pattern for third-party iframes.
 *
 * The Monday enquiry form and the Google Maps embeds each bring their own
 * framework, and on a throttled phone they spend well over a second of blocking
 * time competing with our own hydration — for content that is nowhere near the
 * first screen. Deferring them is worth more than any image optimisation left
 * on this site.
 *
 * The rule is APPROACH or INTERACTION, never a click that the visitor must
 * discover:
 *
 *   - an IntersectionObserver with a generous `rootMargin` mounts the embed
 *     while it is still off-screen, so scrolling toward it is enough and it has
 *     already loaded by the time it is in view;
 *   - pointer, focus or click on the facade mounts it immediately, which is
 *     what a keyboard visitor tabbing into the region gets;
 *   - if IntersectionObserver is missing, a timeout mounts it anyway.
 *
 * Nothing a visitor needs is ever behind this. On the contact page the phone,
 * WhatsApp and email sit above the form and are plain links in the server HTML,
 * so a lead is reachable before a single byte of third-party script loads. Every
 * map carries a direct "Open in Google Maps" link in its facade for the same
 * reason.
 */
export function useDeferredEmbed<T extends HTMLElement>(options?: {
  /** How far outside the viewport to start loading. */
  rootMargin?: string;
  /** Mount regardless after this long, for engines without IO. */
  fallbackMs?: number;
}) {
  const ref = useRef<T>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setMounted(true), options?.fallbackMs ?? 2500);
      return () => clearTimeout(t);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: options?.rootMargin ?? "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, options?.rootMargin, options?.fallbackMs]);

  /** Attach to the facade so any intent loads it at once. */
  const activate = () => setMounted(true);

  return { ref, mounted, activate };
}
