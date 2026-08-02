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

/** Mobile: sequential copy → rail. Desktop: copy + rail in parallel after hold. */
function getHeroExitLayers(root: HTMLElement, isLg: boolean): HeroExitLayer[] {
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

  if (isLg) {
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

  if (copyLayer) layers.push(copyLayer);
  if (ctaPanel) layers.push({ targets: ctaPanel });
  if (tail.length) layers.push({ targets: tail });
  if (cue.length) layers.push({ targets: cue });

  return layers;
}

function flattenExitLayers(layers: HeroExitLayer[]): HTMLElement[] {
  return layers.flatMap((layer) =>
    gsap.utils.toArray(layer.targets),
  ) as HTMLElement[];
}

function isHomeInView(home: HTMLElement) {
  const rect = home.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
}

function playMountEntrance(root: HTMLElement): gsap.core.Timeline | null {
  const copy = getRevealItems(root, "copy");
  const tail = getRevealItems(root, "tail");
  const cue = getRevealItems(root, "cue");
  const ctaPanel = getCtaPanel(root);

  if (!copy.length && !tail.length && !cue.length && !ctaPanel) return null;

  const all = flattenExitLayers(
    getHeroExitLayers(root, window.matchMedia(LG_QUERY).matches),
  );

  // CSS already plays the entrance on first paint — don't re-hide and replay.
  all.forEach((el) => el.classList.add("gsap-bound"));
  if (ctaPanel) {
    ctaPanel.classList.add("gsap-bound");
    ctaPanel.style.pointerEvents = "auto";
  }

  const tl = gsap.timeline();
  // Hand off to GSAP after CSS entrance finishes (delay + duration ≈ 0.3 + 0.72)
  tl.to({}, { duration: 0.85 });
  tl.add(() => {
    const targets = ctaPanel ? [...all, ctaPanel] : all;
    targets.forEach((el) => {
      el.style.animation = "none";
    });
    gsap.set(targets, { opacity: 1, y: 0, force3D: true });
  });

  return tl;
}

/**
 * Hero: mount entrance + staggered scrub exit (copy → CTAs → metrics → cue).
 * Scrub reverse = blocks return in reverse order when scrolling back up.
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

      const ctx = gsap.context(() => {
        const exitLayers = getHeroExitLayers(root, isLg);
        const scrubTargets = flattenExitLayers(exitLayers);
        if (!scrubTargets.length) return;

        const mount = isHomeInView(home) ? playMountEntrance(root) : null;

        const bindExit = () => bindHeroExitScrub(home, exitLayers, isLg);

        if (!mount) {
          gsap.set(scrubTargets, {
            opacity: 0,
            y: heroScrollReveal.y,
            force3D: true,
          });
          const ctaPanel = getCtaPanel(root);
          if (ctaPanel) ctaPanel.style.pointerEvents = "auto";
          bindExit();
        } else {
          mount.eventCallback("onComplete", bindExit);
        }
      }, root);

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => ctx.revert();
    },
    {
      scope: contentRef,
      dependencies: [prefersReducedMotion, isLg],
      revertOnUpdate: true,
    },
  );
}
