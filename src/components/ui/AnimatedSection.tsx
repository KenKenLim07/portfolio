"use client";

import { cn } from "@/lib/utils";

/**
 * Layout/grouping wrapper for staggered children.
 * Scroll animation is handled per-page-section by `Section` + `useSectionScrollReveal`.
 */
export function AnimatedSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

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

export function AnimatedStagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <AnimatedSection className={className}>{children}</AnimatedSection>;
}
