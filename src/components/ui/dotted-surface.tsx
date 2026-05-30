"use client";

import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type DottedSurfaceProps = Omit<React.ComponentProps<"div">, "ref">;

const FOG = {
  light: 0xf4f4f5,
  dark: 0x09090b,
} as const;

const DOT = {
  light: [0.2, 0.22, 0.34] as const,
  dark: [0.72, 0.74, 0.82] as const,
};

const CAMERA_BASE = { x: 0, y: 355, z: 1220 } as const;

/** Max grid lift at page bottom — keeps dots in frame (scroll indicator). */
const INDICATOR_MAX_LIFT = 148;

/** Wave motion: idle baseline vs boost while scrolling. */
const WAVE_IDLE_AMP = 32;
const WAVE_SCROLL_AMP = 68;
const WAVE_IDLE_SPEED = 0.048;
const WAVE_SCROLL_SPEED = 0.14;

type ScrollState = {
  progress: { current: number; target: number };
  velocity: number;
  activity: number;
  direction: -1 | 0 | 1;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Ease-out: more lift through the middle of the page, full lift at bottom. */
function indicatorProgress(scrollProgress: number) {
  const p = Math.min(1, Math.max(0, scrollProgress));
  return p * (2 - p);
}

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<ScrollState>({
    progress: { current: 0, target: 0 },
    velocity: 0,
    activity: 0,
    direction: 0,
  });
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const readScroll = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const y = window.scrollY;
      const velocity = y - lastScrollYRef.current;
      lastScrollYRef.current = y;

      const scroll = scrollRef.current;
      scroll.progress.target = Math.min(1, Math.max(0, y / max));
      scroll.velocity = velocity;

      if (Math.abs(velocity) > 3) {
        scroll.activity = Math.min(1, scroll.activity + 0.28);
      }
    };

    readScroll();
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const SEPARATION = 150;
    const AMOUNTX = 40;
    const AMOUNTY = 60;
    const isDark = theme === "dark";

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(isDark ? FOG.dark : FOG.light, 2000, 10000);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000,
    );
    camera.position.set(CAMERA_BASE.x, CAMERA_BASE.y, CAMERA_BASE.z);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(scene.fog.color, 0);

    container.appendChild(renderer.domElement);

    const positions: number[] = [];
    const colors: number[] = [];
    const dot = isDark ? DOT.dark : DOT.light;

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
        positions.push(x, 0, z);
        colors.push(dot[0], dot[1], dot[2]);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3),
    );

    const material = new THREE.PointsMaterial({
      size: isDark ? 8 : 10,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.75 : 0.92,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const clock = new THREE.Clock();
    let count = 0;
    let animationId = 0;
    let velocityKick = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      const scroll = scrollRef.current;

      const goingUp =
        scroll.progress.target < scroll.progress.current - 0.0005 ||
        scroll.direction === -1;
      const goingDown =
        scroll.progress.target > scroll.progress.current + 0.0005 ||
        scroll.direction === 1;

      const progressFollow = goingUp ? 0.14 : goingDown ? 0.095 : 0.085;
      scroll.progress.current = lerp(
        scroll.progress.current,
        scroll.progress.target,
        progressFollow,
      );

      scroll.activity = Math.max(0, scroll.activity - 0.75 * dt);

      const active = scroll.activity;
      const p = scroll.progress.current;
      const targetP = scroll.progress.target;

      /* Scroll down: eased lift. Scroll up: track target faster so the grid drops back clearly. */
      const liftP = goingUp ? lerp(p, targetP, 0.45) : p;
      const liftT = goingUp
        ? Math.min(1, Math.max(0, liftP))
        : indicatorProgress(p);
      const indicatorLift = liftT * INDICATOR_MAX_LIFT;

      const kickScale = scroll.velocity < 0 ? 0.68 : 0.55;
      const kickCap = scroll.velocity < 0 ? 28 : 22;
      const kickTarget = Math.max(
        -kickCap,
        Math.min(kickCap, scroll.velocity * kickScale),
      );
      const kickBlend = goingUp ? 0.14 : 0.1;
      velocityKick = lerp(
        velocityKick,
        kickTarget * Math.max(active, goingUp ? 0.35 : 0),
        kickBlend,
      );
      points.position.y = indicatorLift + velocityKick;
      const zTarget = active * p * (goingUp ? 22 : 55);
      points.position.z = lerp(points.position.z, zTarget, 0.08);
      points.rotation.z = lerp(
        points.rotation.z,
        Math.max(-0.05, Math.min(0.05, scroll.velocity * 0.00014 * active)),
        goingUp ? 0.12 : 0.08,
      );

      const cameraLift = liftT * 24 + active * p * 38;
      const cameraDolly = active * p * 95;
      camera.position.y = CAMERA_BASE.y + cameraLift;
      camera.position.z = CAMERA_BASE.z - cameraDolly;
      camera.rotation.x = lerp(camera.rotation.x, -active * p * 0.06, 0.08);

      if (!reducedMotion) {
        const positionAttribute = geometry.attributes.position;
        const positionArray = positionAttribute.array as Float32Array;

        const waveAmp = lerp(WAVE_IDLE_AMP, WAVE_SCROLL_AMP, active);
        const countSpeed = lerp(WAVE_IDLE_SPEED, WAVE_SCROLL_SPEED, active);
        const scrollDir = scroll.direction === -1 ? -1 : 1;
        const scrollPhase = p * 3.4 * active * scrollDir;

        let i = 0;
        for (let ix = 0; ix < AMOUNTX; ix++) {
          for (let iy = 0; iy < AMOUNTY; iy++) {
            const index = i * 3;
            positionArray[index + 1] =
              Math.sin((ix + count + scrollPhase) * 0.3) * waveAmp +
              Math.sin((iy + count + scrollPhase * 0.7) * 0.5) * waveAmp;
            i++;
          }
        }

        positionAttribute.needsUpdate = true;
        count += countSpeed;
      } else {
        points.position.y = indicatorLift;
        camera.position.set(CAMERA_BASE.x, CAMERA_BASE.y, CAMERA_BASE.z);
        camera.rotation.x = 0;
      }

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none fixed inset-0 -z-10", className)}
      aria-hidden
      {...props}
    />
  );
}
