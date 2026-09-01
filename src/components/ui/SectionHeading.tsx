import { cn } from "@/lib/utils";
import { Reveal, RuleDraw, TextReveal } from "@/components/motion/Reveal";

/**
 * The standard section opener: numbered eyebrow, hairline, display heading,
 * optional standfirst. Used on every page so the rhythm stays identical.
 */
export function SectionHeading({
  eyebrow,
  heading,
  standfirst,
  align = "left",
  className,
  as = "h2",
  size = "title",
}: {
  eyebrow?: string;
  heading: string;
  standfirst?: string;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2" | "h3";
  size?: "display" | "title" | "heading";
}) {
  const sizes = {
    display: "text-display",
    title: "text-title",
    heading: "text-heading",
  } as const;

  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow && (
        <Reveal>
          <div
            className={cn(
              "flex items-center gap-5 text-muted",
              align === "center" && "justify-center",
            )}
          >
            <span className="eyebrow">{eyebrow}</span>
            <RuleDraw className={cn("w-16", align === "center" && "hidden")} />
          </div>
        </Reveal>
      )}

      <TextReveal
        as={as}
        text={heading}
        className={cn(sizes[size], "mt-6 text-bone")}
      />

      {standfirst && (
        <Reveal delay={0.12}>
          <p
            className={cn(
              "mt-7 max-w-2xl text-lead leading-relaxed text-muted",
              align === "center" && "mx-auto",
            )}
          >
            {standfirst}
          </p>
        </Reveal>
      )}
    </div>
  );
}
