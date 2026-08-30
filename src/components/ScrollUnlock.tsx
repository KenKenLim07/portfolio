"use client";

import { useEffect } from "react";
import { unlockDocumentScroll } from "@/lib/unlock-scroll";
import { onIntroComplete } from "@/lib/site-intro";

/**
 * Ensures mobile scroll is never left locked after intro, bfcache restore, or hydration.
 * The intro overlay (not html overflow) blocks interaction while it is visible.
 */
export function ScrollUnlock() {
  useEffect(() => {
    const unlock = () => unlockDocumentScroll();

    unlock();
    const safety = window.setTimeout(unlock, 8000);

    const unsubIntro = onIntroComplete(unlock);

    window.addEventListener("pageshow", unlock);
    window.addEventListener("load", unlock);

    return () => {
      window.clearTimeout(safety);
      unsubIntro();
      window.removeEventListener("pageshow", unlock);
      window.removeEventListener("load", unlock);
    };
  }, []);

  return null;
}
