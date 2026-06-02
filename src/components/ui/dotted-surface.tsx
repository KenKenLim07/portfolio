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
  /* ~zinc-600 + indigo tint — visible on #f4f4f5 without overpowering content */
  light: [0.36, 0.38, 0.52] as const,
  dark: [0.72, 0.74, 0.82] as const,
};

const CAMERA_BASE = { x: 0, y: 355, z: 1220 } as const;

/** Max grid lift at page bottom — keeps dots in frame (scroll indicator). */
const INDICATOR_MAX_LIFT = 198;

/** Camera dolly: progress-based depth + instant gesture zoom in/out. */
const DOLLY_FROM_PROGRESS = 68;
const DOLLY_GESTURE_IN = 158;
const DOLLY_GESTURE_OUT = 142;
const CAMERA_BASE_FOV = 60;

/** Wave motion: idle baseline vs boost while scrolling. */
const WAVE_IDLE_AMP = 32;
const WAVE_SCROLL_AMP = 68;
const WAVE_IDLE_SPEED = 0.048;
const WAVE_SCROLL_SPEED = 0.14;

type ScrollState = {
  progress: { current: number; target: number };
  velocity: number;
  lastScrollAt: number;
  scrollDir: -1 | 0 | 1;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Frame-rate independent exponential smoothing. */
function expSmooth(current: number, target: number, lambda: number, dt: number) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
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
    lastScrollAt: 0,
    scrollDir: 0,
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

      if (Math.abs(velocity) > 2) {
        scroll.scrollDir = velocity > 0 ? 1 : -1;
        scroll.lastScrollAt = performance.now();
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
      size: isDark ? 8 : 9,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.75 : 0.88,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const timer = new THREE.Timer();
    timer.connect(document);

    let count = 0;
    let animationId = 0;
    let velocityKick = 0;
    let smoothedActivity = 0;
    let smoothedVelocity = 0;

    const animate = (timestamp: number) => {
      animationId = requestAnimationFrame(animate);
      timer.update(timestamp);
      const dt = Math.min(timer.getDelta(), 0.05);

      const scroll = scrollRef.current;

      const goingUp =
        scroll.progress.target < scroll.progress.current - 0.0005;
      const goingDown =
        scroll.progress.target > scroll.progress.current + 0.0005;

      const progressFollow = goingUp ? 0.14 : goingDown ? 0.095 : 0.085;
      scroll.progress.current = lerp(
        scroll.progress.current,
        scroll.progress.target,
        progressFollow,
      );

      const scrollAge = performance.now() - scroll.lastScrollAt;
      const activityTarget =
        scrollAge < 140 ? 1 : Math.exp(-(scrollAge - 140) * 0.007);
      smoothedActivity = expSmooth(
        smoothedActivity,
        activityTarget,
        16,
        dt,
      );
      smoothedVelocity = expSmooth(
        smoothedVelocity,
        scroll.velocity,
        10,
        dt,
      );
      scroll.velocity *= Math.exp(-10 * dt);

      const active = smoothedActivity;
      const p = scroll.progress.current;
      const targetP = scroll.progress.target;
      const dir = scroll.scrollDir;

      if (dir !== 0 && active < 0.02) {
        scroll.scrollDir = 0;
      }

      const liftP = goingUp ? lerp(p, targetP, 0.45) : p;
      const liftT = goingUp
        ? Math.min(1, Math.max(0, liftP))
        : indicatorProgress(p);
      const indicatorLift = liftT * INDICATOR_MAX_LIFT;

      const velBoost = Math.min(Math.abs(smoothedVelocity) * 0.55, 72);
      const kickCap = 28;
      const kickTarget = Math.max(
        -kickCap,
        Math.min(kickCap, smoothedVelocity * 0.62),
      );
      velocityKick = expSmooth(
        velocityKick,
        kickTarget * active,
        12,
        dt,
      );
      points.position.y = indicatorLift + velocityKick;

      /*
       * Gesture zoom — one driver (active × dir), progress depth stays stable.
       * No cross-fade between progress/gesture (that caused the hiccup).
       */
      const zoomIn = dir === 1;
      const zoomOut = dir === -1;
      const gestureDolly =
        zoomIn
          ? active * (DOLLY_GESTURE_IN + velBoost)
          : zoomOut
            ? active * (DOLLY_GESTURE_OUT + velBoost)
            : 0;
      const gestureDollySigned = zoomOut ? -gestureDolly : gestureDolly;

      const progressZ = p * 38;
      const zGesture =
        zoomIn
          ? active * (72 + velBoost)
          : zoomOut
            ? -active * (58 + velBoost)
            : 0;
      const targetZ = progressZ + zGesture;
      points.position.z = expSmooth(points.position.z, targetZ, 18, dt);

      points.rotation.z = expSmooth(
        points.rotation.z,
        Math.max(-0.06, Math.min(0.06, smoothedVelocity * 0.00016 * active)),
        12,
        dt,
      );

      const cameraLift =
        liftT * 32 + (zoomOut ? -1 : 1) * active * (zoomIn ? 48 : 38);

      const progressDolly = p * DOLLY_FROM_PROGRESS;
      const targetCamZ =
        CAMERA_BASE.z - progressDolly - gestureDollySigned;
      camera.position.y = CAMERA_BASE.y + cameraLift;
      camera.position.z = expSmooth(camera.position.z, targetCamZ, 20, dt);

      const tiltTarget =
        zoomOut ? active * 0.085 : zoomIn ? -active * 0.085 : 0;
      camera.rotation.x = expSmooth(camera.rotation.x, tiltTarget, 14, dt);

      const targetFov =
        zoomOut
          ? CAMERA_BASE_FOV + active * 8
          : zoomIn
            ? CAMERA_BASE_FOV - active * 7
            : CAMERA_BASE_FOV;
      camera.fov = expSmooth(camera.fov, targetFov, 14, dt);
      if (Math.abs(camera.fov - targetFov) > 0.02) {
        camera.updateProjectionMatrix();
      }

      const targetScale =
        zoomOut
          ? 1 - active * 0.06
          : zoomIn
            ? 1 + active * 0.09
            : 1;
      const scale = expSmooth(points.scale.x, targetScale, 14, dt);
      points.scale.set(scale, scale, scale);

      if (!reducedMotion) {
        const positionAttribute = geometry.attributes.position;
        const positionArray = positionAttribute.array as Float32Array;

        const waveAmp = lerp(WAVE_IDLE_AMP, WAVE_SCROLL_AMP, active);
        const countSpeed = lerp(WAVE_IDLE_SPEED, WAVE_SCROLL_SPEED, active);
        const scrollDir = dir === -1 ? -1 : 1;
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
        points.scale.set(1, 1, 1);
        camera.position.set(CAMERA_BASE.x, CAMERA_BASE.y, CAMERA_BASE.z);
        camera.rotation.x = 0;
        camera.fov = CAMERA_BASE_FOV;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    requestAnimationFrame(animate);

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
