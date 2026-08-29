"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { gsap, heroScrollReveal, initGsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Scrub timeline weights (relative). Exit a touch lighter than the mid pass;
 * travel + fade opacity match the hero leave.
 */
const SCRUB_WEIGHTS = {
  enter: 0.75,
  hold: 2.25,
  exit: 0.85,
  scrub: 1.1,
} as const;

/** Mobile — same hero exit travel / fade; enter rise stays smaller. */
const SCRUB_MOBILE = {
  ...SCRUB_WEIGHTS,
  start: "clamp(top 92%)",
  end: "clamp(top 12%)",
  y: 48,
  exitY: heroScrollReveal.y,
  exitOpacity: heroScrollReveal.exitOpacity,
} as const;

/**
 * Desktop — same hero exit travel / fade; enter rise stays desktop-sized.
 */
const SCRUB_DESKTOP = {
  ...SCRUB_WEIGHTS,
  start: "clamp(top 88%)",
  end: "clamp(top 10%)",
  y: 68,
  exitY: heroScrollReveal.y,
  exitOpacity: heroScrollReveal.exitOpacity,
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
  const blocks = gsap.utils
    .toArray<HTMLElement>(root.querySelectorAll(selector))
    // Skip breakpoint-hidden nodes (e.g. mobile-only project images on desktop)
    .filter((el) => getComputedStyle(el).display !== "none");

  blocks.forEach((block) => {
    block.classList.add("gsap-bound");
    gsap.set(block, {
      opacity: 0,
      y: config.y,
      force3D: true,
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
        force3D: true,
      },
      {
        opacity: 1,
        y: 0,
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
        opacity: config.exitOpacity,
        y: -config.exitY,
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
