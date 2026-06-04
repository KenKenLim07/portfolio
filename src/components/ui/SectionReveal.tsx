"use client";

import { useRef } from "react";
import {
  useSectionScrollReveal,
  type SectionScrollRevealOptions,
} from "@/hooks/useSectionScrollReveal";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { cn } from "@/lib/utils";

type SectionRevealProps = SectionScrollRevealOptions & {
  children: React.ReactNode;
  className?: string;
};

/** Staggered scrub enter/exit for all `AnimatedItem`s in the parent section. */
export function SectionReveal({
  children,
  className,
  enterOnly,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useGsapReducedMotion();

  useSectionScrollReveal(ref, { enterOnly });

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
