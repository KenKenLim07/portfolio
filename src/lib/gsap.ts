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
  duration: 0.85,
  stagger: 0.09,
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
 *   start: hero top at viewport top → fully visible
 *   end:   hero bottom crosses band   → vacuumed up
 *
 * Desktop uses an earlier end (stronger vacuum). Mobile uses a longer band so
 * copy/CTAs stay readable after a small scroll — tall stacked layout + short
 * viewport needs a higher end % than desktop so the fade is not instant.
 */
export const heroScrollReveal = {
  start: "clamp(top top)",
  end: "clamp(bottom 48%)",
  endMobile: "clamp(bottom 32%)",
  scrub: 1,
  y: 108,
  duration: 0.95,
  stagger: 0.11,
  /** Scrub timeline: span of each block’s exit tween */
  exitTweenDuration: 0.42,
  /** Offset between copy lines / blocks while exiting */
  exitItemStagger: 0.07,
  /** Gap on the scrub timeline before the next layer starts */
  exitLayerGap: 0.1,
  exitOpacity: tailMotion.exitOpacity,
  ease: "power2.inOut" as const,
} as const;

export type HeroExitLayer = {
  targets: gsap.TweenTarget;
};

export function getHeroScrollBand(isLg: boolean) {
  return {
    ...heroScrollReveal,
    end: isLg ? heroScrollReveal.end : heroScrollReveal.endMobile,
  };
}

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

/** Hero: mount entrance separate; scrub exit reverses on scroll up into `#home` */
export function bindHeroExitScrub(
  section: Element,
  layers: HeroExitLayer[],
  isLg = true,
) {
  const config = getHeroScrollBand(isLg);
  const items = layers.flatMap((layer) =>
    gsap.utils.toArray(layer.targets),
  ) as HTMLElement[];

  if (!items.length) return null;

  enableHeroExitPointerEvents(items);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: config.start,
      end: config.end,
      scrub: config.scrub,
      invalidateOnRefresh: true,
    },
  });

  let position = 0;

  for (const layer of layers) {
    const targets = gsap.utils.toArray(layer.targets);
    if (!targets.length) continue;

    const count = targets.length;
    const { exitTweenDuration, exitItemStagger, exitLayerGap } = heroScrollReveal;

    tl.fromTo(
      targets,
      { opacity: 1, y: 0, force3D: true },
      {
        opacity: config.exitOpacity,
        y: -config.y,
        ease: "none",
        force3D: true,
        duration: exitTweenDuration,
        stagger: exitItemStagger,
      },
      position,
    );

    const layerSpan =
      exitTweenDuration + Math.max(0, count - 1) * exitItemStagger;
    position += layerSpan + exitLayerGap;
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
  const delay = options.delay ?? 0;
  const exitDurationFactor = options.exitDurationFactor ?? 0.65;
  const exitDuration = duration * exitDurationFactor;

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
      { opacity: 1, y: 0, force3D: true, ...enter },
    );

    hasEntered = true;
  };

  /** Scroll down past end — exit upward (63b26d2 tail trick) */
  const playExitUp = () => {
    gsap.killTweensOf(targets);
    gsap.to(targets, { opacity: exitOpacity, y: -y, force3D: true, ...exit });
  };

  /** Scroll up into band — slide down from above (scroll up the page, content enters from top) */
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
