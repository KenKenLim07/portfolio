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

/** RGB 0–1 for THREE.Float32BufferAttribute (vertex colors). */
const DOT = {
  light: [0.2, 0.22, 0.34] as const,
  dark: [0.72, 0.74, 0.82] as const,
};

const CAMERA_BASE = { x: 0, y: 355, z: 1220 } as const;

/** Scroll-linked state (updated on scroll, smoothed in rAF). */
type ScrollState = {
  progress: { current: number; target: number };
  scrollY: { current: number; target: number };
  velocity: number;
  /** 1 while user is scrolling, decays to 0 when idle. */
  activity: number;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<ScrollState>({
    progress: { current: 0, target: 0 },
    scrollY: { current: 0, target: 0 },
    velocity: 0,
    activity: 0,
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
      scroll.scrollY.target = y;
      scroll.velocity = velocity;

      if (Math.abs(velocity) > 0.5) {
        scroll.activity = 1;
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
    let tiltZ = 0;
    let velocityKick = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      const scroll = scrollRef.current;

      scroll.progress.current = lerp(
        scroll.progress.current,
        scroll.progress.target,
        0.09,
      );
      scroll.scrollY.current = lerp(
        scroll.scrollY.current,
        scroll.scrollY.target,
        0.11,
      );

      const activityDecay = reducedMotion ? 2.8 : 1.6;
      scroll.activity = Math.max(0, scroll.activity - activityDecay * dt);

      const active = scroll.activity;
      const p = scroll.progress.current;
      const y = scroll.scrollY.current;

      /* Scroll indicator: grid rises as page scrolls down, returns when scrolling up. */
      const indicatorLift = y * 0.55;
      velocityKick = lerp(velocityKick, scroll.velocity * 2.2, 0.18);
      points.position.y = indicatorLift + velocityKick * active;
      points.position.z = lerp(points.position.z, active * p * 160, 0.1);

      const velocityTilt = Math.max(
        -0.14,
        Math.min(0.14, scroll.velocity * 0.00055 * active),
      );
      tiltZ = lerp(tiltZ, velocityTilt, 0.14);
      points.rotation.z = tiltZ;

      const cameraLift = active * (p * 90 + Math.min(y * 0.04, 120));
      const cameraDolly = active * (p * 320 + Math.min(Math.abs(scroll.velocity) * 0.35, 80));
      camera.position.y = CAMERA_BASE.y + cameraLift;
      camera.position.z = CAMERA_BASE.z - cameraDolly;
      camera.rotation.x = lerp(
        camera.rotation.x,
        -active * (p * 0.2 + Math.min(Math.abs(scroll.velocity) * 0.00008, 0.06)),
        0.1,
      );

      if (!reducedMotion) {
        const positionAttribute = geometry.attributes.position;
        const positionArray = positionAttribute.array as Float32Array;

        const idleAmp = 8;
        const scrollAmp =
          95 +
          active * 45 +
          Math.min(Math.abs(scroll.velocity) * 0.22, 55);
        const waveAmp = lerp(idleAmp, scrollAmp, active);

        const idleSpeed = 0.012;
        const scrollSpeed =
          0.32 + active * 0.15 + Math.min(Math.abs(scroll.velocity) * 0.002, 0.12);
        const countSpeed = lerp(idleSpeed, scrollSpeed, active);

        const scrollPhase = p * 6 * active;

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
