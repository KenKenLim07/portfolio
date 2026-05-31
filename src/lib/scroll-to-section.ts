import { ScrollTrigger } from "@/lib/gsap";

/** Reliable in-page scroll (works with GSAP ScrollTrigger + scroll-margin). */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "start" });

  window.setTimeout(() => ScrollTrigger.refresh(), 450);
}
