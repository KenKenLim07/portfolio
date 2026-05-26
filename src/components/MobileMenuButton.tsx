"use client";

import { cn } from "@/lib/utils";

type MobileMenuButtonProps = {
  open: boolean;
  /** Degrees — driven by scroll for a circling effect */
  scrollRotation?: number;
  className?: string;
};

/**
 * Two-line burger (thick bars). Rotates while scrolling; morphs to X when open.
 */
export function MobileMenuButton({
  open,
  scrollRotation = 0,
  className,
}: MobileMenuButtonProps) {
  const closedTransform = `rotate(${scrollRotation}deg)`;

  return (
    <span
      className={cn(
        "relative inline-flex h-7 w-9 items-center justify-center",
        className,
      )}
      aria-hidden
    >
      <span
        className={cn(
          "absolute left-0 block h-[3.5px] w-9 origin-center rounded-full bg-current transition-[transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open && "top-1/2 -translate-y-1/2 rotate-45",
        )}
        style={
          !open ? { transform: `translateY(-6px) ${closedTransform}` } : undefined
        }
      />
      <span
        className={cn(
          "absolute left-0 block h-[3.5px] w-9 origin-center rounded-full bg-current transition-[transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open && "top-1/2 -translate-y-1/2 -rotate-45",
        )}
        style={!open ? { transform: `translateY(6px) ${closedTransform}` } : undefined}
      />
    </span>
  );
}
