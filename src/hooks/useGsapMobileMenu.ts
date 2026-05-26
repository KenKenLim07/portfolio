"use client";

import { useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { gsap, initGsap } from "@/lib/gsap";

const RADIUS_ENTER = 56;
const RADIUS_REST = 8;

type UseGsapMobileMenuOptions = {
  open: boolean;
};

function hideOverlay(overlay: HTMLElement) {
  overlay.style.display = "none";
  gsap.set(overlay, {
    opacity: 0,
    pointerEvents: "none",
    visibility: "hidden",
  });
}

function showOverlayForAnimation(overlay: HTMLElement) {
  overlay.style.display = "block";
}

/**
 * Tajmirul-style mobile drawer: one GSAP timeline —
 * backdrop fade + panel slide + corner radius morph + link stagger.
 * Reverses cleanly on close.
 */
export function useGsapMobileMenu({ open }: UseGsapMobileMenuOptions) {
  const prefersReducedMotion = useReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const hasOpenedRef = useRef(false);
  const initializedRef = useRef(false);

  useLayoutEffect(() => {
    initGsap();
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;

    const links = panel.querySelectorAll<HTMLElement>("[data-menu-link]");

    hideOverlay(overlay);
    gsap.set(panel, {
      xPercent: 100,
      borderTopLeftRadius: prefersReducedMotion ? RADIUS_REST : RADIUS_ENTER,
      borderBottomLeftRadius: prefersReducedMotion ? RADIUS_REST : RADIUS_ENTER,
    });
    gsap.set(links, { opacity: 0, x: prefersReducedMotion ? 0 : 28 });

    initializedRef.current = true;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      timelineRef.current = gsap
        .timeline({ paused: true })
        .to(
          overlay,
          {
            opacity: 1,
            visibility: "visible",
            duration: 0.42,
            ease: "power2.out",
            onStart: () => {
              gsap.set(overlay, { pointerEvents: "auto" });
            },
          },
          0,
        )
        .to(
          panel,
          {
            xPercent: 0,
            borderTopLeftRadius: RADIUS_REST,
            borderBottomLeftRadius: RADIUS_REST,
            duration: 0.88,
            ease: "power3.inOut",
          },
          0,
        )
        .to(
          links,
          {
            opacity: 1,
            x: 0,
            duration: 0.55,
            stagger: 0.065,
            ease: "power3.out",
          },
          0.2,
        )
        .eventCallback("onReverseComplete", () => {
          hideOverlay(overlay);
        });
    }, panel);

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      hasOpenedRef.current = false;
      initializedRef.current = false;
      ctx.revert();
    };
  }, [prefersReducedMotion]);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!initializedRef.current || !overlay || !panel) return;

    const links = panel.querySelectorAll<HTMLElement>("[data-menu-link]");

    if (prefersReducedMotion) {
      if (open) {
        showOverlayForAnimation(overlay);
        gsap.set(overlay, {
          opacity: 1,
          pointerEvents: "auto",
          visibility: "visible",
        });
        gsap.set(panel, {
          xPercent: 0,
          borderTopLeftRadius: RADIUS_REST,
          borderBottomLeftRadius: RADIUS_REST,
        });
        gsap.set(links, { opacity: 1, x: 0 });
      } else {
        hideOverlay(overlay);
        gsap.set(panel, { xPercent: 100 });
        gsap.set(links, { opacity: 0, x: 0 });
      }
      return;
    }

    const tl = timelineRef.current;
    if (!tl) return;

    if (open) {
      hasOpenedRef.current = true;
      showOverlayForAnimation(overlay);
      tl.progress(0).pause();
      tl.play();
      return;
    }

    if (!hasOpenedRef.current) {
      hideOverlay(overlay);
      tl.progress(0).pause();
      return;
    }

    tl.reverse();
  }, [open, prefersReducedMotion]);

  return { overlayRef, panelRef };
}
