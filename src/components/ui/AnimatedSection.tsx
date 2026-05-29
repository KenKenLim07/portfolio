"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "framer-motion";
import {
  createDirectionalScrollReveal,
  gsap,
  initGsap,
  revealDefaults,
  tailRevealScroll,
} from "@/lib/gsap";
import { cn } from "@/lib/utils";

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "default" | "tail";
  start?: string;
  end?: string;
  exitOpacity?: number;
};

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

  useGSAP(
    () => {
      initGsap();
      const root = ref.current;
      if (!root || prefersReducedMotion) return;

      const ctx = gsap.context(() => {
        const items = root.querySelectorAll<HTMLElement>("[data-gsap-reveal]");
        if (!items.length) return;

        createDirectionalScrollReveal(root, items, {
          delay,
          start: resolvedStart,
          end: resolvedEnd,
          exitOpacity: resolvedExitOpacity,
        });
      }, root);

      return () => ctx.revert();
    },
    {
      scope: ref,
      dependencies: [
        delay,
        resolvedStart,
        resolvedEnd,
        resolvedExitOpacity,
        prefersReducedMotion,
      ],
      revertOnUpdate: true,
    },
  );

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
