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
  /** Visual stroke width for better prominence on mobile. */
  strokeWidth?: number;
};

const APEX = { x: 12, yDown: 16, yUp: 8 };
const BURGER = {
  top: { x1: 3, y1: 9, x2: 21, y2: 9 },
  bottom: { x1: 3, y1: 15, x2: 21, y2: 15 },
};
const CHEVRON_DOWN = {
  top: { x1: 3, y1: 10, x2: APEX.x, y2: APEX.yDown },
  bottom: { x1: 21, y1: 10, x2: APEX.x, y2: APEX.yDown },
};
const CHEVRON_UP = {
  top: { x1: 3, y1: 14, x2: APEX.x, y2: APEX.yUp },
  bottom: { x1: 21, y1: 14, x2: APEX.x, y2: APEX.yUp },
};

export function ScrollBurgerIcon({
  className,
  disabled = false,
  resetDelayMs = 300,
  strokeWidth = 2.4,
}: ScrollBurgerIconProps) {
  const topRef = useRef<SVGLineElement>(null);
  const bottomRef = useRef<SVGLineElement>(null);
  const lastYRef = useRef(0);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    initGsap();
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!top || !bottom) return;

    const setLine = (
      el: SVGLineElement,
      coords: { x1: number; y1: number; x2: number; y2: number },
    ) => {
      el.setAttribute("x1", String(coords.x1));
      el.setAttribute("y1", String(coords.y1));
      el.setAttribute("x2", String(coords.x2));
      el.setAttribute("y2", String(coords.y2));
    };

    setLine(top, BURGER.top);
    setLine(bottom, BURGER.bottom);
    lastYRef.current = window.scrollY;

    const tweenLine = (
      el: SVGLineElement,
      coords: { x1: number; y1: number; x2: number; y2: number },
      duration: number,
    ) =>
      gsap.to(el, {
        attr: coords,
        duration,
        ease: "power3.out",
      });

    const toBurger = () => {
      tweenLine(top, BURGER.top, 0.3);
      tweenLine(bottom, BURGER.bottom, 0.3);
    };

    const toChevron = (direction: "up" | "down") => {
      const shape = direction === "down" ? CHEVRON_DOWN : CHEVRON_UP;
      tweenLine(top, shape.top, 0.22);
      tweenLine(bottom, shape.bottom, 0.22);
    };

    const clearReset = () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    };

    const scheduleReset = () => {
      clearReset();
      resetTimerRef.current = window.setTimeout(toBurger, resetDelayMs);
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
      className={cn("h-7 w-7", className)}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <line ref={topRef} x1={BURGER.top.x1} y1={BURGER.top.y1} x2={BURGER.top.x2} y2={BURGER.top.y2} />
      <line
        ref={bottomRef}
        x1={BURGER.bottom.x1}
        y1={BURGER.bottom.y1}
        x2={BURGER.bottom.x2}
        y2={BURGER.bottom.y2}
      />
    </svg>
  );
}
