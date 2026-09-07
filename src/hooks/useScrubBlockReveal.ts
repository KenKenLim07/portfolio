"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { gsap, heroScrollReveal, initGsap, ScrollTrigger } from "@/lib/gsap";
import {
  getLayoutViewportHeight,
  getMobileChromeClearancePx,
} from "@/lib/viewport-resize";

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

type ScrubBand = {
  start: string | (() => string);
  end: string | (() => string);
};

/**
 * Mobile enter/exit must stay above the bottom toolbar.
 * Toolbar shows on scroll-up — a fixed `top 92%` start sits under it and the
 * fade is almost invisible. Use chrome clearance so the band tracks the safe area.
 */
function getMobileScrubBand(lastSection: boolean): ScrubBand {
  const start = () => {
    const h = getLayoutViewportHeight();
    const clearance = getMobileChromeClearancePx();
    // % from top where element top triggers enter (above chrome + small margin)
    const pct = Math.min(
      86,
      Math.max(74, Math.round(((h - clearance) / h) * 100) - 6),
    );
    return `clamp(top ${pct}%)`;
  };

  if (lastSection) {
    // Finish enter before the block sinks into the chrome zone at page end
    const end = () => {
      const h = getLayoutViewportHeight();
      const clearance = getMobileChromeClearancePx();
      const pct = Math.min(
        88,
        Math.max(70, Math.round(((h - clearance) / h) * 100) - 4),
      );
      return `clamp(bottom ${pct}%)`;
    };
    return { start, end };
  }

  // Exit finishes a bit higher so the last fade isn't behind the bar
  return { start, end: "clamp(top 12%)" };
}

/** Mobile — lighter scrub; chrome-safe start so enter/exit aren't under the toolbar */
const SCRUB_MOBILE = {
  ...SCRUB_WEIGHTS,
  ...getMobileScrubBand(false),
  y: 48,
  exitY: 72,
  exitOpacity: heroScrollReveal.exitOpacity,
  scrub: 0.55,
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

/** Last section — shorter hold, bottom-based end so enter can finish near page end */
const SCRUB_LAST_WEIGHTS = {
  enter: 0.85,
  hold: 0.2,
  exit: 0,
  scrub: 0.9,
} as const;

const SCRUB_LAST_MOBILE = {
  ...SCRUB_LAST_WEIGHTS,
  ...getMobileScrubBand(true),
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

type ScrubConfig =
  | typeof SCRUB_MOBILE
  | typeof SCRUB_DESKTOP
  | typeof SCRUB_LAST_MOBILE
  | typeof SCRUB_LAST_DESKTOP;

type UseScrubBlockRevealOptions = {
  /** Defaults to `[data-scrub-reveal]` */
  selector?: string;
  /** Skip upward exit — useful for the last section (e.g. contact form). */
  disableExit?: boolean;
  /** Bottom-of-page section — completes enter before scroll runs out. */
  lastSection?: boolean;
  /** Keep full opacity on mobile exit (form stays readable while typing). */
  holdExitOpacity?: boolean;
};

function completeIfPinnedAtPageEnd(block: HTMLElement, tl: gsap.core.Timeline) {
  const sync = () => {
    const viewportH = getLayoutViewportHeight();
    const maxScroll =
      document.documentElement.scrollHeight - viewportH;
    if (maxScroll <= 8 || window.scrollY < maxScroll - 24) return;

    const rect = block.getBoundingClientRect();
    if (rect.top >= viewportH * 0.98) return;

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
  holdExitOpacity: boolean,
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
        opacity: holdExitOpacity ? 1 : config.exitOpacity,
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
  const holdExitOpacity = options.holdExitOpacity ?? false;

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
            holdExitOpacity && !isDesktop,
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
      dependencies: [
        prefersReducedMotion,
        selector,
        disableExit,
        lastSection,
        holdExitOpacity,
      ],
      revertOnUpdate: true,
    },
  );

  return scopeRef;
}

/** @deprecated Prefer useScrubBlockReveal — kept for existing About imports */
export function useAboutBlockReveal() {
  return useScrubBlockReveal({ selector: "[data-about-reveal]" });
}
