"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

const DEFAULT_MARGIN = "80px 0px" as const;

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
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );

  useEffect(() => {
    const onVisibility = () => {
      setTabVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const shouldAnimate = Boolean(inView && tabVisible && !prefersReducedMotion);

  return { ref, shouldAnimate, prefersReducedMotion };
}
