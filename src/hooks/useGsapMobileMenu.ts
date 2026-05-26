"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { gsap, initGsap } from "@/lib/gsap";

const RADIUS_ENTER = 56;
const RADIUS_REST = 8;

type UseGsapMobileMenuOptions = {
  open: boolean;
};

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

  useLayoutEffect(() => {
    initGsap();
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;

    if (prefersReducedMotion) {
      gsap.set(overlay, {
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
      });
      gsap.set(panel, {
        xPercent: open ? 0 : 100,
        borderTopLeftRadius: RADIUS_REST,
        borderBottomLeftRadius: RADIUS_REST,
      });
      const links = panel.querySelectorAll<HTMLElement>("[data-menu-link]");
      gsap.set(links, { opacity: open ? 1 : 0, x: 0 });
      return;
    }

    const links = panel.querySelectorAll<HTMLElement>("[data-menu-link]");

    const ctx = gsap.context(() => {
      gsap.set(overlay, { opacity: 0, pointerEvents: "none" });
      gsap.set(panel, {
        xPercent: 100,
        borderTopLeftRadius: RADIUS_ENTER,
        borderBottomLeftRadius: RADIUS_ENTER,
      });
      gsap.set(links, { opacity: 0, x: 28 });

      timelineRef.current = gsap
        .timeline({ paused: true })
        .to(
          overlay,
          {
            opacity: 1,
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
          gsap.set(overlay, { pointerEvents: "none" });
        });
    }, panel);

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      ctx.revert();
    };
  }, [open, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const tl = timelineRef.current;
    if (!tl) return;

    if (open) {
      tl.play();
    } else {
      tl.reverse();
    }
  }, [open, prefersReducedMotion]);

  return { overlayRef, panelRef };
}
