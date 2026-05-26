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
        "radius-chip inline-flex items-center border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors duration-200",
        className,
      )}
    >
      {children}
    </span>
  );
}
