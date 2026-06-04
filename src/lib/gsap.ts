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

/** Staggered scrub reveal — shared by hero exit and page sections. */
export const scrollRevealMotion = {
  scrub: 1,
  y: 64,
  exitOpacity: 0.15,
  enterTweenDuration: 0.38,
  exitTweenDuration: 0.42,
  itemStagger: 0.07,
  layerGap: 0.1,
  /** Gap on scrub timeline between enter phase and exit phase */
  enterExitGap: 0.12,
  ease: "power2.inOut" as const,
} as const;

/** Scroll band for `<section id="…">` enter + vacuum exit */
export const sectionScrollBand = {
  start: "clamp(top bottom-=8%)",
  end: "clamp(bottom 52%)",
} as const;

/** Footer / last block: scrub enter only (no forward exit) */
export const sectionEnterOnlyBand = {
  start: "clamp(top 88%)",
  end: "clamp(bottom 62%)",
} as const;

/**
 * Hero scroll exit — scrubbed to scroll distance (not a one-shot tween).
 * Mount entrance is separate; this timeline is exit-only.
 */
export const heroScrollReveal = {
  start: "clamp(top top)",
  end: "clamp(bottom 48%)",
  endMobile: "clamp(bottom 32%)",
  scrub: scrollRevealMotion.scrub,
  y: 108,
  duration: 0.95,
  stagger: 0.11,
  exitTweenDuration: scrollRevealMotion.exitTweenDuration,
  exitItemStagger: scrollRevealMotion.itemStagger,
  exitLayerGap: scrollRevealMotion.layerGap,
  exitOpacity: scrollRevealMotion.exitOpacity,
  ease: scrollRevealMotion.ease,
} as const;

export type ScrollRevealLayer = {
  targets: gsap.TweenTarget;
};

/** @deprecated Alias for hero hook */
export type HeroExitLayer = ScrollRevealLayer;

export function getHeroScrollBand(isLg: boolean) {
  return {
    ...heroScrollReveal,
    end: isLg ? heroScrollReveal.end : heroScrollReveal.endMobile,
  };
}

function markScrollRevealBound(items: HTMLElement[]) {
  items.forEach((el) => el.classList.add("gsap-bound"));
}

function enableScrollRevealPointerEvents(items: HTMLElement[]) {
  items.forEach((el) => {
    el.style.pointerEvents = "auto";
    if (el.hasAttribute("data-hero-cta-panel")) {
      el.querySelectorAll<HTMLElement>("a[href]").forEach((link) => {
        link.style.pointerEvents = "auto";
      });
    }
  });
}

export type BindScrollRevealOptions = {
  trigger: Element;
  layers: ScrollRevealLayer[];
  start: string;
  end: string;
  scrub?: number;
  y?: number;
  exitOpacity?: number;
  /** Content starts visible; timeline only vacuums up (hero). */
  exitOnly?: boolean;
  /** Scrub enter on scroll-in; no vacuum when scrolling past (contact/footer). */
  enterOnly?: boolean;
  enterTweenDuration?: number;
  exitTweenDuration?: number;
  itemStagger?: number;
  layerGap?: number;
  enterExitGap?: number;
};

/**
 * Staggered scrub timeline: enter (below → visible) then exit (vacuum up).
 * Hero uses `exitOnly`. Reverses cleanly on scroll-up.
 */
export function bindScrollRevealScrub(options: BindScrollRevealOptions) {
  const {
    trigger,
    layers,
    start,
    end,
    scrub = scrollRevealMotion.scrub,
    y = scrollRevealMotion.y,
    exitOpacity = scrollRevealMotion.exitOpacity,
    exitOnly = false,
    enterOnly = false,
    enterTweenDuration = scrollRevealMotion.enterTweenDuration,
    exitTweenDuration = scrollRevealMotion.exitTweenDuration,
    itemStagger = scrollRevealMotion.itemStagger,
    layerGap = scrollRevealMotion.layerGap,
    enterExitGap = scrollRevealMotion.enterExitGap,
  } = options;

  const items = layers.flatMap((layer) =>
    gsap.utils.toArray(layer.targets),
  ) as HTMLElement[];

  if (!items.length) return null;

  if (exitOnly) {
    gsap.set(items, { opacity: 1, y: 0, force3D: true });
  } else {
    gsap.set(items, { opacity: 0, y, force3D: true });
    markScrollRevealBound(items);
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger,
      start,
      end,
      scrub,
      invalidateOnRefresh: true,
    },
  });

  let position = 0;

  if (!exitOnly) {
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
          stagger: itemStagger,
        },
        position,
      );

      position +=
        enterTweenDuration + Math.max(0, count - 1) * itemStagger + layerGap;
    }
  }

  if (!enterOnly) {
    let exitPos = exitOnly ? 0 : position + enterExitGap;

    for (const layer of layers) {
      const targets = gsap.utils.toArray(layer.targets);
      if (!targets.length) continue;

      const count = targets.length;
      tl.fromTo(
        targets,
        { opacity: 1, y: 0, force3D: true },
        {
          opacity: exitOpacity,
          y: -y,
          ease: "none",
          force3D: true,
          duration: exitTweenDuration,
          stagger: itemStagger,
        },
        exitPos,
      );

      exitPos +=
        exitTweenDuration + Math.max(0, count - 1) * itemStagger + layerGap;
    }
  }

  enableScrollRevealPointerEvents(items);

  return tl;
}

/** Hero: mount entrance separate; scrub exit reverses on scroll up into `#home` */
export function bindHeroExitScrub(
  section: Element,
  layers: ScrollRevealLayer[],
  isLg = true,
) {
  const band = getHeroScrollBand(isLg);

  return bindScrollRevealScrub({
    trigger: section,
    layers,
    start: band.start,
    end: band.end,
    scrub: band.scrub,
    y: band.y,
    exitOpacity: band.exitOpacity,
    exitOnly: true,
    exitTweenDuration: band.exitTweenDuration,
    itemStagger: band.exitItemStagger,
    layerGap: band.exitLayerGap,
  });
}

export function layersFromRevealItems(
  items: HTMLElement[],
): ScrollRevealLayer[] {
  return items.map((el) => ({ targets: el }));
}

export { gsap, ScrollTrigger, useGSAP };
