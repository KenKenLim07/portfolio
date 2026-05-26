"use client";

import { usePreserveScrollOnViewportResize } from "@/hooks/usePreserveScrollOnViewportResize";

/** Client-only guard against mobile viewport resize scroll jumps. */
export function ScrollGuard() {
  usePreserveScrollOnViewportResize();
  return null;
}
