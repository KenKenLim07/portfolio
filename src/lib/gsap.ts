import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Shared media query for accessibility-aware GSAP setup. */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Register GSAP plugins once (client-only). */
export function initGsap() {
  if (typeof window === "undefined" || registered) return;
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  registered = true;
}

/** Scroll reveal defaults */
export const revealDefaults = {
  y: 56,
  duration: 0.75,
  stagger: 0.08,
  ease: "power3.out" as const,
  start: "clamp(top 85%)",
};

/** Hero / above-the-fold blocks — wider band for tail exit only */
export const tailRevealScroll = {
  start: "clamp(top bottom-=4%)",
  end: "clamp(bottom 30%)",
} as const;

/**
 * Hero tail exit when `scrollTrigger` is `#home` (full hero height).
 * Same band as the original tail preset — tied to the section, not the arrow wrapper.
 */
export const heroTailExitScroll = {
  start: tailRevealScroll.start,
  end: tailRevealScroll.end,
} as const;

/**
 * Unified hero scroll exit — scrubbed to scroll distance (not a one-shot tween).
 * Wider band + larger travel than section defaults.
 */
/** Shared buttery scrub motion (hero + sections) */
export const scrubRevealMotion = {
  scrub: 1.25,
  y: 88,
  stagger: 0.1,
  exitOpacity: 0.05,
} as const;

export const heroScrollReveal = {
  ...scrubRevealMotion,
  y: 96,
  stagger: 0.11,
  exitOpacity: 0.04,
  start: "clamp(top top)",
  end: "clamp(bottom 22%)",
  duration: 0.95,
  ease: "power2.inOut" as const,
} as const;

/** Below-fold sections: enter while scrolling in, exit while scrolling out */
export const sectionScrollReveal = {
  ...scrubRevealMotion,
  start: "clamp(top 90%)",
  end: "clamp(bottom 10%)",
  /** Timeline position (0–1) where exit begins */
  enterAt: 0.46,
} as const;

export type ScrubRevealMode = "enterExit" | "exitOnly";

export type ScrubRevealOptions = {
  mode?: ScrubRevealMode;
  start?: string;
  end?: string;
  scrub?: number;
  y?: number;
  stagger?: number;
  exitOpacity?: number;
  enterAt?: number;
};

/** Scrub-linked scroll reveal — one timeline tied to scroll distance */
export function createScrubScrollReveal(
  trigger: Element,
  targets: gsap.TweenTarget,
  options: ScrubRevealOptions = {},
) {
  const mode = options.mode ?? "enterExit";
  const y = options.y ?? scrubRevealMotion.y;
  const stagger = options.stagger ?? scrubRevealMotion.stagger;
  const exitOpacity = options.exitOpacity ?? scrubRevealMotion.exitOpacity;
  const scrub = options.scrub ?? scrubRevealMotion.scrub;
  const start =
    options.start ??
    (mode === "exitOnly" ? heroScrollReveal.start : sectionScrollReveal.start);
  const end =
    options.end ??
    (mode === "exitOnly" ? heroScrollReveal.end : sectionScrollReveal.end);
  const enterAt = options.enterAt ?? sectionScrollReveal.enterAt;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger,
      start,
      end,
      scrub,
      invalidateOnRefresh: true,
    },
  });

  if (mode === "exitOnly") {
    tl.fromTo(
      targets,
      { opacity: 1, y: 0, force3D: true },
      {
        opacity: exitOpacity,
        y: -y,
        stagger,
        ease: "none",
        force3D: true,
      },
    );
  } else {
    tl.fromTo(
      targets,
      { opacity: 0, y, force3D: true },
      { opacity: 1, y: 0, stagger, ease: "none", force3D: true },
      0,
    ).to(
      targets,
      {
        opacity: exitOpacity,
        y: -y,
        stagger,
        ease: "none",
        force3D: true,
      },
      enterAt,
    );
  }

  return tl;
}

export type DirectionalRevealOptions = {
  delay?: number;
  y?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
  start?: string;
  end?: string;
  exitOpacity?: number;
  /** Play enter animation on mount when the trigger is already in the viewport. */
  revealIfInView?: boolean;
  /**
   * Above-fold hero: one-shot enter on load, no onEnter re-fire on scroll/refresh.
   * Optional scroll exit when `end` is set.
   */
  entranceOnly?: boolean;
  /** ScrollTrigger element (e.g. `#home`). Scope still holds animated targets. */
  scrollTrigger?: Element | string;
};

function isTriggerInViewport(trigger: Element) {
  const rect = trigger.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
}

