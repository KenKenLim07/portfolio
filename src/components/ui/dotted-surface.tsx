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

const CAMERA_BASE = { x: 0, y: 280, z: 1180 } as const;

/** Max field lift at page bottom — keeps stars in frame (scroll indicator). */
const INDICATOR_MAX_LIFT = 198;

/** Camera dolly: progress-based depth + instant gesture zoom in/out. */
const DOLLY_FROM_PROGRESS = 68;
const DOLLY_GESTURE_IN = 158;
const DOLLY_GESTURE_OUT = 142;
const CAMERA_BASE_FOV = 60;

/** Warp motion: idle baseline vs boost while scrolling. */
const WAVE_IDLE_AMP = 18;
const WAVE_SCROLL_AMP = 78;
const WAVE_IDLE_SPEED = 0.028;
const WAVE_SCROLL_SPEED = 0.16;

const STAR_COUNT = 520;
/** Large rock meshes (not point sprites). */
const ROCK_COUNT = 12;
/** Spread of the field (was a dense 40×60 grid). */
const FIELD = { x: 5200, y: 520, z: 6400 } as const;

type ScrollState = {
  progress: { current: number; target: number };
  velocity: number;
  lastScrollAt: number;
  scrollDir: -1 | 0 | 1;
};

type StarSeed = {
  x: number;
  y: number;
  z: number;
  size: number;
  twinklePhase: number;
  twinkleSpeed: number;
  baseAlpha: number;
};

type RockBody = {
  mesh: THREE.Mesh;
  spin: THREE.Vector3;
  home: THREE.Vector3;
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

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function buildStarfield(isDark: boolean): {
  seeds: StarSeed[];
  positions: number[];
  colors: number[];
} {
  const seeds: StarSeed[] = [];
  const positions: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i < STAR_COUNT; i++) {
    const x = (Math.random() - 0.5) * FIELD.x;
    const y = (Math.random() - 0.5) * FIELD.y;
    const z = (Math.random() - 0.5) * FIELD.z;

    const twinklePhase = Math.random() * Math.PI * 2;
    const twinkleSpeed = rand(0.4, 1.4);
    const baseAlpha = isDark ? rand(0.45, 0.95) : rand(0.35, 0.75);

    let r: number;
    let g: number;
    let b: number;
    if (isDark) {
      const cool = Math.random();
      r = lerp(0.78, 0.95, cool);
      g = lerp(0.82, 0.96, cool);
      b = lerp(0.9, 1, cool);
    } else {
      const cool = Math.random();
      r = lerp(0.28, 0.42, cool);
      g = lerp(0.32, 0.46, cool);
      b = lerp(0.48, 0.62, cool);
    }

    seeds.push({
      x,
      y,
      z,
      size: Math.random() > 0.92 ? rand(7, 12) : rand(2.2, 5.5),
      twinklePhase,
      twinkleSpeed,
      baseAlpha,
    });
    positions.push(x, y, z);
    colors.push(r, g, b);
  }

  return { seeds, positions, colors };
}

/** Irregular rock mesh — displaced icosahedron with crater-like dents. */
function createAsteroidGeometry(detail = 2): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const pos = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  const scratch = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    vertex.fromBufferAttribute(pos, i);
    const n = vertex.clone().normalize();

    // Multi-frequency noise for rocky silhouette
    const ridge =
      0.18 * Math.sin(n.x * 7.3 + n.y * 3.1) +
      0.14 * Math.sin(n.y * 5.7 - n.z * 4.2) +
      0.1 * Math.sin(n.z * 9.1 + n.x * 2.4) +
      0.08 * Math.sin(n.x * 13.0 + n.y * 11.0 + n.z * 8.0);

    // Occasional deeper crater
    const craterSeed = Math.abs(Math.sin(n.x * 17.0) * Math.cos(n.y * 19.0));
    const crater = craterSeed > 0.82 ? -0.22 * (craterSeed - 0.82) * 6 : 0;

    const scale = 1 + ridge + crater + rand(-0.04, 0.04);
    scratch.copy(n).multiplyScalar(scale);
    pos.setXYZ(i, scratch.x, scratch.y, scratch.z);
  }

  // Stretch into a less-spherical rock
  geometry.scale(rand(0.85, 1.25), rand(0.7, 1.1), rand(0.8, 1.35));
  geometry.computeVertexNormals();
  return geometry;
}

