"use client";

import { useEffect, useRef } from "react";
import { gsap, initGsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type ScrollBurgerIconProps = {
  className?: string;
  /** Disable scroll morphing (e.g. when menu open). */
  disabled?: boolean;
  /** Reset delay after scroll stops (ms). */
  resetDelayMs?: number;
};

const BURGER_GAP = 4;
const CHEVRON_ANGLE = 56;
const CHEVRON_X = 2.5;
const BURGER_WIDTH = 18;
const BURGER_X = 3;

export function ScrollBurgerIcon({
  className,
  disabled = false,
  resetDelayMs = 300,
}: ScrollBurgerIconProps) {
  const topRef = useRef<SVGRectElement>(null);
  const bottomRef = useRef<SVGRectElement>(null);
  const lastYRef = useRef(0);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    initGsap();
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!top || !bottom) return;

    // To make a real V / ^ (not an X), hinge both lines toward the center:
    // top pivots from the right end, bottom pivots from the left end.
    gsap.set(top, { transformOrigin: "100% 50%" });
    gsap.set(bottom, { transformOrigin: "0% 50%" });
    gsap.set(top, { y: -BURGER_GAP, rotate: 0, x: 0 });
    gsap.set(bottom, { y: BURGER_GAP, rotate: 0, x: 0 });

    lastYRef.current = window.scrollY;

    const toBurger = () => {
      gsap.to([top, bottom], {
        rotate: 0,
        duration: 0.3,
        ease: "power3.out",
      });
      gsap.to(top, { y: -BURGER_GAP, x: 0, duration: 0.3, ease: "power3.out" });
      gsap.to(bottom, { y: BURGER_GAP, x: 0, duration: 0.3, ease: "power3.out" });
    };

    const toChevron = (direction: "up" | "down") => {
      // “V” for down, “^” for up.
      const sign = direction === "down" ? 1 : -1;
      gsap.to(top, {
        rotate: -sign * CHEVRON_ANGLE,
        y: 0,
        x: CHEVRON_X,
        duration: 0.22,
        ease: "power3.out",
      });
      gsap.to(bottom, {
        rotate: sign * CHEVRON_ANGLE,
        y: 0,
        x: -CHEVRON_X,
        duration: 0.22,
        ease: "power3.out",
      });
    };

    const clearReset = () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    };

    const scheduleReset = () => {
      clearReset();
      resetTimerRef.current = window.setTimeout(() => {
        toBurger();
      }, resetDelayMs);
    };

    const onScroll = () => {
      if (disabled) return;
      const nextY = window.scrollY;
      const delta = nextY - lastYRef.current;
      lastYRef.current = nextY;

      if (Math.abs(delta) < 2) {
        scheduleReset();
        return;
      }

      toChevron(delta > 0 ? "down" : "up");
      scheduleReset();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearReset();
    };
  }, [disabled, resetDelayMs]);

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-6 w-6", className)}
      aria-hidden
      fill="currentColor"
    >
      {/* Wider two-line burger (morphs via transforms) */}
      <rect
        ref={topRef}
        x={BURGER_X}
        y={12}
        width={BURGER_WIDTH}
        height={2}
        rx={1}
      />
      <rect
        ref={bottomRef}
        x={BURGER_X}
        y={12}
        width={BURGER_WIDTH}
        height={2}
        rx={1}
      />
    </svg>
  );
}

