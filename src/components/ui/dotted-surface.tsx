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
const INDICATOR_MAX_LIFT = 120;

/**
 * Ship throttle: page scroll 0→1 drives deep travel into -Z.
 * Gesture adds a short burst while actively scrolling.
 */
const DOLLY_FROM_PROGRESS = 1180;
const DOLLY_GESTURE_IN = 260;
const DOLLY_GESTURE_OUT = 200;
const CAMERA_BASE_FOV = 60;

/** Subtle asteroid idle bob (stars stay fixed — no surface wave). */
const ROCK_BOB_AMP = 4;
const ROCK_BOB_SPEED = 0.22;
const TWINKLE_SPEED = 0.032;

/** Occasional meteors — sparse so they feel natural. */
const SHOOTING = {
  trailPoints: 28,
  poolSize: 2,
  minGapSec: 5,
  maxGapSec: 14,
  lifeMin: 0.9,
  lifeMax: 1.55,
  speedMin: 1500,
  speedMax: 2400,
} as const;

const STAR_COUNT = 260;
/** Side rocks — main asteroid field. */
const ROCK_COUNT = 14;
/**
 * Depth bands (camera sits around z ≈ 1180 looking toward -Z):
 * - stars: deep backdrop (material.fog off — scene fog is for rocks only)
 * - asteroids: corridor ahead of the camera; recycled as we pass them
 */
/** XY span at star depth — must fill the camera frustum or stars read as a salt band. */
const STAR_EXTENT = { x: 16000, y: 9000 } as const;
/** Side / corridor rock placement bounds. */
const FIELD = { x: 5600, y: 640, z: 6400 } as const;
/**
 * Stars live deep behind the asteroid corridor.
 * Camera travels ~1180 in Z — this band stays thousands of units farther
 * than any rock so pinpoints never read as nearby debris.
 */
const STAR_Z = { closest: -4200, farthest: -8200 } as const;
/** How far ahead (-Z from camera) recycled rocks respawn. */
const ROCK_RECYCLE = {
  passMargin: 120,
  /** Beyond fog near so rocks fade in instead of popping. */
  aheadMin: 2600,
  aheadMax: 4600,
} as const;
/** World scale when a rock respawns far ahead (perspective grows it later). */
const ROCK_SPAWN_SCALE = { min: 22, max: 48 } as const;

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
  baseScale: number;
};

