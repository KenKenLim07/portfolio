"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { gsap, initGsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Roadmap execution: spine fills with accent as you scroll the process track,
 * and each numbered node lights up when its step reaches the viewport center.
 */
export function useProcessRoadmap() {
  const trackRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useGsapReducedMotion();

  useGSAP(
    () => {
      initGsap();
      const track = trackRef.current;
      if (!track) return;

      const progress = track.querySelector<HTMLElement>("[data-process-progress]");
      const steps = gsap.utils.toArray<HTMLElement>(
        track.querySelectorAll("[data-process-step]"),
      );
      const nodes = gsap.utils.toArray<HTMLElement>(
        track.querySelectorAll("[data-process-node]"),
      );

      if (!progress || steps.length === 0) return;

      const setActive = (activeIndex: number) => {
        nodes.forEach((node, i) => {
          node.dataset.active = i <= activeIndex ? "true" : "false";
        });
      };

      if (prefersReducedMotion) {
        gsap.set(progress, { scaleY: 1 });
        setActive(nodes.length - 1);
        return;
      }

      gsap.set(progress, { scaleY: 0, transformOrigin: "top center" });
      setActive(-1);

      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: track,
          start: "top 65%",
          end: "bottom 45%",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(progress, { scaleY: self.progress });
          },
        });

        steps.forEach((step, index) => {
          ScrollTrigger.create({
            trigger: step,
            start: "top 58%",
            end: "bottom 42%",
            invalidateOnRefresh: true,
            onEnter: () => setActive(index),
            onEnterBack: () => setActive(index),
            onLeaveBack: () => setActive(index - 1),
          });
        });
      }, track);

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => ctx.revert();
    },
    {
      scope: trackRef,
      dependencies: [prefersReducedMotion],
      revertOnUpdate: true,
    },
  );

  return trackRef;
}
