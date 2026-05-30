"use client";

import { cn } from "@/lib/utils";

/**
 * Layout wrapper only — scroll animation is driven by `Section` + `useSectionScrollReveal`
 * (or `useHeroScrollReveal` for the hero). Mark children with `<AnimatedItem>`.
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

/** Bottom block — gets scroll-down “suck up” exit; head/copy use AnimatedItem only */
export function AnimatedTailItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-gsap-reveal
      data-gsap-reveal-tail
      className={cn("gsap-reveal", className)}
    >
      {children}
    </div>
  );
}

/** @deprecated Use a plain `div` + `AnimatedItem` children; section hook handles stagger. */
export function AnimatedStagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
