"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { tsParticles } from "@tsparticles/engine";
import type { Container, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { cn } from "@/lib/utils";

type ParticlesProps = {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

let enginePromise: Promise<void> | null = null;

/** Start loading tsparticles as early as possible (call from intro mount). */
export function preloadSparklesEngine(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!enginePromise) {
    enginePromise = loadSlim(tsParticles).then(() => undefined);
  }
  return enginePromise;
}

export function SparklesCore({
  id,
  className,
  background,
  minSize,
  maxSize,
  speed,
  particleColor,
  particleDensity,
}: ParticlesProps) {
  const generatedId = useId();
  const particleId = id || generatedId.replace(/:/g, "");
  const containerRef = useRef<Container | null>(null);

  const options = useMemo(
    () =>
      ({
        background: {
          color: { value: background || "transparent" },
        },
        fullScreen: {
          enable: false,
          zIndex: 1,
        },
        fpsLimit: 60,
        detectRetina: true,
        particles: {
          color: {
            value: particleColor || "#ffffff",
          },
          move: {
            enable: true,
            direction: "none",
            random: true,
            straight: false,
            outModes: { default: "out" },
            speed: { min: 0.15, max: 0.9 },
          },
          number: {
            density: {
              enable: true,
              width: 400,
              height: 400,
            },
            value: particleDensity || 120,
          },
          opacity: {
            value: { min: 0.45, max: 1 },
            animation: {
              enable: true,
              speed: speed || 4,
              sync: false,
              startValue: "random",
            },
          },
          shape: {
            type: "circle",
          },
          size: {
            value: {
              min: minSize || 1,
              max: maxSize || 3,
            },
          },
        },
      }) satisfies ISourceOptions,
    [
      background,
      maxSize,
      minSize,
      particleColor,
      particleDensity,
      speed,
    ],
  );

  useEffect(() => {
    let cancelled = false;

    void preloadSparklesEngine().then(async () => {
      if (cancelled) return;
      const container = await tsParticles.load({
        id: particleId,
        options,
      });
      if (cancelled) {
        container?.destroy();
        return;
      }
      containerRef.current = container ?? null;
    });

    return () => {
      cancelled = true;
      containerRef.current?.destroy();
      containerRef.current = null;
    };
  }, [options, particleId]);

  return (
    <div id={particleId} className={cn("h-full w-full", className)} aria-hidden />
  );
}
