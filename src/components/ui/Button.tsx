import Link from "next/link";

import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "ghost";
type Size = "md" | "lg";

/**
 * Buttons are hairline pills or text-plus-a-rule. There are no filled colour
 * buttons anywhere on the site — `solid` is the inverse fill: ink on limestone
 * on paper, bone on night inside a chapter, used once or twice per page at
 * most. Every variant asks for a role, so the same button sits on either ground
 * without a call-site override.
 */
const base =
  "group relative inline-flex items-center justify-center gap-4 font-sans " +
  "text-[0.7rem] font-medium uppercase tracking-[0.2em] " +
  "transition-[color,background-color,border-color] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] " +
  "disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  solid:
    "rounded-full bg-[var(--inverse)] text-[var(--text-on-inverse)] hover:bg-[color-mix(in_srgb,var(--inverse)_85%,transparent)]",
  outline:
    "rounded-full border border-[var(--rule-strong)] text-[var(--text-primary)] hover:border-[var(--text-primary)] hover:bg-[var(--inverse)] hover:text-[var(--text-on-inverse)]",
  ghost: "text-[var(--text-primary)]",
};

const sizes: Record<Size, string> = {
  md: "px-8 py-3.5",
  lg: "px-11 py-5",
};

interface Props {
  children: React.ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  external?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  "aria-label"?: string;
}

export function Button({
  children,
  href,
  variant = "outline",
  size = "md",
  className,
  external,
  type = "button",
  onClick,
  ...rest
}: Props) {
  const classes = cn(base, variants[variant], variant !== "ghost" && sizes[size], className);

  const inner =
    variant === "ghost" ? (
      /* Text plus a rule that fills from the left on hover. */
      <>
        <span>{children}</span>
        <span className="relative block h-px w-14 bg-current opacity-35 sm:w-20">
          <span className="absolute inset-0 origin-left scale-x-0 bg-current transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
        </span>
      </>
    ) : (
      <>
        <span>{children}</span>
        <span
          aria-hidden
          className="transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5"
        >
          &rarr;
        </span>
      </>
    );

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
        {inner}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} {...rest}>
      {inner}
    </button>
  );
}

/** Inline text link with a line-grow underline. */
export function TextLink({
  children,
  href,
  external,
  className,
}: {
  children: React.ReactNode;
  href: string;
  external?: boolean;
  className?: string;
}) {
  const classes = cn(
    "group relative inline-block text-[var(--text-primary)] transition-colors duration-[450ms] hover:text-[var(--text-secondary)]",
    className,
  );

  const content = (
    <>
      {children}
      <span
        aria-hidden
        className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-[var(--rule-strong)] transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:origin-left group-hover:scale-x-100"
      />
    </>
  );

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {content}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
