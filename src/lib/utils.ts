import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "01", "02", … — used for the numbered editorial indices. */
export const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * A small count as an English word, for headings that count something.
 *
 * "The other three" was typed into the venue page when there were four venues.
 * Villa Aetos was withdrawn, the heading stayed, and every venue page then
 * announced three sibling venues above a grid holding two. No audit could see
 * it: the claims audit checks figures, and this was a word.
 *
 * So the count derives, like every other figure on this site. Falls back to the
 * numeral above ten, which no realistic collection will reach.
 */
const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five",
  "six", "seven", "eight", "nine", "ten",
];
export const countWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

/**
 * Presents the live site's "How many people can fit: up to 300" as a label.
 * The stored string stays verbatim; only the presentation is tidied.
 *
 * A single figure keeps its ceiling: "Up to 200 guests".
 *
 * A RANGE drops it. "Up to 200-300" is not English — the range already carries
 * both bounds, and prefixing it implies a ceiling on a number that is itself a
 * ceiling. It reads as "200–300 guests", with a true en dash rather than the
 * hyphen the source copy uses.
 */
export function capacityLabel(capacity: string) {
  const value = capacity.replace(/^How many people can fit:\s*/i, "").trim();
  const range = value.match(/^(?:up to\s*)?(\d+)\s*[-–—]\s*(\d+)$/i);

  if (range) return `${range[1]}–${range[2]} guests`;

  const single = value.match(/^up to\s*(\d+)$/i);
  if (single) return `Up to ${single[1]} guests`;

  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Builds a prefilled WhatsApp deep link. Falls back to the plain number when
 * no message is supplied.
 */
export function whatsappLink(base: string, message?: string) {
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
