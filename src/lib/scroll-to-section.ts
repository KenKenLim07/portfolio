import { markProgrammaticScroll } from "@/lib/gsap";

/** Reliable in-page scroll (works with GSAP ScrollTrigger + scroll-margin). */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  markProgrammaticScroll();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
