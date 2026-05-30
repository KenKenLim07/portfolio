"use client";

import { type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { createDirectionalScrollReveal, gsap, initGsap } from "@/lib/gsap";

export type GsapRevealOptions = {
  delay?: number;
  y?: number;
  duration?: number;
  start?: string;
  end?: string;
  exitOpacity?: number;
  revealIfInView?: boolean;
  triggerRef?: RefObject<HTMLElement | null>;
};

export function useGsapReveal(
  targetRef: RefObject<HTMLElement | null>,
  options: GsapRevealOptions = {},
) {
  const prefersReducedMotion = useGsapReducedMotion();

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
          revealIfInView: options.revealIfInView,
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
        options.revealIfInView,
        options.triggerRef,
        prefersReducedMotion,
      ],
      revertOnUpdate: true,
    },
  );
}
