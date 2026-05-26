"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { createDirectionalScrollReveal, initGsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** ScrollTrigger start position (default: top 85%) */
  start?: string;
};

/**
 * Scroll-triggered stagger reveal (GSAP ScrollTrigger).
 * Wrap direct children in <AnimatedItem> for staggered motion.
 */
export function AnimatedSection({
  children,
  className,
  delay = 0,
  start,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    initGsap();
    const root = ref.current;
    if (!root || prefersReducedMotion) return;

    const items = root.querySelectorAll<HTMLElement>("[data-gsap-reveal]");
    if (!items.length) return;

    const trigger = createDirectionalScrollReveal(root, items, { delay, start });

    return () => trigger.kill();
  }, [delay, start, prefersReducedMotion]);

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
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <AnimatedSection className={className} delay={delay}>
      {children}
    </AnimatedSection>
  );
}
