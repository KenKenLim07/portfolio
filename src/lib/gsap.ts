import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Register ScrollTrigger once (client-only). */
export function initGsap() {
  if (typeof window === "undefined" || registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

/** Scroll reveal defaults */
export const revealDefaults = {
  y: 56,
  duration: 0.75,
  stagger: 0.08,
  ease: "power3.out" as const,
  start: "top 85%",
};

/**
 * Wider scroll band for tail blocks (hero CTAs/metrics, section footers).
 * - Enter sooner on scroll down (`start` below viewport edge)
 * - Exit sooner on scroll down (`end` higher in the viewport)
 * - Same band gives enter-back / leave-back more room on scroll up
 */
export const tailRevealScroll = {
  // Slightly narrower than before so re-entry on scroll-up happens sooner.
  start: "top bottom-=4%",
  // Keep tail visible longer before exit to avoid sudden empty gaps.
  end: "bottom 30%",
} as const;

export type DirectionalRevealOptions = {
  delay?: number;
  y?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
  start?: string;
  /**
   * Optional ScrollTrigger end position.
   * When provided, `onLeave`/`onLeaveBack` fire when the trigger passes `end`,
   * which makes exit animations easier to time (e.g. only fade the “tail”).
   */
  end?: string;
  /**
   * Exit opacity target used by onLeave/onLeaveBack.
   * Useful for "tail" blocks where full fade-to-zero can feel too abrupt.
   */
  exitOpacity?: number;
};

/**
 * Direction-aware scroll reveal:
 * - Scroll down into view → rise from below (y+ → 0)
 * - Scroll down past → exit upward (0 → y-)
 * - Scroll up into view → drop from above (y- → 0)
 * - Scroll up past → exit downward (0 → y+)
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

  gsap.set(targets, { opacity: 0, y });

  return ScrollTrigger.create({
    trigger,
    start,
    end,
    onEnter: () => {
      gsap.killTweensOf(targets);
      gsap.set(targets, { opacity: 0, y });
      gsap.to(targets, { opacity: 1, y: 0, ...enter });
    },
    onLeave: () => {
      gsap.killTweensOf(targets);
      gsap.to(targets, { opacity: exitOpacity, y: -y, ...exit });
    },
    onEnterBack: () => {
      gsap.killTweensOf(targets);
      gsap.to(targets, { opacity: 1, y: 0, ...enter });
    },
    onLeaveBack: () => {
      gsap.killTweensOf(targets);
      // Near the top of the page, avoid a second "leave back" fade that can feel
      // like a duplicate reveal/flicker on the first section.
      if (typeof window !== "undefined" && window.scrollY <= 4) {
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration: Math.min(0.22, duration * 0.35),
          ease,
          overwrite: "auto",
        });
        return;
      }
      gsap.to(targets, { opacity: exitOpacity, y, ...exit });
    },
  });
}

export { gsap, ScrollTrigger };
