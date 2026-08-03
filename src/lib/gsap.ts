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
  delay: 0,
  ease: "power3.out" as const,
  start: "clamp(top 90%)",
};

/** Hero / above-the-fold blocks — wider band for tail exit only */
export const tailRevealScroll = {
  start: "clamp(top bottom-=4%)",
  end: "clamp(bottom 30%)",
} as const;

/**
 * Tail block pinned to a parent `<section id="…">` trigger.
 * Exit runs while the section (and card) are still largely on screen.
 */
export const sectionTailRevealScroll = {
  start: "clamp(top bottom-=8%)",
  end: "clamp(bottom 52%)",
} as const;

/** Small tail block without a section trigger — earlier exit on the block itself */
export const tailBlockRevealScroll = {
  start: "clamp(top bottom-=8%)",
  end: "clamp(bottom 78%)",
} as const;

/** Stronger motion for tail enter/exit (sections below hero) */
export const tailMotion = {
  y: 64,
  duration: 0.9,
  stagger: 0.1,
  /** Short beat before enter — softens “pops in as soon as visible” */
  delay: 0.15,
  exitOpacity: 0.15,
  /** Exit tweens use ~95% of enter duration (default blocks use 65%). */
  exitDurationFactor: 0.95,
} as const;

/**
 * Last section on the page: content-scoped trigger, tail motion, no forward exit.
 * Requires `end` — without it ScrollTrigger collapses to a zero-width toggle.
 */
export const lastSectionReveal = {
  start: "clamp(top 88%)",
  end: "clamp(bottom 62%)",
  y: tailMotion.y,
  duration: tailMotion.duration,
  stagger: tailMotion.stagger,
  delay: tailMotion.delay,
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
 *   start → end: full hero scroll distance linked to the timeline
 *
 * exitScrollHold: first N timeline units = no motion (content stays readable on
 * small scroll). Desktop: both columns exit in parallel after the hold.
 */
export const heroScrollReveal = {
  start: "clamp(top top)",
  /** Lower % = exit finishes nearer the bottom of the hero (more scroll in-band) */
  endDesktop: "clamp(bottom 28%)",
  endMobile: "clamp(bottom 26%)",
  scrub: 1.25,
  y: 108,
  /** Copy: visible motion, still more legible than chrome */
  exitYCopy: 96,
  exitOpacityCopy: 0.15,
  duration: 0.95,
  stagger: 0.11,
  /** Timeline dead zone before any exit (fraction of scrub progress) */
  exitScrollHold: 0.28,
  exitTweenDuration: 0.52,
  exitItemStagger: 0.085,
  exitLayerGap: 0.13,
  /** Desktop: offset between right-rail blocks (copy runs at 0 in parallel) */
  exitRailStagger: 0.05,
  exitOpacity: tailMotion.exitOpacity,
  ease: "power2.inOut" as const,
} as const;

export type SectionExitLayer = {
  targets: gsap.TweenTarget;
  exitOpacity?: number;
  exitY?: number;
  /** Offset from end of hold — layers with the same `at` exit in parallel */
  at?: number;
};

/** @deprecated Prefer SectionExitLayer — alias kept for hero call sites */
export type HeroExitLayer = SectionExitLayer;

export type SectionExitScrubConfig = {
  start: string;
  end: string;
  scrub: number | boolean;
  y: number;
  exitOpacity: number;
  exitScrollHold: number;
  exitTweenDuration: number;
  exitItemStagger: number;
  exitLayerGap: number;
};

export function getHeroScrollBand(isLg: boolean) {
  return {
    ...heroScrollReveal,
    end: isLg ? heroScrollReveal.endDesktop : heroScrollReveal.endMobile,
  };
}

/**
 * About — two bands so exit isn’t pushed off-screen:
 * 1) Enter while rising into view (with deferred lead hold)
 * 2) Exit while `#about` top is still near the top (hero-style suck-up)
 */
export const aboutScrollReveal = {
  enterStart: "clamp(top 78%)",
  /** Longer enter band so heading → belief → copy → focus all scrub in */
  enterEnd: "clamp(top 26%)",
  exitStart: "clamp(top 18%)",
  exitEnd: "clamp(bottom 34%)",
  scrub: heroScrollReveal.scrub,
  y: heroScrollReveal.y,
  exitY: heroScrollReveal.exitYCopy,
  exitOpacity: heroScrollReveal.exitOpacityCopy,
  /** Lead hold before fade-up (deferred reveal) */
  enterScrollHold: 0.2,
  enterTweenDuration: 0.42,
  enterItemStagger: 0.07,
  enterLayerGap: 0.08,
  exitScrollHold: 0.24,
  exitTweenDuration: heroScrollReveal.exitTweenDuration,
  exitItemStagger: heroScrollReveal.exitItemStagger,
  exitLayerGap: heroScrollReveal.exitLayerGap,
  ease: heroScrollReveal.ease,
} as const;

export type SectionEnterScrubConfig = {
  start: string;
  end: string;
  scrub: number | boolean;
  y: number;
  enterScrollHold?: number;
  enterTweenDuration: number;
  enterItemStagger: number;
  enterLayerGap: number;
};

function enableHeroExitPointerEvents(items: HTMLElement[]) {
  items.forEach((el) => {
    el.style.pointerEvents = "auto";
    if (el.hasAttribute("data-hero-cta-panel")) {
      el.querySelectorAll<HTMLElement>("a[href]").forEach((link) => {
        link.style.pointerEvents = "auto";
      });
    }
  });
}

/** Shared scrubbed exit — scroll-linked suck-up that reverses on scroll up */
export function bindSectionExitScrub(
  section: Element,
  layers: SectionExitLayer[],
  config: SectionExitScrubConfig,
  options?: { enableHeroPointerEvents?: boolean },
) {
  const items = layers.flatMap((layer) =>
    gsap.utils.toArray(layer.targets),
  ) as HTMLElement[];

  if (!items.length) return null;

  if (options?.enableHeroPointerEvents) {
    enableHeroExitPointerEvents(items);
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: config.start,
      end: config.end,
      scrub: config.scrub,
      invalidateOnRefresh: true,
    },
  });

  const {
    exitScrollHold,
    exitTweenDuration,
    exitItemStagger,
    exitLayerGap,
  } = config;

  if (exitScrollHold > 0) {
    tl.to({}, { duration: exitScrollHold });
  }

  let sequentialAt = exitScrollHold;

  for (const layer of layers) {
    const targets = gsap.utils.toArray(layer.targets);
    if (!targets.length) continue;

    const count = targets.length;
    const exitOpacity = layer.exitOpacity ?? config.exitOpacity;
    const exitY = layer.exitY ?? config.y;
    const startAt =
      layer.at !== undefined ? exitScrollHold + layer.at : sequentialAt;

    tl.fromTo(
      targets,
      { opacity: 1, y: 0, force3D: true },
      {
        opacity: exitOpacity,
        y: -exitY,
        ease: "none",
        force3D: true,
        duration: exitTweenDuration,
        stagger: exitItemStagger,
        // Don't paint "from" on create — that forced opacity:1 and killed enter
        immediateRender: false,
      },
      startAt,
    );

    const layerSpan =
      exitTweenDuration + Math.max(0, count - 1) * exitItemStagger;

    if (layer.at === undefined) {
      sequentialAt += layerSpan + exitLayerGap;
    }
  }

  return tl;
}

