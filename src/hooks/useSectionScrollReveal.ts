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
} from "@/lib/gsap";

type UseSectionScrollRevealOptions = {
  enabled?: boolean;
};

/**
 * One scrubbed ScrollTrigger per section — all `[data-gsap-reveal]` children
 * enter, hold, and exit together (same model as the hero).
 */
export function useSectionScrollReveal(
  sectionRef: RefObject<HTMLElement | null>,
  options: UseSectionScrollRevealOptions = {},
) {
  const prefersReducedMotion = useGsapReducedMotion();
  const enabled = options.enabled !== false;

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || prefersReducedMotion || !enabled) return;

      initGsap();
      const items = queryRevealItems(section);
      if (!items.length) return;

      const ctx = gsap.context(() => {
        bindSectionScrollScrub(section, items);
      }, section);

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => ctx.revert();
    },
    {
      scope: sectionRef,
      dependencies: [prefersReducedMotion, enabled],
      revertOnUpdate: true,
    },
  );
}
