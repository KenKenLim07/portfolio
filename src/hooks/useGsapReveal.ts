"use client";

import { useEffect, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { createDirectionalScrollReveal, initGsap } from "@/lib/gsap";

export type GsapRevealOptions = {
  delay?: number;
  y?: number;
  duration?: number;
  start?: string;
  /** ScrollTrigger trigger element (defaults to the animated element) */
  triggerRef?: RefObject<HTMLElement | null>;
};

/**
 * Direction-aware scroll reveal for a single element (e.g. project cards).
 */
export function useGsapReveal(
  targetRef: RefObject<HTMLElement | null>,
  options: GsapRevealOptions = {},
) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    initGsap();
    const el = targetRef.current;
    if (!el || prefersReducedMotion) return;

    const triggerEl = options.triggerRef?.current ?? el;

    const trigger = createDirectionalScrollReveal(triggerEl, el, {
      delay: options.delay,
      y: options.y,
      duration: options.duration,
      start: options.start,
    });

    return () => trigger.kill();
  }, [
    targetRef,
    options.triggerRef,
    options.delay,
    options.y,
    options.duration,
    options.start,
    prefersReducedMotion,
  ]);
}
