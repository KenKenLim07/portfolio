"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { gsap, initGsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type ScrollBurgerIconProps = {
  className?: string;
  /** When true, scroll chevron morph is paused (menu open / vortex active). */
  disabled?: boolean;
  resetDelayMs?: number;
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

/**
 * Burger / scroll-chevron + close X.
 * Blackhole visuals live in Navbar layers (disk under content, core above).
 */
export function ScrollBurgerIcon({
  className,
  disabled = false,
  resetDelayMs = 300,
  strokeWidth = 2.4,
}: ScrollBurgerIconProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const topRef = useRef<SVGLineElement>(null);
  const bottomRef = useRef<SVGLineElement>(null);
  const lastYRef = useRef(0);
  const resetTimerRef = useRef<number | null>(null);
  const prefersReducedMotion = useGsapReducedMotion();

  useGSAP(
    (_, contextSafe) => {
      initGsap();
      const top = topRef.current;
      const bottom = bottomRef.current;
      if (!top || !bottom || disabled || prefersReducedMotion) return;

      const safe = contextSafe ?? ((fn: () => void) => fn);

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
          overwrite: "auto",
        });

      const toBurger = safe(() => {
        tweenLine(top, BURGER.top, 0.3);
        tweenLine(bottom, BURGER.bottom, 0.3);
      });

      const toChevron = (direction: "up" | "down") => {
        const shape = direction === "down" ? CHEVRON_DOWN : CHEVRON_UP;
        tweenLine(top, shape.top, 0.22);
        tweenLine(bottom, shape.bottom, 0.22);
      };

      const clearReset = () => {
        if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      };

      const scheduleReset = safe(() => {
        clearReset();
        resetTimerRef.current = window.setTimeout(toBurger, resetDelayMs);
      });

      const onScroll = safe(() => {
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
      });

      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        clearReset();
      };
    },
    {
      scope: rootRef,
      dependencies: [disabled, resetDelayMs, prefersReducedMotion],
      revertOnUpdate: true,
    },
  );

  return (
    <span
      ref={rootRef}
      className={cn("menu-trigger-icon relative inline-flex h-7 w-7", className)}
      data-menu-trigger-icon
    >
      <svg
        viewBox="0 0 24 24"
        className="relative z-[1] h-full w-full"
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        data-burger-lines
      >
        <line
          ref={topRef}
          data-burger-line="top"
          x1={BURGER.top.x1}
          y1={BURGER.top.y1}
          x2={BURGER.top.x2}
          y2={BURGER.top.y2}
        />
        <line
          ref={bottomRef}
          data-burger-line="bottom"
          x1={BURGER.bottom.x1}
          y1={BURGER.bottom.y1}
          x2={BURGER.bottom.x2}
          y2={BURGER.bottom.y2}
        />
      </svg>

      <svg
        viewBox="0 0 24 24"
        className="menu-trigger-close"
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        data-burger-close
      >
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
    </span>
  );
}

/** Accretion disk layer — sits UNDER flying menu content. */
export function MenuBlackholeDisk({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("menu-trigger-vortex menu-trigger-vortex--disk", className)}
      data-burger-vortex-disk
      aria-hidden
    >
      <span className="menu-trigger-vortex__corona" />
      <span className="menu-trigger-vortex__glow" />
      <span data-vortex-ring className="menu-trigger-vortex__disk" />
      <span
        data-vortex-ring
        className="menu-trigger-vortex__disk menu-trigger-vortex__disk--inner"
      />
      <span
        data-vortex-ring
        className="menu-trigger-vortex__ring menu-trigger-vortex__ring--a"
      />
      <span
        data-vortex-ring
        className="menu-trigger-vortex__ring menu-trigger-vortex__ring--b"
      />
    </div>
  );
}

/** Event-horizon core — sits ABOVE flying menu content so items enter the void. */
export function MenuBlackholeCore({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("menu-trigger-vortex menu-trigger-vortex--core", className)}
      data-burger-vortex-core
      aria-hidden
    >
      <span className="menu-trigger-vortex__photon" />
      <span data-vortex-core className="menu-trigger-vortex__core" />
    </div>
  );
}
