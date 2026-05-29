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

    window.addEventListener("resize", refresh, { passive: true });
    const t = window.setTimeout(refresh, 150);

    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh);
    }

    return () => {
      window.removeEventListener("resize", refresh);
      window.clearTimeout(t);
      if (refreshTimer) window.clearTimeout(refreshTimer);
    };
  }, []);

  return children;
}
