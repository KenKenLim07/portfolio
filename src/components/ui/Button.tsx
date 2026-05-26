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
    "bg-foreground text-background hover:bg-zinc-200 border border-transparent",
  secondary:
    "bg-white/5 text-foreground border border-white/15 hover:bg-white/10 hover:border-white/25",
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
    "radius-control inline-flex cursor-pointer items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40",
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
