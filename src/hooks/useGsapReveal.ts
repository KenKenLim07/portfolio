"use client";

import { type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import {
  createScrubScrollReveal,
  gsap,
  initGsap,
  scrubRevealMotion,
  sectionScrollReveal,
  ScrollTrigger,
} from "@/lib/gsap";

export type GsapRevealOptions = {
  y?: number;
  start?: string;
  end?: string;
  scrub?: number;
  exitOpacity?: number;
  enterAt?: number;
  triggerRef?: RefObject<HTMLElement | null>;
};

/** Standalone scrub reveal (e.g. one card when not inside a `Section`) */
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
      if (!el.hasAttribute("data-gsap-reveal")) {
        el.setAttribute("data-gsap-reveal", "");
        el.classList.add("gsap-reveal");
      }

      const ctx = gsap.context(() => {
        createScrubScrollReveal(triggerEl, el, {
          mode: "enterExit",
          start: options.start ?? sectionScrollReveal.start,
          end: options.end ?? sectionScrollReveal.end,
          scrub: options.scrub ?? scrubRevealMotion.scrub,
          y: options.y ?? scrubRevealMotion.y,
          exitOpacity: options.exitOpacity ?? scrubRevealMotion.exitOpacity,
          enterAt: options.enterAt ?? sectionScrollReveal.enterAt,
        });
      }, el);

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => ctx.revert();
    },
    {
      scope: targetRef,
      dependencies: [
        options.y,
        options.start,
        options.end,
        options.scrub,
        options.exitOpacity,
        options.enterAt,
        options.triggerRef,
        prefersReducedMotion,
      ],
      revertOnUpdate: true,
    },
  );
}
