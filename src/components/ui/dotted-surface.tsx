"use client";

import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type DottedSurfaceProps = Omit<React.ComponentProps<"div">, "ref">;

const FOG = {
  space: 0x09090b,
} as const;

const CAMERA_BASE = { x: 0, y: 280, z: 1180 } as const;

/** Max field lift at page bottom — keeps stars in frame (scroll indicator). */
const INDICATOR_MAX_LIFT = 120;

/**
 * Ship throttle: forward scroll flies the corridor.
 * Sun mode keeps the camera (and sun) nearly fixed — rocks stream past instead.
 */
const DOLLY_FROM_PROGRESS = 2200;
const DOLLY_GESTURE_IN = 420;
const DOLLY_GESTURE_OUT = 340;
const CAMERA_BASE_FOV = 60;
/** How fast the ship yaws between forward corridor and reverse hollow (expSmooth λ). */
const FACING_TURN_LAMBDA = 1.85;

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

const STAR_COUNT = 280;
/** Side rocks — main asteroid field. */
const ROCK_COUNT = 14;
/**
 * Depth bands (camera sits around z ≈ 1180 looking toward -Z):
 * - stars: spherical shell so forward + reverse views both have sky
 * - asteroids: corridor ahead of travel; recycled as we pass them
 * - hollow: large eclipse behind the ship (+Z) for "light" facing
 */
/** Side / corridor rock placement bounds. */
const FIELD = { x: 5600, y: 640, z: 6400 } as const;
/** Spherical star shell centered near the travel mid-path. */
const STAR_SHELL = {
  centerZ: 400,
  radiusMin: 5200,
  radiusMax: 9400,
  yScale: 0.72,
} as const;
/** Distant sun — modest hot disc; wash must overshoot the viewport with no hard edge. */
const HOLLOW = {
  ahead: 8600,
  aheadMobile: 6800,
  /** Hot disc radius in world units. */
  voidRadius: 520,
  voidRadiusMobile: 360,
  /** Plane around the disc core. */
  discSpan: 5.5,
  /**
   * Wash plane — oversized vs FOV so soft falloff dies before the square border.
   * At ~8600 ahead, half-FOV height ≈ D*tan(30°) ≈ 5k; plane needs ≫ that.
   */
  washSize: 28000,
  washSizeMobile: 22000,
} as const;
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
  /** Against the sun these read as tiny debris silhouettes. */
  silhouette: boolean;
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

function buildStarfield(): {
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
    // Spherical shell — stars remain when the ship yaws 180° toward the sun
    const radius = lerp(
      STAR_SHELL.radiusMin,
      STAR_SHELL.radiusMax,
      Math.pow(rng(), 0.65),
    );
    const u = rng();
    const v = rng();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y =
      CAMERA_BASE.y +
      radius * Math.sin(phi) * Math.sin(theta) * STAR_SHELL.yScale;
    const z = STAR_SHELL.centerZ + radius * Math.cos(phi);

    const twinklePhase = rng() * Math.PI * 2;
    const twinkleSpeed = randRange(rng, 0.25, 0.9);
    const luminosity = Math.pow(rng(), 2.4);
    const baseAlpha = lerp(0.28, 1, luminosity);
    // Prefer reverse-hemisphere dust as sun silhouettes
    const towardSun = z > CAMERA_BASE.z - 400;
    const silhouette = towardSun && rng() < 0.22;
    const size = silhouette
      ? lerp(2.2, 6.5, Math.pow(rng(), 0.55))
      : lerp(1.4, 5.2, Math.pow(luminosity, 0.65));

    const cool = rng();
    const r = lerp(0.78, 0.98, cool);
    const g = lerp(0.82, 0.98, cool);
    const b = lerp(0.9, 1, cool);

    seeds.push({
      x,
      y,
      z,
      size,
      twinklePhase,
      twinkleSpeed,
      baseAlpha,
      silhouette,
    });
    positions.push(x, y, z);
    colors.push(r, g, b);
    sizes.push(size);
  }

  return { seeds, positions, colors, sizes };
}

