"use client";

import { type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import {
  createScrubScrollReveal,
  gsap,
  initGsap,
  sectionScrollReveal,
  ScrollTrigger,
  type ScrubRevealOptions,
} from "@/lib/gsap";

/**
 * One scrubbed timeline per page section — all `[data-gsap-reveal]` children
 * enter and exit together (same feel as the hero).
 */
export function useSectionScrollReveal(
  sectionRef: RefObject<HTMLElement | null>,
  options: ScrubRevealOptions = {},
) {
  const prefersReducedMotion = useGsapReducedMotion();

  useGSAP(
    () => {
      initGsap();
      const section = sectionRef.current;
      if (!section || prefersReducedMotion) return;

      const items = section.querySelectorAll<HTMLElement>("[data-gsap-reveal]");
      if (!items.length) return;

      const ctx = gsap.context(() => {
        createScrubScrollReveal(section, items, {
          mode: "enterExit",
          start: sectionScrollReveal.start,
          end: sectionScrollReveal.end,
          scrub: sectionScrollReveal.scrub,
          y: sectionScrollReveal.y,
          stagger: sectionScrollReveal.stagger,
          exitOpacity: sectionScrollReveal.exitOpacity,
          enterAt: sectionScrollReveal.enterAt,
          ...options,
        });
      }, section);

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => ctx.revert();
    },
    {
      scope: sectionRef,
      dependencies: [prefersReducedMotion],
      revertOnUpdate: true,
    },
  );
}