function createRockField(isDark: boolean): {
  group: THREE.Group;
  rocks: RockBody[];
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
} {
  const group = new THREE.Group();
  const rocks: RockBody[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  for (let i = 0; i < ROCK_COUNT; i++) {
    const geometry = createAsteroidGeometry(Math.random() > 0.45 ? 2 : 1);
    geometries.push(geometry);

    const tone = Math.random();
    const color = isDark
      ? new THREE.Color().setRGB(
          lerp(0.22, 0.38, tone),
          lerp(0.2, 0.34, tone),
          lerp(0.2, 0.32, tone),
        )
      : new THREE.Color().setRGB(
          lerp(0.42, 0.55, tone),
          lerp(0.4, 0.52, tone),
          lerp(0.44, 0.56, tone),
        );

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: rand(0.78, 0.96),
      metalness: rand(0.02, 0.12),
      flatShading: Math.random() > 0.55,
      transparent: true,
      opacity: isDark ? rand(0.55, 0.78) : rand(0.4, 0.58),
      depthWrite: true,
    });
    materials.push(material);

    const mesh = new THREE.Mesh(geometry, material);
    const scale = rand(28, 72);
    mesh.scale.setScalar(scale);

    // Keep most rocks off-center so they don't crowd the hero copy
    const side = Math.random() > 0.5 ? 1 : -1;
    const home = new THREE.Vector3(
      side * rand(420, FIELD.x * 0.42),
      rand(-180, 220),
      rand(-FIELD.z * 0.35, FIELD.z * 0.35),
    );
    mesh.position.copy(home);
    mesh.rotation.set(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2));

    group.add(mesh);
    rocks.push({
      mesh,
      spin: new THREE.Vector3(rand(-0.25, 0.25), rand(-0.35, 0.35), rand(-0.2, 0.2)),
      home,
    });
  }

  return { group, rocks, geometries, materials };
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

    const isDark = theme === "dark";
    const { seeds, positions, colors } = buildStarfield(isDark);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(isDark ? FOG.dark : FOG.light, 1600, 9000);

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
    renderer.domElement.style.pointerEvents = "none";

    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(isDark ? 0x6b7280 : 0xa1a1aa, 0.55);
    const key = new THREE.DirectionalLight(isDark ? 0xcbd5e1 : 0xffffff, 0.85);
    key.position.set(420, 680, 320);
    const rim = new THREE.DirectionalLight(isDark ? 0x818cf8 : 0x6366f1, 0.28);
    rim.position.set(-380, -120, -520);
    scene.add(ambient, key, rim);

    const starPositions: number[] = [];
    const starColors: number[] = [];
    seeds.forEach((seed, i) => {
      const base = i * 3;
      starPositions.push(positions[base], positions[base + 1], positions[base + 2]);
      starColors.push(colors[base], colors[base + 1], colors[base + 2]);
    });

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions, 3),
    );
    starGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(starColors, 3),
    );

    const starMat = new THREE.PointsMaterial({
      size: isDark ? 5.5 : 6.5,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.9 : 0.72,
      sizeAttenuation: true,
      depthWrite: false,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const stars = new THREE.Points(starGeo, starMat);
    const {
      group: rockGroup,
      rocks,
      geometries: rockGeometries,
      materials: rockMaterials,
    } = createRockField(isDark);

    const field = new THREE.Group();
    field.add(stars);
    field.add(rockGroup);
    scene.add(field);

    const starSeeds = seeds;

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
      smoothedActivity = expSmooth(smoothedActivity, activityTarget, 16, dt);
      smoothedVelocity = expSmooth(smoothedVelocity, scroll.velocity, 10, dt);
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
      velocityKick = expSmooth(velocityKick, kickTarget * active, 12, dt);
      field.position.y = indicatorLift + velocityKick;

      const zoomIn = dir === 1;
      const zoomOut = dir === -1;
      const gestureDolly = zoomIn
        ? active * (DOLLY_GESTURE_IN + velBoost)
        : zoomOut
          ? active * (DOLLY_GESTURE_OUT + velBoost)
          : 0;
      const gestureDollySigned = zoomOut ? -gestureDolly : gestureDolly;

      const progressZ = p * 38;
      const zGesture = zoomIn
        ? active * (72 + velBoost)
        : zoomOut
          ? -active * (58 + velBoost)
          : 0;
      const targetZ = progressZ + zGesture;
      field.position.z = expSmooth(field.position.z, targetZ, 18, dt);

      field.rotation.z = expSmooth(
        field.rotation.z,
        Math.max(-0.06, Math.min(0.06, smoothedVelocity * 0.00016 * active)),
        12,
        dt,
      );

      const cameraLift =
        liftT * 32 + (zoomOut ? -1 : 1) * active * (zoomIn ? 48 : 38);

      const progressDolly = p * DOLLY_FROM_PROGRESS;
      const targetCamZ = CAMERA_BASE.z - progressDolly - gestureDollySigned;
      camera.position.y = CAMERA_BASE.y + cameraLift;
      camera.position.z = expSmooth(camera.position.z, targetCamZ, 20, dt);

      const tiltTarget = zoomOut
        ? active * 0.085
        : zoomIn
          ? -active * 0.085
          : 0;
      camera.rotation.x = expSmooth(camera.rotation.x, tiltTarget, 14, dt);

      const targetFov = zoomOut
        ? CAMERA_BASE_FOV + active * 8
        : zoomIn
          ? CAMERA_BASE_FOV - active * 7
          : CAMERA_BASE_FOV;
      camera.fov = expSmooth(camera.fov, targetFov, 14, dt);
      if (Math.abs(camera.fov - targetFov) > 0.02) {
        camera.updateProjectionMatrix();
      }

      const targetScale = zoomOut
        ? 1 - active * 0.06
        : zoomIn
          ? 1 + active * 0.09
          : 1;
      const scale = expSmooth(field.scale.x, targetScale, 14, dt);
      field.scale.set(scale, scale, scale);

      if (!reducedMotion) {
        const waveAmp = lerp(WAVE_IDLE_AMP, WAVE_SCROLL_AMP, active);
        const countSpeed = lerp(WAVE_IDLE_SPEED, WAVE_SCROLL_SPEED, active);
        const scrollDir = dir === -1 ? -1 : 1;
        const scrollPhase = p * 3.4 * active * scrollDir;
        const warpZ = lerp(0.35, 2.4, active);

        const pos = starGeo.attributes.position.array as Float32Array;
        const col = starGeo.attributes.color.array as Float32Array;

        for (let i = 0; i < starSeeds.length; i++) {
          const seed = starSeeds[i];
          const index = i * 3;
          const ripple =
            Math.sin((seed.x * 0.002 + count + scrollPhase) * 0.9) * waveAmp +
            Math.sin(
              (seed.z * 0.0015 + count * 0.7 + scrollPhase * 0.7) * 1.1,
            ) *
              waveAmp *
              0.65;

          pos[index] = seed.x;
          pos[index + 1] = seed.y + ripple;
          pos[index + 2] = seed.z + ripple * warpZ * 0.35;

          const twinkle =
            seed.baseAlpha *
            (0.72 +
              0.28 * Math.sin(count * seed.twinkleSpeed + seed.twinklePhase));
          col[index] = starColors[index] * twinkle;
          col[index + 1] = starColors[index + 1] * twinkle;
          col[index + 2] = starColors[index + 2] * twinkle;
        }

        starGeo.attributes.position.needsUpdate = true;
        starGeo.attributes.color.needsUpdate = true;

        // Tumbling rocks + subtle bob with the warp
        for (const rock of rocks) {
          rock.mesh.rotation.x += rock.spin.x * dt;
          rock.mesh.rotation.y += rock.spin.y * dt;
          rock.mesh.rotation.z += rock.spin.z * dt;

          const bob =
            Math.sin(count * 0.35 + rock.home.x * 0.001) * waveAmp * 0.22;
          rock.mesh.position.y = rock.home.y + bob;
          rock.mesh.position.z =
            rock.home.z + bob * warpZ * 0.18 * (0.4 + active);
        }

        count += countSpeed;
      } else {
        field.position.y = indicatorLift;
        field.scale.set(1, 1, 1);
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

      starGeo.dispose();
      starMat.dispose();
      for (const geo of rockGeometries) geo.dispose();
      for (const mat of rockMaterials) mat.dispose();
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
