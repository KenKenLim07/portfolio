"use client";

import { useEffect } from "react";
import { initGsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Initializes GSAP ScrollTrigger and debounced refresh on resize / font load.
 */
export function GsapProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initGsap();

    let refreshTimer: number | undefined;

    const refresh = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
    };

    const markReady = () => {
      document.documentElement.classList.add("gsap-ready");
    };

    window.addEventListener("resize", refresh, { passive: true });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        markReady();
      });
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh);
    }

    return () => {
      window.removeEventListener("resize", refresh);
      if (refreshTimer) window.clearTimeout(refreshTimer);
      document.documentElement.classList.remove("gsap-ready");
    };
  }, []);

  return children;
}
