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

/** Fill only — strokes are drawn separately on each arm. */
const BOOMERANG_FILL = [
  `M ${OUTER_LEFT_X} ${BOOMERANG_GEOMETRY.topY}`,
  `L ${CX} ${BOOMERANG_GEOMETRY.vertexY}`,
  `L ${OUTER_RIGHT_X} ${BOOMERANG_GEOMETRY.topY}`,
  `L ${INNER_RIGHT_X} ${BOOMERANG_GEOMETRY.innerTopY}`,
  `L ${CX} ${BOOMERANG_GEOMETRY.innerVertexY}`,
  `L ${INNER_LEFT_X} ${BOOMERANG_GEOMETRY.innerTopY}`,
  "Z",
].join(" ");

const BOOMERANG_ARMS = {
  outerLeft: `M ${OUTER_LEFT_X} ${BOOMERANG_GEOMETRY.topY} L ${CX} ${BOOMERANG_GEOMETRY.vertexY}`,
  outerRight: `M ${OUTER_RIGHT_X} ${BOOMERANG_GEOMETRY.topY} L ${CX} ${BOOMERANG_GEOMETRY.vertexY}`,
  innerLeft: `M ${INNER_LEFT_X} ${BOOMERANG_GEOMETRY.innerTopY} L ${CX} ${BOOMERANG_GEOMETRY.innerVertexY}`,
  innerRight: `M ${INNER_RIGHT_X} ${BOOMERANG_GEOMETRY.innerTopY} L ${CX} ${BOOMERANG_GEOMETRY.innerVertexY}`,
} as const;

const FILL_OPACITY = 0.07;
const FILL_OPACITY_STATIC = 0.08;

/** Slide-down speed — lower duration = faster travel. */
const SLIDE_DURATION = 0.57;
const SLIDE_EASE = "power3.in";
const SLIDE_FADE_DURATION = 0.9;
/** When fade starts during the slide (seconds from slide start). */
const SLIDE_FADE_START = 0.35;

function getSlideDistance(layer: HTMLElement | null) {
  if (!layer) return window.innerHeight * 0.65;
  const { top, height } = layer.getBoundingClientRect();
  return window.innerHeight - top + height * 0.5;
}

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
  const outerLeftRef = useRef<SVGPathElement>(null);
  const outerRightRef = useRef<SVGPathElement>(null);
  const innerLeftRef = useRef<SVGPathElement>(null);
  const innerRightRef = useRef<SVGPathElement>(null);
  const prefersReducedMotion = useGsapReducedMotion();

  useGSAP(
    () => {
      initGsap();
      const layer = layerRef.current;
      const root = rootRef.current;
      const fill = fillRef.current;
      const outerLeft = outerLeftRef.current;
      const outerRight = outerRightRef.current;
      const innerLeft = innerLeftRef.current;
      const innerRight = innerRightRef.current;

      if (!root || !fill || !outerLeft || !outerRight || !innerLeft || !innerRight) {
        return;
      }

      const outerPaths = [outerLeft, outerRight] as const;
      const innerPaths = [innerLeft, innerRight] as const;
      const allStrokes = [...outerPaths, ...innerPaths];

      // Ensure SVG paths are laid out before measuring stroke lengths.
      layer?.getBoundingClientRect();

      if (prefersReducedMotion) {
        gsap.set(fill, { fillOpacity: FILL_OPACITY_STATIC });
        gsap.set(allStrokes, { opacity: 0 });
        return;
      }

      const outerLengths = outerPaths.map(measurePath);
      const innerLengths = innerPaths.map(measurePath);
      outerPaths.forEach((path, i) => hideStroke(path, outerLengths[i]!));
      innerPaths.forEach((path, i) => hideStroke(path, innerLengths[i]!));

      const slideDistance = () => getSlideDistance(layer);

      gsap.set(fill, { fillOpacity: 0 });
      gsap.set(root, { y: 0, opacity: 1, scale: 0.985, transformOrigin: "50% 88%" });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.35 });

      tl.to(outerPaths, {
        strokeDashoffset: 0,
        duration: 1.05,
        stagger: 0.07,
        ease: "power3.out",
      })
        .to(
          innerPaths,
          {
            strokeDashoffset: 0,
            duration: 0.55,
            stagger: 0.05,
            ease: "power2.out",
          },
          "-=0.22",
        )
        .to(allStrokes, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
        })
        .to(
          fill,
          { fillOpacity: FILL_OPACITY, duration: 0.5, ease: "power2.out" },
          "-=0.22",
        )
        .to(root, { scale: 1, duration: 0.55, ease: "power2.out" }, "<")
        .to({}, { duration: 0.45 })
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
          outerPaths.forEach((path, i) => resetStroke(path, outerLengths[i]!));
          innerPaths.forEach((path, i) => resetStroke(path, innerLengths[i]!));
        })
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

          <g className="hero-scroll-boomerang__strokes">
            <path
              ref={outerLeftRef}
              d={BOOMERANG_ARMS.outerLeft}
              className="hero-scroll-boomerang__stroke"
            />
            <path
              ref={outerRightRef}
              d={BOOMERANG_ARMS.outerRight}
              className="hero-scroll-boomerang__stroke"
            />
            <path
              ref={innerLeftRef}
              d={BOOMERANG_ARMS.innerLeft}
              className="hero-scroll-boomerang__stroke hero-scroll-boomerang__stroke--inner"
            />
            <path
              ref={innerRightRef}
              d={BOOMERANG_ARMS.innerRight}
              className="hero-scroll-boomerang__stroke hero-scroll-boomerang__stroke--inner"
            />
          </g>
        </svg>
      </span>
    </div>
  );
}