type ShootingStar = {
  active: boolean;
  age: number;
  life: number;
  head: THREE.Vector3;
  vel: THREE.Vector3;
  positions: Float32Array;
  colors: Float32Array;
  geo: THREE.BufferGeometry;
  line: THREE.Line;
  headGeo: THREE.BufferGeometry;
  headPoints: THREE.Points;
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
  sizes: number[];
} {
  const rng = createRng(STAR_SEED);
  const seeds: StarSeed[] = [];
  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];

  for (let i = 0; i < STAR_COUNT; i++) {
    // Bias toward farthest depths — stars must stay behind the rock corridor
    const depthT = Math.pow(rng(), 0.55);
    const z = lerp(STAR_Z.closest, STAR_Z.farthest, depthT);
    // Soft radial falloff so the field feels like a sky, not a packed rectangle
    const angle = rng() * Math.PI * 2;
    const radius = Math.sqrt(rng());
    const x = Math.cos(angle) * radius * STAR_EXTENT.x * 0.5;
    const y = Math.sin(angle) * radius * STAR_EXTENT.y * 0.5;

    const twinklePhase = rng() * Math.PI * 2;
    const twinkleSpeed = randRange(rng, 0.25, 0.9);
    // Power-law brightness: mostly dim, a few brighter anchors
    const luminosity = Math.pow(rng(), 2.4);
    const baseAlpha = isDark
      ? lerp(0.28, 1, luminosity)
      : lerp(0.22, 0.85, luminosity);
    // Screen-space px — sparse large jewels + tiny dust, not uniform salt
    const size = lerp(1.4, isDark ? 5.2 : 4.6, Math.pow(luminosity, 0.65));

    let r: number;
    let g: number;
    let b: number;
    if (isDark) {
      const cool = rng();
      r = lerp(0.78, 0.98, cool);
      g = lerp(0.82, 0.98, cool);
      b = lerp(0.9, 1, cool);
    } else {
      const cool = rng();
      r = lerp(0.22, 0.4, cool);
      g = lerp(0.28, 0.46, cool);
      b = lerp(0.48, 0.66, cool);
    }

    seeds.push({
      x,
      y,
      z,
      size,
      twinklePhase,
      twinkleSpeed,
      baseAlpha,
    });
    positions.push(x, y, z);
    colors.push(r, g, b);
    sizes.push(size);
  }

  return { seeds, positions, colors, sizes };
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

  // Side rocks stay on the flanks, spread along a deep corridor ahead of the camera
  const xMin = isMobile ? 120 : 380;
  const xMax = isMobile ? 360 : FIELD.x * 0.38;
  const scaleMin = isMobile ? 20 : 28;
  const scaleMax = isMobile ? 48 : 96;
  const aheadMin = isMobile ? 360 : 420;
  const aheadMax = isMobile ? 2800 : 3800;

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

    // Unique tumble: one dominant axis, slow rate (rad/s)
    const axis = new THREE.Vector3(
      randRange(rng, -1, 1),
      randRange(rng, -1, 1),
      randRange(rng, -1, 1),
    );
    if (axis.lengthSq() < 0.001) axis.set(0.2, 1, 0.1);
    axis.normalize();
    const spinRate = randRange(rng, 0.025, 0.09);
    const bias = rng();
    if (bias < 0.33)
      axis.set(axis.x * 1.8, axis.y * 0.35, axis.z * 0.45).normalize();
    else if (bias < 0.66)
      axis.set(axis.x * 0.4, axis.y * 1.8, axis.z * 0.4).normalize();
    else axis.set(axis.x * 0.45, axis.y * 0.4, axis.z * 1.8).normalize();

    group.add(mesh);
    rocks.push({
      mesh,
      spin: axis.multiplyScalar(spinRate),
      home,
      radius: opts.scale * 1.15,
      warpInfluence: opts.warpInfluence,
      baseScale: opts.scale,
    });
  };

  // Side field — scattered ahead in -Z so scrolling flies through them
  for (let i = 0; i < ROCK_COUNT; i++) {
    const depthT = Math.pow(rng(), 0.55);
    const side = i % 2 === 0 ? 1 : -1;
    const ahead = lerp(aheadMin, aheadMax, depthT);
    pushRock({
      x: side * randRange(rng, xMin, xMax),
      y: randRange(rng, isMobile ? -100 : -160, isMobile ? 120 : 200),
      z: CAMERA_BASE.z - ahead,
      scale: lerp(scaleMax, scaleMin, depthT),
      warpInfluence: 1,
    });
  }

  // Two center rocks — spaced left/right so they don't crowd mid-frame
  pushRock({
    x: isMobile ? -110 : -220,
    y: isMobile ? 10 : 20,
    z: CAMERA_BASE.z - (isMobile ? 420 : 520),
    scale: isMobile ? 24 : 36,
    warpInfluence: 0.18,
  });
  pushRock({
    x: isMobile ? 120 : 240,
    y: isMobile ? -20 : -10,
    z: CAMERA_BASE.z - (isMobile ? 680 : 860),
    scale: isMobile ? 22 : 34,
    warpInfluence: 0.18,
  });

  // Far asteroid, top-right
  pushRock({
    x: isMobile ? 280 : 720,
    y: isMobile ? 160 : 260,
    z: CAMERA_BASE.z - (isMobile ? 1100 : 1500),
    scale: isMobile ? 26 : 42,
    warpInfluence: 0.85,
  });

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

