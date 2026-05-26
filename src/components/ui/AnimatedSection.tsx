"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { gsap, initGsap, revealDefaults } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

/**
 * Scroll-triggered stagger reveal (GSAP ScrollTrigger).
 * Wrap direct children in <AnimatedItem> for staggered motion.
 */
export function AnimatedSection({
  children,
  className,
  delay = 0,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    initGsap();
    const root = ref.current;
    if (!root || prefersReducedMotion) return;

    const items = root.querySelectorAll<HTMLElement>("[data-gsap-reveal]");
    if (!items.length) return;

    const ctx = gsap.context(() => {
      gsap.set(items, { opacity: 0, y: revealDefaults.y });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: root,
            start: revealDefaults.start,
            toggleActions: revealDefaults.toggleActions,
          },
        })
        .to(items, {
          opacity: 1,
          y: 0,
          duration: revealDefaults.duration,
          ease: revealDefaults.ease,
          stagger: revealDefaults.stagger,
          delay,
        });
    }, root);

    return () => ctx.revert();
  }, [delay, prefersReducedMotion]);

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
