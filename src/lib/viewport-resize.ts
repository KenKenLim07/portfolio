/**
 * Mobile browsers fire `resize` when the address bar / bottom chrome shows or hides.
 * That changes `window.innerHeight` and `dvh`, causing layout shift, scroll jank,
 * and WebGL background flicker. Use these helpers to ignore chrome-only resizes.
 */

let lastWidth = 0;
let lastHeight = 0;

export function isCoarseTouchViewport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 1023px)").matches ||
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

/**
 * True when resize is likely mobile browser chrome toggling (height-only, modest delta).
 */
export function isMobileBrowserChromeResize(): boolean {
  if (typeof window === "undefined") return false;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const widthChanged = lastWidth > 0 && Math.abs(width - lastWidth) > 1;
  const heightDelta = lastHeight > 0 ? Math.abs(height - lastHeight) : 0;

  const chromeOnly =
    isCoarseTouchViewport() &&
    !widthChanged &&
    heightDelta > 0 &&
    heightDelta < 220;

  lastWidth = width;
  lastHeight = height;

  return chromeOnly;
}

export function shouldHandleViewportResize(): boolean {
  return !isMobileBrowserChromeResize();
}

/** Subscribe to resize events that are not mobile browser chrome toggles. */
export function onStableViewportResize(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  lastWidth = window.innerWidth;
  lastHeight = window.innerHeight;

  const handler = () => {
    if (shouldHandleViewportResize()) callback();
  };

  window.addEventListener("resize", handler, { passive: true });
  window.visualViewport?.addEventListener("resize", handler, { passive: true });

  return () => {
    window.removeEventListener("resize", handler);
    window.visualViewport?.removeEventListener("resize", handler);
  };
}