function createShootingStarPool(isDark: boolean, count: number) {
  const group = new THREE.Group();
  const stars: ShootingStar[] = [];
  const disposables: Array<THREE.BufferGeometry | THREE.Material> = [];

  const headColor = isDark
    ? new THREE.Color(0xdbeafe)
    : new THREE.Color(0x1e3a8a);
  const midColor = isDark
    ? new THREE.Color(0x60a5fa)
    : new THREE.Color(0x3b82f6);
  const tailColor = isDark
    ? new THREE.Color(0x000000)
    : new THREE.Color(0xf4f4f5);

  for (let i = 0; i < count; i++) {
    const n = SHOOTING.trailPoints;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.95 : 0.75,
      depthWrite: false,
      fog: false,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const line = new THREE.Line(geo, lineMat);
    line.visible = false;
    line.frustumCulled = false;

    const headPos = new Float32Array(3);
    const headGeo = new THREE.BufferGeometry();
    headGeo.setAttribute("position", new THREE.BufferAttribute(headPos, 3));
    const headMat = new THREE.PointsMaterial({
      color: isDark ? 0xf8fafc : 0x1d4ed8,
      size: isDark ? 14 : 11,
      transparent: true,
      opacity: isDark ? 0.95 : 0.7,
      depthWrite: false,
      sizeAttenuation: true,
      fog: false,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const headPoints = new THREE.Points(headGeo, headMat);
    headPoints.visible = false;
    headPoints.frustumCulled = false;

    group.add(line);
    group.add(headPoints);
    disposables.push(geo, lineMat, headGeo, headMat);

    stars.push({
      active: false,
      age: 0,
      life: 1,
      head: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      positions,
      colors,
      geo,
      line,
      headGeo,
      headPoints,
    });
  }

  const paintTrail = (star: ShootingStar, brightness: number) => {
    const n = SHOOTING.trailPoints;
    const tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const falloff = Math.pow(1 - t, 1.65) * brightness;
      if (t < 0.25) {
        tmp.copy(headColor).lerp(midColor, t / 0.25);
      } else {
        tmp.copy(midColor).lerp(tailColor, (t - 0.25) / 0.75);
      }
      const ci = i * 3;
      star.colors[ci] = tmp.r * falloff;
      star.colors[ci + 1] = tmp.g * falloff;
      star.colors[ci + 2] = tmp.b * falloff;
    }
    star.geo.attributes.color.needsUpdate = true;
  };

  const spawn = (star: ShootingStar) => {
    const side = Math.random() > 0.5 ? 1 : -1;
    star.head.set(
      side * (900 + Math.random() * 1600),
      160 + Math.random() * 280,
      lerp(STAR_Z.closest - 200, STAR_Z.farthest + 400, Math.random()),
    );
    const speed =
      SHOOTING.speedMin +
      Math.random() * (SHOOTING.speedMax - SHOOTING.speedMin);
    star.vel.set(
      -side * speed * (0.55 + Math.random() * 0.35),
      -speed * (0.32 + Math.random() * 0.28),
      speed * (Math.random() * 0.16 - 0.08),
    );
    star.life =
      SHOOTING.lifeMin +
      Math.random() * (SHOOTING.lifeMax - SHOOTING.lifeMin);
    star.age = 0;
    star.active = true;
    star.line.visible = true;
    star.headPoints.visible = true;

    for (let i = 0; i < SHOOTING.trailPoints; i++) {
      const pi = i * 3;
      star.positions[pi] = star.head.x;
      star.positions[pi + 1] = star.head.y;
      star.positions[pi + 2] = star.head.z;
    }
    star.geo.attributes.position.needsUpdate = true;
    paintTrail(star, 0);
  };

  const deactivate = (star: ShootingStar) => {
    star.active = false;
    star.line.visible = false;
    star.headPoints.visible = false;
  };

  const update = (dt: number, nextSpawnAt: { t: number }, now: number) => {
    if (now >= nextSpawnAt.t) {
      const idle = stars.find((s) => !s.active);
      if (idle) spawn(idle);
      nextSpawnAt.t =
        now +
        SHOOTING.minGapSec +
        Math.random() * (SHOOTING.maxGapSec - SHOOTING.minGapSec);
    }

    for (const star of stars) {
      if (!star.active) continue;

      star.age += dt;
      const lifeT = star.age / star.life;
      if (lifeT >= 1) {
        deactivate(star);
        continue;
      }

      star.head.addScaledVector(star.vel, dt);

      // Stretch trail behind the head
      for (let i = SHOOTING.trailPoints - 1; i > 0; i--) {
        const to = i * 3;
        const from = (i - 1) * 3;
        star.positions[to] = star.positions[from];
        star.positions[to + 1] = star.positions[from + 1];
        star.positions[to + 2] = star.positions[from + 2];
      }
      star.positions[0] = star.head.x;
      star.positions[1] = star.head.y;
      star.positions[2] = star.head.z;
      star.geo.attributes.position.needsUpdate = true;

      const headAttr = star.headGeo.attributes.position.array as Float32Array;
      headAttr[0] = star.head.x;
      headAttr[1] = star.head.y;
      headAttr[2] = star.head.z;
      star.headGeo.attributes.position.needsUpdate = true;

      // Ease in, hold, soft fade out
      const brightness =
        lifeT < 0.12
          ? lifeT / 0.12
          : lifeT > 0.65
            ? 1 - (lifeT - 0.65) / 0.35
            : 1;
      paintTrail(star, Math.max(0, brightness));
      const headMat = star.headPoints.material as THREE.PointsMaterial;
      headMat.opacity = (isDark ? 0.95 : 0.7) * brightness;
    }
  };

  return { group, stars, update, disposables };
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
    const { seeds, positions, colors, sizes } = buildStarfield(isDark);

    const scene = new THREE.Scene();
    // Fog hides far recycled rocks until they approach (no hard pop-in)
    scene.fog = new THREE.Fog(isDark ? FOG.dark : FOG.light, 1400, 6200);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      14000,
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
    const rim = new THREE.DirectionalLight(isDark ? 0x60a5fa : 0x2563eb, 0.28);
    rim.position.set(-380, -120, -520);
    scene.add(ambient, key, rim);

    const starPositions: number[] = [];
    const starColors: number[] = [];
    const starSizes: number[] = [];
    seeds.forEach((seed, i) => {
      const base = i * 3;
      starPositions.push(positions[base], positions[base + 1], positions[base + 2]);
      starColors.push(colors[base], colors[base + 1], colors[base + 2]);
      starSizes.push(sizes[i]);
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
    starGeo.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(starSizes, 1),
    );

    // Soft discs + per-star size — avoids the square "salt grain" PointsMaterial look
    const starMat = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: renderer.getPixelRatio() },
        uOpacity: { value: isDark ? 0.95 : 0.78 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * uPixelRatio;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float uOpacity;
        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          if (d > 0.5) discard;
          float core = 1.0 - smoothstep(0.0, 0.22, d);
          float halo = 1.0 - smoothstep(0.12, 0.5, d);
          float alpha = (core * 0.85 + halo * 0.45) * uOpacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      fog: false,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const stars = new THREE.Points(starGeo, starMat);
    const {
      group: rockGroup,
      rocks,
      geometries: rockGeometries,
      materials: rockMaterials,
    } = createRockField(isDark, isMobile);
    const shootingPool = reducedMotion
      ? null
      : createShootingStarPool(isDark, isMobile ? 1 : SHOOTING.poolSize);

    // Backdrop drifts slowly; corridor rocks stay in world space for true fly-through
    const backdrop = new THREE.Group();
    backdrop.add(stars);
    if (shootingPool) backdrop.add(shootingPool.group);
    scene.add(backdrop);
    scene.add(rockGroup);

    const starSeeds = seeds;
    const nextMeteorSpawn = {
      t:
        performance.now() / 1000 +
        SHOOTING.minGapSec * 0.4 +
        Math.random() * 2.5,
    };

    const spawnScale = isMobile
      ? { min: 16, max: 34 }
      : ROCK_SPAWN_SCALE;

    const recycleRock = (rock: RockBody, camZ: number) => {
      const side = Math.random() > 0.5 ? 1 : -1;
      const xMin = isMobile ? 120 : 360;
      const xMax = isMobile ? 340 : FIELD.x * 0.36;
      const ahead =
        ROCK_RECYCLE.aheadMin +
        Math.random() * (ROCK_RECYCLE.aheadMax - ROCK_RECYCLE.aheadMin);
      rock.home.x = side * (xMin + Math.random() * (xMax - xMin));
      rock.home.y = (Math.random() - 0.5) * (isMobile ? 220 : 320);
      rock.home.z = camZ - ahead;
      // Always small at spawn — perspective grows them as we approach
      const depthT =
        (ahead - ROCK_RECYCLE.aheadMin) /
        (ROCK_RECYCLE.aheadMax - ROCK_RECYCLE.aheadMin);
      const scale = lerp(spawnScale.max, spawnScale.min, depthT);
      rock.baseScale = scale;
      rock.mesh.scale.setScalar(scale);
      rock.radius = scale * 1.15;
      rock.mesh.position.copy(rock.home);
      rock.mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );
    };

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

      const velBoost = Math.min(Math.abs(smoothedVelocity) * 0.55, 80);
      const kickCap = 28;
      const kickTarget = Math.max(
        -kickCap,
        Math.min(kickCap, smoothedVelocity * 0.55),
      );
      velocityKick = expSmooth(velocityKick, kickTarget * active, 9, dt);

      const gestureDolly =
        zoomInAmt * (DOLLY_GESTURE_IN + velBoost) -
        zoomOutAmt * (DOLLY_GESTURE_OUT + velBoost);

      // Ship throttle: page depth is the main drive into space
      const progressDolly = p * DOLLY_FROM_PROGRESS;
      const targetCamZ = CAMERA_BASE.z - progressDolly - gestureDolly;
      const cameraLift =
        liftT * 24 + zoomInAmt * 36 - zoomOutAmt * 28 + velocityKick * 0.35;

      camera.position.y = expSmooth(
        camera.position.y,
        CAMERA_BASE.y + cameraLift,
        11,
        dt,
      );
      camera.position.z = expSmooth(camera.position.z, targetCamZ, 10, dt);

      // Star backdrop: slow parallax only (not locked to ship speed)
      backdrop.position.y = expSmooth(
        backdrop.position.y,
        indicatorLift * 0.35 + velocityKick * 0.15,
        10,
        dt,
      );
      backdrop.position.z = expSmooth(
        backdrop.position.z,
        p * 90 + zoomInAmt * 40 - zoomOutAmt * 30,
        10,
        dt,
      );
      backdrop.rotation.z = expSmooth(
        backdrop.rotation.z,
        Math.max(-0.04, Math.min(0.04, smoothedVelocity * 0.00012 * active)),
        9,
        dt,
      );

      const tiltTarget = zoomOutAmt * 0.06 - zoomInAmt * 0.07;
      camera.rotation.x = expSmooth(camera.rotation.x, tiltTarget, 10, dt);

      const targetFov =
        CAMERA_BASE_FOV + zoomOutAmt * 6 - zoomInAmt * 5 + active * 1.5;
      camera.fov = expSmooth(camera.fov, targetFov, 10, dt);
      if (Math.abs(camera.fov - targetFov) > 0.02) {
        camera.updateProjectionMatrix();
      }

      if (!reducedMotion) {
        // Stars: fixed positions + soft twinkle only (distant backdrop)
        const col = starGeo.attributes.color.array as Float32Array;

        for (let i = 0; i < starSeeds.length; i++) {
          const seed = starSeeds[i];
          const index = i * 3;
          const twinkle =
            seed.baseAlpha *
            (0.78 +
              0.22 * Math.sin(count * seed.twinkleSpeed + seed.twinklePhase));
          col[index] = starColors[index] * twinkle;
          col[index + 1] = starColors[index + 1] * twinkle;
          col[index + 2] = starColors[index + 2] * twinkle;
        }

        starGeo.attributes.color.needsUpdate = true;

        shootingPool?.update(dt, nextMeteorSpawn, performance.now() / 1000);

        const camZ = camera.position.z;

        // Asteroids: tumble, bob, grow via perspective, recycle when passed
        for (const rock of rocks) {
          rock.mesh.rotation.x += rock.spin.x * dt;
          rock.mesh.rotation.y += rock.spin.y * dt;
          rock.mesh.rotation.z += rock.spin.z * dt;

          const bob =
            Math.sin(count * ROCK_BOB_SPEED + rock.home.x * 0.001) *
            ROCK_BOB_AMP *
            rock.warpInfluence;
          rock.mesh.position.x = rock.home.x;
          rock.mesh.position.y = rock.home.y + bob;
          rock.mesh.position.z = rock.home.z;

          // Passed the ship — respawn far ahead as a "new" distant rock
          if (rock.home.z > camZ - ROCK_RECYCLE.passMargin) {
            recycleRock(rock, camZ);
            continue;
          }

          // Scrolled back — pull rocks that drifted too far ahead into range
          if (rock.home.z < camZ - ROCK_RECYCLE.aheadMax * 1.2) {
            rock.home.z =
              camZ -
              (ROCK_RECYCLE.aheadMin +
                Math.random() * (ROCK_RECYCLE.aheadMax - ROCK_RECYCLE.aheadMin) * 0.45);
            rock.mesh.position.z = rock.home.z;
          }
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

            a.home.x += dx * push * 0.35;
            a.home.y += dy * push * 0.35;
            a.home.z += dz * push * 0.35;
            b.home.x -= dx * push * 0.35;
            b.home.y -= dy * push * 0.35;
            b.home.z -= dz * push * 0.35;
          }
        }

        count += TWINKLE_SPEED;
      } else {
        backdrop.position.set(0, indicatorLift * 0.35, 0);
        backdrop.rotation.z = 0;
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
      starMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
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
      if (shootingPool) {
        for (const d of shootingPool.disposables) d.dispose();
      }
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
