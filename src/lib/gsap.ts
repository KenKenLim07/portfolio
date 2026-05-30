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

/** Scroll reveal defaults — enter only; exit uses {@link sectionExitScroll} */
export const revealDefaults = {
  y: 56,
  duration: 0.75,
  stagger: 0.08,
  ease: "power3.out" as const,
  start: "clamp(top 85%)",
};

/**
 * Wider scroll band for section exit (enter stays on each block wrapper).
 * Trigger should be the full `<section>` or a shared group wrapper — not a small inner div.
 */
export const sectionExitScroll = {
  start: "clamp(top bottom-=8%)",
  end: "clamp(bottom top+=22%)",
  y: 72,
  exitOpacity: 0.1,
  exitDuration: 0.85,
  exitStagger: 0.035,
  ease: "power3.out" as const,
} as const;

/** Process + Contact exit together — same band, zero stagger (“sucked” at top) */
export const closingSectionsExitScroll = {
  start: sectionExitScroll.start,
  end: "clamp(bottom top+=26%)",
  y: 80,
  exitOpacity: 0.08,
  exitDuration: 0.9,
  exitStagger: 0,
} as const;

/** Hero / above-the-fold blocks — wider band for tail exit only */
export const tailRevealScroll = {
  start: "clamp(top bottom-=4%)",
  end: sectionExitScroll.end,
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
 *
 * Scroll band (maps scrub 0 → 1):
 *   start: hero top at viewport top     → fully visible
 *   end:   hero bottom near viewport top → fully exited
 *
 * Tune `end` to widen/narrow how much scroll drives the exit:
 *   - `bottom top+=20%` = longer band (exit starts earlier as you scroll)
 *   - `bottom top`       = longest band (exit completes when hero is almost gone)
 *
 * Tune `scrub` for how tightly motion follows the wheel (higher = smoother/laggier).
 */
export const heroScrollReveal = {
  start: "clamp(top top)",
  end: "clamp(bottom top+=18%)",
  scrub: 1.4,
  y: 96,
  duration: 0.95,
  /** Stagger for load-in only — scrub exit uses group offsets, not per-item stagger */
  stagger: 0.11,
  /** Timeline offset between copy → tail → cue during scroll exit (0 = all in sync) */
  exitGroupOffset: 0.03,
  exitOpacity: 0.04,
  ease: "power2.inOut" as const,
} as const;

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
  /**
   * Exit band trigger — full section or group (e.g. `#closing-sections`).
   * Enter still uses `scope`. Defaults to closest `<section>`.
   */
  exitScrollTrigger?: Element | string | "parent-section";
  exitStart?: string;
  exitEnd?: string;
  exitY?: number;
  exitDuration?: number;
  exitStagger?: number;
  /** When false, enter + exit share one trigger (legacy). */
  splitExitTrigger?: boolean;
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
): ScrollTrigger[] {
  const enterTrigger = resolveScrollTrigger(scope, options.scrollTrigger);
  const y = options.y ?? revealDefaults.y;
  const duration = options.duration ?? revealDefaults.duration;
  const stagger = options.stagger ?? revealDefaults.stagger;
  const ease = options.ease ?? revealDefaults.ease;
  const enterStart = options.start ?? revealDefaults.start;
  const delay = options.delay ?? 0;
  const exitOpacity = options.exitOpacity ?? sectionExitScroll.exitOpacity;
  const exitY = options.exitY ?? sectionExitScroll.y;
  const exitDuration = options.exitDuration ?? sectionExitScroll.exitDuration;
  const exitStagger = options.exitStagger ?? sectionExitScroll.exitStagger;
  const exitEase = sectionExitScroll.ease;

  const enter = {
    duration,
    ease,
    stagger,
    delay,
    overwrite: "auto" as const,
  };
  const exit = {
    duration: exitDuration,
    ease: exitEase,
    stagger: exitStagger,
    overwrite: "auto" as const,
  };

  let hasEntered = false;

  const inViewOnMount =
    options.revealIfInView &&
    typeof window !== "undefined" &&
    isTriggerInViewport(enterTrigger);

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

  const playExitUp = () => {
    gsap.killTweensOf(targets);
    gsap.to(targets, {
      opacity: exitOpacity,
      y: -exitY,
      force3D: true,
      ...exit,
    });
  };

  const playEnterBack = () => {
    gsap.killTweensOf(targets);
    gsap.set(targets, { opacity: 0, y: -exitY, force3D: true });
    gsap.to(targets, {
      opacity: 1,
      y: 0,
      force3D: true,
      duration: exitDuration,
      ease: exitEase,
      stagger: exitStagger,
      overwrite: "auto",
    });
    hasEntered = true;
  };

  const playExitDown = () => {
    gsap.killTweensOf(targets);
    if (typeof window !== "undefined" && window.scrollY <= 4) {
      gsap.set(targets, { opacity: 1, y: 0, force3D: true });
      hasEntered = true;
      return;
    }
    gsap.to(targets, {
      opacity: exitOpacity,
      y: exitY,
      force3D: true,
      ...exit,
    });
  };

  if (!options.entranceOnly) {
    gsap.set(targets, { opacity: 0, y, force3D: true });
  }

  if (inViewOnMount) {
    playEnter(true);
  } else if (!options.entranceOnly) {
    gsap.set(targets, { opacity: 0, y, force3D: true });
  }

  const heroCopyEntranceOnly = options.entranceOnly && !options.end && !options.exitEnd;

  const resolveExitTrigger = (): Element => {
    if (options.exitScrollTrigger === "parent-section") {
      return scope.closest("section") ?? scope;
    }
    if (options.exitScrollTrigger) {
      return resolveScrollTrigger(scope, options.exitScrollTrigger);
    }
    return scope.closest("section") ?? scope;
  };

  const useSplitExit =
    options.splitExitTrigger !== false &&
    !heroCopyEntranceOnly &&
    !options.entranceOnly;

  const triggers: ScrollTrigger[] = [];

  if (useSplitExit) {
    const exitTriggerEl = resolveExitTrigger();
    const exitStart = options.exitStart ?? sectionExitScroll.start;
    const exitEnd = options.exitEnd ?? options.end ?? sectionExitScroll.end;

    triggers.push(
      ScrollTrigger.create({
        trigger: enterTrigger,
        start: enterStart,
        invalidateOnRefresh: true,
        onEnter: () => playEnter(),
        onLeaveBack: playExitDown,
      }),
      ScrollTrigger.create({
        trigger: exitTriggerEl,
        start: exitStart,
        end: exitEnd,
        invalidateOnRefresh: true,
        onLeave: playExitUp,
        onEnterBack: playEnterBack,
      }),
    );
  } else {
    const singleEnd = options.end ?? options.exitEnd;
    triggers.push(
      ScrollTrigger.create({
        trigger: enterTrigger,
        start: enterStart,
        end: singleEnd,
        invalidateOnRefresh: true,
        onEnter: options.entranceOnly ? undefined : () => playEnter(),
        onLeave: heroCopyEntranceOnly ? undefined : playExitUp,
        onEnterBack: heroCopyEntranceOnly ? undefined : () => playEnterBack(),
        onLeaveBack: heroCopyEntranceOnly ? undefined : playExitDown,
      }),
    );
  }

  if (inViewOnMount) {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  return triggers;
}

export { gsap, ScrollTrigger, useGSAP };
