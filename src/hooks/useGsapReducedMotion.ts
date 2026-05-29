"use client";

import { useEffect, useState } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/gsap";

/** Mirrors `prefers-reduced-motion` for GSAP-driven UI (shared with gsap.matchMedia). */
export function useGsapReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}
