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
export const heroScrollReveal = {
  start: "clamp(top top)",
  /** Wider band — exit plays across more scroll distance */
  end: "clamp(bottom 22%)",
  scrub: 1.25,
  y: 96,
  duration: 0.95,
  stagger: 0.11,
  exitOpacity: 0.04,
  ease: "power2.inOut" as const,
} as const;

export type ScrollScrubConfig = {
  start: string;
  end: string;
  scrub: number;
  y: number;
  stagger: number;
  exitOpacity: number;
  ease?: string;
  /** Scroll progress (0–1) before lines start entering — content stays hidden */
  enterDelay?: number;
  /** Scroll progress (0–1) where the last line finishes entering */
  enterAt?: number;
  /** Scroll progress (0–1) where exit begins */
  exitAt?: number;
  /** Stagger between lines on exit (defaults to `stagger`; hero uses ~0.11) */
  exitStagger?: number;
  /**
   * After hero: skip scrubbed slide-in; snap visible then scrub exit only (tail “suck up”).
   * Set false to restore enter + hold + exit on one timeline.
   */
  exitOnly?: boolean;
};

/**
 * Below-fold sections — exit-only scrub (portfolio tail trick).
 * Tune exit strength: lower `exitAt` = more scroll % dedicated to slide-up (`1 - exitAt`).
 */
export const sectionScrollReveal: ScrollScrubConfig = {
  start: "clamp(top bottom)",
  end: "clamp(bottom top)",
  scrub: heroScrollReveal.scrub,
  y: heroScrollReveal.y,
  stagger: heroScrollReveal.stagger,
  exitStagger: heroScrollReveal.stagger,
  exitOpacity: heroScrollReveal.exitOpacity,
  exitOnly: true,
  enterDelay: 0,
  enterAt: 0,
  /** ~80% of section scroll = exit (hero-style suck up) */
  exitAt: 0.2,
  ease: heroScrollReveal.ease,
};

export function queryRevealItems(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-gsap-reveal]"));
}

/**
 * Section scroll reveal. Default `exitOnly`: no scrubbed enter — content snaps in,
 * most scroll distance is exit (like hero tail). Set `exitOnly: false` for enter+exit.
 */
export function bindSectionScrollScrub(
  section: Element,
  items: HTMLElement[],
  config: ScrollScrubConfig = sectionScrollReveal,
) {
  if (!items.length) return null;

  const { y, exitOpacity, scrub, start, end, stagger } = config;
  const exitStagger = config.exitStagger ?? stagger;
  const exitOnly = config.exitOnly !== false;
  const exitAt = config.exitAt ?? 0.2;
  const exitSpan = Math.max(0, 1 - exitAt);

  gsap.set(items, { opacity: 0, y, force3D: true });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start,
      end,
      scrub,
      invalidateOnRefresh: true,
    },
  });

  if (exitOnly) {
    tl.to(
      items,
      { opacity: 1, y: 0, ease: "none", duration: 0.01, force3D: true },
      0,
    );
    tl.to(
      items,
      { opacity: 1, y: 0, ease: "none", duration: exitAt },
      0,
    );
    tl.to(
      items,
      {
        opacity: exitOpacity,
        y: -y,
        stagger: exitStagger,
        ease: "none",
        duration: exitSpan,
        force3D: true,
      },
      exitAt,
    );
    return tl;
  }

  const enterDelay = config.enterDelay ?? 0;
  const enterAt = config.enterAt ?? 0.42;
  const hold = Math.max(0, exitAt - enterAt);
  const enterWindow = Math.max(0.08, enterAt - enterDelay);
  const staggerEach =
    items.length > 1
      ? Math.min(stagger, (enterWindow * 0.85) / (items.length - 1))
      : 0;

  items.forEach((item, index) => {
    const enterStart = enterDelay + index * staggerEach;
    const enterDuration = Math.max(0.08, enterAt - enterStart);

    tl.fromTo(
      item,
      { opacity: 0, y, force3D: true },
      {
        opacity: 1,
        y: 0,
        ease: "none",
        duration: enterDuration,
        force3D: true,
      },
      enterStart,
    );

    tl.to(
      item,
      { opacity: 1, y: 0, ease: "none", duration: hold },
      enterAt,
    );
  });

  tl.to(
    items,
    {
      opacity: exitOpacity,
      y: -y,
      stagger: exitStagger,
      ease: "none",
      duration: exitSpan,
      force3D: true,
    },
    exitAt,
  );

  return tl;
}

/** Hero: mount entrance handled separately; scrub fades the full block out on scroll down */
export function bindHeroExitScrub(section: Element, items: HTMLElement[]) {
  if (!items.length) return null;

  const config = heroScrollReveal;

  return gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: config.start,
        end: config.end,
        scrub: config.scrub,
        invalidateOnRefresh: true,
      },
    })
    .fromTo(
      items,
      { opacity: 1, y: 0, force3D: true },
      {
        opacity: config.exitOpacity,
        y: -config.y,
        stagger: config.stagger,
        ease: "none",
        force3D: true,
      },
    );
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
