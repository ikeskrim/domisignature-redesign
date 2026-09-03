import type { Metadata } from "next";

import { EventsStrip } from "@/components/home/EventsStrip";
import { StripWithRail } from "@/components/study/StripWithRail";

/**
 * STUDY — the two backlog items that are taste decisions, not defects.
 *
 * Nothing here ships. `/` still renders the shelf exactly as it always has;
 * this page imports that same component, unmodified, so the left-hand column is
 * the real thing rather than a description of it.
 */
export const metadata: Metadata = {
  title: "Study — backlog",
  robots: { index: false, follow: false, nocache: true },
};

const ALT_SAMPLE = [
  {
    file: "th4.jpg",
    now: "Open image 3 of 24 full screen",
    proposed:
      "Long banquet tables laid in white beside a pool, a canopy of fairy lights strung between two palms, the sea just beyond the wall.",
  },
  {
    file: "th3-DSC_9730.jpg",
    now: "Open image 9 of 24 full screen",
    proposed:
      "Guests dressed in white gathered around a lit pool after dark, festoon lights and palms overhead.",
  },
];

export default function BacklogStudy() {
  return (
    <main className="bg-ink pb-section pt-32 lg:pt-40">
      <div className="mx-auto w-full max-w-[104rem] px-gutter">
        <p className="eyebrow text-muted">Study — not part of the site</p>
        <h1 className="mt-8 font-display text-[clamp(2.25rem,5vw,4.5rem)] font-light leading-[1.02] text-bone">
          Two questions of taste
        </h1>
        <p className="prose-editorial mt-8 max-w-2xl">
          The standing backlog had five items. One was a wrong diagnosis and is
          fixed. One is a refactor with no user-visible outcome and stays
          unbuilt. These two are real, and both are judgement calls rather than
          defects — so they are shown here rather than shipped.
        </p>
      </div>

      {/* ---------- 1. the shelf ---------- */}
      <section aria-labelledby="rail-h" className="mt-24 lg:mt-32">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <h2 id="rail-h" className="font-display text-title font-light text-bone">
            1. Does the shelf need a progress rail?
          </h2>
          <div className="prose-editorial mt-7 max-w-3xl">
            <p>
              The note said a touch visitor has &ldquo;only the cards running off
              the edge&rdquo;. Measured at 390px, that turns out to be wrong: the
              cards are 78vw wide, so the next one already peeks by{" "}
              <strong className="font-normal text-bone">38px</strong> and its
              title is visible at the edge. The affordance the note asked for is
              already there.
            </p>
            <p>
              What is genuinely missing is <em>extent</em>. The shelf scrolls
              2,273px inside a 366px window — six and a quarter screens — and
              nothing says so. A visitor who swipes once has no idea whether two
              more cards remain or six.
            </p>
          </div>
        </div>

        <div className="mt-14 space-y-20">
          <div>
            <p className="mx-auto mb-6 w-full max-w-[104rem] px-gutter text-[0.6875rem] uppercase tracking-[0.18em] text-faint">
              A — what ships today
            </p>
            <div className="px-gutter">
              <EventsStrip />
            </div>
          </div>

          <div>
            <p className="mx-auto mb-6 w-full max-w-[104rem] px-gutter text-[0.6875rem] uppercase tracking-[0.18em] text-faint">
              B — with a progress rail
            </p>
            <div className="px-gutter">
              <StripWithRail />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 w-full max-w-[104rem] px-gutter">
          <p className="prose-editorial max-w-3xl">
            The cost of B is one more line on a page whose whole argument is
            restraint, and it competes with the hairline rules already used as
            section dividers. My own view is that it earns its place on a phone
            and is clutter on a desktop where three cards are visible at once —
            which would mean showing it below <code>lg</code> only. That is a
            direction call, not a defect, so it is yours.
          </p>
        </div>
      </section>

      {/* ---------- 2. alt text ---------- */}
      <section aria-labelledby="alt-h" className="mt-28 lg:mt-40">
        <div className="mx-auto w-full max-w-[104rem] px-gutter">
          <h2 id="alt-h" className="font-display text-title font-light text-bone">
            2. What a screen reader hears in a gallery
          </h2>
          <div className="prose-editorial mt-7 max-w-3xl">
            <p>
              This is not the problem the note described either. Alt text is not
              inconsistent in voice — there is barely any. Gallery photographs
              are marked decorative and the tile around them is announced by
              position: <em>&ldquo;Open image 3 of 24 full screen&rdquo;</em>.
              That is technically correct, which is why axe reports zero
              violations, and it is why nothing has ever caught it.
            </p>
            <p>
              It is also, for a page whose entire content is photographs, close
              to announcing nothing at all. Someone using a screen reader can
              open twenty-four images and learn twenty-four numbers.
            </p>
          </div>

          <div className="mt-12 max-w-4xl divide-y divide-hair border-y border-hair">
            {ALT_SAMPLE.map((row) => (
              <div key={row.file} className="grid gap-4 py-8 sm:grid-cols-[10rem_1fr]">
                <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
                  {row.file}
                </p>
                <div>
                  <p className="text-bone/60">
                    <span className="text-faint">now — </span>
                    {row.now}
                  </p>
                  <p className="mt-3 leading-relaxed text-bone">
                    <span className="text-faint">proposed — </span>
                    {row.proposed}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="prose-editorial mt-10 max-w-3xl">
            Two frames, written by looking at them. That is the catch: there are
            roughly two hundred photographs on this site, and honest alt text
            cannot be generated — the same rule that says gallery titles are
            written with your eyes. It is a sitting-down job with the pictures
            open, and it is writing, which is why it is not something to do
            unattended overnight. The ingest tool built tonight produces an{" "}
            <code>alt</code> TODO for every new frame and refuses to publish a
            gallery with them unfilled, so the backlog stops growing while you
            decide about the two hundred already here.
          </p>
        </div>
      </section>
    </main>
  );
}
