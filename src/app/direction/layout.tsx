import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, IBM_Plex_Mono, Instrument_Serif, Inter, Jost, Playfair_Display } from "next/font/google";

import "./direction.css";

/*
 * Phase 6 Step A — three art directions, served side by side for comparison.
 * These routes are scratch: noindex, excluded from the sitemap, and they do not
 * touch the live site's design system.
 */

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Art direction study",
  robots: { index: false, follow: false, nocache: true },
};

export default function DirectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${instrument.variable} ${inter.variable} ${playfair.variable} ${jost.variable} ${fraunces.variable} ${plexMono.variable}`}
    >
      {/* Switcher — study only, never ships */}
      <nav
        aria-label="Direction switcher"
        className="fixed left-1/2 top-4 z-[200] flex -translate-x-1/2 gap-1 rounded-full bg-black/70 p-1 backdrop-blur-md"
      >
        {(["a", "b", "c", "d"] as const).map((d) => (
          <Link
            key={d}
            href={`/direction/${d}`}
            className="rounded-full px-4 py-2 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-white/70 transition-colors hover:bg-white hover:text-black"
          >
            {d}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
