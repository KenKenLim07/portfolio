"use client";

import { useEffect, useRef, useState } from "react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { SITE } from "@/lib/constants";
import { pauseLenis, resumeLenis } from "@/lib/lenis-instance";
import {
  isIntroComplete,
  markIntroComplete,
  onBackgroundReady,
} from "@/lib/site-intro";
import { cn } from "@/lib/utils";

const MIN_INTRO_MS = 2200;
const MAX_INTRO_MS = 6500;
const CURTAIN_MS = 760;
const FILL_LERP = 0.038;
const HOLD_AT_FULL_MS = 360;
const INTRO_TEXT = `${SITE.name}.`;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export function SiteIntro() {
  const prefersReducedMotion = useGsapReducedMotion();
  const [visible, setVisible] = useState(
    () => !prefersReducedMotion && !isIntroComplete(),
  );
  const [exiting, setExiting] = useState(false);
  const fillRef = useRef<HTMLSpanElement>(null);
  const fillValue = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      markIntroComplete();
      setVisible(false);
      return;
    }

    if (isIntroComplete()) {
      setVisible(false);
      return;
    }

    document.documentElement.setAttribute("data-intro-active", "true");
    pauseLenis();

    let bgReady = false;
    let fontsReady = document.fonts?.status === "loaded";
    let finishing = false;
    let holdingFull = false;
    let holdStarted = 0;
    let raf = 0;
    let curtainTimer: number | undefined;
    const start = performance.now();

    const unsubBg = onBackgroundReady(() => {
      bgReady = true;
    });

    void document.fonts?.ready.then(() => {
      fontsReady = true;
    });

    const applyFill = (value: number, complete = false) => {
      if (!fillRef.current) return;
      fillRef.current.style.width = `${value}%`;
      fillRef.current.classList.toggle("intro-fill-complete", complete);
    };

    const completeIntro = () => {
      document.documentElement.removeAttribute("data-intro-active");
      resumeLenis();
      markIntroComplete();
      setVisible(false);
    };

    const tick = () => {
      const elapsed = performance.now() - start;
      const timeProgress = Math.min(1, elapsed / (MIN_INTRO_MS * 1.15));
      const ready = bgReady && fontsReady && elapsed >= MIN_INTRO_MS;

      let target = easeOutCubic(timeProgress) * 86;
      if (bgReady) target = Math.min(97, target + 6);
      if (fontsReady) target = Math.min(99, target + 4);
      if (ready) target = 100;

      fillValue.current += (target - fillValue.current) * FILL_LERP;
      applyFill(fillValue.current);

      if (!finishing && ready && fillValue.current >= 99.85) {
        finishing = true;
        holdingFull = true;
        holdStarted = performance.now();
        fillValue.current = 100;
        applyFill(100, true);
      }

      if (holdingFull && performance.now() - holdStarted >= HOLD_AT_FULL_MS) {
        setExiting(true);
        curtainTimer = window.setTimeout(completeIntro, CURTAIN_MS);
        return;
      }

      if (!finishing && elapsed >= MAX_INTRO_MS) {
        finishing = true;
        holdingFull = true;
        holdStarted = performance.now();
        fillValue.current = 100;
        applyFill(100, true);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (curtainTimer) window.clearTimeout(curtainTimer);
      unsubBg();
      document.documentElement.removeAttribute("data-intro-active");
      resumeLenis();
    };
  }, [prefersReducedMotion]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "intro-curtain fixed inset-0 z-[200] bg-background motion-reduce:transition-none",
        exiting && "intro-curtain-exiting",
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      <div className="flex h-full w-full items-center justify-center px-6">
        <h1
          className="relative inline-block max-w-full text-center font-display text-[clamp(2.5rem,11vw,6.5rem)] font-semibold leading-[0.95] tracking-tight"
          aria-label={SITE.name}
        >
          <span className="block whitespace-nowrap text-white/12">
            {INTRO_TEXT}
          </span>
          <span
            ref={fillRef}
            className="intro-fill absolute inset-y-0 left-0 overflow-hidden text-white"
            style={{ width: "0%" }}
            aria-hidden
          >
            <span className="block whitespace-nowrap">{INTRO_TEXT}</span>
          </span>
        </h1>
      </div>
    </div>
  );
}
