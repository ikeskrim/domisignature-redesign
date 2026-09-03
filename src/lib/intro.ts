"use client";

/**
 * The intro gate.
 *
 * The preloader and the hero have to agree on when the site has "opened",
 * otherwise the headline plays its entrance behind the curtain and is already
 * finished by the time anyone can see it. This is the handshake between them.
 *
 * `Preloader` is mounted on every page and is the only thing that resolves it —
 * immediately when it decides not to show (reduced motion, or already seen this
 * session), and otherwise when its curtain has cleared. Anything that wants to
 * play an entrance awaits `introDone` first.
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