/**
 * Below-fold enter only — scrubbed fade-up with optional lead hold.
 * Pair with `bindSectionExitScrub` on a later band so exit stays on-screen.
 */
export function bindSectionEnterScrub(
  section: Element,
  layers: SectionExitLayer[],
  config: SectionEnterScrubConfig,
) {
  const items = layers.flatMap((layer) =>
    gsap.utils.toArray(layer.targets),
  ) as HTMLElement[];

  if (!items.length) return null;

  items.forEach((el) => el.classList.add("gsap-bound"));
  gsap.set(items, { opacity: 0, y: config.y, force3D: true });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: config.start,
      end: config.end,
      scrub: config.scrub,
      invalidateOnRefresh: true,
    },
  });

  const {
    y,
    enterScrollHold = 0,
    enterTweenDuration,
    enterItemStagger,
    enterLayerGap,
  } = config;

  let at = 0;
  if (enterScrollHold > 0) {
    tl.to({}, { duration: enterScrollHold });
    at = enterScrollHold;
  }

  for (const layer of layers) {
    const targets = gsap.utils.toArray(layer.targets);
    if (!targets.length) continue;

    const count = targets.length;
    tl.fromTo(
      targets,
      { opacity: 0, y, force3D: true },
      {
        opacity: 1,
        y: 0,
        ease: "none",
        force3D: true,
        duration: enterTweenDuration,
        stagger: enterItemStagger,
        immediateRender: false,
      },
      at,
    );
    at +=
      enterTweenDuration +
      Math.max(0, count - 1) * enterItemStagger +
      enterLayerGap;
  }

  return tl;
}

/**
 * @deprecated Prefer bindSectionEnterScrub + bindSectionExitScrub — a single
 * band pushes exit off-screen on tall sections.
 */
