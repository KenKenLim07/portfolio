"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { gsap, initGsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Mathematically symmetric downward chevron (boomerang).
 * All points mirror across centerX; outer span = inner span + 2×inset.
 */
const BOOMERANG_GEOMETRY = {
  viewBox: "0 0 100 44",
  centerX: 50,
  topY: 6,
  vertexY: 40,
  outerHalfSpan: 46,
  innerHalfSpan: 38,
  innerTopY: 12,
  innerVertexY: 32,
} as const;

const { centerX: CX } = BOOMERANG_GEOMETRY;

const OUTER_LEFT_X = CX - BOOMERANG_GEOMETRY.outerHalfSpan;
const OUTER_RIGHT_X = CX + BOOMERANG_GEOMETRY.outerHalfSpan;
const INNER_LEFT_X = CX - BOOMERANG_GEOMETRY.innerHalfSpan;
const INNER_RIGHT_X = CX + BOOMERANG_GEOMETRY.innerHalfSpan;

const BOOMERANG_FILL = [
  `M ${OUTER_LEFT_X} ${BOOMERANG_GEOMETRY.topY}`,
  `L ${CX} ${BOOMERANG_GEOMETRY.vertexY}`,
  `L ${OUTER_RIGHT_X} ${BOOMERANG_GEOMETRY.topY}`,
  `L ${INNER_RIGHT_X} ${BOOMERANG_GEOMETRY.innerTopY}`,
  `L ${CX} ${BOOMERANG_GEOMETRY.innerVertexY}`,
  `L ${INNER_LEFT_X} ${BOOMERANG_GEOMETRY.innerTopY}`,
  "Z",
].join(" ");

/** Border halves — trace outline from bottom vertex outward in sync. */
const BORDER_RIGHT = [
  `M ${CX} ${BOOMERANG_GEOMETRY.vertexY}`,
  `L ${OUTER_RIGHT_X} ${BOOMERANG_GEOMETRY.topY}`,
  `L ${INNER_RIGHT_X} ${BOOMERANG_GEOMETRY.innerTopY}`,
  `L ${CX} ${BOOMERANG_GEOMETRY.innerVertexY}`,
].join(" ");

const BORDER_LEFT = [
  `M ${CX} ${BOOMERANG_GEOMETRY.vertexY}`,
  `L ${OUTER_LEFT_X} ${BOOMERANG_GEOMETRY.topY}`,
  `L ${INNER_LEFT_X} ${BOOMERANG_GEOMETRY.innerTopY}`,
  `L ${CX} ${BOOMERANG_GEOMETRY.innerVertexY}`,
].join(" ");

const FILL_OPACITY = 0.22;
const FILL_OPACITY_STATIC = 0.24;

/** Slide-down speed — lower duration = faster travel. */
const SLIDE_DURATION = 0.57;
const SLIDE_EASE = "power3.in";
const SLIDE_FADE_DURATION = 0.9;
const SLIDE_FADE_START = 0.35;
/** Slide stays inside hero — avoids page scrollbar jitter. */
const SLIDE_DISTANCE_VH = 22;

function measurePath(path: SVGPathElement) {
  return Math.max(path.getTotalLength(), 1);
}

function hideStroke(path: SVGPathElement, length: number) {
  gsap.set(path, {
    strokeDasharray: `${length} ${length}`,
    strokeDashoffset: length,
    opacity: 1,
  });
}

function resetStroke(path: SVGPathElement, length: number) {
  gsap.set(path, {
    strokeDasharray: `${length} ${length}`,
    strokeDashoffset: length,
    opacity: 1,
  });
}

type HeroScrollCueProps = {
  className?: string;
};

export function HeroScrollCue({ className }: HeroScrollCueProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const borderLeftRef = useRef<SVGPathElement>(null);
  const borderRightRef = useRef<SVGPathElement>(null);
  const prefersReducedMotion = useGsapReducedMotion();

  useGSAP(
    () => {
      initGsap();
      const root = rootRef.current;
      const fill = fillRef.current;
      const borderLeft = borderLeftRef.current;
      const borderRight = borderRightRef.current;

      if (!root || !fill || !borderLeft || !borderRight) return;

      const borderPaths = [borderLeft, borderRight] as const;

      layerRef.current?.getBoundingClientRect();

      if (prefersReducedMotion) {
        gsap.set(fill, { fillOpacity: FILL_OPACITY_STATIC });
        gsap.set(borderPaths, { opacity: 0 });
        return;
      }

      const borderLengths = borderPaths.map(measurePath);
      borderPaths.forEach((path, i) => hideStroke(path, borderLengths[i]!));

      const slideDistance = () =>
        (window.innerHeight * SLIDE_DISTANCE_VH) / 100;

      gsap.set(fill, { fillOpacity: 0 });
      gsap.set(root, { y: 0, opacity: 1, scale: 0.985, transformOrigin: "50% 88%" });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.35 });

      tl.to(borderPaths, {
        strokeDashoffset: 0,
        duration: 1.1,
        stagger: 0,
        ease: "power3.out",
      })
        .to(fill, {
          fillOpacity: FILL_OPACITY,
          duration: 0.5,
          ease: "power2.out",
        })
        .to(borderPaths, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
        })
        .to(root, { scale: 1, duration: 0.5, ease: "power2.out" })
        .to({}, { duration: 0.35 })
        .to(root, {
          y: slideDistance,
          duration: SLIDE_DURATION,
          ease: SLIDE_EASE,
        })
        .to(
          root,
          {
            opacity: 0,
            duration: SLIDE_FADE_DURATION,
            ease: "power1.in",
          },
          `<${SLIDE_FADE_START}`,
        )
        .to({}, { duration: 0.7 })
        .set(root, { y: 0, scale: 0.985, opacity: 1 })
        .set(fill, { fillOpacity: 0 })
        .call(() => {
          borderPaths.forEach((path, i) => resetStroke(path, borderLengths[i]!));
        });
    },
    {
      scope: layerRef,
      dependencies: [prefersReducedMotion],
      revertOnUpdate: true,
    },
  );

  return (
    <div
      ref={layerRef}
      className={cn("hero-scroll-boomerang-layer pointer-events-none", className)}
      aria-hidden
    >
      <span
        ref={rootRef}
        className={cn(
          "hero-scroll-boomerang",
          prefersReducedMotion && "hero-scroll-boomerang--static",
        )}
      >
        <svg
          viewBox={BOOMERANG_GEOMETRY.viewBox}
          className="hero-scroll-boomerang__svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            ref={fillRef}
            d={BOOMERANG_FILL}
            className="hero-scroll-boomerang__fill"
          />

          <g className="hero-scroll-boomerang__border">
            <path
              ref={borderLeftRef}
              d={BORDER_LEFT}
              className="hero-scroll-boomerang__border-stroke"
            />
            <path
              ref={borderRightRef}
              d={BORDER_RIGHT}
              className="hero-scroll-boomerang__border-stroke"
            />
          </g>
        </svg>
      </span>
    </div>
  );
}
