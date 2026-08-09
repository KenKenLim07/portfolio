import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  external?: boolean;
  className?: string;
};

const variants = {
  primary:
    "bg-[var(--cta-bg)] text-[var(--cta-fg)] border border-[color:var(--cta-border)] hover:opacity-90",
  secondary:
    "bg-subtle text-foreground border border-border hover:bg-[var(--fill-hover)] hover:border-border",
  ghost: "text-muted hover:text-foreground bg-transparent",
};

export function Button({
  href,
  children,
  variant = "primary",
  external,
  className,
}: ButtonProps) {
  const classes = cn(
    "radius-control inline-flex cursor-pointer items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30",
    variants[variant],
    className,
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
