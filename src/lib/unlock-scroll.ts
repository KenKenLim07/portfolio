/** Clear any stuck scroll locks (intro, Lenis, inline styles). Safe to call repeatedly. */
export function unlockDocumentScroll() {
  if (typeof document === "undefined") return;

  const { documentElement: html, body } = document;

  html.removeAttribute("data-intro-active");
  html.style.overflow = "";
  html.style.touchAction = "";
  body.style.overflow = "";
  body.style.touchAction = "";

  for (const cls of [...html.classList]) {
    if (cls === "lenis" || cls.startsWith("lenis-")) {
      html.classList.remove(cls);
    }
  }
}
