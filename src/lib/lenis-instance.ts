import type Lenis from "lenis";

let lenis: Lenis | null = null;

/** Matches `scroll-mt-28` on sections — keeps anchors under the fixed nav. */
export const SECTION_SCROLL_OFFSET = 112;

export function setLenisInstance(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis(): Lenis | null {
  return lenis;
}

export function pauseLenis() {
  lenis?.stop();
}

export function resumeLenis() {
  lenis?.start();
}