export function bindSectionEnterExitScrub(
  section: Element,
  layers: SectionExitLayer[],
  config: SectionEnterScrubConfig & {
    exitOpacity: number;
    exitY?: number;
    readableHold: number;
    exitTweenDuration: number;
    exitItemStagger: number;
    exitLayerGap: number;
  },
) {
  const items = layers.flatMap((layer) =>
    gsap.utils.toArray(layer.targets),
  ) as HTMLElement[];

  if (!items.length) return null;

  items.forEach((el) => el.classList.add("gsap-bound"));
  gsap.set(items, { opacity: 0, y: config.y, force3D: true });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: config.start,
      end: config.end,
      scrub: config.scrub,
      invalidateOnRefresh: true,
    },
  });

  const {
    y,
    exitOpacity,
    enterScrollHold = 0,
    enterTweenDuration,
    enterItemStagger,
    enterLayerGap,
    readableHold,
    exitTweenDuration,
    exitItemStagger,
    exitLayerGap,
  } = config;
  const exitYDefault = config.exitY ?? y;

  let at = 0;

  if (enterScrollHold > 0) {
    tl.to({}, { duration: enterScrollHold });
    at = enterScrollHold;
  }

  for (const layer of layers) {
    const targets = gsap.utils.toArray(layer.targets);
    if (!targets.length) continue;

    const count = targets.length;
    tl.fromTo(
      targets,
      { opacity: 0, y, force3D: true },
      {
        opacity: 1,
        y: 0,
        ease: "none",
        force3D: true,
        duration: enterTweenDuration,
        stagger: enterItemStagger,
      },
      at,
    );
    at +=
      enterTweenDuration +
      Math.max(0, count - 1) * enterItemStagger +
      enterLayerGap;
  }

  if (readableHold > 0) {
    tl.to({}, { duration: readableHold }, at);
    at += readableHold;
  }

  let exitAt = at;
  for (const layer of layers) {
    const targets = gsap.utils.toArray(layer.targets);
    if (!targets.length) continue;

    const count = targets.length;
    const exitOpacityLayer = layer.exitOpacity ?? exitOpacity;
    const exitY = layer.exitY ?? exitYDefault;

    tl.fromTo(
      targets,
      { opacity: 1, y: 0, force3D: true },
      {
        opacity: exitOpacityLayer,
        y: -exitY,
        ease: "none",
        force3D: true,
        duration: exitTweenDuration,
        stagger: exitItemStagger,
      },
      exitAt,
    );

    exitAt +=
      exitTweenDuration +
      Math.max(0, count - 1) * exitItemStagger +
      exitLayerGap;
  }

  return tl;
}

