"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the site chrome on the Phase 6 art-direction study routes.
 *
 * `/direction/*` sits inside the root layout, so without this the live header
 * and footer render on top of each direction and contaminate the comparison.
 * Scratch routes only — this has no effect on any real page.
 */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/direction")) return null;

  /*
   * The Aegean Bone light study is gated too, and only it. Framing a warm-ivory
   * page in the site's near-black header and footer misrepresents the thing
   * being judged — the first capture of it came back showing the dark footer
   * under an ivory page, which is not what a light site would look like.
   *
   * The other study routes deliberately keep the chrome: /study/enquiry exists
   * to judge a form inside the design it would ship into, and removing the
   * frame there would be the misrepresentation.
   */
  if (pathname?.startsWith("/study/aegean")) return null;

  return <>{children}</>;
}
