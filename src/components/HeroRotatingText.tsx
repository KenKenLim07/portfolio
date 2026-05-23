"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const roles = [
  "AI Systems Engineer",
  "Fullstack Developer",
  "Premium Web Architect",
  "Product-minded Engineer",
] as const;

export function HeroRotatingText() {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const longestRole = useMemo(
    () => roles.reduce((a, b) => (a.length >= b.length ? a : b)),
    [],
  );

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % roles.length);
    }, 3800);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted sm:tracking-[0.25em]">
        {roles[0]}
      </span>
    );
  }

  return (
    <span className="inline-grid max-w-[min(100%,20rem)] text-xs font-medium uppercase tracking-[0.18em] text-muted sm:max-w-none sm:tracking-[0.25em]">
      {/* Sizer — reserves width/height for the longest label (fixes mobile clipping) */}
      <span
        className="invisible col-start-1 row-start-1 whitespace-nowrap leading-none"
        aria-hidden
      >
        {longestRole}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={roles[index]}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="col-start-1 row-start-1 whitespace-nowrap leading-none"
        >
          {roles[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
