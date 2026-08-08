"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";

const DEFAULT_MARGIN = "160px 0px" as const;

/**
 * Drive infinite marquees only while near the viewport.
 * Stops Framer animations off-screen to cut mobile main-thread / compositor work.
 */
export function useMarqueeInView(
  margin: typeof DEFAULT_MARGIN = DEFAULT_MARGIN,
) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const inView = useInView(ref, { margin, amount: 0 });
  const shouldAnimate = Boolean(inView && !prefersReducedMotion);

  return { ref, shouldAnimate, prefersReducedMotion };
}
