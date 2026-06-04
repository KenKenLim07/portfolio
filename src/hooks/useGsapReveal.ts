"use client";

import { type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import {
  bindScrollRevealScrub,
  gsap,
  initGsap,
  layersFromRevealItems,
  scrollRevealMotion,
  sectionScrollBand,
} from "@/lib/gsap";

export type GsapRevealOptions = {
  y?: number;
  start?: string;
  end?: string;
  exitOpacity?: number;
  enterOnly?: boolean;
  triggerRef?: RefObject<HTMLElement | null>;
};

/** Standalone card/block scrub reveal (when not inside `Section`). */
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
        el.classList.add("gsap-reveal");
        if (!el.hasAttribute("data-gsap-reveal")) {
          el.setAttribute("data-gsap-reveal", "");
        }

        bindScrollRevealScrub({
          trigger: triggerEl,
          layers: layersFromRevealItems([el]),
          start: options.start ?? sectionScrollBand.start,
          end: options.end ?? sectionScrollBand.end,
          y: options.y ?? scrollRevealMotion.y,
          exitOpacity: options.exitOpacity,
          enterOnly: options.enterOnly,
        });
      }, el);

      return () => ctx.revert();
    },
    {
      scope: targetRef,
      dependencies: [
        options.y,
        options.start,
        options.end,
        options.exitOpacity,
        options.enterOnly,
        options.triggerRef,
        prefersReducedMotion,
      ],
      revertOnUpdate: true,
    },
  );
}
