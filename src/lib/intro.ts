"use client";

import { isDropped } from "@/lib/motion-tier";

/**
 * The intro gate.
 *
 * The preloader and the hero have to agree on when the site has "opened",
 * otherwise the headline plays its entrance behind the curtain and is already
 * finished by the time anyone can see it. This is the handshake between them.
 *
 * `Preloader` is mounted on every page and is the only thing that resolves it —
 * immediately when it decides not to show (reduced motion, already seen this
 * session, or dropped on a phone), and otherwise when its sheet has cleared.
 * Anything that wants to play an entrance awaits `introDone` first.
 *
 * A 4s failsafe resolves the gate regardless, so a bug in the preloader can
 * never leave the homepage sitting on an invisible headline.
 */

let settle: () => void = () => {};

export const introDone: Promise<void> =
  typeof window === "undefined"
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        settle = resolve;
        setTimeout(resolve, 4000);
      });

export function markIntroDone() {
  settle();
}

/** Set by the preloader once it has shown; a new tab is a new session. */
export const INTRO_SEEN_KEY = "domi:intro-seen";

let willShow: boolean | undefined;

/**
 * Whether the preloader covers this page load.
 *
 * Decided once, on the first call, and remembered: the preloader marks the
 * session as seen as soon as it decides to show, so a later read of
 * sessionStorage would answer for the next page, not this one. The preloader
 * must ask this before it writes the key, and a component that holds an
 * entrance for the preloader (the Hero) asks the same question and gets the
 * same answer.
 *
 * Without it, a server-painted headline that nothing will cover is hidden and
 * replayed — a flash on the first screen.
 */
export function introWillShow(): boolean {
  if (typeof window === "undefined") return false;
  if (willShow === undefined) {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(INTRO_SEEN_KEY) !== null;
    } catch {
      /* Storage blocked: behave as a returning visitor rather than cover the page. */
      seen = true;
    }
    willShow =
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !seen &&
      !isDropped("preloader");
  }
  return willShow;
}

let hasBooted = false;

/**
 * Marks the end of the hard load. The preloader calls it from a passive
 * effect, which runs after every layout effect of the first commit — so a
 * component mounting on the hard load reads `booted() === false`, and one
 * mounting later, on a client navigation under the page curtain, reads true.
 */
export function markBooted() {
  hasBooted = true;
}

/** True once the hard load has committed: later mounts are client navigations. */
export function booted(): boolean {
  return hasBooted;
}
