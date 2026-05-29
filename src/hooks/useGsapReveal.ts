"use client";

import { type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import {
  bindSectionScrollScrub,
  gsap,
  initGsap,
  queryRevealItems,
  ScrollTrigger,
  sectionScrollReveal,
} from "@/lib/gsap";

export type GsapRevealOptions = {
  y?: number;
  stagger?: number;
  exitOpacity?: number;
};

/**
 * Attaches scrubbed section-style reveal to the nearest `<section>` ancestor.
 * Prefer `Section` + `AnimatedItem` on the home page.
 */
export function useGsapReveal(
  targetRef: RefObject<HTMLElement | null>,
  options: GsapRevealOptions = {},
) {
  const prefersReducedMotion = useGsapReducedMotion();

  useGSAP(
    () => {
      const el = targetRef.current;
      if (!el || prefersReducedMotion) return;

      const section = el.closest("section");
      if (!section) return;

      initGsap();

      const items = queryRevealItems(section);
      if (!items.length) return;

      const config = {
        ...sectionScrollReveal,
        ...(options.y !== undefined ? { y: options.y } : {}),
        ...(options.stagger !== undefined ? { stagger: options.stagger } : {}),
        ...(options.exitOpacity !== undefined
          ? { exitOpacity: options.exitOpacity }
          : {}),
      };

      const ctx = gsap.context(() => {
        bindSectionScrollScrub(section, items, config);
      }, section);

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => ctx.revert();
    },
    {
      scope: targetRef,
      dependencies: [
        options.y,
        options.stagger,
        options.exitOpacity,
        prefersReducedMotion,
      ],
      revertOnUpdate: true,
    },
  );
}
