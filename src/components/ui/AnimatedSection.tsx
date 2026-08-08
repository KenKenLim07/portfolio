"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import {
  createDirectionalScrollReveal,
  gsap,
  initGsap,
  lastSectionReveal,
  resolveTailScrollBand,
  revealDefaults,
  tailMotion,
} from "@/lib/gsap";
import { cn } from "@/lib/utils";

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "default" | "tail" | "last";
  start?: string;
  end?: string;
  exitOpacity?: number;
  /** Hero / above-fold: reveal on first paint without requiring scroll. */
  revealIfInView?: boolean;
  /** Pin scroll band to this element (e.g. `#home`) instead of the section root. */
  scrollTrigger?: string;
  /** Scroll exit (onLeave). Ignored when variant is `last`. */
  exit?: boolean;
  /** Optional motion overrides. */
  y?: number;
  duration?: number;
  stagger?: number;
};

export function AnimatedSection({
  children,
  className,
  delay,
  variant = "default",
  start,
  end,
  exitOpacity,
  revealIfInView = false,
  scrollTrigger,
  exit = true,
  y: motionY,
  duration: motionDuration,
  stagger: motionStagger,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useGsapReducedMotion();

  useGSAP(
    () => {
      initGsap();
      const root = ref.current;
      if (!root || prefersReducedMotion) return;

      const ctx = gsap.context(() => {
        const items = root.querySelectorAll<HTMLElement>("[data-gsap-reveal]");
        if (!items.length) return;

        const isLast = variant === "last";

        const tailBand =
          variant === "tail" && !revealIfInView
            ? resolveTailScrollBand(root, { scrollTrigger, start, end })
            : null;

        const resolvedStart =
          start ??
          (isLast
            ? lastSectionReveal.start
            : tailBand
              ? tailBand.start
              : revealDefaults.start);
        const resolvedEnd = isLast
          ? (end ?? lastSectionReveal.end)
          : tailBand
            ? (end ?? tailBand.end)
            : (end ?? (exit ? revealDefaults.end : undefined));
        const resolvedScrollTrigger =
          scrollTrigger ?? tailBand?.scrollTrigger;
        const resolvedExitOpacity =
          exitOpacity ?? (variant === "tail" ? tailMotion.exitOpacity : 0);

        const useTailExit =
          isLast || (variant === "tail" && !revealIfInView);

        createDirectionalScrollReveal(root, items, {
          delay:
            delay ??
            (isLast
              ? lastSectionReveal.delay
              : variant === "tail" && !revealIfInView
                ? tailMotion.delay
                : revealDefaults.delay),
          start: resolvedStart,
          end: resolvedEnd,
          exitOpacity: resolvedExitOpacity,
          revealIfInView,
          entranceOnly: revealIfInView,
          disableExit: isLast || !exit,
          scrollTrigger: resolvedScrollTrigger,
          exitDurationFactor: useTailExit
            ? tailMotion.exitDurationFactor
            : undefined,
          y:
            motionY ??
            (isLast
              ? lastSectionReveal.y
              : variant === "tail" && !revealIfInView
                ? tailMotion.y
                : undefined),
          duration:
            motionDuration ??
            (isLast
              ? lastSectionReveal.duration
              : variant === "tail" && !revealIfInView
                ? tailMotion.duration
                : undefined),
          stagger:
            motionStagger ??
            (isLast
              ? lastSectionReveal.stagger
              : variant === "tail" && !revealIfInView
                ? tailMotion.stagger
                : undefined),
        });
      }, root);

      return () => ctx.revert();
    },
    {
      scope: ref,
      dependencies: [
        delay,
        start,
        end,
        exitOpacity,
        scrollTrigger,
        revealIfInView,
        variant,
        exit,
        motionY,
        motionDuration,
        motionStagger,
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
  delay,
  variant,
  start,
  end,
  exitOpacity,
  revealIfInView,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "default" | "tail" | "last";
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
