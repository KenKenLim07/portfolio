"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { gsap, initGsap, ScrollTrigger } from "@/lib/gsap";

const SCRUB_REVEAL = {
  start: "clamp(top 92%)",
  end: "clamp(top top)",
  scrub: 1.1,
  y: 48,
  enter: 0.7,
  hold: 2.4,
  exit: 0.7,
} as const;

type UseScrubBlockRevealOptions = {
  /** Defaults to `[data-scrub-reveal]` */
  selector?: string;
  /** Skip upward exit — useful for the last section (e.g. contact form). */
  disableExit?: boolean;
};

/**
 * Per-block scrubbed reveal: enter from below → long readable hold → late
 * exit upward. Used by About, Projects, Stack, Process, Contact, etc.
 */
export function useScrubBlockReveal(
  options: UseScrubBlockRevealOptions = {},
) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useGsapReducedMotion();
  const selector = options.selector ?? "[data-scrub-reveal]";
  const disableExit = options.disableExit ?? false;

  useGSAP(
    () => {
      initGsap();
      const root = scopeRef.current;
      if (!root || prefersReducedMotion) return;

      const ctx = gsap.context(() => {
        const blocks = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(selector),
        );

        blocks.forEach((block) => {
          block.classList.add("gsap-bound");
          gsap.set(block, {
            opacity: 0,
            y: SCRUB_REVEAL.y,
            force3D: true,
          });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: block,
              start: SCRUB_REVEAL.start,
              end: SCRUB_REVEAL.end,
              scrub: SCRUB_REVEAL.scrub,
              invalidateOnRefresh: true,
            },
          });

          tl.fromTo(
            block,
            { opacity: 0, y: SCRUB_REVEAL.y, force3D: true },
            {
              opacity: 1,
              y: 0,
              force3D: true,
              duration: SCRUB_REVEAL.enter,
              ease: "none",
            },
          ).to(
            {},
            {
              duration: disableExit
                ? SCRUB_REVEAL.hold + SCRUB_REVEAL.exit
                : SCRUB_REVEAL.hold,
            },
          );

          if (!disableExit) {
            tl.to(block, {
              opacity: 0,
              y: -SCRUB_REVEAL.y,
              force3D: true,
              duration: SCRUB_REVEAL.exit,
              ease: "none",
            });
          }
        });
      }, root);

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => ctx.revert();
    },
    {
      scope: scopeRef,
      dependencies: [prefersReducedMotion, selector, disableExit],
      revertOnUpdate: true,
    },
  );

  return scopeRef;
}

/** @deprecated Prefer useScrubBlockReveal — kept for existing About imports */
export function useAboutBlockReveal() {
  return useScrubBlockReveal({ selector: "[data-about-reveal]" });
}
