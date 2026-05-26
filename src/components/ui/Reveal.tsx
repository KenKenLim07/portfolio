"use client";

import { useIsLg } from "@/hooks/useIsLg";
import { AnimatedItem } from "@/components/ui/AnimatedSection";
import { cn } from "@/lib/utils";

/** GSAP scroll reveal on desktop only; static on mobile (avoids scroll-jump flashes). */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const isLg = useIsLg();

  if (!isLg) {
    return <div className={className}>{children}</div>;
  }

  return <AnimatedItem className={cn(className)}>{children}</AnimatedItem>;
}
