"use client";

import { type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "framer-motion";
import { createDirectionalScrollReveal, gsap, initGsap } from "@/lib/gsap";

export type GsapRevealOptions = {
  delay?: number;
  y?: number;
  duration?: number;
  start?: string;
  end?: string;
  exitOpacity?: number;
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

  useGSAP(
    () => {
      initGsap();
      const el = targetRef.current;
      if (!el || prefersReducedMotion) return;

      const triggerEl = options.triggerRef?.current ?? el;

      const ctx = gsap.context(() => {
        createDirectionalScrollReveal(triggerEl, el, {
          delay: options.delay,
          y: options.y,
          duration: options.duration,
          start: options.start,
          end: options.end,
          exitOpacity: options.exitOpacity,
        });
      }, el);

      return () => ctx.revert();
    },
    {
      scope: targetRef,
      dependencies: [
        options.delay,
        options.y,
        options.duration,
        options.start,
        options.end,
        options.exitOpacity,
        options.triggerRef,
        prefersReducedMotion,
      ],
      revertOnUpdate: true,
    },
  );
}
