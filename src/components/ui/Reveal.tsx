"use client";

import { AnimatedItem } from "@/components/ui/AnimatedSection";
import { cn } from "@/lib/utils";

/**
 * Scroll reveal on desktop only (lg+). Mobile uses a plain wrapper so GSAP
 * opacity tricks cannot flash the hero when the viewport jumps.
 */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <div className={cn(className, "lg:hidden")}>{children}</div>
      <AnimatedItem className={cn(className, "hidden lg:block")}>
        {children}
      </AnimatedItem>
    </>
  );
}
