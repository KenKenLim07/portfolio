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

/** Marks a block as tail — scroll-down exit with other tail lines (synced) */
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

/** Wrap bottom content — all nested `[data-gsap-reveal]` share tail exit */
export function AnimatedTailZone({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-gsap-reveal-tail-zone className={className}>
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