/** Hero: mount entrance separate; scrub exit reverses on scroll up into `#home` */
export function bindHeroExitScrub(
  section: Element,
  layers: SectionExitLayer[],
  isLg = true,
) {
  const band = getHeroScrollBand(isLg);
  return bindSectionExitScrub(
    section,
    layers,
    {
      start: band.start,
      end: band.end,
      scrub: band.scrub,
      y: band.y,
      exitOpacity: band.exitOpacity,
      exitScrollHold: heroScrollReveal.exitScrollHold,
      exitTweenDuration: heroScrollReveal.exitTweenDuration,
      exitItemStagger: heroScrollReveal.exitItemStagger,
      exitLayerGap: heroScrollReveal.exitLayerGap,
    },
    { enableHeroPointerEvents: true },
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
  /** Skip onLeave when scrolling past (e.g. last section). Leave-back exit still runs. */
  disableExit?: boolean;
  /** Multiplier for exit duration vs enter (tail blocks default 0.95). */
  exitDurationFactor?: number;
};

/** One shared scrollEnd listener for last-section enter fallbacks. */
type EnterFallback = () => void;
const enterFallbacks = new Set<EnterFallback>();
let scrollEndBound = false;

function runEnterFallbacks() {
  for (const fn of enterFallbacks) fn();
}

function registerEnterFallback(fn: EnterFallback): () => void {
  enterFallbacks.add(fn);
  if (!scrollEndBound && typeof window !== "undefined") {
    ScrollTrigger.addEventListener("scrollEnd", runEnterFallbacks);
    scrollEndBound = true;
  }
  return () => {
    enterFallbacks.delete(fn);
    if (enterFallbacks.size === 0 && scrollEndBound) {
      ScrollTrigger.removeEventListener("scrollEnd", runEnterFallbacks);
      scrollEndBound = false;
    }
  };
}

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

/** Prefer section `#id` as scroll band for tail blocks (avoids “tip only” exit on small wrappers). */
export function resolveTailScrollBand(
  scope: Element,
  options: { scrollTrigger?: string; start?: string; end?: string } = {},
) {
  if (options.scrollTrigger) {
    return {
      scrollTrigger: options.scrollTrigger,
      start: options.start ?? sectionTailRevealScroll.start,
      end: options.end ?? sectionTailRevealScroll.end,
    };
  }

  const section = scope.closest("section[id]");
  if (section?.id) {
    return {
      scrollTrigger: `#${section.id}`,
      start: options.start ?? sectionTailRevealScroll.start,
      end: options.end ?? sectionTailRevealScroll.end,
    };
  }

  return {
    scrollTrigger: undefined,
    start: options.start ?? tailBlockRevealScroll.start,
    end: options.end ?? tailBlockRevealScroll.end,
  };
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
  const delay = options.delay ?? revealDefaults.delay;
  const exitDurationFactor = options.exitDurationFactor ?? 0.65;
  const exitDuration = duration * exitDurationFactor;

  const enter = {
    duration,
    ease,
    stagger,
    overwrite: "auto" as const,
  };
  /** Delay only on downward enter (from bottom) — not on scroll-up enter-back */
  const enterFromBottom = {
    ...enter,
    delay,
  };
  const exit = {
    duration: exitDuration,
    ease,
    stagger: stagger * (exitDurationFactor >= 0.9 ? 0.85 : 0.6),
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

    gsap.fromTo(
      targets,
      { opacity: 0, y, force3D: true, immediateRender: true },
      { opacity: 1, y: 0, force3D: true, ...enterFromBottom },
    );

    hasEntered = true;
  };

  /** Scroll down past end — exit upward (63b26d2 tail trick) */
  const playExitUp = () => {
    gsap.killTweensOf(targets);
    gsap.to(targets, { opacity: exitOpacity, y: -y, force3D: true, ...exit });
  };

  /** Scroll up into band — slide down from above (no delay; keeps top enter snappy) */
  const playEnterBack = () => {
    const firstTarget = gsap.utils.toArray(targets)[0] as Element | undefined;
    const opacity =
      firstTarget instanceof Element
        ? Number(gsap.getProperty(firstTarget, "opacity"))
        : 0;
    const currentY =
      firstTarget instanceof Element
        ? Number(gsap.getProperty(firstTarget, "y"))
        : 0;

    if (opacity >= 0.99 && Math.abs(currentY) < 2 && hasEntered) return;

    gsap.killTweensOf(targets);
    gsap.fromTo(
      targets,
      { opacity: 0, y: -y, force3D: true, immediateRender: true },
      { opacity: 1, y: 0, force3D: true, ...enter },
    );
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

  const markBound = () => {
    gsap.utils.toArray(targets).forEach((t) => {
      if (t instanceof Element) t.classList.add("gsap-bound");
    });
  };

  if (!options.entranceOnly) {
    gsap.set(targets, { opacity: 0, y, force3D: true });
    markBound();
  }

  if (inViewOnMount) {
    playEnter(true);
  } else if (!options.entranceOnly) {
    gsap.set(targets, { opacity: 0, y, force3D: true });
    markBound();
  }

  /** Hero copy: entrance on load only — no scroll band. Tail + below-fold keep full directional scroll. */
  const heroCopyEntranceOnly = options.entranceOnly && !end;
  const skipForwardExit = heroCopyEntranceOnly || options.disableExit;

  const tryEnterIfActive = () => {
    if (!options.entranceOnly && st.isActive && !hasEntered) {
      playEnter(true);
    }
  };

  let unregisterFallback: (() => void) | undefined;

  const st = ScrollTrigger.create({
    trigger,
    start,
    end,
    invalidateOnRefresh: true,
    onEnter: options.entranceOnly ? undefined : () => playEnter(),
    onLeave: skipForwardExit ? undefined : playExitUp,
    onEnterBack: heroCopyEntranceOnly ? undefined : () => playEnterBack(),
    onLeaveBack: heroCopyEntranceOnly ? undefined : playExitDown,
    onRefresh: options.disableExit
      ? (self) => {
          if (!options.entranceOnly && self.isActive && !hasEntered) {
            playEnter(true);
          }
        }
      : undefined,
    onKill: () => {
      unregisterFallback?.();
    },
  });

  if (options.disableExit && !options.entranceOnly) {
    unregisterFallback = registerEnterFallback(tryEnterIfActive);
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      tryEnterIfActive();
    });
  } else if (inViewOnMount) {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  return st;
}

export { gsap, ScrollTrigger, useGSAP };
