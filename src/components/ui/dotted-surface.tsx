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
 * Tuned to the deep rock belt so mid→bottom scroll still feels like travel
 * (field reaches ~6–9k ahead; keep dolly a solid fraction of that).
 */
const DOLLY_FROM_PROGRESS = 3800;
const DOLLY_GESTURE_IN = 520;
const DOLLY_GESTURE_OUT = 420;
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

const STAR_COUNT = 280;
/** Side rocks — forward corridor (dark / travel). */
const ROCK_COUNT_FORWARD = 20;
/** Extra deep-belt rocks past full-page dolly so the bottom still has asteroids ahead. */
const ROCK_COUNT_FORWARD_FAR = 14;
/** Side rocks — toward the sun (+Z), visible in light / sun-facing mode. */
const ROCK_COUNT_SUNWARD = 10;
/**
 * Depth bands (camera sits around z ≈ 1180 looking toward -Z):
 * - stars: spherical shell (visible forward + when yawed toward the sun)
 * - asteroids: fixed field in both directions (forward −Z deep past dolly + sunward +Z)
 * - sun: behind the ship (+Z) — only shown in sun-facing mode
 */
/** Side / corridor rock placement bounds. */
const FIELD = { x: 5600, y: 640, z: 9600 } as const;
/** Spherical star shell centered near the travel mid-path. */
const STAR_SHELL = {
  centerZ: 400,
  radiusMin: 5200,
  radiusMax: 9400,
  yScale: 0.72,
} as const;
/**
 * Distant sun for sun mode — sits behind the ship (+Z).
 * Upper-right in the reverse view (screen-right = world −X after 180° yaw).
 */
const SUN = {
  /** Distance behind (+Z) from camera base. */
  ahead: 7200,
  aheadMobile: 5600,
  offsetX: 2200,
  offsetY: 1200,
  offsetXMobile: 1400,
  offsetYMobile: 900,
  voidRadius: 420,
  voidRadiusMobile: 300,
  discSpan: 5.5,
  washSize: 24000,
  washSizeMobile: 18000,
} as const;
/** How fast the ship yaws between forward corridor and sun-facing (expSmooth λ). */
const FACING_TURN_LAMBDA = 1.85;

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

/**
 * Asteroid size mix — many small debris, fewer medium, rare giants.
 * (Avoids the old depth-linked lerp that made most rocks read the same on screen.)
 */
function pickRockScale(rng: Rng, isMobile: boolean): number {
  const roll = rng();
  if (isMobile) {
    if (roll < 0.5) return randRange(rng, 10, 24);
    if (roll < 0.78) return randRange(rng, 24, 46);
    if (roll < 0.93) return randRange(rng, 46, 82);
    return randRange(rng, 82, 130);
  }
  if (roll < 0.46) return randRange(rng, 14, 34);
  if (roll < 0.74) return randRange(rng, 34, 70);
  if (roll < 0.91) return randRange(rng, 70, 128);
  return randRange(rng, 128, 220);
}

/**
 * Lateral scatter — mostly near the viewport edges (flanks), not mid-frame.
 * Random side + depth jitter avoids the old dual-column look without
 * dumping rocks in the center.
 */
function pickRockX(
  rng: Rng,
  isMobile: boolean,
  xMin: number,
  xMax: number,
): number {
  const side = rng() < 0.5 ? -1 : 1;
  // Bias hard toward the outer edge of the allowed band
  const t = Math.pow(rng(), 0.35);
  const inner = xMin * (isMobile ? 0.95 : 0.85);
  const outer = xMax * (isMobile ? 1.55 : 1.25);
  const absX = lerp(inner, outer, t);
  // Small jitter only — keep them on the flank, not drifting to center
  return side * absX + randRange(rng, isMobile ? -22 : -50, isMobile ? 22 : 50);
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
    // Spherical shell backdrop
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
    const size = lerp(1.4, 5.2, Math.pow(luminosity, 0.65));

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
    });
    positions.push(x, y, z);
    colors.push(r, g, b);
    sizes.push(size);
  }

  return { seeds, positions, colors, sizes };
}

