"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { REDUCED_MOTION_QUERY, gsap, initGsap, ScrollTrigger } from "@/lib/gsap";
import { setLenisInstance, SECTION_SCROLL_OFFSET, pauseLenis } from "@/lib/lenis-instance";
import { isIntroComplete, onIntroComplete } from "@/lib/site-intro";
import { unlockDocumentScroll } from "@/lib/unlock-scroll";
import { onViewportResize } from "@/lib/viewport-resize";

/** Touch-primary / mobile layout — use native scroll instead of Lenis. */
function prefersNativeTouchScroll() {
  return (
    window.matchMedia("(max-width: 1023px)").matches ||
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

function refreshScrollMetrics(lenis: Lenis | null) {
  lenis?.resize();
  ScrollTrigger.refresh();
}

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
    const unlockTimers: number[] = [];
    let touchActive = false;

    const onTouchStart = () => {
      touchActive = true;
    };
    const onTouchEnd = () => {
      touchActive = false;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    const refresh = () => {
      // Never refresh mid-swipe on touch — chrome resize + ST.refresh stalls scroll
      if (touchActive && prefersNativeTouchScroll()) return;

      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        if (touchActive && prefersNativeTouchScroll()) return;
        refreshScrollMetrics(lenis);
      }, 150);
    };

    const unlockAfterIntro = () => {
      unlockDocumentScroll();
      lenis?.start();

      if (useLenis) {
        refreshScrollMetrics(lenis);
        requestAnimationFrame(() => refreshScrollMetrics(lenis));
        unlockTimers.push(
          window.setTimeout(() => refreshScrollMetrics(lenis), 120),
        );
      } else {
        // One refresh after paint — repeated refresh mid-swipe causes sticky scroll on iOS
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }
    };

    const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const useLenis = !prefersReducedMotion && !prefersNativeTouchScroll();

    if (useLenis) {
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

      unsubscribeIntro = onIntroComplete(unlockAfterIntro);

      tickerCallback = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickerCallback);
      gsap.ticker.lagSmoothing(0);
    } else {
      setLenisInstance(null);
      unlockDocumentScroll();
      unsubscribeIntro = onIntroComplete(unlockAfterIntro);
    }

    unlockDocumentScroll();

    const unsubscribeResize = onViewportResize({
      onStable: refresh,
      // Chrome toggles: never refresh — mid-swipe ScrollTrigger.refresh stalls iOS Chrome
    });
    const t = window.setTimeout(refresh, 150);

    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh);
    }

    const onLoad = () => {
      if (useLenis) refreshScrollMetrics(lenis);
    };
    window.addEventListener("load", onLoad);

    requestAnimationFrame(() => ScrollTrigger.refresh());

    if (isIntroComplete()) {
      unlockAfterIntro();
    }

    return () => {
      unsubscribeResize();
      window.removeEventListener("load", onLoad);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.clearTimeout(t);
      unlockTimers.forEach((id) => window.clearTimeout(id));
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
