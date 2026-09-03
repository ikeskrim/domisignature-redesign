import { cn } from "@/lib/utils";

type Width = "narrow" | "default" | "wide" | "full";

const widths: Record<Width, string> = {
  narrow: "max-w-3xl",
  default: "max-w-[88rem]",
  wide: "max-w-[104rem]",
  full: "max-w-none",
};

export function Container({
  children,
  className,
  width = "default",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  width?: Width;
  as?: React.ElementType;
}) {
  return (
    <Tag className={cn("mx-auto w-full px-gutter", widths[width], className)}>{children}</Tag>
  );
}

/** Vertical rhythm wrapper. Every full-width band on the site uses this. */
export function Section({
  children,
  className,
  id,
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: React.ElementType;
}) {
  return (
    <Tag id={id} className={cn("py-section", className)}>
      {children}
    </Tag>
  );
}
