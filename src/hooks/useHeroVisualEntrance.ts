"use client";

import { useEffect, useState, type RefObject } from "react";
import { useInView } from "framer-motion";
import { useHeroEntrance } from "@/hooks/useHeroEntrance";

/** Matches HeroSection scrollFx breakpoint — desktop uses mount, mobile uses in-view. */
const MOBILE_SCROLL_ENTRANCE_MQ = "(max-width: 1023px)";

/**
 * Hero brain card entrance: on lg+ animates with the rest of the hero on load;
 * below lg animates when the card scrolls into view (stacked under hero copy).
 */
export function useHeroVisualEntrance(ref: RefObject<HTMLElement | null>) {
  const { ready, prefersReducedMotion } = useHeroEntrance();
  const [mobileScrollEntrance, setMobileScrollEntrance] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_SCROLL_ENTRANCE_MQ);
    const sync = () => setMobileScrollEntrance(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const inView = useInView(ref, {
    once: true,
    amount: 0.18,
    margin: "0px 0px -6% 0px",
  });

  const active =
    prefersReducedMotion || (mobileScrollEntrance ? inView : ready);

  return { active, mobileScrollEntrance };
}
