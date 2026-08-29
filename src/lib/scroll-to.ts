import { getLenis, SECTION_SCROLL_OFFSET } from "@/lib/lenis-instance";

/** Scroll to a page section — uses Lenis when active, native smooth scroll otherwise. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { offset: SECTION_SCROLL_OFFSET });
    return;
  }

  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
