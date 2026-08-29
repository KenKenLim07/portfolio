"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { REDUCED_MOTION_QUERY, gsap, initGsap, ScrollTrigger } from "@/lib/gsap";
import { setLenisInstance, SECTION_SCROLL_OFFSET, pauseLenis } from "@/lib/lenis-instance";
import { isIntroComplete, onIntroComplete } from "@/lib/site-intro";

/**
 * Initializes GSAP ScrollTrigger, Lenis smooth scroll, and debounced refresh on resize / font load.
 */
export function GsapProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initGsap();

    let refreshTimer: number | undefined;
    let lenis: Lenis | null = null;
    let tickerCallback: ((time: number) => void) | null = null;
    let unsubscribeIntro: (() => void) | undefined;

    const refresh = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
    };

    const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (!prefersReducedMotion) {
      lenis = new Lenis({
        lerp: 0.08,
        smoothWheel: true,
        anchors: { offset: SECTION_SCROLL_OFFSET },
        autoRaf: false,
      });

      setLenisInstance(lenis);
      lenis.on("scroll", ScrollTrigger.update);

      if (!isIntroComplete()) {
        pauseLenis();
      }

      unsubscribeIntro = onIntroComplete(() => {
        lenis?.start();
      });

      tickerCallback = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickerCallback);
      gsap.ticker.lagSmoothing(0);
    }

    window.addEventListener("resize", refresh, { passive: true });
    const t = window.setTimeout(refresh, 150);

    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh);
    }

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      window.removeEventListener("resize", refresh);
      window.clearTimeout(t);
      if (refreshTimer) window.clearTimeout(refreshTimer);

      if (tickerCallback) {
        gsap.ticker.remove(tickerCallback);
        gsap.ticker.lagSmoothing(500, 33);
      }

      lenis?.destroy();
      setLenisInstance(null);
      unsubscribeIntro?.();
    };
  }, []);

  return children;
}
