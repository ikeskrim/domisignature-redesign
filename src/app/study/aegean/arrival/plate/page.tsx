import type { Metadata } from "next";

import { ArrivalProposal } from "@/components/study/ArrivalProposal";

export const metadata: Metadata = {
  title: "Study — arrival (plate)",
  robots: { index: false, follow: false, nocache: true },
};

export default function ArrivalStudy() {
  return (
    <>
      <ArrivalProposal variant="plate" />
      {/* The ivory resumes underneath, which is the point of the comparison:
          what the join looks like when the scene ends. */}
      <section data-ground="light" className="bg-[var(--surface)] px-gutter py-24 lg:py-32">
        <div className="mx-auto w-full max-w-[104rem]">
          <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            the page continues
          </p>
          <p className="mt-7 max-w-2xl font-display text-[clamp(1.5rem,2.6vw,2.4rem)] font-light leading-[1.25] text-[var(--text-primary)]">
            Three settings, one island
          </p>
        </div>
      </section>
    </>
  );
}
