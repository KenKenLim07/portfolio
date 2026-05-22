"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const roles = [
  "AI Systems Engineer",
  "Fullstack Developer",
  "Premium Web Architect",
  "Product-minded Engineer",
];

export function HeroRotatingText() {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % roles.length);
    }, 3200);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
        {roles[0]}
      </span>
    );
  }

  return (
    <span className="relative inline-flex h-4 min-w-[180px] overflow-hidden text-xs font-medium uppercase tracking-[0.2em] text-muted sm:min-w-[220px] sm:tracking-[0.25em]">
      <AnimatePresence mode="wait">
        <motion.span
          key={roles[index]}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 whitespace-nowrap"
        >
          {roles[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
