import { getLenis, SECTION_SCROLL_OFFSET } from "@/lib/lenis-instance";

function scheduleAfterScroll(cb: () => void) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cb();
  };

  window.addEventListener("scrollend", run, { once: true });
  setTimeout(run, 1200);
}

/** Scroll to a page section — Lenis on desktop, native smooth scroll on mobile. */
export function scrollToSection(id: string, afterScroll?: () => void) {
  const el = document.getElementById(id);
  if (!el) return;

  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, {
      offset: SECTION_SCROLL_OFFSET,
      onComplete: afterScroll,
    });
    return;
  }

  const top =
    el.getBoundingClientRect().top + window.scrollY - SECTION_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  if (afterScroll) scheduleAfterScroll(afterScroll);
}