/** Distant sun — bright disc + oversized corona wash (no square light border). */
function createSun(isMobile: boolean) {
  const group = new THREE.Group();
  const disposables: Array<THREE.BufferGeometry | THREE.Material> = [];
  const discR = isMobile ? SUN.voidRadiusMobile : SUN.voidRadius;
  const discSize = discR * SUN.discSpan;
  const washSize = isMobile ? SUN.washSizeMobile : SUN.washSize;

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

        vec3 hot = vec3(0.95, 0.97, 1.0);
        vec3 warm = vec3(0.72, 0.84, 1.0);
        vec3 cool = vec3(0.42, 0.58, 0.84);
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
  corona.renderOrder = 3;

  const outerMat = new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 0.85 },
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
        if (d > 0.62) discard;

        float bloom = exp(-d * d * 2.8) * 0.55;
        float veil = exp(-d * d * 1.1) * 0.4;
        float fill = exp(-d * d * 0.55) * 0.22;
        float alpha = (bloom + veil + fill) * uOpacity;
        alpha *= 1.0 - smoothstep(0.48, 0.62, d);
        if (alpha < 0.002) discard;

        vec3 col = mix(vec3(0.42, 0.56, 0.78), vec3(0.78, 0.88, 1.0), bloom);
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
  outer.renderOrder = 2;

  group.add(outer);
  group.add(corona);
  sunWorldPosition(isMobile, group.position);

  return {
    group,
    coronaMat,
    outerMat,
    disposables,
  };
}

