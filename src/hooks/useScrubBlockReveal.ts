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
  hold: 3.1,
  exit: 1.35,
  scrub: 1.1,
} as const;

/** Mobile — same hero exit travel / fade; enter rise stays smaller. */
const SCRUB_MOBILE = {
  ...SCRUB_WEIGHTS,
  start: "clamp(top 92%)",
  end: "clamp(top 8%)",
  y: 48,
  exitY: 72,
  exitOpacity: heroScrollReveal.exitOpacity,
} as const;

/**
 * Desktop — same hero exit travel / fade; enter rise stays desktop-sized.
 */
const SCRUB_DESKTOP = {
  ...SCRUB_WEIGHTS,
  start: "clamp(top 88%)",
  end: "clamp(top 6%)",
  y: 68,
  exitY: 88,
  exitOpacity: heroScrollReveal.exitOpacity,
} as const;

type ScrubConfig = typeof SCRUB_MOBILE | typeof SCRUB_DESKTOP | typeof SCRUB_LAST_MOBILE | typeof SCRUB_LAST_DESKTOP;

/** Last section — shorter hold, bottom-based end so enter can finish near page end */
const SCRUB_LAST_WEIGHTS = {
  enter: 0.85,
  hold: 0.2,
  exit: 0,
  scrub: 0.9,
} as const;

const SCRUB_LAST_MOBILE = {
  ...SCRUB_LAST_WEIGHTS,
  start: "clamp(top 94%)",
  end: "clamp(bottom 78%)",
  y: 40,
  exitY: heroScrollReveal.y,
  exitOpacity: heroScrollReveal.exitOpacity,
} as const;

const SCRUB_LAST_DESKTOP = {
  ...SCRUB_LAST_WEIGHTS,
  start: "clamp(top 90%)",
  end: "clamp(bottom 75%)",
  y: 56,
  exitY: heroScrollReveal.y,
  exitOpacity: heroScrollReveal.exitOpacity,
} as const;

type UseScrubBlockRevealOptions = {
  /** Defaults to `[data-scrub-reveal]` */
  selector?: string;
  /** Skip upward exit — useful for the last section (e.g. contact form). */
  disableExit?: boolean;
  /** Bottom-of-page section — completes enter before scroll runs out. */
  lastSection?: boolean;
};

function completeIfPinnedAtPageEnd(block: HTMLElement, tl: gsap.core.Timeline) {
  const sync = () => {
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 8 || window.scrollY < maxScroll - 24) return;

    const rect = block.getBoundingClientRect();
    if (rect.top >= window.innerHeight * 0.98) return;

    tl.progress(1, false);
  };

  sync();
  ScrollTrigger.addEventListener("refresh", sync);
  window.addEventListener("scroll", sync, { passive: true });

  return () => {
    ScrollTrigger.removeEventListener("refresh", sync);
    window.removeEventListener("scroll", sync);
  };
}

function bindScrubBlocks(
  root: HTMLElement,
  selector: string,
  config: ScrubConfig,
  disableExit: boolean,
  lastSection: boolean,
) {
  const blocks = gsap.utils
    .toArray<HTMLElement>(root.querySelectorAll(selector))
    // Skip breakpoint-hidden nodes (e.g. mobile-only project images on desktop)
    .filter((el) => getComputedStyle(el).display !== "none");

  const cleanups: Array<() => void> = [];

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

    if (lastSection) {
      cleanups.push(completeIfPinnedAtPageEnd(block, tl));
    }
  });

  return () => {
    cleanups.forEach((fn) => fn());
  };
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
  const lastSection = options.lastSection ?? false;

  useGSAP(
    () => {
      initGsap();
      const root = scopeRef.current;
      if (!root || prefersReducedMotion) return;

      const mm = gsap.matchMedia();
      let cleanupBlocks: (() => void) | undefined;

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
          const config = lastSection
            ? isDesktop
              ? SCRUB_LAST_DESKTOP
              : SCRUB_LAST_MOBILE
            : isDesktop
              ? SCRUB_DESKTOP
              : SCRUB_MOBILE;
          cleanupBlocks = bindScrubBlocks(
            root,
            selector,
            config,
            disableExit,
            lastSection,
          );
        },
      );

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        cleanupBlocks?.();
        mm.revert();
      };
    },
    {
      scope: scopeRef,
      dependencies: [prefersReducedMotion, selector, disableExit, lastSection],
      revertOnUpdate: true,
    },
  );

  return scopeRef;
}

/** @deprecated Prefer useScrubBlockReveal — kept for existing About imports */
export function useAboutBlockReveal() {
  return useScrubBlockReveal({ selector: "[data-about-reveal]" });
}
