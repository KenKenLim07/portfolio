import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "radius-chip inline-flex items-center border border-border bg-subtle px-3 py-1 text-xs font-medium text-foreground transition-[color,background-color,border-color] duration-200 ease-out",
        className,
      )}
    >
      {children}
    </span>
  );
}
