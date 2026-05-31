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

/** Tail exit band with earlier enter (sections near page bottom, e.g. contact). */
export const sectionTailEarlyEnterScroll = {
  start: "clamp(top 88%)",
  end: sectionTailRevealScroll.end,
} as const;

/** Stronger motion for tail enter/exit (sections below hero) */
export const tailMotion = {
  y: 64,
  duration: 0.85,
  stagger: 0.09,
  exitOpacity: 0.15,
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
  end: "clamp(bottom 22%)",
  scrub: 1.25,
  y: 96,
  duration: 0.95,
  stagger: 0.11,
  exitOpacity: 0.04,
  ease: "power2.inOut" as const,
} as const;

/** Hero: mount entrance separate; scrub exit reverses on scroll up into `#home` */
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
  /** Skip onLeave / onLeaveBack (e.g. last section on page). */
  disableExit?: boolean;
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
  const skipExit = heroCopyEntranceOnly || options.disableExit;

  const st = ScrollTrigger.create({
    trigger,
    start,
    end,
    invalidateOnRefresh: true,
    onEnter: options.entranceOnly ? undefined : () => playEnter(),
    onLeave: skipExit ? undefined : playExitUp,
    onEnterBack: heroCopyEntranceOnly ? undefined : () => playEnterBack(),
    onLeaveBack: skipExit ? undefined : playExitDown,
  });

  if (inViewOnMount) {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  } else if (!heroCopyEntranceOnly && !options.entranceOnly) {
    /* Last section / refresh mid-page: trigger may already be active before onEnter fires. */
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (st.isActive && !hasEntered) {
        playEnter(true);
      }
    });
  }

  return st;
}

export { gsap, ScrollTrigger, useGSAP };
