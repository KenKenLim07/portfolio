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

/**
 * Wider scroll band for tail blocks (hero CTAs/metrics, section footers).
 * `clamp()` keeps triggers inside page bounds (ScrollTrigger best practice).
 */
export const tailRevealScroll = {
  start: "clamp(top bottom-=4%)",
  end: "clamp(bottom 30%)",
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
};

/**
 * Direction-aware scroll reveal:
 * - Scroll down into view → rise from below (y+ → 0)
 * - Scroll down past → exit upward (0 → y-)
 * - Scroll up into view → drop from above (y- → 0)
 * - Scroll up past → exit downward (0 → y+)
 *
 * Call inside gsap.context() / useGSAP so ScrollTriggers revert on cleanup.
 */
export function createDirectionalScrollReveal(
  trigger: Element,
  targets: gsap.TweenTarget,
  options: DirectionalRevealOptions = {},
): ScrollTrigger {
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

  gsap.set(targets, { opacity: 0, y, force3D: true });

  return ScrollTrigger.create({
    trigger,
    start,
    end,
    onEnter: () => {
      gsap.killTweensOf(targets);
      gsap.set(targets, { opacity: 0, y });
      gsap.to(targets, { opacity: 1, y: 0, force3D: true, ...enter });
    },
    onLeave: () => {
      gsap.killTweensOf(targets);
      gsap.to(targets, { opacity: exitOpacity, y: -y, force3D: true, ...exit });
    },
    onEnterBack: () => {
      gsap.killTweensOf(targets);
      gsap.to(targets, { opacity: 1, y: 0, force3D: true, ...enter });
    },
    onLeaveBack: () => {
      gsap.killTweensOf(targets);
      if (typeof window !== "undefined" && window.scrollY <= 4) {
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          force3D: true,
          duration: Math.min(0.22, duration * 0.35),
          ease,
          overwrite: "auto",
        });
        return;
      }
      gsap.to(targets, { opacity: exitOpacity, y, force3D: true, ...exit });
    },
  });
}

export { gsap, ScrollTrigger, useGSAP };
