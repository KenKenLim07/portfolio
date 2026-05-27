"use client";

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
  return <AnimatedItem className={cn(className)}>{children}</AnimatedItem>;
}
