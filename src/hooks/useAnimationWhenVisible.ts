"use client";

import { useEffect, useRef, useState } from "react";

type UseAnimationWhenVisibleOptions = {
  threshold?: number;
  rootMargin?: string;
};

/**
 * Pauses expensive CSS animations when the target leaves the viewport.
 */
export function useAnimationWhenVisible<T extends HTMLElement = HTMLElement>(
  options: UseAnimationWhenVisibleOptions = {},
) {
  const { threshold = 0.12, rootMargin = "0px" } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );

  useEffect(() => {
    const onVisibility = () => {
      setTabVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry?.isIntersecting ?? false);
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible: inView && tabVisible };
}
