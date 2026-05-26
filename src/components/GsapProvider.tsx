"use client";

import { useEffect } from "react";
import { initGsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Initializes GSAP ScrollTrigger and refreshes on resize / font load
 * so trigger positions stay accurate after layout shifts.
 */
export function GsapProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initGsap();

    let lastWidth = window.innerWidth;
    const refresh = () => {
      const width = window.innerWidth;
      if (width === lastWidth) return;
      lastWidth = width;
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", refresh);
    const t = window.setTimeout(refresh, 150);

    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh);
    }

    return () => {
      window.removeEventListener("resize", refresh);
      window.clearTimeout(t);
    };
  }, []);

  return children;
}
