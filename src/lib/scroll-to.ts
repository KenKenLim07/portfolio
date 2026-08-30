import { getLenis, SECTION_SCROLL_OFFSET } from "@/lib/lenis-instance";

/** Scroll to a page section — Lenis on desktop, native smooth scroll on mobile. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { offset: SECTION_SCROLL_OFFSET });
    return;
  }

  const top =
    el.getBoundingClientRect().top + window.scrollY - SECTION_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}
