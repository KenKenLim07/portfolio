import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  external?: boolean;
  className?: string;
};

const base =
  "radius-control inline-flex cursor-pointer items-center justify-center gap-2 px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.08em] transition-[color,background-color,border-color,box-shadow,filter,opacity] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30 motion-reduce:transition-none";

const variants = {
  primary:
    "border border-[color:var(--cta-border)] bg-[var(--cta-bg)] text-[var(--cta-fg)] hover:brightness-110 hover:shadow-[0_8px_24px_-8px_var(--overlay)] active:brightness-95",
  secondary:
    "border border-border bg-subtle text-foreground hover:border-[color-mix(in_srgb,var(--accent-from)_40%,var(--border))] hover:bg-[var(--fill-hover)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-from)_22%,transparent)] active:bg-[var(--fill-hover)]",
  ghost:
    "border border-transparent bg-transparent text-muted hover:border-border hover:bg-[var(--fill-subtle)] hover:text-foreground",
};

export function Button({
  href,
  children,
  variant = "primary",
  external,
  className,
}: ButtonProps) {
  const classes = cn(base, variants[variant], className);

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