/** Lightweight additive flare — streak + ghost orbs (no postprocessing). */
function createSunFlare(isMobile: boolean) {
  const group = new THREE.Group();
  const disposables: Array<THREE.BufferGeometry | THREE.Material | THREE.Texture> =
    [];
  const mats: THREE.MeshBasicMaterial[] = [];

  const makeDiscTexture = (soft = true) => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    if (soft) {
      g.addColorStop(0, "rgba(220, 235, 255, 1)");
      g.addColorStop(0.25, "rgba(140, 180, 255, 0.55)");
      g.addColorStop(0.6, "rgba(80, 130, 220, 0.12)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
    } else {
      g.addColorStop(0, "rgba(255, 255, 255, 1)");
      g.addColorStop(0.15, "rgba(200, 220, 255, 0.8)");
      g.addColorStop(0.45, "rgba(100, 150, 255, 0.2)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    disposables.push(tex);
    return tex;
  };

  const discTex = makeDiscTexture(true);
  const streakTex = makeDiscTexture(false);

  const addSprite = (
    map: THREE.Texture,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    opacity: number,
    color: number,
  ) => {
    const mat = new THREE.MeshBasicMaterial({
      map,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      depthTest: false,
      fog: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    mats.push(mat);
    disposables.push(mat);
    const geo = new THREE.PlaneGeometry(w, h);
    disposables.push(geo);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    group.add(mesh);
    return mesh;
  };

  const scale = isMobile ? 0.7 : 1;
  // Horizontal streak through the sun
  addSprite(
    streakTex,
    5200 * scale,
    180 * scale,
    0,
    0,
    8,
    0.35,
    0xb8d4ff,
  );
  // Ghost orbs along a diagonal (screen-space feel once billboarded)
  const ghosts: Array<[number, number, number, number, number]> = [
    [0.55, -280, 160, 12, 0x7dd3fc],
    [0.4, -620, 340, 18, 0x93c5fd],
    [0.32, -980, 520, 24, 0x67e8f9],
    [0.22, 420, -220, 14, 0xa5b4fc],
  ];
  for (const [op, x, y, z, col] of ghosts) {
    const s = (220 + Math.abs(x) * 0.08) * scale;
    addSprite(discTex, s, s, x * scale, y * scale, z, op, col);
  }

  const setIntensity = (amount: number) => {
    const a = Math.max(0, Math.min(1, amount));
    // Base opacities baked into construction order: streak then 4 ghosts
    const bases = [0.35, 0.55, 0.4, 0.32, 0.22];
    for (let i = 0; i < mats.length; i++) {
      mats[i]!.opacity = (bases[i] ?? 0.25) * a;
      mats[i]!.visible = a > 0.02;
    }
  };

  return { group, setIntensity, disposables };
}

function sunWorldPosition(isMobile: boolean, out: THREE.Vector3) {
  const ahead = isMobile ? SUN.aheadMobile : SUN.ahead;
  const offsetX = isMobile ? SUN.offsetXMobile : SUN.offsetX;
  const offsetY = isMobile ? SUN.offsetYMobile : SUN.offsetY;
  // Behind ship (+Z). Negative X ⇒ upper-right after 180° yaw toward +Z.
  return out.set(
    -offsetX,
    CAMERA_BASE.y + offsetY,
    CAMERA_BASE.z + ahead,
  );
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

  // IcosahedronGeometry is non-indexed (duplicate verts per face). Displacement
  // MUST be deterministic from position/normal — any per-vertex random opens seams.
  for (let i = 0; i < pos.count; i++) {
    vertex.fromBufferAttribute(pos, i);
    const n = vertex.clone().normalize();

    const ridge =
      0.22 * Math.sin(n.x * 6.1 + n.y * 2.7) +
      0.16 * Math.sin(n.y * 5.3 - n.z * 4.8) +
      0.12 * Math.sin(n.z * 8.4 + n.x * 3.1) +
      0.09 * Math.sin(n.x * 11.0 + n.y * 9.5 + n.z * 7.2) +
      0.06 * Math.sin(n.x * 17.0 - n.y * 14.0);

    const craterSeed = Math.abs(Math.sin(n.x * 17.0) * Math.cos(n.y * 19.0));
    const crater = craterSeed > 0.78 ? -0.28 * (craterSeed - 0.78) * 5 : 0;

    // Soft lobe stretch — keeps a closed shell, just less spherical
    const lobe =
      0.08 * n.x * n.y + 0.06 * n.y * n.z - 0.05 * n.z * n.x;

    const scale = 1 + ridge + crater + lobe;
    scratch.copy(n).multiplyScalar(scale);
    pos.setXYZ(i, scratch.x, scratch.y, scratch.z);
  }

  // Per-rock oblong shape (uniform transform — does not crack faces)
  geometry.scale(
    randRange(rng, 0.55, 1.55),
    randRange(rng, 0.5, 1.25),
    randRange(rng, 0.6, 1.6),
  );
  geometry.computeVertexNormals();
  return geometry;
}

type RockSurfaceMaps = {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
};

function fade(t: number) {
  return t * t * (3 - 2 * t);
}

function hash2(ix: number, iy: number, seed: number) {
  let n = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function valueNoise2(x: number, y: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);
  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

function fbm2(x: number, y: number, seed: number, octaves = 4) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2(x * freq, y * freq, seed + i * 101);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/**
 * Shared procedural rock surfaces (albedo + normal + roughness).
 * No image assets — generated once and reused across the field.
 */
function createRockSurfaceMaps(size: number, seed: number): RockSurfaceMaps {
  const rng = createRng(seed);
  const height = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      let h = fbm2(u * 6, v * 6, seed, 5);
      h = h * 0.72 + fbm2(u * 18, v * 18, seed + 7, 3) * 0.28;
      height[y * size + x] = h;
    }
  }

  const craterCount = 10 + Math.floor(rng() * 8);
  for (let i = 0; i < craterCount; i++) {
    const cx = rng() * size;
    const cy = rng() * size;
    const radius = size * randRange(rng, 0.035, 0.14);
    const depth = randRange(rng, 0.25, 0.55);
    const rim = randRange(rng, 0.04, 0.12);
    const r2 = radius * radius;
    const minX = Math.max(0, Math.floor(cx - radius - 2));
    const maxX = Math.min(size - 1, Math.ceil(cx + radius + 2));
    const minY = Math.max(0, Math.floor(cy - radius - 2));
    const maxY = Math.min(size - 1, Math.ceil(cy + radius + 2));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const d = Math.sqrt(d2) / radius;
        const bowl = (1 - d * d) * depth;
        const rimLift = Math.exp(-Math.pow((d - 0.85) / 0.12, 2)) * rim;
        const idx = y * size + x;
        height[idx] = Math.max(0, Math.min(1, height[idx] - bowl + rimLift));
      }
    }
  }

  const albedo = document.createElement("canvas");
  albedo.width = size;
  albedo.height = size;
  const albedoCtx = albedo.getContext("2d")!;
  const albedoData = albedoCtx.createImageData(size, size);

  const normal = document.createElement("canvas");
  normal.width = size;
  normal.height = size;
  const normalCtx = normal.getContext("2d")!;
  const normalData = normalCtx.createImageData(size, size);

  const rough = document.createElement("canvas");
  rough.width = size;
  rough.height = size;
  const roughCtx = rough.getContext("2d")!;
  const roughData = roughCtx.createImageData(size, size);

  const sampleH = (x: number, y: number) => {
    const ix = ((x % size) + size) % size;
    const iy = ((y % size) + size) % size;
    return height[iy * size + ix];
  };

  const strength = 3.2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const h = height[y * size + x];
      const grit = fbm2((x / size) * 22, (y / size) * 22, seed + 19, 2);

      const shade = 0.22 + h * 0.34 + grit * 0.1;
      albedoData.data[i] = Math.floor(shade * 255 * 1.08);
      albedoData.data[i + 1] = Math.floor(shade * 255 * 1.0);
      albedoData.data[i + 2] = Math.floor(shade * 255 * 0.94);
      albedoData.data[i + 3] = 255;

      const dx = (sampleH(x + 1, y) - sampleH(x - 1, y)) * strength;
      const dy = (sampleH(x, y + 1) - sampleH(x, y - 1)) * strength;
      const nx = -dx;
      const ny = -dy;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      normalData.data[i] = Math.floor(((nx / len) * 0.5 + 0.5) * 255);
      normalData.data[i + 1] = Math.floor(((ny / len) * 0.5 + 0.5) * 255);
      normalData.data[i + 2] = Math.floor(((nz / len) * 0.5 + 0.5) * 255);
      normalData.data[i + 3] = 255;

      const roughV = Math.min(1, 0.72 + (1 - h) * 0.12 + grit * 0.22);
      const rv = Math.floor(roughV * 255);
      roughData.data[i] = rv;
      roughData.data[i + 1] = rv;
      roughData.data[i + 2] = rv;
      roughData.data[i + 3] = 255;
    }
  }

  albedoCtx.putImageData(albedoData, 0, 0);
  normalCtx.putImageData(normalData, 0, 0);
  roughCtx.putImageData(roughData, 0, 0);

  const map = new THREE.CanvasTexture(albedo);
  const normalMap = new THREE.CanvasTexture(normal);
  const roughnessMap = new THREE.CanvasTexture(rough);

  for (const tex of [map, normalMap, roughnessMap]) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = tex === map ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
  }

  return { map, normalMap, roughnessMap };
}

