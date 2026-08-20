"use client";

import { useId, useRef, useState } from "react";

import { venues } from "@content/venues";

/**
 * PROTOTYPE — a native enquiry form, built to answer one question: what would
 * we gain by replacing the Monday.com embed?
 *
 * It collects exactly the fields the live Monday form collects, in the same
 * order, so this is a like-for-like comparison and not a redesign smuggled in
 * as a decision.
 *
 * It is NOT CONNECTED and must not be. Submitting shows a stub. Wiring it for
 * real needs a provider (Resend, Postmark) or the Monday API, plus a key in
 * Vercel's environment variables and a server route to hold it — none of which
 * belongs in a prototype whose job is to be looked at.
 *
 * What it demonstrates that the embed cannot: our own typography on our own
 * dark ground, inline validation in our voice, a real focus order,
 * required-field semantics a screen reader can use, and no third-party
 * JavaScript at all.
 */

type Errors = Partial<Record<string, string>>;

const BUDGETS = [
  "Not sure yet",
  "Up to 10,000 EUR",
  "10,000 - 25,000 EUR",
  "25,000 - 50,000 EUR",
  "Over 50,000 EUR",
];

export function NativeEnquiryForm() {
  const uid = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const field = (name: string) => `${uid}-${name}`;

  function validate(data: FormData): Errors {
    const next: Errors = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const guests = String(data.get("guests") ?? "").trim();

    if (!name) next.name = "Please tell us your name.";
    if (!email) next.email = "We need an email address to reply to.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      next.email = "That email address looks incomplete.";
    }
    if (!phone) next.phone = "A phone number helps us reach you quickly.";
    if (guests && !/^\d{1,4}$/.test(guests)) next.guests = "Please give a number of guests.";
    return next;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const found = validate(data);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      /* Move the reader to the summary, then let them jump to the first field. */
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="border border-hair bg-graphite p-8 lg:p-10">
        <p className="eyebrow text-faint">Prototype — not connected</p>
        <h3 className="mt-5 font-display text-[1.75rem] font-light leading-tight text-bone">
          This is where the confirmation would go.
        </h3>
        <p className="mt-4 max-w-md leading-relaxed text-bone/85">
          Nothing was sent and nothing was stored. A wired version would confirm
          the enquiry, name the venue it was about, and say when to expect a reply.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-8 border border-hair/35 px-6 py-3 text-[0.6875rem] uppercase tracking-[0.18em] text-bone transition-colors duration-500 hover:bg-bone hover:text-ink"
        >
          Back to the form
        </button>
      </div>
    );
  }

  const invalid = (k: string) =>
    errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${field(k)}-error` } : {};

  const inputClass =
    "mt-3 w-full border border-hair bg-ink px-4 py-3 text-bone outline-none transition-colors " +
    "placeholder:text-faint focus-visible:border-bone";

  return (
    <form noValidate onSubmit={onSubmit} className="border border-hair bg-graphite p-8 lg:p-10">
      <p className="eyebrow text-faint">Prototype — not connected</p>

      {Object.keys(errors).length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="mt-6 border border-hair bg-ink p-5 outline-none"
        >
          <p className="text-bone">
            Please check {Object.keys(errors).length} field
            {Object.keys(errors).length > 1 ? "s" : ""} below.
          </p>
          <ul className="mt-3 space-y-1">
            {Object.entries(errors).map(([k, message]) => (
              <li key={k}>
                <a
                  href={`#${field(k)}`}
                  className="text-bone/85 underline underline-offset-4 hover:text-bone"
                >
                  {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <label htmlFor={field("name")} className="block sm:col-span-2">
          <span className="eyebrow text-muted">Name (required)</span>
          <input
            id={field("name")}
            name="name"
            autoComplete="name"
            className={inputClass}
            {...invalid("name")}
          />
          {errors.name && (
            <span id={`${field("name")}-error`} className="mt-2 block text-sm text-bone/85">
              {errors.name}
            </span>
          )}
        </label>

        <label htmlFor={field("email")} className="block">
          <span className="eyebrow text-muted">Email (required)</span>
          <input
            id={field("email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className={inputClass}
            {...invalid("email")}
          />
          {errors.email && (
            <span id={`${field("email")}-error`} className="mt-2 block text-sm text-bone/85">
              {errors.email}
            </span>
          )}
        </label>

        <label htmlFor={field("phone")} className="block">
          <span className="eyebrow text-muted">Phone (required)</span>
          <input
            id={field("phone")}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={inputClass}
            {...invalid("phone")}
          />
          {errors.phone && (
            <span id={`${field("phone")}-error`} className="mt-2 block text-sm text-bone/85">
              {errors.phone}
            </span>
          )}
        </label>

        <label htmlFor={field("guests")} className="block">
          <span className="eyebrow text-muted">Estimated guests</span>
          <input
            id={field("guests")}
            name="guests"
            inputMode="numeric"
            placeholder="e.g. 80"
            className={inputClass}
            {...invalid("guests")}
          />
          {errors.guests && (
            <span id={`${field("guests")}-error`} className="mt-2 block text-sm text-bone/85">
              {errors.guests}
            </span>
          )}
        </label>

        <label htmlFor={field("date")} className="block">
          <span className="eyebrow text-muted">Looking at</span>
          <input id={field("date")} name="date" type="date" className={inputClass} />
        </label>

        <label htmlFor={field("budget")} className="block">
          <span className="eyebrow text-muted">Budget</span>
          <select id={field("budget")} name="budget" className={inputClass} defaultValue="">
            <option value="" disabled>
              Select a range
            </option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>

        {/*
          Not on the Monday form, and the one addition worth arguing for: it can
          pre-fill from the venue page a visitor arrived from, so an enquiry
          lands already attached to a venue.
        */}
        <label htmlFor={field("venue")} className="block">
          <span className="eyebrow text-muted">Venue</span>
          <select id={field("venue")} name="venue" className={inputClass} defaultValue="">
            <option value="">Not sure yet</option>
            {venues.map((v) => (
              <option key={v.slug} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor={field("message")} className="block sm:col-span-2">
          <span className="eyebrow text-muted">Anything else</span>
          <textarea id={field("message")} name="message" rows={5} className={inputClass} />
        </label>
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-6">
        <button
          type="submit"
          className="border border-bone bg-bone px-8 py-4 text-[0.6875rem] uppercase tracking-[0.18em] text-ink transition-opacity duration-500 hover:opacity-85"
        >
          Send enquiry
        </button>
        <p className="text-sm text-faint">Nothing is sent — this is a prototype.</p>
      </div>
    </form>
  );
}
