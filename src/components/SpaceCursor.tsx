"use client";

import { useEffect, useRef } from "react";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const INTERACTIVE =
  "a,button,[role='button'],input,textarea,select,label,summary,.cursor-pointer";

const TEXT_FIELD =
  "input,textarea,[contenteditable='true'],[contenteditable='']";

const LERP = 0.28;
const MIN_SPEED = 0.4;

function isTextField(el: Element | null): boolean {
  if (!el) return false;
  return Boolean(el.closest(TEXT_FIELD));
}

function isInteractive(el: Element | null): boolean {
  if (!el || isTextField(el)) return false;
  return Boolean(el.closest(INTERACTIVE));
}

/** Geometric spaceship — nose points toward +Y in local SVG (rotated in JS). */
function ShipMark() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden fill="none">
      <path
        d="M14 3 L20 18 L14 15 L8 18 Z"
        fill="currentColor"
        fillOpacity="0.92"
      />
      <path
        d="M14 15 L18 22 L14 19.5 L10 22 Z"
        fill="currentColor"
        fillOpacity="0.45"
      />
      <circle
        cx="14"
        cy="11"
        r="1.4"
        fill="var(--background)"
        fillOpacity="0.85"
      />
    </svg>
  );
}

export function SpaceCursor() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fineMq = window.matchMedia(FINE_POINTER);
    const motionMq = window.matchMedia(REDUCED_MOTION);
    const root = document.documentElement;
    const el = elRef.current;
    if (!el) return;

    let enabled = fineMq.matches;
    let reduced = motionMq.matches;
    let raf = 0;
    let hot = false;
    let textMode = false;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let angle = -90;
    let prevX = 0;
    let prevY = 0;
    let hasPoint = false;

    const setEnabledClass = (on: boolean) => {
      root.classList.toggle("has-space-cursor", on);
    };

    const setTextClass = (on: boolean) => {
      root.classList.toggle("has-space-cursor-text", on);
    };

    const show = (on: boolean) => {
      el.classList.toggle("is-visible", on);
    };

    const setHot = (on: boolean) => {
      if (hot === on) return;
      hot = on;
      el.classList.toggle("space-cursor--hot", on);
    };

    const applyTransform = () => {
      // SVG nose points up (-Y); atan2 heading 0° = right → offset +90° for nose-forward.
      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle + 90}deg)`;
    };

    const hitTest = (clientX: number, clientY: number) => {
      el.style.visibility = "hidden";
      const under = document.elementFromPoint(clientX, clientY);
      el.style.visibility = "";

      const nextText = isTextField(under);
      if (nextText !== textMode) {
        textMode = nextText;
        setTextClass(textMode);
        show(enabled && hasPoint && !textMode);
      }

      if (textMode) {
        setHot(false);
        return;
      }

      setHot(isInteractive(under));
    };

    const tick = () => {
      raf = 0;
      if (!enabled || !hasPoint || textMode) return;

      const dx = targetX - x;
      const dy = targetY - y;

      if (reduced) {
        x = targetX;
        y = targetY;
      } else {
        x += dx * LERP;
        y += dy * LERP;

        const vx = x - prevX;
        const vy = y - prevY;
        const speed = Math.hypot(vx, vy);
        if (speed > MIN_SPEED) {
          angle = (Math.atan2(vy, vx) * 180) / Math.PI;
        }
        prevX = x;
        prevY = y;
      }

      applyTransform();

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!enabled) return;
      targetX = e.clientX;
      targetY = e.clientY;

      if (!hasPoint) {
        hasPoint = true;
        x = targetX;
        y = targetY;
        prevX = x;
        prevY = y;
        applyTransform();
      }

      hitTest(e.clientX, e.clientY);

      if (!textMode) show(true);

      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      hasPoint = false;
      show(false);
      setHot(false);
      textMode = false;
      setTextClass(false);
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const syncMedia = () => {
      enabled = fineMq.matches;
      reduced = motionMq.matches;
      setEnabledClass(enabled);
      if (!enabled) {
        onLeave();
        setEnabledClass(false);
        setTextClass(false);
      }
    };

    syncMedia();
    fineMq.addEventListener("change", syncMedia);
    motionMq.addEventListener("change", syncMedia);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      fineMq.removeEventListener("change", syncMedia);
      motionMq.removeEventListener("change", syncMedia);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      if (raf) cancelAnimationFrame(raf);
      setEnabledClass(false);
      setTextClass(false);
    };
  }, []);

  return (
    <div ref={elRef} className="space-cursor" aria-hidden>
      <ShipMark />
    </div>
  );
}
