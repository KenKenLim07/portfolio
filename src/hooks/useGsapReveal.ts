"use client";

import { useEffect, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { gsap, initGsap, revealDefaults } from "@/lib/gsap";

export type GsapRevealOptions = {
  delay?: number;
  y?: number;
  duration?: number;
  start?: string;
  toggleActions?: string;
  /** ScrollTrigger trigger element (defaults to the animated element) */
  triggerRef?: RefObject<HTMLElement | null>;
};

/**
 * Tajmirul-style scroll reveal: animates in when scrolling down into view,
 * reverses when scrolling back up (GSAP ScrollTrigger toggleActions).
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

    const trigger = options.triggerRef?.current ?? el;
    const y = options.y ?? revealDefaults.y;
    const duration = options.duration ?? revealDefaults.duration;

    const ctx = gsap.context(() => {
      gsap.set(el, { opacity: 0, y });

      gsap
        .timeline({
          scrollTrigger: {
            trigger,
            start: options.start ?? revealDefaults.start,
            toggleActions:
              options.toggleActions ?? revealDefaults.toggleActions,
          },
        })
        .to(el, {
          opacity: 1,
          y: 0,
          duration,
          ease: revealDefaults.ease,
          delay: options.delay ?? 0,
        });
    }, el);

    return () => ctx.revert();
  }, [
    targetRef,
    options.triggerRef,
    options.delay,
    options.y,
    options.duration,
    options.start,
    options.toggleActions,
    prefersReducedMotion,
  ]);
}
