/**
 * Mobile browsers fire `resize` / `visualViewport` when the address bar / bottom
 * chrome shows or hides. That must NOT trigger ScrollTrigger.refresh or canvas
 * resize mid-swipe — both stall iOS/Chrome scroll.
 */

let lastWidth = 0;
let lastHeight = 0;
let stableViewportHeight = 0;

/** Height-only deltas below this are treated as browser chrome, not orientation. */
const CHROME_HEIGHT_MAX_DELTA = 220;

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
  stableViewportHeight = window.innerHeight;
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
 * Bottom browser chrome inset (toolbar overlapping the page).
 * ~0 when chrome is hidden; typically 40–90px when visible.
 */
export function getBrowserChromeBottomInset(): number {
  if (typeof window === "undefined") return 0;
  if (!isCoarseTouchViewport()) return 0;

  const vv = window.visualViewport;
  if (!vv) return 0;

  const inset = window.innerHeight - (vv.height + vv.offsetTop);
  return Math.max(0, Math.round(inset));
}

/**
 * Pixels to keep clear above the bottom toolbar for enter/exit motion.
 * Uses a floor even when chrome is hidden (inset ≈ 0 while scrolling down).
 */
export function getMobileChromeClearancePx(): number {
  if (typeof window === "undefined") return 72;
  const h = getLayoutViewportHeight();
  return Math.max(getBrowserChromeBottomInset(), Math.round(h * 0.12), 72);
}

type ResizeKind = "chrome" | "stable" | "noop";

/**
 * Classify a window size change without updating module state.
 * Call {@link commitViewportSize} after handling.
 */
export function classifyViewportResize(
  width = typeof window !== "undefined" ? window.innerWidth : 0,
  height = typeof window !== "undefined" ? window.innerHeight : 0,
): ResizeKind {
  if (typeof window === "undefined") return "noop";

  const widthChanged = lastWidth > 0 && Math.abs(width - lastWidth) > 1;
  const heightDelta = lastHeight > 0 ? Math.abs(height - lastHeight) : 0;

  if (!isCoarseTouchViewport()) {
    return widthChanged || heightDelta > 0 ? "stable" : "noop";
  }

  // Height-only modest change = URL/toolbar chrome
  if (!widthChanged && heightDelta > 0 && heightDelta < CHROME_HEIGHT_MAX_DELTA) {
    return "chrome";
  }

  // Orientation / real layout (width change or large height jump)
  if (widthChanged || heightDelta >= CHROME_HEIGHT_MAX_DELTA) {
    return "stable";
  }

  // Duplicate event / visualViewport with unchanged innerHeight
  return "noop";
}

export function commitViewportSize(
  width = typeof window !== "undefined" ? window.innerWidth : 0,
  height = typeof window !== "undefined" ? window.innerHeight : 0,
) {
  lastWidth = width;
  lastHeight = height;
}

/**
 * True when resize is likely mobile browser chrome toggling (height-only, modest delta).
 * Updates last size as a side effect for callers that only need a boolean gate.
 */
export function isMobileBrowserChromeResize(): boolean {
  if (typeof window === "undefined") return false;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const kind = classifyViewportResize(width, height);
  commitViewportSize(width, height);
  return kind === "chrome";
}

/** True when callers should run layout/canvas resize work. */
export function shouldHandleViewportResize(): boolean {
  if (typeof window === "undefined") return false;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const kind = classifyViewportResize(width, height);
  commitViewportSize(width, height);
  return kind === "stable";
}

type ViewportResizeHandlers = {
  /** Orientation / real layout changes — full refresh */
  onStable?: () => void;
  /** Mobile browser chrome show/hide — never refresh ScrollTrigger here */
  onChrome?: () => void;
};

/**
 * Subscribe to viewport resize with separate stable vs chrome handlers.
 * On touch mobile we intentionally do NOT listen to visualViewport — it fires
 * on every toolbar toggle (often without innerHeight changing) and previously
 * falsely triggered onStable → ScrollTrigger.refresh → stuck scroll.
 */
export function onViewportResize(handlers: ViewportResizeHandlers): () => void {
  if (typeof window === "undefined") return () => {};

  lastWidth = window.innerWidth;
  lastHeight = window.innerHeight;
  initStableViewportHeight();

  const onWindowResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const kind = classifyViewportResize(width, height);
    commitViewportSize(width, height);

    if (kind === "chrome") {
      handlers.onChrome?.();
      return;
    }

    if (kind === "stable") {
      if (isCoarseTouchViewport()) {
        initStableViewportHeight();
      }
      handlers.onStable?.();
    }
  };

  window.addEventListener("resize", onWindowResize, { passive: true });

  // Desktop only — pinch-zoom / keyboard can use visualViewport without chrome traps
  let onVisualViewport: (() => void) | undefined;
  if (!isCoarseTouchViewport()) {
    onVisualViewport = onWindowResize;
    window.visualViewport?.addEventListener("resize", onVisualViewport, {
      passive: true,
    });
  }

  return () => {
    window.removeEventListener("resize", onWindowResize);
    if (onVisualViewport) {
      window.visualViewport?.removeEventListener("resize", onVisualViewport);
    }
  };
}

/** @deprecated Use onViewportResize({ onStable }) */
export function onStableViewportResize(callback: () => void): () => void {
  return onViewportResize({ onStable: callback });
}
