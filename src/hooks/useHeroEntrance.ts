"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Defers hero entrance animations until after hydration so they run on every
 * full page load (Framer Motion + scroll transforms won't fight on first paint).
 */
export function useHeroEntrance() {
  const prefersReducedMotion = useReducedMotion();
  const [ready, setReady] = useState(() => prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [prefersReducedMotion]);

  return { ready, prefersReducedMotion };
}
