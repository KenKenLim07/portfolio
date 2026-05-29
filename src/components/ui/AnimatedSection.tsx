"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import {
  createDirectionalScrollReveal,
  gsap,
  initGsap,
  revealDefaults,
  heroTailExitScroll,
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
  /** Hero / above-fold: reveal on first paint without requiring scroll. */
  revealIfInView?: boolean;
  /** Pin scroll band to this element (e.g. `#home`) instead of the section root. */
  scrollTrigger?: string;
};

export function AnimatedSection({
  children,
  className,
  delay = 0,
  variant = "default",
  start,
  end,
  exitOpacity,
  revealIfInView = false,
  scrollTrigger,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useGsapReducedMotion();
  const resolvedStart =
    start ?? (variant === "tail" ? tailRevealScroll.start : revealDefaults.start);
  const resolvedEnd =
    end ??
    (variant === "tail"
      ? revealIfInView
        ? heroTailExitScroll.end
        : tailRevealScroll.end
      : undefined);
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
          revealIfInView,
          entranceOnly: revealIfInView,
          scrollTrigger,
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
        revealIfInView,
        scrollTrigger,
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
  revealIfInView,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "default" | "tail";
  start?: string;
  end?: string;
  exitOpacity?: number;
  revealIfInView?: boolean;
}) {
  return (
    <AnimatedSection
      className={className}
      delay={delay}
      variant={variant}
      start={start}
      end={end}
      exitOpacity={exitOpacity}
      revealIfInView={revealIfInView}
    >
      {children}
    </AnimatedSection>
  );
}
