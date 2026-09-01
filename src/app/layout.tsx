import type { Metadata, Viewport } from "next";
import { Jost, Playfair_Display } from "next/font/google";

import { site, siteMeta } from "@content/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChromeGate } from "@/components/layout/ChromeGate";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { PageTransition } from "@/components/motion/PageTransition";
import { Preloader } from "@/components/motion/Preloader";
import { Cursor } from "@/components/motion/Cursor";
import { Magnetic } from "@/components/motion/Magnetic";
import { VenueTransition } from "@/components/motion/VenueTransition";
import { Grain } from "@/components/motion/Grain";
import { robotsForEnvironment } from "@/lib/seo";
import { LegacyAnchorRedirect } from "@/components/layout/LegacyAnchorRedirect";

import "./globals.css";

/*
 * Cretan Noir type pairing — next/font self-hosts both, so no requests reach
 * fonts.googleapis.com. Playfair's high stroke contrast is what makes the
 * display type read as light against the dark ground.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: siteMeta.title,
    template: `%s | ${site.name}`,
  },
  description: siteMeta.description,
  keywords: [...siteMeta.keywords],
  authors: [{ name: siteMeta.author }],
  creator: siteMeta.author,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: site.url,
    siteName: site.name,
    title: siteMeta.title,
    description: siteMeta.description,
    images: [
      {
        url: "/media/mdGEOR3108.jpg",
        width: 2000,
        height: 1333,
        alt: `${site.name} — ${site.descriptor}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteMeta.title,
    description: siteMeta.description,
    images: ["/media/mdGEOR3108.jpg"],
  },
  icons: { icon: "/assets/favicon.ico" },
  /*
   * Was a hard-coded `{ index: true, follow: true }`, which meant a preview
   * deployment served an explicit "please index me" meta tag while robots.txt
   * said the opposite. Now driven by the environment, and every page inherits
   * it unless it sets its own via pageMetadata().
   */
  robots: robotsForEnvironment,
};

/*
 * Both of these still described the pre-noir palette, so mobile browser chrome
 * rendered cream above an almost-black site and form controls were asked to
 * style themselves for a light page. Matched to --color-ink in Phase 6 §5.
 */
export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.locale} className={`${playfair.variable} ${jost.variable}`}>
      <head>
        {/*
          Palette study switch. Inert unless ?palette=ember is in the URL, and
          it selects a study palette that is never the default.

          It runs before paint rather than after hydration, because a client
          effect would show the shipped palette first and then swap — which is
          both ugly and useless for a side-by-side capture, since the
          screenshot could catch either state. Setting an attribute on
          documentElement touches nothing React renders, so there is no
          hydration mismatch.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var p=new URLSearchParams(location.search).get('palette');if(p==='ember'||p==='ember-deep')document.documentElement.dataset.palette=p}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-4 z-[100] bg-ink px-5 py-3 text-sm text-bone"
        >
          Skip to content
        </a>

        <Preloader />
        <SmoothScroll />
        <Cursor />
        <Magnetic />
        <VenueTransition />
        <LegacyAnchorRedirect />
        <ChromeGate>
          <Header />
        </ChromeGate>

        <main id="main">
          <PageTransition>{children}</PageTransition>
        </main>

        <ChromeGate>
          <Footer />
        </ChromeGate>

        <Grain />
      </body>
    </html>
  );
}
