"use client";

import { useEffect } from "react";

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: coarse)").matches;
}

export function DoubleTapBlocker() {
  useEffect(() => {
    if (!isTouchDevice()) return;

    const handleDblClick = (event: MouseEvent) => {
      // Allow text inputs/textareas to keep native behavior just in case.
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("dblclick", handleDblClick, { capture: true });
    return () => window.removeEventListener("dblclick", handleDblClick, { capture: true });
  }, []);

  return null;
}

