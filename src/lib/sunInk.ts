/** Open-air type that should flip ink against the sun wash. */
const INK_SELECTOR = [
  "main",
  "footer",
  "aside",
]
  .map(
    (root) =>
      `${root} :is(.text-foreground, .text-muted, .section-mega-outline, .hero-mega-outline, .hero-sun-ink, .hero-sun-muted, .hero-sun-outline)`,
  )
  .join(", ");

const SOLID_CLOSEST =
  "[data-sun-solid], .glass, .bg-surface, .bg-subtle, nav, .mobile-menu-panel, [data-hero-cta-panel]";

let lastLitKey = "";

/** Clear lit flags when leaving sun mode. */
export function clearSunInkLit() {
  lastLitKey = "";
  document.querySelectorAll("[data-sun-lit]").forEach((el) => {
    el.removeAttribute("data-sun-lit");
  });
}

/**
 * Mark each open-air text node with data-sun-lit based on distance to the
 * projected sun (viewport 0–1). Runs from the WebGL frame loop so scroll /
 * camera lift update ink in realtime — works even when GSAP opacity parents
 * break mix-blend-mode.
 */
export function updateSunInkLit(sunX: number, sunY: number, flare: number) {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  const radius = 0.18 + Math.max(0, Math.min(1, flare)) * 0.34;
  const key = `${sunX.toFixed(3)}_${sunY.toFixed(3)}_${radius.toFixed(3)}_${(window.scrollY / h).toFixed(3)}`;
  if (key === lastLitKey) return;
  lastLitKey = key;

  const nodes = document.querySelectorAll<HTMLElement>(INK_SELECTOR);

  for (const el of nodes) {
    if (el.closest(SOLID_CLOSEST)) {
      if (el.dataset.sunLit !== undefined) delete el.dataset.sunLit;
      continue;
    }
    if (el.tagName === "SVG" || el.querySelector(":scope > svg")) continue;

    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.bottom < -80 || r.top > h + 80) continue;

    const samples: Array<[number, number]> = [
      [r.left + r.width * 0.2, r.top + r.height * 0.5],
      [r.left + r.width * 0.5, r.top + r.height * 0.5],
      [r.left + r.width * 0.8, r.top + r.height * 0.5],
    ];

    let litHits = 0;
    for (const [px, py] of samples) {
      const dx = px / w - sunX;
      const dy = py / h - sunY;
      if (Math.hypot(dx, dy) < radius) litHits += 1;
    }

    const next =
      litHits === 0 ? "0" : litHits === samples.length ? "1" : "mixed";
    if (el.dataset.sunLit !== next) el.dataset.sunLit = next;
  }
}
