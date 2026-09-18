/**
 * The drop switch — the one place motion is taken away on phones.
 *
 * Stage 6 re-tunes motion for paper, and the owner set the order in which it
 * is given up if a phone cannot carry it: the preloader first, then parallax,
 * then grain, then the shadow choreography. Nothing else is ever dropped, and
 * nothing is dropped out of that order: a level is always a prefix of it.
 *
 * `PHONE_DROP_LEVEL` is chosen by measurement, not taste: a Lighthouse matrix
 * of levels × routes × three runs, taken after the loading fixes, picks the
 * smallest level at which every route clears the mobile floor. Desktop never
 * drops.
 *
 * The level is applied before first paint by `DROP_SCRIPT`, an inline script
 * in the root layout beside the palette switch. It sets `data-drop` on <html>
 * to the dropped features, space-separated, so CSS reads it with `~=` and
 * effects read it through `isDropped()`. React never renders that attribute,
 * so there is nothing to mismatch at hydration, and the script is a constant
 * string, so the server render is identical on every device. `?drop=N` (0–4)
 * overrides the level on a phone-width window, for the matrix and the
 * motion-tier gate; it never applies at desktop widths.
 *
 * This module is imported by the (server) root layout for the script string
 * and by client components for `isDropped()`, so it holds no client-only code
 * at the top level.
 */

export const DROP_ORDER = ["preloader", "parallax", "grain", "shadow"] as const;

export type DropFeature = (typeof DROP_ORDER)[number];

/** How many of DROP_ORDER a phone drops, 0–4. 0 until the matrix measures it. */
export const PHONE_DROP_LEVEL: number = 0;

/** Where "a phone" ends: the site's own `md` breakpoint. */
export const PHONE_QUERY = "(max-width: 767px)";

export const DROP_SCRIPT =
  "try{var d=document.documentElement,o=" +
  JSON.stringify(DROP_ORDER) +
  ",n=" +
  String(PHONE_DROP_LEVEL) +
  ",q=new URLSearchParams(location.search).get('drop');" +
  "if(q!==null&&/^[0-4]$/.test(q))n=+q;" +
  "if(n>0&&matchMedia(" +
  JSON.stringify(PHONE_QUERY) +
  ").matches)d.dataset.drop=o.slice(0,n).join(' ')}catch(e){}";

/**
 * True when this page load dropped `feature`. Read at call time from the
 * attribute the inline script set, so every consumer agrees with the CSS.
 */
export function isDropped(feature: DropFeature): boolean {
  if (typeof document === "undefined") return false;
  return (document.documentElement.dataset.drop ?? "").split(" ").includes(feature);
}
