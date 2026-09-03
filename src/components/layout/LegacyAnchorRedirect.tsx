"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { nav } from "@content/site";

/**
 * The old one-page site published anchors: #services, #portfolio, #portfolio1,
 * #about, #team, #contact. Those links exist in the wild — in the brochure, in
 * social bios, in Google's index — so a visitor arriving at /#portfolio must
 * still land somewhere sensible.
 *
 * Anchors are never sent to the server, so this has to be resolved client-side.
 */
const LEGACY: Record<string, string> = {
  "#services": "/services",
  "#portfolio": "/venues",
  "#portfolio1": "/events",
  "#about": "/wedding-guide",
  "#team": "/about",
  "#contact": "/contact",
  "#page-top": "/",
  // The venue modals were addressable too.
  "#portfolioModal1": "/venues/mountain-escape",
  "#portfolioModal2": "/venues/thalasses",
  "#portfolioModal3": "/venues/olive-stories",
  // Villa Aetos was removed; its old deep link lands on the collection instead.
  "#portfolioModal4": "/venues",
  "#portfolio1Modal1": "/events/sunset-by-the-pool",
  "#portfolio1Modal2": "/events/villa-party",
  "#portfolio1Modal3": "/events/party-celebration",
  "#portfolio1Modal4": "/events/wedding-rituals-aerial",
  "#portfolio1Modal5": "/events/dinner-celebration",
  "#portfolio1Modal6": "/events/party-drone",
  "#portfolio1Modal7": "/events/wedding-rituals-olive",
};

export function LegacyAnchorRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only rewrite anchors landing on the homepage — deep links elsewhere are ours.
    if (pathname !== "/") return;

    const hash = window.location.hash;
    if (!hash) return;

    const destination = LEGACY[hash];
    if (!destination || destination === "/") return;

    // Drop the stale anchor from history so Back doesn't loop.
    window.history.replaceState(null, "", "/");
    router.replace(destination);
  }, [pathname, router]);

  return null;
}

/** Exported for the sitemap and for tests. */
export const legacyAnchorMap = LEGACY;
export const navAnchors = nav.map((n) => n.legacyAnchor);
