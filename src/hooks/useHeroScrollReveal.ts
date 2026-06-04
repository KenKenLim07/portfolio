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
  type ScrollRevealLayer,
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

/** Exit order: copy lines → CTAs → metrics → scroll cue (staggered on scrub timeline). */
function getHeroExitLayers(root: HTMLElement): ScrollRevealLayer[] {
  const copy = getRevealItems(root, "copy");
  const ctaPanel = getCtaPanel(root);
  const tail = getRevealItems(root, "tail");
  const cue = getRevealItems(root, "cue");
  const layers: ScrollRevealLayer[] = [];

  if (copy.length) layers.push({ targets: copy });
  if (ctaPanel) layers.push({ targets: ctaPanel });
  if (tail.length) layers.push({ targets: tail });
  if (cue.length) layers.push({ targets: cue });

  return layers;
}

function flattenExitLayers(layers: ScrollRevealLayer[]): HTMLElement[] {
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

  const { y, duration, stagger, ease } = heroScrollReveal;
  const all = flattenExitLayers(getHeroExitLayers(root));

  gsap.set(all, { opacity: 0, y, force3D: true });
  if (ctaPanel) ctaPanel.style.pointerEvents = "auto";

  const tl = gsap.timeline();
  if (copy.length) {
    tl.to(
      copy,
      { opacity: 1, y: 0, stagger, duration, ease, force3D: true },
      0.05,
    );
  }
  const bandTargets = ctaPanel ? [...tail, ctaPanel] : tail;
  if (bandTargets.length) {
    tl.to(
      bandTargets,
      { opacity: 1, y: 0, stagger, duration, ease, force3D: true },
      0.18,
    );
  }
  if (cue.length) {
    tl.to(cue, { opacity: 1, y: 0, duration, ease, force3D: true }, 0.34);
  }

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
        const exitLayers = getHeroExitLayers(root);
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
