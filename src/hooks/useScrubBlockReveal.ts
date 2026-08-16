"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { gsap, initGsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Scrub timeline weights (relative). Exit sits between the old equal-weight
 * leave and the stronger hero-like pass — readable, not dramatic.
 */
const SCRUB_WEIGHTS = {
  enter: 0.75,
  hold: 2.1,
  exit: 1.0,
  scrub: 1.1,
} as const;

/** Mobile — exit finishes mid-way between `top top` and the strong on-screen leave. */
const SCRUB_MOBILE = {
  ...SCRUB_WEIGHTS,
  start: "clamp(top 92%)",
  end: "clamp(top 12%)",
  y: 48,
  exitY: 56,
  enterScale: 0.97,
  exitScale: 0.94,
} as const;

/**
 * Desktop — taller viewport; moderated exit travel + end between the old
 * `top top` and the stronger `top 18%` pass.
 */
const SCRUB_DESKTOP = {
  ...SCRUB_WEIGHTS,
  start: "clamp(top 88%)",
  end: "clamp(top 10%)",
  y: 68,
  exitY: 82,
  enterScale: 0.97,
  exitScale: 0.94,
} as const;

type ScrubConfig = typeof SCRUB_MOBILE | typeof SCRUB_DESKTOP;

type UseScrubBlockRevealOptions = {
  /** Defaults to `[data-scrub-reveal]` */
  selector?: string;
  /** Skip upward exit — useful for the last section (e.g. contact form). */
  disableExit?: boolean;
};

function bindScrubBlocks(
  root: HTMLElement,
  selector: string,
  config: ScrubConfig,
  disableExit: boolean,
) {
  const blocks = gsap.utils.toArray<HTMLElement>(
    root.querySelectorAll(selector),
  );

  blocks.forEach((block) => {
    block.classList.add("gsap-bound");
    gsap.set(block, {
      opacity: 0,
      y: config.y,
      scale: config.enterScale,
      force3D: true,
      transformOrigin: "center center",
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: block,
        start: config.start,
        end: config.end,
        scrub: config.scrub,
        invalidateOnRefresh: true,
      },
    });

    tl.fromTo(
      block,
      {
        opacity: 0,
        y: config.y,
        scale: config.enterScale,
        force3D: true,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        force3D: true,
        duration: config.enter,
        ease: "none",
      },
    ).to(
      {},
      {
        duration: disableExit ? config.hold + config.exit : config.hold,
      },
    );

    if (!disableExit) {
      tl.to(block, {
        opacity: 0,
        y: -config.exitY,
        scale: config.exitScale,
        force3D: true,
        duration: config.exit,
        ease: "none",
      });
    }
  });
}

/**
 * Per-block scrubbed reveal: enter from below → readable hold → exit upward
 * while still on screen. Used by About, Projects, Stack, Process, Contact, etc.
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

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: "(min-width: 768px)",
          isMobile: "(max-width: 767px)",
        },
        (context) => {
          const { isDesktop } = context.conditions as {
            isDesktop: boolean;
            isMobile: boolean;
          };
          const config = isDesktop ? SCRUB_DESKTOP : SCRUB_MOBILE;
          bindScrubBlocks(root, selector, config, disableExit);
        },
      );

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => mm.revert();
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
