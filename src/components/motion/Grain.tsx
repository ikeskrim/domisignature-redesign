/**
 * The film-grain layer, mounted once at the root.
 *
 * A server component with no JavaScript: it is a single fixed div and a CSS
 * background, so it costs nothing at runtime and cannot fail to hydrate.
 *
 * `aria-hidden` and `pointer-events: none` — it must never reach the
 * accessibility tree and must never intercept a click. It sits at z-60, above
 * the page content so the texture reads across photography and ground alike,
 * but below the header (z-50 is the header's own stacking context on the page,
 * while the menu, curtain, cursor and preloader all sit at z-80 and above), so
 * nothing interactive is ever veiled by it.
 *
 * It is NOT gated on prefers-reduced-motion: it does not move. Reduced motion
 * asks for less animation, not less texture.
 */
export function Grain() {
  return <div className="grain" aria-hidden="true" />;
}
