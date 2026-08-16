"use client";

import { useRef, useSyncExternalStore, type RefObject } from "react";
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

function markBound(els: HTMLElement[]) {
  els.forEach((el) => el.classList.add("gsap-bound"));
}

/**
 * Hero ships two panels (mobile + desktop). Entrance/scrub only touch the active
 * one — the other stays at CSS opacity:0 and looks blank after a breakpoint
 * resize. Keep the *hidden* panel paint-ready. Never reset the active panel
 * here (that fought the exit scrub and caused rewind).
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
  gsap.set(items, { opacity: 1, y: 0, scale: 1, force3D: true });
  items.forEach((el) => {
    if (el.hasAttribute("data-hero-cta-panel")) {
      el.style.pointerEvents = "auto";
    }
  });
}

/** Staggered fade-up on hydrate — runs when the user can actually see it. */
function playMountEntrance(root: HTMLElement): gsap.core.Timeline | null {
  const copy = getRevealItems(root, "copy");
  const tail = getRevealItems(root, "tail");
  const cue = getRevealItems(root, "cue");
  const ctaPanel = getCtaPanel(root);

  if (!copy.length && !tail.length && !cue.length && !ctaPanel) return null;

  const { y, duration, stagger, ease, enterScale } = heroScrollReveal;
  const all = flattenExitLayers(
    getHeroExitLayers(root, window.matchMedia(LG_QUERY).matches),
  );
  const withCta = ctaPanel ? [...all, ctaPanel] : all;

  markBound(withCta);
  gsap.set(withCta, {
    opacity: 0,
    y,
    scale: enterScale,
    force3D: true,
    transformOrigin: "center center",
  });
  if (ctaPanel) ctaPanel.style.pointerEvents = "auto";

  const enter = {
    opacity: 1,
    y: 0,
    scale: 1,
    stagger,
    duration,
    ease,
    force3D: true,
  } as const;

  const tl = gsap.timeline();
  if (copy.length) {
    tl.to(copy, { ...enter }, 0.04);
  }
  const bandTargets = ctaPanel ? [...tail, ctaPanel] : tail;
  if (bandTargets.length) {
    tl.to(bandTargets, { ...enter }, 0.16);
  }
  if (cue.length) {
    tl.to(cue, { opacity: 1, y: 0, scale: 1, duration, ease, force3D: true }, 0.3);
  }

  return tl;
}

/**
 * Hero: mount entrance + staggered scrub exit (copy → CTAs → metrics → cue).
 * Entrance plays once (survives lg breakpoint rebind). Scrub rebinds on layout
 * only after entrance finishes — otherwise fromTo(opacity:1) snaps the fade.
 */
export function useHeroScrollReveal(
  contentRef: RefObject<HTMLElement | null>,
) {
  const prefersReducedMotion = useGsapReducedMotion();
  const isLg = useMediaQuery(LG_QUERY);
  const didEnterRef = useRef(false);
  const entranceTlRef = useRef<gsap.core.Timeline | null>(null);

  // Entrance once — not tied to isLg, so breakpoint hydrate can't cancel mid-fade
  useGSAP(
    () => {
      initGsap();
      const home = document.getElementById("home");
      const root = contentRef.current;
      if (!home || !root || prefersReducedMotion) return;
      if (didEnterRef.current || !isHomeInView(home)) return;

      didEnterRef.current = true;
      const tl = playMountEntrance(root);
      entranceTlRef.current = tl;

      return () => {
        // Dev Strict Mode remount: allow a fresh fade if we never finished
        if (tl && tl.progress() < 1) {
          tl.kill();
          entranceTlRef.current = null;
          didEnterRef.current = false;
        }
      };
    },
    {
      scope: contentRef,
      dependencies: [prefersReducedMotion],
    },
  );

  // Scroll-exit scrub — safe to rebuild when desktop/mobile panel swaps
  useGSAP(
    () => {
      initGsap();
      const home = document.getElementById("home");
      const root = contentRef.current;
      if (!home || !root || prefersReducedMotion) return;

      let ctx: gsap.Context | undefined;

      const bindExit = () => {
        ctx?.revert();
        ctx = undefined;

        const exitLayers = getHeroExitLayers(root, isLg);
        if (!flattenExitLayers(exitLayers).length) return;

        // Outside context so revertOnUpdate can't clear it — resize-only prep
        paintInactiveHeroPanel(root, isLg);

        ctx = gsap.context(() => {
          bindHeroExitScrub(home, exitLayers, isLg);
        }, root);
      };

      const afterEntrance = (fn: () => void) => {
        const entrance = entranceTlRef.current;
        if (entrance && entrance.progress() < 1) {
          entrance.eventCallback("onComplete", () => {
            entranceTlRef.current = null;
            fn();
          });
          return;
        }
        entranceTlRef.current = null;
        fn();
      };

      if (!isHomeInView(home) && !didEnterRef.current) {
        const exitLayers = getHeroExitLayers(root, isLg);
        const scrubTargets = flattenExitLayers(exitLayers);
        gsap.set(scrubTargets, {
          opacity: 0,
          y: heroScrollReveal.y,
          scale: heroScrollReveal.enterScale,
          force3D: true,
          transformOrigin: "center center",
        });
        markBound(scrubTargets);
        const ctaPanel = getCtaPanel(root);
        if (ctaPanel) {
          gsap.set(ctaPanel, {
            opacity: 0,
            y: heroScrollReveal.y,
            scale: heroScrollReveal.enterScale,
            force3D: true,
            transformOrigin: "center center",
          });
          markBound([ctaPanel]);
          ctaPanel.style.pointerEvents = "auto";
        }
        paintInactiveHeroPanel(root, isLg);
        ctx = gsap.context(() => {
          bindHeroExitScrub(home, exitLayers, isLg);
        }, root);
      } else {
        afterEntrance(() => {
          if (!didEnterRef.current) {
            requestAnimationFrame(() => afterEntrance(bindExit));
            return;
          }
          bindExit();
        });
      }

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => ctx?.revert();
    },
    {
      scope: contentRef,
      dependencies: [prefersReducedMotion, isLg],
      revertOnUpdate: true,
    },
  );
}
