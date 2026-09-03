import type { Metadata } from "next";

import { NativeEnquiryForm } from "@/components/study/NativeEnquiryForm";
import { MondayForm } from "@/components/contact/MondayForm";

/**
 * STUDY — the enquiry form decision, side by side.
 *
 * Built so the choice takes thirty seconds instead of an argument: the same
 * fields, the same page, the same ground. Left is a native form in our own
 * design language; right is the Monday.com embed exactly as it ships today.
 *
 * Nothing here changes the live site. `/contact` still uses the embed.
 */
export const metadata: Metadata = {
  title: "Study — enquiry form",
  robots: { index: false, follow: false, nocache: true },
};

const NATIVE = [
  ["No third-party JavaScript", "The embed brings its own framework; this brings none."],
  ["Our typography, our ground", "The embed is a white card on a dark site and cannot be themed."],
  ["Validation in our voice", "“We need an email address to reply to”, not a red asterisk."],
  ["Real focus order and ARIA", "Errors are announced, and each links to the field it belongs to."],
  ["Venue pre-fill", "An enquiry can arrive already attached to the venue it came from."],
];

const EMBED = [
  ["Already working", "Submissions land in a board the team already watches."],
  ["No key to hold", "Nothing to store in Vercel, nothing to rotate, nothing to leak."],
  ["Nobody has to build it", "File upload, spam handling and delivery are someone else’s problem."],
  ["Changes without a deploy", "The team can edit fields in Monday; a native form needs a release."],
];

export default function EnquiryStudy() {
  return (
    <main className="bg-ink pb-section pt-32 lg:pt-40">
      <div className="mx-auto w-full max-w-[104rem] px-gutter">
        <p className="eyebrow text-muted">Study — not part of the site</p>
        <h1 className="mt-8 font-display text-[clamp(2.25rem,5vw,4.5rem)] font-light leading-[1.02] text-bone">
          Native form, or the embed?
        </h1>
        <p className="prose-editorial mt-8 max-w-2xl">
          The same fields, twice. Left is a prototype in our own design language;
          right is the Monday.com embed exactly as it ships on{" "}
          <a href="/contact" className="underline underline-offset-4 hover:text-bone">
            /contact
          </a>{" "}
          today. Neither is wired up here — the prototype&rsquo;s submit shows a stub, and
          nothing on this page is sent anywhere.
        </p>

        <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-2 lg:gap-10">
          <section aria-labelledby="native-h">
            <h2 id="native-h" className="font-display text-title font-light text-bone">
              A. Native
            </h2>
            <ul className="mt-7 space-y-3">
              {NATIVE.map(([k, why]) => (
                <li key={k} className="flex gap-4 leading-relaxed text-bone/85">
                  <span aria-hidden className="mt-3 h-px w-4 shrink-0 bg-muted" />
                  <span>
                    <strong className="font-normal text-bone">{k}.</strong> {why}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <NativeEnquiryForm />
            </div>
          </section>

          <section aria-labelledby="embed-h">
            <h2 id="embed-h" className="font-display text-title font-light text-bone">
              B. The Monday embed — what ships today
            </h2>
            <ul className="mt-7 space-y-3">
              {EMBED.map(([k, why]) => (
                <li key={k} className="flex gap-4 leading-relaxed text-bone/85">
                  <span aria-hidden className="mt-3 h-px w-4 shrink-0 bg-muted" />
                  <span>
                    <strong className="font-normal text-bone">{k}.</strong> {why}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <MondayForm />
            </div>
          </section>
        </div>

        <section aria-labelledby="wiring-h" className="mt-24 max-w-3xl border-t border-hair pt-12">
          <h2 id="wiring-h" className="font-display text-title font-light text-bone">
            What choosing A would actually cost
          </h2>
          <div className="prose-editorial mt-7">
            <p>
              A server route to receive the post, and one of two delivery paths: a
              mail provider such as Resend or Postmark, or Monday&rsquo;s own API so
              submissions keep landing on the board the team already watches. Either
              needs a key, and the key belongs in Vercel&rsquo;s environment variables —
              never in this repository.
            </p>
            <p>
              Then the parts the embed currently handles for free: spam protection,
              the file upload, and a record of every enquiry that someone can search
              months later. The second path keeps that record where it already is,
              which is why it is the one I would take.
            </p>
            <p>
              It also changes a habit. Today the team edits the form in Monday
              whenever they want a new field. With a native form that becomes a code
              change and a deploy.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
