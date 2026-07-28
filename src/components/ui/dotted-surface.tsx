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

const STAR_COUNT = 580;
/** Side rocks — main asteroid field. */
const ROCK_COUNT = 12;
/** Distant center rocks — subtle mid-frame anchors (weak scroll warp). */
const CENTER_ROCK_COUNT = 2;
/**
 * Depth bands (camera sits around z ≈ 1180 looking toward -Z):
 * - stars: deep background plane (still in fog range so they read)
 * - asteroids: nearer mid-field (closer to POV, larger)
 */
const FIELD = { x: 5600, y: 640, z: 6400 } as const;
const STAR_Z = { near: -2100, far: -180 } as const;
const ROCK_Z = { near: 220, far: 860 } as const;

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
  /** Collision radius in world units. */
  radius: number;
  /** 0 = almost no scroll warp, 1 = full warp. */
  warpInfluence: number;
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

/** Deterministic RNG — keeps layout stable across theme remounts. */
function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Rng = () => number;

function randRange(rng: Rng, min: number, max: number) {
  return min + rng() * (max - min);
}

const STAR_SEED = 0x51a7;
const ROCK_SEED = 0xc0de;

function buildStarfield(isDark: boolean): {
  seeds: StarSeed[];
  positions: number[];
  colors: number[];
} {
  const rng = createRng(STAR_SEED);
  const seeds: StarSeed[] = [];
  const positions: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i < STAR_COUNT; i++) {
    // Bias depth toward the far plane — keep stars behind rocks
    const depthT = Math.pow(rng(), 0.65);
    const z = lerp(STAR_Z.near, STAR_Z.far, depthT);
    const x = (rng() - 0.5) * FIELD.x;
    const y = (rng() - 0.5) * FIELD.y;

    const twinklePhase = rng() * Math.PI * 2;
    const twinkleSpeed = randRange(rng, 0.35, 1.2);
    const baseAlpha = isDark
      ? lerp(0.45, 0.95, depthT)
      : lerp(0.32, 0.7, depthT);

    let r: number;
    let g: number;
    let b: number;
    if (isDark) {
      const cool = rng();
      r = lerp(0.72, 0.95, cool);
      g = lerp(0.76, 0.97, cool);
      b = lerp(0.88, 1, cool);
    } else {
      const cool = rng();
      r = lerp(0.28, 0.42, cool);
      g = lerp(0.32, 0.46, cool);
      b = lerp(0.48, 0.62, cool);
    }

    seeds.push({
      x,
      y,
      z,
      size: lerp(2.2, 4.2, depthT),
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
function createAsteroidGeometry(
  rng: Rng,
  detail = 2,
): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const pos = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  const scratch = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    vertex.fromBufferAttribute(pos, i);
    const n = vertex.clone().normalize();

    const ridge =
      0.18 * Math.sin(n.x * 7.3 + n.y * 3.1) +
      0.14 * Math.sin(n.y * 5.7 - n.z * 4.2) +
      0.1 * Math.sin(n.z * 9.1 + n.x * 2.4) +
      0.08 * Math.sin(n.x * 13.0 + n.y * 11.0 + n.z * 8.0);

    const craterSeed = Math.abs(Math.sin(n.x * 17.0) * Math.cos(n.y * 19.0));
    const crater = craterSeed > 0.82 ? -0.22 * (craterSeed - 0.82) * 6 : 0;

    const scale = 1 + ridge + crater + randRange(rng, -0.04, 0.04);
    scratch.copy(n).multiplyScalar(scale);
    pos.setXYZ(i, scratch.x, scratch.y, scratch.z);
  }

  geometry.scale(
    randRange(rng, 0.85, 1.25),
    randRange(rng, 0.7, 1.1),
    randRange(rng, 0.8, 1.35),
  );
  geometry.computeVertexNormals();
  return geometry;
}

function createRockField(
  isDark: boolean,
  isMobile: boolean,
): {
  group: THREE.Group;
  rocks: RockBody[];
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
} {
  const rng = createRng(ROCK_SEED);
  const group = new THREE.Group();
  const rocks: RockBody[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // Side rocks stay on the flanks (mobile still visible, not center-clustered)
  const xMin = isMobile ? 120 : 380;
  const xMax = isMobile ? 360 : FIELD.x * 0.38;
  const zNear = isMobile ? 420 : ROCK_Z.near;
  const zFar = isMobile ? 880 : ROCK_Z.far;
  const scaleMin = isMobile ? 22 : 36;
  const scaleMax = isMobile ? 52 : 110;

  const pushRock = (opts: {
    x: number;
    y: number;
    z: number;
    scale: number;
    warpInfluence: number;
  }) => {
    const geometry = createAsteroidGeometry(rng, rng() > 0.45 ? 2 : 1);
    geometries.push(geometry);

    const tone = rng();
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
      roughness: randRange(rng, 0.78, 0.96),
      metalness: randRange(rng, 0.02, 0.12),
      flatShading: rng() > 0.55,
      transparent: true,
      opacity: isDark
        ? randRange(rng, 0.55, 0.78)
        : randRange(rng, 0.4, 0.58),
      depthWrite: true,
    });
    materials.push(material);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(opts.scale);
    const home = new THREE.Vector3(opts.x, opts.y, opts.z);
    mesh.position.copy(home);
    mesh.rotation.set(
      randRange(rng, 0, Math.PI * 2),
      randRange(rng, 0, Math.PI * 2),
      randRange(rng, 0, Math.PI * 2),
    );

    group.add(mesh);
    rocks.push({
      mesh,
      spin: new THREE.Vector3(
        randRange(rng, -0.25, 0.25),
        randRange(rng, -0.35, 0.35),
        randRange(rng, -0.2, 0.2),
      ),
      home,
      radius: opts.scale * 1.15,
      warpInfluence: opts.warpInfluence,
    });
  };

  // Side field
  for (let i = 0; i < ROCK_COUNT; i++) {
    const proximity = Math.pow(rng(), 0.7);
    const side = i % 2 === 0 ? 1 : -1;
    pushRock({
      x: side * randRange(rng, xMin, xMax),
      y: randRange(rng, isMobile ? -100 : -160, isMobile ? 120 : 200),
      z: lerp(zNear, zFar, proximity),
      scale: lerp(scaleMin, scaleMax, proximity),
      warpInfluence: 1,
    });
  }

  // 1–2 distant center rocks — far enough that scroll warp stays gentle
  for (let i = 0; i < CENTER_ROCK_COUNT; i++) {
    pushRock({
      x: randRange(rng, isMobile ? -70 : -140, isMobile ? 70 : 140),
      y: randRange(rng, -40, 80),
      z: randRange(rng, isMobile ? -80 : -220, isMobile ? 140 : 60),
      scale: randRange(rng, isMobile ? 18 : 28, isMobile ? 30 : 44),
      warpInfluence: 0.18,
    });
  }

  // Separate overlapping homes at spawn
  for (let pass = 0; pass < 8; pass++) {
    for (let i = 0; i < rocks.length; i++) {
      for (let j = i + 1; j < rocks.length; j++) {
        const a = rocks[i];
        const b = rocks[j];
        const dx = a.home.x - b.home.x;
        const dy = a.home.y - b.home.y;
        const dz = a.home.z - b.home.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
        const minDist = a.radius + b.radius + 24;
        if (dist >= minDist) continue;

        const push = ((minDist - dist) / dist) * 0.55;
        a.home.x += dx * push;
        a.home.y += dy * push;
        a.home.z += dz * push;
        b.home.x -= dx * push;
        b.home.y -= dy * push;
        b.home.z -= dz * push;
        a.mesh.position.copy(a.home);
        b.mesh.position.copy(b.home);
      }
    }
  }

  return { group, rocks, geometries, materials };
}

