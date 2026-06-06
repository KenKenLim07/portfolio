"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { gsap, initGsap } from "@/lib/gsap";

/** Circle origin — aligned with the burger button (top-right of the drawer). */
const CLIP_ORIGIN =
  "calc(100% - 1.75rem) max(1.75rem, calc(env(safe-area-inset-top) + 1.75rem))";

const CLIP_CLOSED = `circle(0px at ${CLIP_ORIGIN})`;
const CLIP_OPEN = `circle(150vmax at ${CLIP_ORIGIN})`;

type UseGsapMobileMenuOptions = {
  open: boolean;
};

export function useGsapMobileMenu({ open }: UseGsapMobileMenuOptions) {
  const prefersReducedMotion = useGsapReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const openRef = useRef(open);

  openRef.current = open;

  useGSAP(
    () => {
      initGsap();
      const overlay = overlayRef.current;
      const panel = panelRef.current;
      if (!overlay || !panel) return;

      const links = panel.querySelectorAll<HTMLElement>("[data-menu-link]");

      gsap.set(overlay, {
        opacity: 0,
        visibility: "hidden",
        pointerEvents: "none",
      });
      gsap.set(panel, {
        clipPath: CLIP_CLOSED,
        WebkitClipPath: CLIP_CLOSED,
        pointerEvents: "none",
      });
      gsap.set(links, { opacity: 0, y: 14 });

      if (prefersReducedMotion) {
        timelineRef.current = null;
        return;
      }

      timelineRef.current = gsap
        .timeline({ paused: true })
        .to(
          overlay,
          {
            opacity: 1,
            visibility: "visible",
            duration: 0.35,
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
            clipPath: CLIP_OPEN,
            WebkitClipPath: CLIP_OPEN,
            duration: 0.9,
            ease: "power3.inOut",
            onStart: () => {
              gsap.set(panel, { pointerEvents: "auto" });
            },
          },
          0,
        )
        .to(
          links,
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.06,
            ease: "power3.out",
          },
          0.28,
        )
        .eventCallback("onReverseComplete", () => {
          gsap.set(overlay, {
            opacity: 0,
            visibility: "hidden",
            pointerEvents: "none",
          });
          gsap.set(panel, { pointerEvents: "none" });
          gsap.set(links, { opacity: 0, y: 14 });
        });

      if (openRef.current) {
        timelineRef.current.play(0);
      }

      return () => {
        timelineRef.current?.kill();
        timelineRef.current = null;
      };
    },
    { scope: panelRef, dependencies: [prefersReducedMotion] },
  );

  useEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;

    const links = panel.querySelectorAll<HTMLElement>("[data-menu-link]");

    if (prefersReducedMotion) {
      if (open) {
        gsap.set(overlay, {
          opacity: 1,
          visibility: "visible",
          pointerEvents: "auto",
        });
        gsap.set(panel, {
          clipPath: CLIP_OPEN,
          WebkitClipPath: CLIP_OPEN,
          pointerEvents: "auto",
        });
        gsap.set(links, { opacity: 1, y: 0 });
      } else {
        gsap.set(overlay, {
          opacity: 0,
          visibility: "hidden",
          pointerEvents: "none",
        });
        gsap.set(panel, {
          clipPath: CLIP_CLOSED,
          WebkitClipPath: CLIP_CLOSED,
          pointerEvents: "none",
        });
        gsap.set(links, { opacity: 0, y: 0 });
      }
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
