import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Register ScrollTrigger once (client-only). */
export function initGsap() {
  if (typeof window === "undefined" || registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

/** Tajmirul-style reveal defaults */
export const revealDefaults = {
  y: 56,
  duration: 0.75,
  stagger: 0.08,
  ease: "power3.out" as const,
  start: "top 85%",
  /** onEnter | onLeave | onEnterBack | onLeaveBack */
  toggleActions: "play reverse play reverse" as const,
};

export { gsap, ScrollTrigger };