const PLANET_PALETTES = {
  dark: [
    { body: [0.28, 0.42, 0.62], atmosphere: [0.45, 0.65, 0.95] },
    { body: [0.48, 0.32, 0.28], atmosphere: [0.75, 0.5, 0.4] },
    { body: [0.32, 0.48, 0.42], atmosphere: [0.5, 0.78, 0.68] },
  ],
  light: [
    { body: [0.42, 0.52, 0.68], atmosphere: [0.55, 0.65, 0.85] },
    { body: [0.62, 0.48, 0.42], atmosphere: [0.78, 0.58, 0.5] },
    { body: [0.45, 0.58, 0.52], atmosphere: [0.55, 0.7, 0.62] },
  ],
} as const;

function createPlanetField(
  isDark: boolean,
  isMobile: boolean,
): {
  group: THREE.Group;
  planets: PlanetBody[];
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
} {
  const rng = createRng(PLANET_SEED);
  const group = new THREE.Group();
  const planets: PlanetBody[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const palettes = isDark ? PLANET_PALETTES.dark : PLANET_PALETTES.light;

  const placements = isMobile
    ? [
        { x: -220, y: 110, z: -720, scale: 70 },
        { x: 260, y: -40, z: -980, scale: 95 },
        { x: -60, y: 160, z: -1280, scale: 55 },
      ]
    : [
        { x: -920, y: 180, z: -860, scale: 120 },
        { x: 1100, y: -80, z: -1180, scale: 160 },
        { x: 180, y: 240, z: -1480, scale: 90 },
      ];

  for (let i = 0; i < PLANET_COUNT; i++) {
    const place = placements[i];
    const palette = palettes[i % palettes.length];
    const planetGroup = new THREE.Group();

    const bodyGeo = new THREE.SphereGeometry(1, 32, 32);
    geometries.push(bodyGeo);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setRGB(
        palette.body[0],
        palette.body[1],
        palette.body[2],
      ),
      roughness: randRange(rng, 0.55, 0.85),
      metalness: randRange(rng, 0.05, 0.18),
      transparent: true,
      opacity: isDark ? 0.92 : 0.72,
    });
    materials.push(bodyMat);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.setScalar(place.scale);

    const atmoGeo = new THREE.SphereGeometry(1, 24, 24);
    geometries.push(atmoGeo);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(
        palette.atmosphere[0],
        palette.atmosphere[1],
        palette.atmosphere[2],
      ),
      transparent: true,
      opacity: isDark ? 0.14 : 0.1,
      depthWrite: false,
      side: THREE.BackSide,
    });
    materials.push(atmoMat);
    const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    atmosphere.scale.setScalar(place.scale * 1.08);

    planetGroup.add(body);
    planetGroup.add(atmosphere);

    const home = new THREE.Vector3(place.x, place.y, place.z);
    home.x += randRange(rng, -40, 40);
    home.y += randRange(rng, -30, 30);
    planetGroup.position.copy(home);

    group.add(planetGroup);
    planets.push({
      group: planetGroup,
      body,
      atmosphere,
      spin: randRange(rng, 0.02, 0.06),
      home,
      warpInfluence: 0.08,
    });
  }

  return { group, planets, geometries, materials };
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
    const isMobile = window.innerWidth < 768;
    const { seeds, positions, colors } = buildStarfield(isDark);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(isDark ? FOG.dark : FOG.light, 2400, 8200);

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
      size: isDark ? 4.2 : 4.8,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.88 : 0.7,
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
    } = createRockField(isDark, isMobile);
    const {
      group: planetGroup,
      planets,
      geometries: planetGeometries,
      materials: planetMaterials,
    } = createPlanetField(isDark, isMobile);

    const field = new THREE.Group();
    field.add(stars);
    field.add(planetGroup);
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
    /** Continuous zoom gesture (-1 scroll up, +1 scroll down) — avoids settle snap. */
    let smoothedGesture = 0;

    const animate = (timestamp: number) => {
      animationId = requestAnimationFrame(animate);
      timer.update(timestamp);
      const dt = Math.min(timer.getDelta(), 0.05);

      const scroll = scrollRef.current;

      const goingUp =
        scroll.progress.target < scroll.progress.current - 0.0005;
      const goingDown =
        scroll.progress.target > scroll.progress.current + 0.0005;

      // Same follow rate both ways — asymmetric catch-up caused settle jitter on scroll-up
      const progressFollow = goingUp || goingDown ? 0.1 : 0.085;
      scroll.progress.current = lerp(
        scroll.progress.current,
        scroll.progress.target,
        progressFollow,
      );

      const scrollAge = performance.now() - scroll.lastScrollAt;
      const activityTarget =
        scrollAge < 140 ? 1 : Math.exp(-(scrollAge - 140) * 0.0065);
      smoothedActivity = expSmooth(smoothedActivity, activityTarget, 10, dt);
      smoothedVelocity = expSmooth(smoothedVelocity, scroll.velocity, 8, dt);
      scroll.velocity *= Math.exp(-10 * dt);

      const active = smoothedActivity;
      const p = scroll.progress.current;
      const dir = scroll.scrollDir;

      if (dir !== 0 && active < 0.03 && Math.abs(smoothedVelocity) < 0.4) {
        scroll.scrollDir = 0;
      }

      // Soft gesture envelope — decay to 0 smoothly instead of flipping lift/zoom curves
      const gestureTarget =
        dir === 1 ? active : dir === -1 ? -active : 0;
      smoothedGesture = expSmooth(smoothedGesture, gestureTarget, 7, dt);
      const zoomInAmt = Math.max(0, smoothedGesture);
      const zoomOutAmt = Math.max(0, -smoothedGesture);

      // Same lift curve always (scroll-up used a different formula → snap on stop mid-page)
      const liftT = indicatorProgress(p);
      const indicatorLift = liftT * INDICATOR_MAX_LIFT;

      const velBoost = Math.min(Math.abs(smoothedVelocity) * 0.45, 56);
      const kickCap = 22;
      const kickTarget = Math.max(
        -kickCap,
        Math.min(kickCap, smoothedVelocity * 0.5),
      );
      velocityKick = expSmooth(velocityKick, kickTarget * active, 9, dt);
      field.position.y = indicatorLift + velocityKick;

      const gestureDolly =
        zoomInAmt * (DOLLY_GESTURE_IN + velBoost) -
        zoomOutAmt * (DOLLY_GESTURE_OUT + velBoost);

      const progressZ = p * 38;
      const zGesture =
        zoomInAmt * (72 + velBoost) - zoomOutAmt * (58 + velBoost);
      const targetZ = progressZ + zGesture;
      field.position.z = expSmooth(field.position.z, targetZ, 12, dt);

      field.rotation.z = expSmooth(
        field.rotation.z,
        Math.max(-0.05, Math.min(0.05, smoothedVelocity * 0.00014 * active)),
        9,
        dt,
      );

      const cameraLift =
        liftT * 32 + zoomInAmt * 48 - zoomOutAmt * 38;

      const progressDolly = p * DOLLY_FROM_PROGRESS;
      const targetCamZ = CAMERA_BASE.z - progressDolly - gestureDolly;
      camera.position.y = expSmooth(
        camera.position.y,
        CAMERA_BASE.y + cameraLift,
        12,
        dt,
      );
      camera.position.z = expSmooth(camera.position.z, targetCamZ, 12, dt);

      const tiltTarget = zoomOutAmt * 0.085 - zoomInAmt * 0.085;
      camera.rotation.x = expSmooth(camera.rotation.x, tiltTarget, 10, dt);

      const targetFov =
        CAMERA_BASE_FOV + zoomOutAmt * 8 - zoomInAmt * 7;
      camera.fov = expSmooth(camera.fov, targetFov, 10, dt);
      if (Math.abs(camera.fov - targetFov) > 0.02) {
        camera.updateProjectionMatrix();
      }

      const targetScale = 1 - zoomOutAmt * 0.06 + zoomInAmt * 0.09;
      const scale = expSmooth(field.scale.x, targetScale, 10, dt);
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

        // Tumbling rocks + subtle bob; center rocks warp much less
        for (const rock of rocks) {
          rock.mesh.rotation.x += rock.spin.x * dt;
          rock.mesh.rotation.y += rock.spin.y * dt;
          rock.mesh.rotation.z += rock.spin.z * dt;

          const influence = rock.warpInfluence;
          const bob =
            Math.sin(count * 0.35 + rock.home.x * 0.001) *
            waveAmp *
            0.22 *
            influence;
          rock.mesh.position.x = rock.home.x;
          rock.mesh.position.y = rock.home.y + bob;
          rock.mesh.position.z =
            rock.home.z + bob * warpZ * 0.18 * (0.4 + active) * influence;
        }

        for (const planet of planets) {
          planet.body.rotation.y += planet.spin * dt;
          const bob =
            Math.sin(count * 0.12 + planet.home.x * 0.0008) *
            waveAmp *
            0.08 *
            planet.warpInfluence;
          planet.group.position.y = planet.home.y + bob;
          planet.group.position.z =
            planet.home.z + bob * warpZ * 0.06 * planet.warpInfluence;
        }

        // Soft collision — push overlapping rocks apart so they don't clip
        for (let i = 0; i < rocks.length; i++) {
          for (let j = i + 1; j < rocks.length; j++) {
            const a = rocks[i];
            const b = rocks[j];
            const dx = a.mesh.position.x - b.mesh.position.x;
            const dy = a.mesh.position.y - b.mesh.position.y;
            const dz = a.mesh.position.z - b.mesh.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
            const minDist = a.radius + b.radius;
            if (dist >= minDist) continue;

            const push = ((minDist - dist) / dist) * 0.5;
            a.mesh.position.x += dx * push;
            a.mesh.position.y += dy * push;
            a.mesh.position.z += dz * push;
            b.mesh.position.x -= dx * push;
            b.mesh.position.y -= dy * push;
            b.mesh.position.z -= dz * push;

            // Nudge homes so they don't immediately re-overlap next frame
            a.home.x += dx * push * 0.35;
            a.home.y += dy * push * 0.35;
            a.home.z += dz * push * 0.35;
            b.home.x -= dx * push * 0.35;
            b.home.y -= dy * push * 0.35;
            b.home.z -= dz * push * 0.35;
          }
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
      for (const geo of planetGeometries) geo.dispose();
      for (const mat of planetMaterials) mat.dispose();
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
