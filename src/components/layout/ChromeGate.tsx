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
   * Two study routes are gated too, and only those. /study/aegean and
   * /study/motion are compared without the live chrome so the frame does not
   * influence the judgement: what is under review is the study itself, not
   * how it reads inside the header and footer.
   *
   * The other study routes deliberately keep the chrome: /study/enquiry exists
   * to judge a form inside the design it would ship into, and removing the
   * frame there would be the misrepresentation.
   */
  if (pathname?.startsWith("/study/aegean") || pathname?.startsWith("/study/motion")) return null;

  return <>{children}</>;
}
