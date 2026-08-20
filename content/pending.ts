/**
 * Sections that do NOT exist on the live domisignature.com.
 *
 * The brief is explicit: do not fabricate reviews, numbers or FAQ answers.
 * These arrays are therefore intentionally empty. The matching components are
 * built and styled, and render nothing while the arrays are empty — so the
 * moment you send real content, the sections appear with no further work.
 *
 * See CONTENT-NEEDED.md for exactly what to send.
 */

export interface Testimonial {
  quote: string;
  author: string;
  /** e.g. "Mountain Escape, June 2025" */
  context?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Stat {
  value: string;
  label: string;
}

/** Awaiting real client quotes — never invent these. */
export const testimonials: Testimonial[] = [];

/** Awaiting real answers, particularly on the legal-wedding paperwork. */
export const faqs: FaqItem[] = [];

/** Awaiting verified figures (weddings planned, years active, nationalities hosted…). */
export const stats: Stat[] = [];
