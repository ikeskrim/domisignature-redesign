import { cn } from "@/lib/utils";

/**
 * A plate — a photograph laid on paper.
 *
 * The one definition of the sourcebook plate, taken from the venues-index
 * study the inversion plan named its north star: the photograph inside a mat
 * of the raised surface, a hairline frame at the mat's edge, and — when there
 * is one — a caption set beneath it on the page, never over the picture. Every
 * surface that shows a photograph as an object on paper uses this, so the site
 * has one plate rather than one per scene (the rule Chapter set for boundaries).
 *
 * The mat is what stops the image edge dissolving into the ground: a pale-sky
 * frame on ivory has no edge of its own, and the reviewers found exactly those
 * frames "floating". The hairline is --rule: decorative, because the mat's
 * tonal step already separates plate from page.
 *
 * Captions are apparatus only — a label the content already has (a title, a
 * venue name, a category) and a plate number derived from position. No new
 * sentence is written for a caption; copy is frozen.
 *
 * The photograph is passed in as children so each surface keeps its own
 * <Image> — sizes, priority, loading and the grade are the caller's.
 *
 * `as="span"` builds the same plate out of spans (set to block), for a plate
 * inside a <button>: a button may hold phrasing content only, and the gallery
 * tiles are buttons.
 *
 * `lift` is for a plate that is (or sits inside) something to activate: on a
 * fine pointer's hover, or while its row holds keyboard focus, the plate rises
 * a few pixels and a soft shadow appears beneath it — a shadow only while it
 * is lifted, never at rest (stage 6, `.plate-lift` in globals.css). The
 * shadow lives on the plate, never on the focused element, so it cannot
 * replace the focus halo. Its row is the nearest `.group` ancestor.
 */
export function Plate({
  children,
  caption,
  number,
  as = "figure",
  lift = false,
  className,
  frameClassName,
}: {
  children: React.ReactNode;
  /** The label beneath the plate. Existing content only. */
  caption?: React.ReactNode;
  /** Plate number, derived from position — rendered as 01, 02 … */
  number?: number;
  as?: "figure" | "div" | "span";
  /** Lifts on hover or row focus, with a shadow only while lifted. */
  lift?: boolean;
  className?: string;
  /** Classes for the image frame (aspect ratio, overflow). */
  frameClassName?: string;
}) {
  const Tag = as;
  const inline = as === "span";
  const Part = inline ? "span" : "div";
  const Caption = as === "figure" ? "figcaption" : Part;
  return (
    <Tag
      className={cn(
        inline && "block",
        "border border-[var(--rule)] bg-[var(--surface-raised)] p-3 sm:p-4 lg:p-5",
        lift && "plate-lift",
        className,
      )}
    >
      <Part className={cn(inline && "block", "relative overflow-hidden", frameClassName)}>{children}</Part>
      {(caption || number !== undefined) && (
        <Caption className="mt-3 flex items-baseline justify-between gap-6 lg:mt-4">
          <span className="eyebrow">{caption}</span>
          {number !== undefined && (
            <span aria-hidden className="eyebrow tabular-nums">
              {String(number).padStart(2, "0")}
            </span>
          )}
        </Caption>
      )}
    </Tag>
  );
}
