"use client";

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import {
  aboutScrollReveal,
  bindSectionEnterScrub,
  bindSectionExitScrub,
  gsap,
  initGsap,
  ScrollTrigger,
  type SectionExitLayer,
} from "@/lib/gsap";

function layerItems(root: HTMLElement, name: string): HTMLElement[] {
  const layer = root.querySelector<HTMLElement>(`[data-about-layer="${name}"]`);
  if (!layer) return [];
  const marked = Array.from(
    layer.querySelectorAll<HTMLElement>("[data-gsap-reveal]"),
  );
  return marked.length ? marked : [layer];
}

function getAboutLayers(root: HTMLElement): SectionExitLayer[] {
  const layerNames = ["heading", "belief", "copy", "focus"] as const;
  const layers: SectionExitLayer[] = [];

  for (const name of layerNames) {
    const items = layerItems(root, name);
    if (!items.length) continue;
    layers.push({
      targets: items,
      exitOpacity: aboutScrollReveal.exitOpacity,
      exitY: aboutScrollReveal.exitY,
    });
  }

  return layers;
}

/**
 * About: enter scrub (deferred) while rising into view, then a separate
 * hero-style exit scrub while the section top is still on screen.
 */
export function useAboutScrollReveal(
  contentRef: RefObject<HTMLElement | null>,
) {
  const prefersReducedMotion = useGsapReducedMotion();

  useGSAP(
    () => {
      initGsap();
      const about = document.getElementById("about");
      const root = contentRef.current;
      if (!about || !root || prefersReducedMotion) return;

      const layers = getAboutLayers(root);
      if (!layers.length) return;

      const ctx = gsap.context(() => {
        bindSectionEnterScrub(about, layers, {
          start: aboutScrollReveal.enterStart,
          end: aboutScrollReveal.enterEnd,
          scrub: aboutScrollReveal.enterScrub,
          y: aboutScrollReveal.y,
          enterScrollHold: aboutScrollReveal.enterScrollHold,
          enterTweenDuration: aboutScrollReveal.enterTweenDuration,
          enterItemStagger: aboutScrollReveal.enterItemStagger,
        });

        bindSectionExitScrub(about, layers, {
          start: aboutScrollReveal.exitStart,
          end: aboutScrollReveal.exitEnd,
          scrub: aboutScrollReveal.scrub,
          y: aboutScrollReveal.y,
          exitOpacity: aboutScrollReveal.exitOpacity,
          exitScrollHold: aboutScrollReveal.exitScrollHold,
          exitTweenDuration: aboutScrollReveal.exitTweenDuration,
          exitItemStagger: aboutScrollReveal.exitItemStagger,
          exitLayerGap: aboutScrollReveal.exitLayerGap,
        });
      }, root);

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => ctx.revert();
    },
    {
      scope: contentRef,
      dependencies: [prefersReducedMotion],
    },
  );
}
