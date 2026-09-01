"use client";

import { useSyncExternalStore, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import {
  bindHeroExitScrub,
  gsap,
  heroScrollReveal,
  initGsap,
  ScrollTrigger,
  type HeroExitLayer,
} from "@/lib/gsap";
import { getLayoutViewportHeight } from "@/lib/viewport-resize";

const LG_QUERY = "(min-width: 1024px)";

type HeroGroup = "copy" | "tail" | "cue";

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function getActivePanel(root: HTMLElement): HTMLElement | null {
  const lg = window.matchMedia(LG_QUERY).matches;
  return root.querySelector<HTMLElement>(
    lg ? '[data-hero-panel="desktop"]' : '[data-hero-panel="mobile"]',
  );
}

function getRevealItems(root: HTMLElement, group?: HeroGroup): HTMLElement[] {
  const panel = getActivePanel(root);
  if (!panel) return [];
  const selector = group
    ? `[data-gsap-reveal][data-hero-group="${group}"]`
    : "[data-gsap-reveal]";
  return Array.from(panel.querySelectorAll<HTMLElement>(selector));
}

function getCtaPanel(root: HTMLElement): HTMLElement | null {
  const panel = getActivePanel(root);
  return panel?.querySelector<HTMLElement>("[data-hero-cta-panel]") ?? null;
}

/** Mobile + desktop: parallel exit rail so partial scrub doesn't strand copy while CTAs show. */
function getHeroExitLayers(root: HTMLElement): HeroExitLayer[] {
  const copy = getRevealItems(root, "copy");
  const ctaPanel = getCtaPanel(root);
  const tail = getRevealItems(root, "tail");
  const cue = getRevealItems(root, "cue");
  const layers: HeroExitLayer[] = [];

  const copyLayer: HeroExitLayer | null = copy.length
    ? {
        targets: copy,
        exitOpacity: heroScrollReveal.exitOpacityCopy,
        exitY: heroScrollReveal.exitYCopy,
      }
    : null;

  const { exitRailStagger } = heroScrollReveal;
  let railAt = 0;

  if (copyLayer) layers.push({ ...copyLayer, at: 0 });
  if (ctaPanel) {
    layers.push({ targets: ctaPanel, at: railAt });
    railAt += exitRailStagger;
  }
  if (tail.length) {
    layers.push({ targets: tail, at: railAt });
    railAt += exitRailStagger;
  }
  if (cue.length) layers.push({ targets: cue, at: railAt });

  return layers;
}

function flattenExitLayers(layers: HeroExitLayer[]): HTMLElement[] {
  return layers.flatMap((layer) =>
    gsap.utils.toArray(layer.targets),
  ) as HTMLElement[];
}

function isHomeInView(home: HTMLElement) {
  const rect = home.getBoundingClientRect();
  const viewportH = getLayoutViewportHeight();
  return rect.top < viewportH * 0.92 && rect.bottom > 0;
}

function markBound(els: HTMLElement[]) {
  els.forEach((el) => el.classList.add("gsap-bound"));
}

/**
 * Hero ships two panels (mobile + desktop). Only the active panel is scrubbed;
 * the hidden panel is painted visible so breakpoint swaps don't flash blank.
 */
function paintInactiveHeroPanel(root: HTMLElement, isLg: boolean) {
  const inactive = root.querySelector<HTMLElement>(
    isLg ? '[data-hero-panel="mobile"]' : '[data-hero-panel="desktop"]',
  );
  if (!inactive) return;

  const items = Array.from(
    inactive.querySelectorAll<HTMLElement>(
      "[data-gsap-reveal], [data-hero-cta-panel]",
    ),
  );
  if (!items.length) return;

  markBound(items);
  gsap.set(items, { opacity: 1, y: 0, force3D: true });
  items.forEach((el) => {
    if (el.hasAttribute("data-hero-cta-panel")) {
      el.style.pointerEvents = "auto";
    }
  });
}

/** Show the active hero panel immediately — no mount entrance animation. */
function initializeHeroVisible(root: HTMLElement, isLg: boolean) {
  paintInactiveHeroPanel(root, isLg);

  const exitLayers = getHeroExitLayers(root);
  const targets = flattenExitLayers(exitLayers);
  const ctaPanel = getCtaPanel(root);
  const all = ctaPanel ? [...targets, ctaPanel] : targets;

  if (!all.length) return;

  markBound(all);
  gsap.set(all, { opacity: 1, y: 0, force3D: true });
  if (ctaPanel) ctaPanel.style.pointerEvents = "auto";
}

/**
 * Hero: visible on load, scrub exit on scroll (copy, CTAs, metrics, cue in parallel).
 */
export function useHeroScrollReveal(
  contentRef: RefObject<HTMLElement | null>,
) {
  const prefersReducedMotion = useGsapReducedMotion();
  const isLg = useMediaQuery(LG_QUERY);

  useGSAP(
    () => {
      initGsap();
      const home = document.getElementById("home");
      const root = contentRef.current;
      if (!home || !root || prefersReducedMotion) return;

      let ctx: gsap.Context | undefined;
      let removeScrollEnd: (() => void) | undefined;
      let heroTimeline: gsap.core.Timeline | null = null;

      const bindExit = () => {
        ctx?.revert();
        ctx = undefined;
        removeScrollEnd?.();
        removeScrollEnd = undefined;
        heroTimeline = null;

        const exitLayers = getHeroExitLayers(root);
        if (!flattenExitLayers(exitLayers).length) return;

        paintInactiveHeroPanel(root, isLg);

        if (isHomeInView(home)) {
          initializeHeroVisible(root, isLg);
        } else {
          const scrubTargets = flattenExitLayers(exitLayers);
          const ctaPanel = getCtaPanel(root);
          const all = ctaPanel ? [...scrubTargets, ctaPanel] : scrubTargets;
          gsap.set(all, {
            opacity: 0,
            y: heroScrollReveal.y,
            force3D: true,
          });
          markBound(all);
          if (ctaPanel) ctaPanel.style.pointerEvents = "auto";
        }

        ctx = gsap.context(() => {
          heroTimeline = bindHeroExitScrub(home, exitLayers, isLg);
        }, root);

        if (!isLg) {
          const syncAtTop = () => {
            if (window.scrollY > 12) return;
            const st = heroTimeline?.scrollTrigger;
            if (st && st.progress > 0.02) {
              ScrollTrigger.refresh();
            }
          };
          ScrollTrigger.addEventListener("scrollEnd", syncAtTop);
          removeScrollEnd = () => {
            ScrollTrigger.removeEventListener("scrollEnd", syncAtTop);
          };
        }
      };

      bindExit();
      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        removeScrollEnd?.();
        ctx?.revert();
      };
    },
    {
      scope: contentRef,
      dependencies: [prefersReducedMotion, isLg],
      revertOnUpdate: true,
    },
  );
}
