"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
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
 */
export function useGsapMobileMenu({ open }: UseGsapMobileMenuOptions) {
  const prefersReducedMotion = useGsapReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const hasOpenedRef = useRef(false);

  useGSAP(
    () => {
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
      }, panel);

      return () => {
        timelineRef.current?.kill();
        timelineRef.current = null;
        hasOpenedRef.current = false;
        ctx.revert();
      };
    },
    {
      scope: panelRef,
      dependencies: [open, prefersReducedMotion],
      revertOnUpdate: true,
    },
  );

  return { overlayRef, panelRef };
}
