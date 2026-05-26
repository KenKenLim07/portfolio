"use client";

import { useEffect, useRef } from "react";

/**
 * iOS/Android: dynamic viewport (dvh) + browser chrome toggling can reset scrollY to 0
 * on tap. Restore the last position when that happens unintentionally.
 */
export function usePreserveScrollOnViewportResize() {
  const scrollYRef = useRef(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onScroll = () => {
      scrollYRef.current = window.scrollY;
    };

    const onResize = () => {
      const saved = scrollYRef.current;
      if (saved < 80) return;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (window.scrollY === 0 && saved > 80) {
            window.scrollTo(0, saved);
          }
        });
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    vv.addEventListener("resize", onResize);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      vv.removeEventListener("resize", onResize);
      window.removeEventListener("resize", onResize);
    };
  }, []);
}
