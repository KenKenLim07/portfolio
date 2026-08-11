"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { gsap, initGsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Roadmap execution: spine fills toward each numbered node; a node lights up
 * when the fill reaches it (never the other way around). Uses live layout so
 * scrub-reveal transforms on steps stay in sync with the fixed spine.
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
      const spine = progress?.parentElement;
      const steps = gsap.utils.toArray<HTMLElement>(
        track.querySelectorAll("[data-process-step]"),
      );
      const nodes = gsap.utils.toArray<HTMLElement>(
        track.querySelectorAll("[data-process-node]"),
      );

      if (!progress || !spine || nodes.length === 0) return;

      const setActive = (activeIndex: number) => {
        nodes.forEach((node, i) => {
          node.dataset.active = i <= activeIndex ? "true" : "false";
        });
        steps.forEach((step, i) => {
          const on = i <= activeIndex;
          step.dataset.active = on ? "true" : "false";
          // Fire the card glow once the first time this step fills — never again.
          if (on && step.dataset.glow !== "true") {
            step.dataset.glow = "true";
          }
        });
      };

      const nodeCenterInSpine = (node: HTMLElement) => {
        const spineRect = spine.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();
        return nodeRect.top + nodeRect.height / 2 - spineRect.top;
      };

      const syncRoadmap = (scrollProgress: number) => {
        const spineHeight = spine.offsetHeight || 1;
        let fillPx = scrollProgress * spineHeight;

        // Nodes the fill has reached (uses transformed layout from scrub reveal).
        let activeIndex = -1;
        for (let i = 0; i < nodes.length; i++) {
          if (fillPx >= nodeCenterInSpine(nodes[i]!)) activeIndex = i;
        }

        // Before a node is active, don't paint the spine past that node.
        if (activeIndex < 0 && nodes[0]) {
          fillPx = Math.min(fillPx, nodeCenterInSpine(nodes[0]));
        } else if (activeIndex >= 0) {
          // Keep the tip at or below the latest active node center.
          fillPx = Math.max(fillPx, nodeCenterInSpine(nodes[activeIndex]!));
        }

        setActive(activeIndex);
        gsap.set(progress, {
          scaleY: Math.max(0, Math.min(1, fillPx / spineHeight)),
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
          onUpdate: (self) => syncRoadmap(self.progress),
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
