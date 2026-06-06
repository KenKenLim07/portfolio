"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { gsap, initGsap } from "@/lib/gsap";

type ClipPaths = {
  closed: string;
  open: string;
};

type UseGsapMobileMenuOptions = {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
};

function measureClipPaths(
  trigger: HTMLElement,
  panel: HTMLElement,
): ClipPaths {
  const panelRect = panel.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();

  const x = triggerRect.left + triggerRect.width / 2 - panelRect.left;
  const y = triggerRect.top + triggerRect.height / 2 - panelRect.top;
  const origin = `${x}px ${y}px`;

  return {
    closed: `circle(0px at ${origin})`,
    open: `circle(150vmax at ${origin})`,
  };
}

function applyClip(panel: HTMLElement, clip: string) {
  gsap.set(panel, {
    clipPath: clip,
    WebkitClipPath: clip,
  });
}

export function useGsapMobileMenu({
  open,
  triggerRef,
}: UseGsapMobileMenuOptions) {
  const prefersReducedMotion = useGsapReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const clipRef = useRef<ClipPaths | null>(null);

  useEffect(() => {
    initGsap();
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;

    gsap.set(overlay, {
      opacity: 0,
      visibility: "hidden",
      pointerEvents: "none",
    });
    gsap.set(panel, { pointerEvents: "none" });

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!overlay || !panel || !trigger) return;

    const links = panel.querySelectorAll<HTMLElement>("[data-menu-link]");
    const clips = measureClipPaths(trigger, panel);
    clipRef.current = clips;

    if (prefersReducedMotion) {
      timelineRef.current?.kill();
      timelineRef.current = null;

      if (open) {
        gsap.set(overlay, {
          opacity: 1,
          visibility: "visible",
          pointerEvents: "auto",
        });
        applyClip(panel, clips.open);
        gsap.set(panel, { pointerEvents: "auto" });
        gsap.set(links, { opacity: 1, y: 0 });
      } else {
        gsap.set(overlay, {
          opacity: 0,
          visibility: "hidden",
          pointerEvents: "none",
        });
        applyClip(panel, clips.closed);
        gsap.set(panel, { pointerEvents: "none" });
        gsap.set(links, { opacity: 0, y: 0 });
      }
      return;
    }

    if (open) {
      timelineRef.current?.kill();
      applyClip(panel, clips.closed);
      gsap.set(links, { opacity: 0, y: 14 });
      gsap.set(overlay, {
        opacity: 0,
        visibility: "hidden",
        pointerEvents: "none",
      });
      gsap.set(panel, { pointerEvents: "none" });

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
            clipPath: clips.open,
            WebkitClipPath: clips.open,
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
          const closedClip = clipRef.current?.closed ?? clips.closed;
          gsap.set(overlay, {
            opacity: 0,
            visibility: "hidden",
            pointerEvents: "none",
          });
          applyClip(panel, closedClip);
          gsap.set(panel, { pointerEvents: "none" });
          gsap.set(links, { opacity: 0, y: 14 });
        });

      timelineRef.current.play(0);
      return;
    }

    if (timelineRef.current && timelineRef.current.progress() > 0) {
      timelineRef.current.reverse();
      return;
    }

    gsap.set(overlay, {
      opacity: 0,
      visibility: "hidden",
      pointerEvents: "none",
    });
    applyClip(panel, clips.closed);
    gsap.set(panel, { pointerEvents: "none" });
    gsap.set(links, { opacity: 0, y: 14 });
  }, [open, prefersReducedMotion, triggerRef]);

  return { overlayRef, panelRef };
}
