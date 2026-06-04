"use client";

import { useSyncExternalStore } from "react";

const LG_QUERY = "(min-width: 1024px)";

/** Matches Tailwind `lg:` — use for rendering a single hero panel (avoids duplicate CTAs in DOM). */
export function useLgBreakpoint() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(LG_QUERY);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(LG_QUERY).matches,
    () => false,
  );
}

export { LG_QUERY };
