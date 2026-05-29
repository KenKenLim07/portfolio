"use client";

import { useSyncExternalStore, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import {
  createScrubScrollReveal,
  gsap,
  heroScrollReveal,
  initGsap,
  ScrollTrigger,
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

function isHomeInView(home: HTMLElement) {
  const rect = home.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
}

function playMountEntrance(root: HTMLElement): gsap.core.Timeline | null {
  const all = getRevealItems(root);
  const copy = getRevealItems(root, "copy");
  const tail = getRevealItems(root, "tail");
  const cue = getRevealItems(root, "cue");

  if (!all.length) return null;

  const { y, duration, stagger, ease } = heroScrollReveal;

  gsap.set(all, { opacity: 0, y, force3D: true });

  const tl = gsap.timeline();
  if (copy.length) {
    tl.to(
      copy,
      { opacity: 1, y: 0, stagger, duration, ease, force3D: true },
      0.05,
    );
  }
  if (tail.length) {
    tl.to(
      tail,
      { opacity: 1, y: 0, stagger, duration, ease, force3D: true },
      0.2,
    );
  }
  if (cue.length) {
    tl.to(cue, { opacity: 1, y: 0, duration, ease, force3D: true }, 0.34);
  }
  return tl;
}

function bindHeroScrollScrub(home: HTMLElement, all: HTMLElement[]) {
  createScrubScrollReveal(home, all, {
    mode: "exitOnly",
    start: heroScrollReveal.start,
    end: heroScrollReveal.end,
    scrub: heroScrollReveal.scrub,
    y: heroScrollReveal.y,
    stagger: heroScrollReveal.stagger,
    exitOpacity: heroScrollReveal.exitOpacity,
  });
}

/**
 * One scrubbed ScrollTrigger on `#home` — copy, tail, and cue move together
 * over a long scroll band (reverses cleanly on fast scroll up).
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
        const all = getRevealItems(root);
        if (!all.length) return;

        const mount = isHomeInView(home) ? playMountEntrance(root) : null;

        if (!mount) {
          gsap.set(all, { opacity: 0, y: heroScrollReveal.y, force3D: true });
          bindHeroScrollScrub(home, all);
        } else {
          mount.eventCallback("onComplete", () => bindHeroScrollScrub(home, all));
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