/** Distant sun — brighter disc + oversized viewport wash (no square light border). */
function createHollow(isMobile: boolean) {
  const group = new THREE.Group();
  const disposables: Array<THREE.BufferGeometry | THREE.Material> = [];
  const discR = isMobile ? HOLLOW.voidRadiusMobile : HOLLOW.voidRadius;
  const ahead = isMobile ? HOLLOW.aheadMobile : HOLLOW.ahead;
  const discSize = discR * HOLLOW.discSpan;
  const washSize = isMobile ? HOLLOW.washSizeMobile : HOLLOW.washSize;

  // Compact bright sun disc
  const coronaMat = new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 1 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uOpacity;
      void main() {
        vec2 c = vUv - vec2(0.5);
        float d = length(c) * 2.0;
        if (d > 0.95) discard;

        float core = exp(-d * d * 55.0);
        float disc = exp(-d * d * 16.0);
        float limb = exp(-d * d * 5.5) * 0.7;
        float alpha = (core * 1.05 + disc * 0.9 + limb * 0.5) * uOpacity;
        if (alpha < 0.004) discard;

        vec3 hot = vec3(0.97, 0.98, 1.0);
        vec3 warm = vec3(0.78, 0.88, 1.0);
        vec3 cool = vec3(0.5, 0.66, 0.92);
        vec3 col = mix(cool, warm, disc);
        col = mix(col, hot, core);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  disposables.push(coronaMat);

  const coronaGeo = new THREE.PlaneGeometry(discSize, discSize);
  disposables.push(coronaGeo);
  const corona = new THREE.Mesh(coronaGeo, coronaMat);
  corona.position.z = -4;
  corona.frustumCulled = false;

  // Oversized soft wash — alpha ≈ 0 well before the plane edge (kills the box border)
  const outerMat = new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 1 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uOpacity;
      void main() {
        vec2 c = vUv - vec2(0.5);
        // Circular falloff in UV; plane is huge so visible frame never reaches the rim
        float d = length(c) * 2.0;
        // Die out by ~0.55 — mid-edge of a square is d=1.0, corners ~1.41
        if (d > 0.62) discard;

        float bloom = exp(-d * d * 2.8) * 0.55;
        float veil = exp(-d * d * 1.1) * 0.4;
        float fill = exp(-d * d * 0.55) * 0.22;
        float alpha = (bloom + veil + fill) * uOpacity;
        // Extra edge safety — never paint near the geometric border
        alpha *= 1.0 - smoothstep(0.48, 0.62, d);
        if (alpha < 0.002) discard;

        vec3 col = mix(vec3(0.3, 0.42, 0.64), vec3(0.7, 0.84, 1.0), bloom);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  disposables.push(outerMat);
  const outerGeo = new THREE.PlaneGeometry(washSize, washSize);
  disposables.push(outerGeo);
  const outer = new THREE.Mesh(outerGeo, outerMat);
  outer.position.z = -24;
  outer.frustumCulled = false;

  group.add(outer);
  group.add(corona);
  group.position.set(0, CAMERA_BASE.y, CAMERA_BASE.z + ahead);

  return {
    group,
    coronaMat,
    outerMat,
    disposables,
  };
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
      STAR_SHELL.centerZ +
        (Math.random() > 0.5 ? -1 : 1) *
          (STAR_SHELL.radiusMin * 0.35 + Math.random() * 1800),
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
  /** 0 = forward corridor, 1 = reverse hollow. Theme drives this without remounting WebGL. */
  const facingTargetRef = useRef(theme === "light" ? 1 : 0);

  useEffect(() => {
    facingTargetRef.current = theme === "light" ? 1 : 0;
  }, [theme]);

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

    const isMobile = window.innerWidth < 768;
    const { seeds, positions, colors, sizes } = buildStarfield();

    const scene = new THREE.Scene();
    // Fog hides far recycled rocks until they approach (no hard pop-in)
    scene.fog = new THREE.Fog(FOG.space, 1400, 6200);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      22000,
    );
    camera.position.set(CAMERA_BASE.x, CAMERA_BASE.y, CAMERA_BASE.z);
    // Initial facing from stored theme (no flash on first frame)
    let facingAmount = facingTargetRef.current;
    camera.rotation.y = facingAmount * Math.PI;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(scene.fog.color, 0);
    renderer.domElement.style.pointerEvents = "none";

    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x6b7280, 0.55);
    const key = new THREE.DirectionalLight(0xcbd5e1, 0.85);
    key.position.set(420, 680, 320);
    const rim = new THREE.DirectionalLight(0x60a5fa, 0.28);
    rim.position.set(-380, -120, -520);
    scene.add(ambient, key, rim);

    const starPositions: number[] = [];
    const starColors: number[] = [];
    const starSizes: number[] = [];
    const silPositions: number[] = [];
    const silSizes: number[] = [];
    const brightSeeds: StarSeed[] = [];

    seeds.forEach((seed, i) => {
      const base = i * 3;
      if (seed.silhouette) {
        silPositions.push(positions[base], positions[base + 1], positions[base + 2]);
        silSizes.push(sizes[i]);
        return;
      }
      starPositions.push(positions[base], positions[base + 1], positions[base + 2]);
      starColors.push(colors[base], colors[base + 1], colors[base + 2]);
      starSizes.push(sizes[i]);
      brightSeeds.push(seed);
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
        uOpacity: { value: 0.95 },
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
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(starGeo, starMat);

    // Dark debris against the sun — NormalBlending so they read as real silhouettes
    const silGeo = new THREE.BufferGeometry();
    silGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(silPositions, 3),
    );
    silGeo.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(silSizes, 1),
    );
    const silMat = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: renderer.getPixelRatio() },
        uOpacity: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        uniform float uPixelRatio;
        uniform float uOpacity;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * uPixelRatio * (0.85 + uOpacity * 0.35);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          if (d > 0.5) discard;
          float soft = 1.0 - smoothstep(0.1, 0.5, d);
          float alpha = soft * uOpacity;
          if (alpha < 0.02) discard;
          gl_FragColor = vec4(0.02, 0.025, 0.04, alpha);
        }
      `,
      transparent: true,
      depthWrite: true,
      fog: false,
      blending: THREE.NormalBlending,
    });
    const silhouettes = new THREE.Points(silGeo, silMat);
    silhouettes.renderOrder = 2;
    const {
      group: rockGroup,
      rocks,
      geometries: rockGeometries,
      materials: rockMaterials,
    } = createRockField(true, isMobile);
    const shootingPool = reducedMotion
      ? null
      : createShootingStarPool(true, isMobile ? 1 : SHOOTING.poolSize);

    const hollow = createHollow(isMobile);
    const hollowLight = new THREE.PointLight(0xb8cce6, 0, 14000, 2);
    hollow.group.add(hollowLight);

    // Backdrop drifts slowly; corridor rocks stay in world space for true fly-through
    const backdrop = new THREE.Group();
    backdrop.add(stars);
    backdrop.add(silhouettes);
    if (shootingPool) backdrop.add(shootingPool.group);
    scene.add(backdrop);
    scene.add(rockGroup);
    scene.add(hollow.group);

    const starSeeds = brightSeeds;
    const nextMeteorSpawn = {
      t:
        performance.now() / 1000 +
        SHOOTING.minGapSec * 0.4 +
        Math.random() * 2.5,
    };

    const spawnScale = isMobile
      ? { min: 16, max: 34 }
      : ROCK_SPAWN_SCALE;

    const recycleRock = (rock: RockBody, camZ: number, travelSign: number) => {
      const side = Math.random() > 0.5 ? 1 : -1;
      const xMin = isMobile ? 120 : 360;
      const xMax = isMobile ? 340 : FIELD.x * 0.36;
      const ahead =
        ROCK_RECYCLE.aheadMin +
        Math.random() * (ROCK_RECYCLE.aheadMax - ROCK_RECYCLE.aheadMin);
      rock.home.x = side * (xMin + Math.random() * (xMax - xMin));
      rock.home.y = (Math.random() - 0.5) * (isMobile ? 220 : 320);
      // travelSign -1 = forward (-Z), +1 = reverse (+Z)
      rock.home.z = camZ + travelSign * ahead;
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

      // 0 forward / 1 reverse hollow — smooth yaw, snap if reduced motion
      const faceTarget = facingTargetRef.current;
      facingAmount = reducedMotion
        ? faceTarget
        : expSmooth(facingAmount, faceTarget, FACING_TURN_LAMBDA, dt);
      camera.rotation.y = facingAmount * Math.PI;

      const hollowGlow = facingAmount;
      hollow.coronaMat.uniforms.uOpacity.value = 0.45 + hollowGlow * 0.55;
      hollow.outerMat.uniforms.uOpacity.value = 0.35 + hollowGlow * 0.75;
      hollowLight.intensity = hollowGlow * 3.2;
      // Debris silhouettes only read against the sun
      silMat.uniforms.uOpacity.value = hollowGlow * 0.92;

      // Forward: camera flies the corridor. Sun mode: camera stays put, rocks stream.
      const progressDolly = p * DOLLY_FROM_PROGRESS;
      const travel = progressDolly + gestureDolly;
      const face = facingAmount;
      const sunStream = travel * face;
      const targetCamZ = CAMERA_BASE.z - travel * (1 - face);
      const cameraLift =
        (liftT * 24 + zoomInAmt * 36 - zoomOutAmt * 28 + velocityKick * 0.35) *
        (1 - face * 0.85);

      camera.position.y = expSmooth(
        camera.position.y,
        CAMERA_BASE.y + cameraLift,
        11,
        dt,
      );
      camera.position.z = expSmooth(camera.position.z, targetCamZ, 10, dt);

      // Sun fixed in world space — too far to rush toward the ship
      const sunAhead = isMobile ? HOLLOW.aheadMobile : HOLLOW.ahead;
      hollow.group.position.set(0, CAMERA_BASE.y, CAMERA_BASE.z + sunAhead);

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

      const tiltTarget =
        (zoomOutAmt * 0.06 - zoomInAmt * 0.07) * (1 - face * 0.9);
      camera.rotation.x = expSmooth(camera.rotation.x, tiltTarget, 10, dt);

      // Keep FOV stable in sun mode so the distant sun doesn't "zoom"
      const fovKick =
        (zoomOutAmt * 6 - zoomInAmt * 5 + active * 1.5) * (1 - face * 0.92);
      const targetFov = CAMERA_BASE_FOV + fovKick;
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
        const towardSun = face > 0.5;

        // Asteroids: tumble, bob; sun mode streams them past a static camera
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
          // sunStream pulls +Z rocks toward the ship without moving the sun
          const viewZ = rock.home.z - sunStream;
          rock.mesh.position.z = viewZ;

          if (towardSun) {
            if (viewZ < camZ + ROCK_RECYCLE.passMargin) {
              recycleRock(rock, camZ + sunStream, 1);
              rock.mesh.position.z = rock.home.z - sunStream;
              continue;
            }
            if (viewZ > camZ + ROCK_RECYCLE.aheadMax * 1.2) {
              rock.home.z =
                camZ +
                sunStream +
                ROCK_RECYCLE.aheadMin +
                Math.random() *
                  (ROCK_RECYCLE.aheadMax - ROCK_RECYCLE.aheadMin) *
                  0.45;
              rock.mesh.position.z = rock.home.z - sunStream;
            }
          } else {
            if (rock.home.z > camZ - ROCK_RECYCLE.passMargin) {
              recycleRock(rock, camZ, -1);
              continue;
            }
            if (rock.home.z < camZ - ROCK_RECYCLE.aheadMax * 1.2) {
              rock.home.z =
                camZ -
                (ROCK_RECYCLE.aheadMin +
                  Math.random() *
                    (ROCK_RECYCLE.aheadMax - ROCK_RECYCLE.aheadMin) *
                    0.45);
              rock.mesh.position.z = rock.home.z;
            }
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
        camera.rotation.y = facingAmount * Math.PI;
        camera.fov = CAMERA_BASE_FOV;
        camera.updateProjectionMatrix();
        hollow.coronaMat.uniforms.uOpacity.value = 0.45 + facingAmount * 0.55;
        hollow.outerMat.uniforms.uOpacity.value = 0.35 + facingAmount * 0.75;
        hollowLight.intensity = facingAmount * 3.2;
        silMat.uniforms.uOpacity.value = facingAmount * 0.92;
      }

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      starMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      silMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    };

    window.addEventListener("resize", handleResize);
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);

      starGeo.dispose();
      starMat.dispose();
      silGeo.dispose();
      silMat.dispose();
      for (const geo of rockGeometries) geo.dispose();
      for (const mat of rockMaterials) mat.dispose();
      for (const d of hollow.disposables) d.dispose();
      if (shootingPool) {
        for (const d of shootingPool.disposables) d.dispose();
      }
      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none fixed inset-0 -z-10", className)}
      aria-hidden
      {...props}
    />
  );
}