function createRockField(
  isDark: boolean,
  isMobile: boolean,
): {
  group: THREE.Group;
  rocks: RockBody[];
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
  textures: THREE.Texture[];
} {
  const rng = createRng(ROCK_SEED);
  const group = new THREE.Group();
  const rocks: RockBody[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  // Shared surface packs — detail without N unique GPU uploads of source pixels
  const mapSize = isMobile ? 128 : 256;
  const surfacePacks: RockSurfaceMaps[] = [
    createRockSurfaceMaps(mapSize, 0xa11e1),
    createRockSurfaceMaps(mapSize, 0xb0a57),
    createRockSurfaceMaps(mapSize, 0xc4a7e),
  ];
  for (const pack of surfacePacks) {
    textures.push(pack.map, pack.normalMap, pack.roughnessMap);
  }

  // Side rocks stay on the flanks / near viewport edges
  const xMin = isMobile ? 140 : 420;
  const xMax = isMobile ? 520 : FIELD.x * 0.42;
  const aheadMin = isMobile ? 360 : 420;
  // Past DOLLY_FROM_PROGRESS so rocks remain ahead at page bottom
  const aheadMax = isMobile ? 4800 : 6200;
  // Keep rocks in the lower ~15–20% of frame (camera eye ≈ y 280)
  const yMin = isMobile ? -300 : -380;
  const yMax = isMobile ? -50 : -70;
  const yMinFar = isMobile ? -340 : -440;
  const yMaxFar = isMobile ? -60 : -90;

  const pushRock = (opts: {
    x: number;
    y: number;
    z: number;
    scale: number;
    warpInfluence: number;
  }) => {
    // Heavier meshes get a bit more geo detail
    const detail = opts.scale > (isMobile ? 70 : 110) ? 2 : rng() > 0.35 ? 2 : 1;
    const geometry = createAsteroidGeometry(rng, detail);
    geometries.push(geometry);

    const pack = surfacePacks[Math.floor(rng() * surfacePacks.length)]!;
    const repeat = randRange(rng, 1.6, 2.8);
    const tone = rng();
    // Tint multiplies the albedo map
    const color = isDark
      ? new THREE.Color().setRGB(
          lerp(0.75, 1.05, tone),
          lerp(0.72, 1.0, tone),
          lerp(0.68, 0.95, tone),
        )
      : new THREE.Color().setRGB(
          lerp(0.7, 0.95, tone),
          lerp(0.68, 0.92, tone),
          lerp(0.64, 0.88, tone),
        );

    const map = pack.map.clone();
    const normalMap = pack.normalMap.clone();
    const roughnessMap = pack.roughnessMap.clone();
    map.repeat.set(repeat, repeat);
    normalMap.repeat.set(repeat, repeat);
    roughnessMap.repeat.set(repeat, repeat);
    const ox = rng();
    const oy = rng();
    map.offset.set(ox, oy);
    normalMap.offset.set(ox, oy);
    roughnessMap.offset.set(ox, oy);
    textures.push(map, normalMap, roughnessMap);

    const material = new THREE.MeshStandardMaterial({
      color,
      map,
      normalMap,
      normalScale: new THREE.Vector2(
        randRange(rng, 1.1, 1.7),
        randRange(rng, 1.1, 1.7),
      ),
      roughnessMap,
      roughness: randRange(rng, 0.88, 1),
      metalness: 0,
      // Smooth base so crater/normal maps can show micro-relief
      flatShading: false,
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

    // Unique tumble: one dominant axis; larger rocks spin slower
    const axis = new THREE.Vector3(
      randRange(rng, -1, 1),
      randRange(rng, -1, 1),
      randRange(rng, -1, 1),
    );
    if (axis.lengthSq() < 0.001) axis.set(0.2, 1, 0.1);
    axis.normalize();
    const mass = Math.max(opts.scale, 16);
    const spinRate =
      randRange(rng, 0.018, 0.08) * (48 / mass);
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

  // Forward field (−Z) — dark / travel mode flies through these
  for (let i = 0; i < ROCK_COUNT_FORWARD; i++) {
    const depthT = Math.pow(rng(), 0.55);
    const ahead = lerp(aheadMin, aheadMax, depthT);
    // Nudge giants slightly farther so they don't swallow the hero
    let scale = pickRockScale(rng, isMobile);
    if (scale > (isMobile ? 70 : 120) && ahead < (isMobile ? 900 : 1200)) {
      scale *= randRange(rng, 0.45, 0.65);
    }
    pushRock({
      x: pickRockX(rng, isMobile, xMin, xMax),
      y: randRange(rng, yMin, yMax),
      z: CAMERA_BASE.z - ahead,
      scale,
      warpInfluence: 1,
    });
  }

  // Deep belt — beyond full scroll travel so the page bottom still has rocks ahead
  const farMin = isMobile ? 3200 : 4200;
  const farMax = isMobile ? 7200 : 9200;
  for (let i = 0; i < ROCK_COUNT_FORWARD_FAR; i++) {
    const depthT = Math.pow(rng(), 0.7);
    const ahead = lerp(farMin, farMax, depthT);
    // Bias far belt toward medium–large so distant rocks still read
    let scale = pickRockScale(rng, isMobile);
    if (rng() < 0.45) scale = Math.max(scale, pickRockScale(rng, isMobile));
    scale *= randRange(rng, 1.05, 1.4);
    pushRock({
      x: pickRockX(rng, isMobile, xMin, xMax),
      y: randRange(rng, yMinFar, yMaxFar),
      z: CAMERA_BASE.z - ahead,
      scale,
      warpInfluence: 1,
    });
  }

  // Two flank rocks — near, but kept off-center so the mid view stays clear
  pushRock({
    x: isMobile ? -200 : -480,
    y: isMobile ? -90 : -120,
    z: CAMERA_BASE.z - (isMobile ? 420 : 520),
    scale: isMobile ? 24 : 36,
    warpInfluence: 0.18,
  });
  pushRock({
    x: isMobile ? 220 : 520,
    y: isMobile ? -110 : -140,
    z: CAMERA_BASE.z - (isMobile ? 680 : 860),
    scale: isMobile ? 22 : 34,
    warpInfluence: 0.18,
  });

  // Far asteroid, lower-right edge (forward)
  pushRock({
    x: isMobile ? 340 : 920,
    y: isMobile ? -40 : -55,
    z: CAMERA_BASE.z - (isMobile ? 1100 : 1500),
    scale: isMobile ? 26 : 42,
    warpInfluence: 0.85,
  });

  // Mid-deep anchors — intentional size steps (medium → large → giant), on flanks
  pushRock({
    x: isMobile ? -300 : -780,
    y: isMobile ? -70 : -100,
    z: CAMERA_BASE.z - (isMobile ? 2400 : 3200),
    scale: isMobile ? 52 : 96,
    warpInfluence: 0.9,
  });
  pushRock({
    x: isMobile ? 360 : 980,
    y: isMobile ? -130 : -180,
    z: CAMERA_BASE.z - (isMobile ? 3600 : 4800),
    scale: isMobile ? 72 : 145,
    warpInfluence: 0.95,
  });
  pushRock({
    x: isMobile ? -280 : -720,
    y: isMobile ? -160 : -220,
    z: CAMERA_BASE.z - (isMobile ? 5200 : 6800),
    scale: isMobile ? 95 : 195,
    warpInfluence: 1,
  });

  // Sunward field (+Z) — light / sun-facing mode looks this way
  for (let i = 0; i < ROCK_COUNT_SUNWARD; i++) {
    const depthT = Math.pow(rng(), 0.55);
    const ahead = lerp(aheadMin, aheadMax, depthT);
    let scale = pickRockScale(rng, isMobile);
    if (scale > (isMobile ? 70 : 120) && ahead < (isMobile ? 900 : 1200)) {
      scale *= randRange(rng, 0.45, 0.65);
    }
    pushRock({
      x: pickRockX(rng, isMobile, xMin, xMax),
      y: randRange(rng, yMin, yMax),
      z: CAMERA_BASE.z + ahead,
      scale,
      warpInfluence: 1,
    });
  }

  // Near sunward accents — kept on the flanks
  pushRock({
    x: isMobile ? 240 : 520,
    y: isMobile ? -80 : -110,
    z: CAMERA_BASE.z + (isMobile ? 480 : 620),
    scale: isMobile ? 22 : 34,
    warpInfluence: 0.25,
  });
  pushRock({
    x: isMobile ? -260 : -560,
    y: isMobile ? -100 : -130,
    z: CAMERA_BASE.z + (isMobile ? 720 : 980),
    scale: isMobile ? 24 : 38,
    warpInfluence: 0.35,
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

  return { group, rocks, geometries, materials, textures };
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
  /** 0 = forward corridor, 1 = sun-facing. Theme drives this without remounting WebGL. */
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
    scene.fog = new THREE.Fog(FOG.space, 3200, 9800);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      22000,
    );
    camera.position.set(CAMERA_BASE.x, CAMERA_BASE.y, CAMERA_BASE.z);
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

    const forwardKeyPos = new THREE.Vector3(420, 680, 320);
    const focus = new THREE.Vector3(0, CAMERA_BASE.y, CAMERA_BASE.z - 900);
    const sunPos = sunWorldPosition(isMobile, new THREE.Vector3());

    const ambient = new THREE.AmbientLight(0x9ca3af, 0.55);
    const key = new THREE.DirectionalLight(0xe2e8f0, 1.2);
    key.position.copy(forwardKeyPos);
    key.target.position.copy(focus);
    scene.add(key.target);
    const fill = new THREE.DirectionalLight(0x94a3b8, 0.32);
    fill.position.set(-280, 200, 480);
    const rim = new THREE.DirectionalLight(0x60a5fa, 0.22);
    rim.position.set(-380, -120, -520);
    scene.add(ambient, key, fill, rim);

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    starGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3),
    );
    starGeo.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(sizes, 1),
    );
    const starColors = colors.slice();

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

    const {
      group: rockGroup,
      rocks,
      geometries: rockGeometries,
      materials: rockMaterials,
      textures: rockTextures,
    } = createRockField(true, isMobile);
    const shootingPool = reducedMotion
      ? null
      : createShootingStarPool(true, isMobile ? 1 : SHOOTING.poolSize);

    const sun = createSun(isMobile);
    const flare = createSunFlare(isMobile);
    const sunGlow = new THREE.PointLight(0xb8d4ff, 0, 16000, 2);
    sun.group.add(sunGlow);
    // Hidden in forward mode until the ship yaws toward it
    sun.coronaMat.uniforms.uOpacity.value = 0;
    sun.outerMat.uniforms.uOpacity.value = 0;
    flare.setIntensity(0);

    const backdrop = new THREE.Group();
    backdrop.add(stars);
    if (shootingPool) backdrop.add(shootingPool.group);
    scene.add(backdrop);
    scene.add(rockGroup);
    scene.add(sun.group);
    scene.add(flare.group);

    const starSeeds = seeds;
    const nextMeteorSpawn = {
      t:
        performance.now() / 1000 +
        SHOOTING.minGapSec * 0.4 +
        Math.random() * 2.5,
    };

    const ndc = new THREE.Vector3();
    const timer = new THREE.Timer();
    timer.connect(document);

    let count = 0;
    let animationId = 0;
    let velocityKick = 0;
    let smoothedActivity = 0;
    let smoothedVelocity = 0;
    let smoothedGesture = 0;
    let flareAmt = 0;

    const updateSunVisuals = (face: number) => {
      sunWorldPosition(isMobile, sun.group.position);
      sun.group.quaternion.copy(camera.quaternion);
      flare.group.position.copy(sun.group.position);
      flare.group.quaternion.copy(camera.quaternion);

      // Keep class in sync if React wiped it but data-theme says sun
      if (document.documentElement.dataset.theme === "sun") {
        document.documentElement.classList.add("sun");
      }

      const show = face > 0.02;
      sun.group.visible = show;
      flare.group.visible = show;
      if (!show) {
        flare.setIntensity(0);
        sun.coronaMat.uniforms.uOpacity.value = 0;
        sun.outerMat.uniforms.uOpacity.value = 0;
        sunGlow.intensity = 0;
        return;
      }

      ndc.copy(sun.group.position).project(camera);
      const inFront = ndc.z < 1;
      const cx = Math.max(-1.4, Math.min(1.4, ndc.x));
      const cy = Math.max(-1.4, Math.min(1.4, ndc.y));
      const edge = Math.max(Math.abs(cx), Math.abs(cy));
      const edgeFade = 1 - smoothstep(0.75, 1.25, edge);
      const target = !inFront
        ? 0
        : (reducedMotion ? 0.22 : 0.9) * edgeFade * face;
      flareAmt = lerp(flareAmt, target, 0.14);
      flare.setIntensity(flareAmt);
      sun.coronaMat.uniforms.uOpacity.value = face * (0.7 + flareAmt * 0.3);
      sun.outerMat.uniforms.uOpacity.value = face * (0.5 + flareAmt * 0.4);
      sunGlow.intensity = face * 2.6;
    };

    const animate = (timestamp: number) => {
      animationId = requestAnimationFrame(animate);
      timer.update(timestamp);
      const dt = Math.min(timer.getDelta(), 0.05);

      const scroll = scrollRef.current;

      const goingUp =
        scroll.progress.target < scroll.progress.current - 0.0005;
      const goingDown =
        scroll.progress.target > scroll.progress.current + 0.0005;

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

      const gestureTarget =
        dir === 1 ? active : dir === -1 ? -active : 0;
      smoothedGesture = expSmooth(smoothedGesture, gestureTarget, 7, dt);
      const zoomInAmt = Math.max(0, smoothedGesture);
      const zoomOutAmt = Math.max(0, -smoothedGesture);

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

      const faceTarget = facingTargetRef.current;
      facingAmount = reducedMotion
        ? faceTarget
        : expSmooth(facingAmount, faceTarget, FACING_TURN_LAMBDA, dt);
      camera.rotation.y = facingAmount * Math.PI;
      const face = facingAmount;

      const progressDolly = p * DOLLY_FROM_PROGRESS;
      const travel = progressDolly + gestureDolly;
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

      // Lights: corridor fill forward → sun key when facing the sun
      sunWorldPosition(isMobile, sunPos);
      key.position.lerpVectors(forwardKeyPos, sunPos, face);
      key.intensity = lerp(1.2, 1.55, face);
      ambient.intensity = lerp(0.55, 0.36, face);
      if (face > 0.5) {
        focus.set(0, camera.position.y, camera.position.z + 900);
      } else {
        focus.set(0, camera.position.y, camera.position.z - 900);
      }
      key.target.position.copy(focus);

      updateSunVisuals(face);

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

      const fovKick =
        (zoomOutAmt * 6 - zoomInAmt * 5 + active * 1.5) * (1 - face * 0.92);
      const targetFov = CAMERA_BASE_FOV + fovKick;
      camera.fov = expSmooth(camera.fov, targetFov, 10, dt);
      if (Math.abs(camera.fov - targetFov) > 0.02) {
        camera.updateProjectionMatrix();
      }

      if (!reducedMotion) {
        const col = starGeo.attributes.color.array as Float32Array;

        for (let i = 0; i < starSeeds.length; i++) {
          const seed = starSeeds[i]!;
          const index = i * 3;
          const twinkle =
            seed.baseAlpha *
            (0.78 +
              0.22 * Math.sin(count * seed.twinkleSpeed + seed.twinklePhase));
          col[index] = starColors[index]! * twinkle;
          col[index + 1] = starColors[index + 1]! * twinkle;
          col[index + 2] = starColors[index + 2]! * twinkle;
        }

        starGeo.attributes.color.needsUpdate = true;

        shootingPool?.update(dt, nextMeteorSpawn, performance.now() / 1000);

        // Fixed asteroid field — camera travels through; scroll-back restores
        // the same rocks (no recycle / home drift).
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
          rock.mesh.position.z = rock.home.z - sunStream;
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
        updateSunVisuals(facingAmount);
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
      timer.dispose();
      starGeo.dispose();
      starMat.dispose();
      for (const geo of rockGeometries) geo.dispose();
      for (const mat of rockMaterials) mat.dispose();
      for (const tex of rockTextures) tex.dispose();
      for (const d of sun.disposables) d.dispose();
      for (const d of flare.disposables) d.dispose();
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

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
