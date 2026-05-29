"use client";

import { cn } from "@/lib/utils";

export type HeroRevealGroup = "copy" | "tail" | "cue";

export function HeroRevealItem({
  children,
  className,
  group = "copy",
}: {
  children: React.ReactNode;
  className?: string;
  group?: HeroRevealGroup;
}) {
  return (
    <div
      data-gsap-reveal
      data-hero-group={group}
      className={cn("gsap-reveal", className)}
    >
      {children}
    </div>
  );
}
