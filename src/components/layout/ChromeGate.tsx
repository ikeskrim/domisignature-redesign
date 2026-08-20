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
  return <>{children}</>;
}
