/**
 * Mobile browsers fire `resize` when the address bar / bottom chrome shows or hides.
 * That changes `window.innerHeight` and `dvh`, causing layout shift, scroll jank,
 * and WebGL background flicker. Use these helpers to ignore chrome-only resizes.
 */

let lastWidth = 0;
let lastHeight = 0;
let stableViewportHeight = 0;

export function isCoarseTouchViewport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 1023px)").matches ||
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

/** Lock viewport height on mobile so chrome show/hide does not reflow fixed layers. */
export function initStableViewportHeight(): number {
  if (typeof window === "undefined") return 0;

  stableViewportHeight =
    window.visualViewport?.height ?? window.innerHeight;

  return stableViewportHeight;
}

export function getStableViewportHeight(): number {
  if (typeof window === "undefined") return 0;
  if (stableViewportHeight === 0) {
    return initStableViewportHeight();
  }
  return stableViewportHeight;
}

/**
 * Viewport height for scroll + canvas math — stable on touch mobile, live on desktop.
 */
export function getLayoutViewportHeight(): number {
  if (typeof window === "undefined") return 0;
  if (isCoarseTouchViewport()) {
    return getStableViewportHeight();
  }
  return window.innerHeight;
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

  if (widthChanged && isCoarseTouchViewport()) {
    initStableViewportHeight();
  }

  return chromeOnly;
}

export function shouldHandleViewportResize(): boolean {
  return !isMobileBrowserChromeResize();
}

type ViewportResizeHandlers = {
  /** Orientation, keyboard, real layout changes — full refresh */
  onStable?: () => void;
  /** Mobile browser chrome show/hide — ScrollTrigger only (no canvas/Lenis resize) */
  onChrome?: () => void;
};

/** Subscribe to viewport resize with separate stable vs chrome handlers. */
export function onViewportResize(handlers: ViewportResizeHandlers): () => void {
  if (typeof window === "undefined") return () => {};

  lastWidth = window.innerWidth;
  lastHeight = window.innerHeight;
  initStableViewportHeight();

  const handler = () => {
    if (isMobileBrowserChromeResize()) {
      handlers.onChrome?.();
    } else if (shouldHandleViewportResize()) {
      handlers.onStable?.();
    }
  };

  window.addEventListener("resize", handler, { passive: true });
  window.visualViewport?.addEventListener("resize", handler, { passive: true });

  return () => {
    window.removeEventListener("resize", handler);
    window.visualViewport?.removeEventListener("resize", handler);
  };
}

/** @deprecated Use onViewportResize({ onStable }) */
export function onStableViewportResize(callback: () => void): () => void {
  return onViewportResize({ onStable: callback });
}