/**
 * Direction-aware scroll reveal:
 * - Scroll down into view → rise from below (y+ → 0)
 * - Scroll down past → exit upward (0 → y-)
 * - Scroll up into view → drop from above (y- → 0)
 * - Scroll up past → exit downward (0 → y+)
 */
function resolveScrollTrigger(
  scope: Element,
  scrollTrigger?: Element | string,
): Element {
  if (!scrollTrigger) return scope;
  if (typeof scrollTrigger === "string") {
    return document.querySelector(scrollTrigger) ?? scope;
  }
  return scrollTrigger;
}

export function createDirectionalScrollReveal(
  scope: Element,
  targets: gsap.TweenTarget,
  options: DirectionalRevealOptions = {},
): ScrollTrigger {
  const trigger = resolveScrollTrigger(scope, options.scrollTrigger);
  const y = options.y ?? revealDefaults.y;
  const duration = options.duration ?? revealDefaults.duration;
  const stagger = options.stagger ?? revealDefaults.stagger;
  const ease = options.ease ?? revealDefaults.ease;
  const start = options.start ?? revealDefaults.start;
  const end = options.end;
  const exitOpacity = options.exitOpacity ?? 0;
  const delay = options.delay ?? 0;
  const exitDuration = duration * 0.65;

  const enter = {
    duration,
    ease,
    stagger,
    delay,
    overwrite: "auto" as const,
  };
  const exit = {
    duration: exitDuration,
    ease,
    stagger: stagger * 0.6,
    overwrite: "auto" as const,
  };

  let hasEntered = false;

  const inViewOnMount =
    options.revealIfInView &&
    typeof window !== "undefined" &&
    isTriggerInViewport(trigger);

  const playEnter = (force = false) => {
    if (options.entranceOnly && hasEntered && !force) return;

    const firstTarget = gsap.utils.toArray(targets)[0] as Element | undefined;
    const currentOpacity =
      firstTarget instanceof Element
        ? Number(gsap.getProperty(firstTarget, "opacity"))
        : 0;

    if (!force && currentOpacity >= 0.99 && hasEntered) return;

    gsap.killTweensOf(targets);

    if (options.entranceOnly && inViewOnMount && !hasEntered) {
      gsap.fromTo(
        targets,
        { opacity: 0, y, force3D: true, immediateRender: true },
        { opacity: 1, y: 0, force3D: true, ...enter },
      );
    } else {
      gsap.set(targets, { opacity: 0, y, force3D: true });
      gsap.to(targets, { opacity: 1, y: 0, force3D: true, ...enter });
    }

    hasEntered = true;
  };

  /** Scroll down past end — exit upward (63b26d2 tail trick) */
  const playExitUp = () => {
    gsap.killTweensOf(targets);
    gsap.to(targets, { opacity: exitOpacity, y: -y, force3D: true, ...exit });
  };

  /** Scroll up into band — drop from above */
  const playEnterBack = () => {
    gsap.killTweensOf(targets);
    gsap.set(targets, { opacity: 0, y: -y, force3D: true });
    gsap.to(targets, { opacity: 1, y: 0, force3D: true, ...enter });
    hasEntered = true;
  };

  /** Scroll up past start — exit downward */
  const playExitDown = () => {
    gsap.killTweensOf(targets);
    if (typeof window !== "undefined" && window.scrollY <= 4) {
      gsap.set(targets, { opacity: 1, y: 0, force3D: true });
      hasEntered = true;
      return;
    }
    gsap.to(targets, { opacity: exitOpacity, y, force3D: true, ...exit });
  };

  if (!options.entranceOnly) {
    gsap.set(targets, { opacity: 0, y, force3D: true });
  }

  if (inViewOnMount) {
    playEnter(true);
  } else if (!options.entranceOnly) {
    gsap.set(targets, { opacity: 0, y, force3D: true });
  }

  /** Hero copy: entrance on load only — no scroll band. Tail + below-fold keep full directional scroll. */
  const heroCopyEntranceOnly = options.entranceOnly && !end;

  const st = ScrollTrigger.create({
    trigger,
    start,
    end,
    invalidateOnRefresh: true,
    onEnter: options.entranceOnly ? undefined : () => playEnter(),
    onLeave: heroCopyEntranceOnly ? undefined : playExitUp,
    onEnterBack: heroCopyEntranceOnly ? undefined : () => playEnterBack(),
    onLeaveBack: heroCopyEntranceOnly ? undefined : playExitDown,
  });

  if (inViewOnMount) {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  return st;
}

export { gsap, ScrollTrigger, useGSAP };
