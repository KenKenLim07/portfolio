"use client";

import { type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import {
  bindScrollRevealScrub,
  gsap,
  initGsap,
  layersFromRevealItems,
  ScrollTrigger,
  sectionEnterOnlyBand,
  sectionScrollBand,
} from "@/lib/gsap";

export type SectionScrollRevealOptions = {
  /** Footer / contact: enter on scroll-in, no vacuum exit */
  enterOnly?: boolean;
};

/**
 * One staggered scrub timeline per `<section id="…">`.
 * Collects every `[data-gsap-reveal]` in DOM order under that section.
 */
export function useSectionScrollReveal(
  scopeRef: RefObject<HTMLElement | null>,
  options: SectionScrollRevealOptions = {},
) {
  const prefersReducedMotion = useGsapReducedMotion();
  const { enterOnly = false } = options;

  useGSAP(
    () => {
      initGsap();
      const root = scopeRef.current;
      if (!root || prefersReducedMotion) return;

      const section = root.closest("section[id]");
      if (!section) return;

      const ctx = gsap.context(() => {
        const items = Array.from(
          section.querySelectorAll<HTMLElement>("[data-gsap-reveal]"),
        );
        if (!items.length) return;

        const band = enterOnly ? sectionEnterOnlyBand : sectionScrollBand;

        bindScrollRevealScrub({
          trigger: section,
          layers: layersFromRevealItems(items),
          start: band.start,
          end: band.end,
          enterOnly,
        });
      }, root);

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => ctx.revert();
    },
    {
      scope: scopeRef,
      dependencies: [enterOnly, prefersReducedMotion],
      revertOnUpdate: true,
    },
  );
}
