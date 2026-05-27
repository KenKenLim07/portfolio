"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import {
  createDirectionalScrollReveal,
  initGsap,
  revealDefaults,
  tailRevealScroll,
} from "@/lib/gsap";
import { cn } from "@/lib/utils";

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /**
   * `tail` uses a wider scroll band so enter/exit aren’t pinned to the viewport edge.
   * Override with explicit `start` / `end` when needed.
   */
  variant?: "default" | "tail";
  /** ScrollTrigger start position (default: top 85%, or tail preset) */
  start?: string;
  /** ScrollTrigger end position (controls when exit happens) */
  end?: string;
  /** Exit opacity target for leave/leaveBack. */
  exitOpacity?: number;
};

/**
 * Scroll-triggered stagger reveal (GSAP ScrollTrigger).
 * Wrap direct children in <AnimatedItem> for staggered motion.
 */
export function AnimatedSection({
  children,
  className,
  delay = 0,
  variant = "default",
  start,
  end,
  exitOpacity,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const resolvedStart =
    start ?? (variant === "tail" ? tailRevealScroll.start : revealDefaults.start);
  const resolvedEnd =
    end ?? (variant === "tail" ? tailRevealScroll.end : undefined);
  const resolvedExitOpacity = exitOpacity ?? (variant === "tail" ? 0.2 : 0);

  useEffect(() => {
    initGsap();
    const root = ref.current;
    if (!root || prefersReducedMotion) return;

    const items = root.querySelectorAll<HTMLElement>("[data-gsap-reveal]");
    if (!items.length) return;

    const trigger = createDirectionalScrollReveal(root, items, {
      delay,
      start: resolvedStart,
      end: resolvedEnd,
      exitOpacity: resolvedExitOpacity,
    });

    return () => trigger.kill();
  }, [delay, resolvedStart, resolvedEnd, resolvedExitOpacity, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
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

/** Same as AnimatedSection — stagger children marked with AnimatedItem */
export function AnimatedStagger({
  children,
  className,
  delay = 0,
  variant,
  start,
  end,
  exitOpacity,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "default" | "tail";
  start?: string;
  end?: string;
  exitOpacity?: number;
}) {
  return (
    <AnimatedSection
      className={className}
      delay={delay}
      variant={variant}
      start={start}
      end={end}
      exitOpacity={exitOpacity}
    >
      {children}
    </AnimatedSection>
  );
}
