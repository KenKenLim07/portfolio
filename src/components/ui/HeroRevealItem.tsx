"use client";

import { cn } from "@/lib/utils";

export type HeroRevealGroup = "copy" | "tail" | "cue";

export function HeroRevealItem({
  children,
  className,
  group = "copy",
  intro = false,
}: {
  children: React.ReactNode;
  className?: string;
  group?: HeroRevealGroup;
  /** Bio paragraph — own exit layer so stagger doesn't leave it behind */
  intro?: boolean;
}) {
  return (
    <div
      data-gsap-reveal
      data-hero-group={group}
      {...(intro ? { "data-hero-intro": "" } : {})}
      className={cn("gsap-reveal", className)}
    >
      {children}
    </div>
  );
}
