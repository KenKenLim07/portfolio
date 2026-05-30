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

type ScrollState = {
  current: number;
  target: number;
  velocity: number;
};

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<ScrollState>({
    current: 0,
    target: 0,
    velocity: 0,
  });
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const readScroll = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const next = Math.min(1, Math.max(0, window.scrollY / max));
      scrollRef.current.velocity = window.scrollY - lastScrollYRef.current;
      lastScrollYRef.current = window.scrollY;
      scrollRef.current.target = next;
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

    let count = 0;
    let animationId = 0;
    let tiltZ = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const scroll = scrollRef.current;
      scroll.current += (scroll.target - scroll.current) * 0.07;
      const p = scroll.current;

      camera.position.y = CAMERA_BASE.y + p * 55;
      camera.position.z = CAMERA_BASE.z - p * 220;
      camera.rotation.x = -p * 0.14;

      const velocityTilt = Math.max(-0.08, Math.min(0.08, scroll.velocity * 0.00035));
      tiltZ += (velocityTilt - tiltZ) * 0.12;
      points.rotation.z = tiltZ;
      points.position.z = p * 120 - scroll.velocity * 0.15;

      if (!reducedMotion) {
        const positionAttribute = geometry.attributes.position;
        const positionArray = positionAttribute.array as Float32Array;
        const waveAmp = 50 + p * 35;
        const scrollPhase = p * 4.5;

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
        count += 0.1 + p * 0.04;
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
