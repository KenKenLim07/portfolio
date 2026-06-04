import { cn } from "@/lib/utils";

/** Marks a block for the parent section’s staggered scrub timeline. */
export function AnimatedItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-gsap-reveal className={cn("gsap-reveal", className)}>
      {children}
    </div>
  );
}
