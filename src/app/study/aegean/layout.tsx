import type { Metadata } from "next";

/**
 * AEGEAN BONE — the light mini-study.
 *
 * Three surfaces only, on study routes, so nothing here touches the site. The
 * wrapper carries `data-study="aegean"`, which is the only place the light
 * tokens in globals.css resolve.
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
    <div data-study="aegean" className="min-h-dvh bg-[var(--aegean-ivory)]">
      {children}
    </div>
  );
}
