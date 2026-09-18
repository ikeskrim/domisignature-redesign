import type { Metadata } from "next";

/**
 * AEGEAN BONE — the light mini-study.
 *
 * Three surfaces only, on study routes, so nothing here touches the site. The
 * wrapper carries `data-ground="light"`; the dark chapters inside declare
 * `data-ground="dark"` on their own section and invert locally. No component in
 * here names a palette literal — that is the point of stage 1.
 *
 * The photography rule is unchanged and absolute: every frame on these pages is
 * a real photograph already in the library. Nothing is generated, and nothing is
 * hazed, tinted or faded to make it sit on a light ground — the whole point of
 * the study is whether ivory mats and dark chapters can carry dusk imagery
 * without touching the images themselves.
 */
export const metadata: Metadata = {
  title: "Study — Aegean Bone",
  robots: { index: false, follow: false, nocache: true },
};

export default function AegeanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-ground="light" className="min-h-dvh bg-[var(--surface)]">
      {children}
    </div>
  );
}
