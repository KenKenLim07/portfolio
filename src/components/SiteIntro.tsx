"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import {
  preloadSparklesEngine,
  SparklesCore,
} from "@/components/ui/sparkles";
import { SITE } from "@/lib/constants";
import { pauseLenis, resumeLenis } from "@/lib/lenis-instance";
import {
  isIntroComplete,
  markIntroComplete,
  onBackgroundReady,
} from "@/lib/site-intro";
import { unlockDocumentScroll } from "@/lib/unlock-scroll";
import { cn } from "@/lib/utils";

const MIN_INTRO_MS = 2200;
const MAX_INTRO_MS = 6500;
const CURTAIN_MS = 760;
const FILL_LERP = 0.038;
const HOLD_AT_FULL_MS = 360;
const INTRO_TEXT = `${SITE.name}.`;

/** Kick off particles while the intro module evaluates — before paint when possible. */
if (typeof window !== "undefined") {
  void preloadSparklesEngine();
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

/**
 * objectBoundingBox path: y=0 top, y=1 bottom.
 * Rising liquid with a rolling sine surface.
 */
function buildWaveClipPath(fillPct: number, phase: number): string {
  const level = Math.max(0, Math.min(1, fillPct / 100));
  if (level >= 0.995) {
    return "M0,0 H1 V1 H0 Z";
  }
  if (level <= 0.001) {
    return "M0,1 H1 V1 H0 Z";
  }

  // Surface sits near the top of the filled region; amplitude shrinks near full
  const surfaceY = 1 - level;
  const amp = 0.035 * (1 - level * 0.55);
  const segments = 18;
  let d = `M0,1 L0,${(surfaceY + Math.sin(phase) * amp).toFixed(4)}`;

  for (let i = 1; i <= segments; i += 1) {
    const x = i / segments;
    const y = surfaceY + Math.sin(x * Math.PI * 3 + phase) * amp;
    d += ` L${x.toFixed(4)},${y.toFixed(4)}`;
  }

  d += " L1,1 Z";
  return d;
}

export function SiteIntro() {
  const prefersReducedMotion = useGsapReducedMotion();
  const [visible, setVisible] = useState(
    () => !prefersReducedMotion && !isIntroComplete(),
  );
  const [exiting, setExiting] = useState(false);
  const fillRef = useRef<HTMLSpanElement>(null);
  const wavePathRef = useRef<SVGPathElement>(null);
  const fillValue = useRef(0);
  const clipId = useId().replace(/:/g, "");

  useEffect(() => {
    void preloadSparklesEngine();
  }, []);

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

    // Desktop Lenis only — mobile uses native scroll; overlay blocks touches while visible.
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

    const applyFill = (value: number, complete = false, now = performance.now()) => {
      const path = wavePathRef.current;
      const fillEl = fillRef.current;
      if (!path || !fillEl) return;

      const done = complete || value >= 97;
      if (done) {
        path.setAttribute("d", "M0,0 H1 V1 H0 Z");
        fillEl.classList.add("intro-fill-complete");
        fillEl.style.clipPath = "none";
        fillEl.style.setProperty("-webkit-clip-path", "none");
        return;
      }

      const phase = now * 0.0042;
      path.setAttribute("d", buildWaveClipPath(value, phase));
      fillEl.style.clipPath = `url(#${clipId})`;
      fillEl.style.setProperty("-webkit-clip-path", `url(#${clipId})`);
      fillEl.classList.remove("intro-fill-complete");
    };

    const completeIntro = () => {
      unlockDocumentScroll();
      resumeLenis();
      markIntroComplete();
      setVisible(false);
    };

    const tick = () => {
      const now = performance.now();
      const elapsed = now - start;
      const timeProgress = Math.min(1, elapsed / (MIN_INTRO_MS * 1.15));
      const ready = bgReady && fontsReady && elapsed >= MIN_INTRO_MS;

      let target = easeOutCubic(timeProgress) * 86;
      if (bgReady) target = Math.min(97, target + 6);
      if (fontsReady) target = Math.min(99, target + 4);
      if (ready) target = 100;

      fillValue.current += (target - fillValue.current) * FILL_LERP;
      applyFill(fillValue.current, false, now);

      if (!finishing && ready && fillValue.current >= 99.85) {
        finishing = true;
        holdingFull = true;
        holdStarted = now;
        fillValue.current = 100;
        applyFill(100, true, now);
      }

      if (holdingFull && now - holdStarted >= HOLD_AT_FULL_MS) {
        setExiting(true);
        curtainTimer = window.setTimeout(completeIntro, CURTAIN_MS);
        return;
      }

      if (!finishing && elapsed >= MAX_INTRO_MS) {
        finishing = true;
        holdingFull = true;
        holdStarted = now;
        fillValue.current = 100;
        applyFill(100, true, now);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (curtainTimer) window.clearTimeout(curtainTimer);
      unsubBg();
      unlockDocumentScroll();
      resumeLenis();
    };
  }, [clipId, prefersReducedMotion]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "intro-curtain fixed inset-0 z-[200] motion-reduce:transition-none",
        "bg-black text-white",
        exiting && "intro-curtain-exiting",
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      <svg
        className="pointer-events-none absolute h-px w-px overflow-visible"
        aria-hidden
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path ref={wavePathRef} d="M0,1 H1 V1 H0 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-6">
        <h1
          className="relative z-20 inline-block max-w-full text-center font-display text-[clamp(2.25rem,9vw,5.5rem)] font-semibold leading-[0.95] tracking-tight"
          aria-label={SITE.name}
        >
          <span className="block whitespace-nowrap text-white/12">
            {INTRO_TEXT}
          </span>
          <span
            ref={fillRef}
            className="intro-fill absolute inset-0 overflow-hidden text-white"
            style={{
              clipPath: `url(#${clipId})`,
              WebkitClipPath: `url(#${clipId})`,
            }}
            aria-hidden
          >
            <span className="block whitespace-nowrap">{INTRO_TEXT}</span>
          </span>
        </h1>

        <div className="relative z-10 mt-2 h-36 w-full max-w-xl sm:h-40 sm:max-w-2xl">
          <div className="absolute inset-x-[12%] top-0 h-[2px] w-3/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm" />
          <div className="absolute inset-x-[12%] top-0 h-px w-3/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
          <div className="absolute inset-x-[32%] top-0 h-[5px] w-1/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent blur-sm" />
          <div className="absolute inset-x-[32%] top-0 h-px w-1/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

          <SparklesCore
            id="site-intro-sparkles"
            background="transparent"
            minSize={0.4}
            maxSize={1.2}
            particleDensity={520}
            className="h-full w-full"
            particleColor="#FFFFFF"
            speed={2.5}
          />

          <div className="pointer-events-none absolute inset-0 h-full w-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]" />
        </div>
      </div>
    </div>
  );
}
