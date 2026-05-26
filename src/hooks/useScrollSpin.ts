"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const SCROLL_THRESHOLD = 32;
const SCROLL_STOP_MS = 140;

/**
 * Burger rotation while actively scrolling; snaps back to 0° when scrolling stops.
 */
export function useScrollSpin(paused = false) {
  const prefersReducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion || paused) return;

    let lastY = window.scrollY;
    let ticking = false;
    let stopTimer: ReturnType<typeof setTimeout>;

    const snapBack = () => {
      rotationRef.current = 0;
      setRotation(0);
    };

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      if (Math.abs(delta) > 0.5) {
        rotationRef.current = Math.max(
          -90,
          Math.min(90, rotationRef.current + delta * 0.45),
        );
        setRotation(rotationRef.current);
        clearTimeout(stopTimer);
        stopTimer = setTimeout(snapBack, SCROLL_STOP_MS);
      }

      setScrolled(y > SCROLL_THRESHOLD);
      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(stopTimer);
    };
  }, [prefersReducedMotion, paused]);

  useEffect(() => {
    if (!paused) return;
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [paused]);

  return { scrolled, rotation: prefersReducedMotion || paused ? 0 : rotation };
}
