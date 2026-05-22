"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { MY_BRAIN } from "@/lib/constants";
import { useHeroEntrance } from "@/hooks/useHeroEntrance";
import { useMouseTilt } from "@/hooks/useMouseTilt";
import { easeOut } from "@/lib/motion";
import {
  NEURAL_CORE,
  NEURAL_EDGES,
  NEURAL_MACRO,
  NEURAL_MICRO,
  getNeuralNode,
  synapsePath,
} from "@/lib/neural-brain-graph";

const PULSE_COUNT = 32;

export function HeroVisual() {
  const { ready, prefersReducedMotion } = useHeroEntrance();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { ref, springX, springY, spotlight, onMove, onLeave, tiltEnabled } =
    useMouseTilt(!prefersReducedMotion);

  const pulseEdges = useMemo(
    () =>
      NEURAL_EDGES.filter((e) => e.primary).slice(0, PULSE_COUNT),
    [],
  );

  const connected = useMemo(() => {
    if (!activeId) return null;
    const set = new Set<string>([activeId]);
    for (const e of NEURAL_EDGES) {
      if (e.from === activeId || e.to === activeId) {
        set.add(e.from);
        set.add(e.to);
      }
    }
    return set;
  }, [activeId]);

  const edgeLit = (from: string, to: string) => {
    if (!connected) return true;
    return connected.has(from) && connected.has(to);
  };

  const nodeLit = (id: string) => !connected || connected.has(id);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      animate={
        ready
          ? { opacity: 1, y: 0 }
          : prefersReducedMotion
            ? undefined
            : { opacity: 0, y: 24 }
      }
      transition={{ duration: 0.6, delay: 0.25, ease: easeOut }}
      style={
        tiltEnabled
          ? {
              rotateX: springX,
              rotateY: springY,
              transformPerspective: 1200,
              transformStyle: "preserve-3d",
            }
          : undefined
      }
      className="relative mx-auto w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:mx-0 lg:max-w-none lg:w-full xl:min-h-0"
    >
      <div
        className="relative aspect-[4/5] min-h-[480px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50 sm:min-h-[560px] md:min-h-[620px] lg:min-h-[700px] lg:aspect-auto lg:min-h-[720px] xl:min-h-[800px] 2xl:min-h-[860px]"
        aria-label={`${MY_BRAIN.title} — interactive knowledge map`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 50% at ${spotlight.x}% ${spotlight.y}%, rgba(99,102,241,0.12), transparent 70%)`,
          }}
        />

        <div
          className={`pointer-events-none absolute left-1/2 top-[48%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl ${!prefersReducedMotion ? "mesh-glow-aura" : ""}`}
        />
        <div
          className={`pointer-events-none absolute left-[30%] top-[46%] h-28 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-2xl ${!prefersReducedMotion ? "mesh-glow-aura-delayed" : ""}`}
        />
        <div
          className={`pointer-events-none absolute left-[70%] top-[46%] h-28 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-2xl ${!prefersReducedMotion ? "mesh-glow-aura" : ""}`}
        />

        {!prefersReducedMotion && (
          <>
            <div className="hero-brain-pulse pointer-events-none absolute left-1/2 top-[48%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/25" />
            <div className="hero-brain-pulse-delayed pointer-events-none absolute left-1/2 top-[48%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/15" />
          </>
        )}

        <motion.div
          className="absolute left-4 top-4 z-40 sm:left-5 sm:top-5"
          initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
          transition={{ delay: 0.4, duration: 0.45, ease: easeOut }}
        >
          <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-indigo-300/70 sm:text-[10px]">
            {MY_BRAIN.title}
          </p>
          <h3 className="mt-1 font-display text-base font-semibold leading-snug tracking-tight text-zinc-100 sm:text-lg">
            {MY_BRAIN.previewTitle}
          </h3>
        </motion.div>

        <div
          className={`absolute inset-x-0 top-[10%] bottom-[18%] origin-center scale-[1.06] sm:scale-[1.1] md:scale-[1.14] lg:scale-[1.2] xl:scale-[1.26] 2xl:scale-[1.32] ${!prefersReducedMotion ? "mesh-alive-wrap" : ""}`}
        >
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="synapseHot" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(129,140,248,0.5)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="100%" stopColor="rgba(167,139,250,0.45)" />
            </linearGradient>
            <linearGradient id="synapseDim" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(99,102,241,0.08)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.14)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0.08)" />
            </linearGradient>
            <radialGradient id="meshGlow" cx="50%" cy="48%" r="55%">
              <stop offset="0%" stopColor="rgba(99,102,241,0.12)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0)" />
            </radialGradient>
            <filter id="synapseGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.15" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse
            cx="50"
            cy="48"
            rx="46"
            ry="42"
            fill="url(#meshGlow)"
            opacity="0.85"
          >
            {!prefersReducedMotion && (
              <>
                <animate
                  attributeName="opacity"
                  values="0.55;0.95;0.55"
                  dur="4.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="rx"
                  values="44;48;44"
                  dur="5.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="ry"
                  values="40;44;40"
                  dur="5.5s"
                  repeatCount="indefinite"
                />
              </>
            )}
          </ellipse>

          <g filter="url(#synapseGlow)">
            {NEURAL_EDGES.map((edge, edgeIndex) => {
              const a = getNeuralNode(edge.from);
              const b = getNeuralNode(edge.to);
              const lit = edgeLit(edge.from, edge.to);
              const d = synapsePath(a.x, a.y, b.x, b.y, edge.primary ? 0.14 : 0.22);
              const isMicro = a.tier === "micro" && b.tier === "micro";
              const baseOpacity = lit ? (edge.primary ? 0.85 : 0.45) : 0.12;
              return (
                <path
                  key={`${edge.from}-${edge.to}`}
                  d={d}
                  fill="none"
                  stroke={lit ? "url(#synapseHot)" : "url(#synapseDim)"}
                  strokeWidth={
                    lit
                      ? edge.primary
                        ? 0.35
                        : isMicro
                          ? 0.22
                          : 0.28
                      : isMicro
                        ? 0.1
                        : 0.14
                  }
                  opacity={baseOpacity}
                  className="transition-all duration-300"
                >
                  {!prefersReducedMotion && lit && edge.primary && (
                    <animate
                      attributeName="opacity"
                      values={`${baseOpacity * 0.55};${baseOpacity};${baseOpacity * 0.55}`}
                      dur={`${2.8 + (edgeIndex % 5) * 0.4}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </path>
              );
            })}

          {/* Traveling impulses along primary synapses */}
          {!prefersReducedMotion &&
            pulseEdges.map((edge, i) => {
              const a = getNeuralNode(edge.from);
              const b = getNeuralNode(edge.to);
              const d = synapsePath(a.x, a.y, b.x, b.y, 0.14);
              const reverse = i % 3 === 0;
              const dur = `${1.6 + (i % 9) * 0.28}s`;
              return (
                <circle
                  key={`pulse-${i}`}
                  r={i % 4 === 0 ? "0.65" : "0.5"}
                  fill="rgba(224,231,255,0.95)"
                >
                  <animate
                    attributeName="opacity"
                    values="0.15;1;0.15"
                    dur={dur}
                    repeatCount="indefinite"
                  />
                  <animateMotion
                    dur={dur}
                    repeatCount="indefinite"
                    path={d}
                    keyPoints={reverse ? "1;0" : "0;1"}
                    keyTimes="0;1"
                  />
                </circle>
              );
            })}

          {/* Micro neurons (inside brain) */}
          {NEURAL_MICRO.map((n, i) => {
            const lit = nodeLit(n.id);
            const r = lit && activeId ? 0.55 : 0.38;
            return (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={r}
                fill={lit ? "rgba(199,210,254,0.7)" : "rgba(255,255,255,0.18)"}
                className="transition-all duration-300"
              >
                {!prefersReducedMotion && lit && (
                  <>
                    <animate
                      attributeName="opacity"
                      values="0.25;0.85;0.25"
                      dur={`${2.2 + (i % 7) * 0.35}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="r"
                      values={`${r * 0.85};${r * 1.15};${r * 0.85}`}
                      dur={`${3 + (i % 6) * 0.4}s`}
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
            );
          })}
          </g>
        </svg>

        {/* Core */}
        <motion.div
          className="absolute z-30"
          style={{ left: `${NEURAL_CORE.x}%`, top: `${NEURAL_CORE.y}%` }}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.7 }}
          animate={
            ready ? { opacity: 1, scale: nodeLit("core") ? 1.08 : 1 } : { opacity: 0, scale: 0.7 }
          }
          transition={{ delay: 0.45, duration: 0.5 }}
          onMouseEnter={() => setActiveId("core")}
          onMouseLeave={() => setActiveId(null)}
        >
          <div className="-translate-x-1/2 -translate-y-1/2">
            <div
              className={`relative flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 sm:h-14 sm:w-14 ${
                activeId === "core" || !activeId
                  ? `border-indigo-300/50 bg-indigo-500/25 shadow-[0_0_32px_rgba(99,102,241,0.35)] ${!prefersReducedMotion ? "mesh-core-heartbeat" : ""}`
                  : "border-white/20 bg-zinc-950/80"
              }`}
            >
              <Brain
                className={`h-6 w-6 sm:h-7 sm:w-7 ${
                  activeId === "core" || !activeId ? "text-indigo-100" : "text-zinc-500"
                }`}
                strokeWidth={1.2}
              />
            </div>
          </div>
        </motion.div>

        {/* Skill markers — anchored inside the brain at each node */}
        {NEURAL_MACRO.map((node, i) => (
          <motion.button
            key={node.id}
            type="button"
            className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-default flex-col items-center border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.6 }}
            animate={
              ready
                ? { opacity: 1, scale: activeId === node.id ? 1.12 : 1 }
                : { opacity: 0, scale: 0.6 }
            }
            transition={{ delay: 0.52 + i * 0.03, duration: 0.35 }}
            onMouseEnter={() => setActiveId(node.id)}
            onMouseLeave={() => setActiveId(null)}
            aria-label={node.label}
          >
            <span
              className={`mb-0.5 block h-1.5 w-1.5 rounded-full ring-2 ring-black/40 sm:h-2 sm:w-2 ${
                activeId === node.id
                  ? "bg-indigo-200 shadow-[0_0_8px_rgba(199,210,254,0.9)]"
                  : "bg-indigo-400/70"
              }`}
            />
            <span
              className={`max-w-[3.75rem] truncate rounded-md border px-1 py-px text-center text-[7px] font-medium leading-tight tracking-wide backdrop-blur-sm sm:max-w-[4.25rem] sm:px-1.5 sm:text-[8px] ${
                activeId === node.id
                  ? "border-indigo-300/50 bg-indigo-950/90 text-indigo-100"
                  : "border-white/10 bg-zinc-950/85 text-zinc-400"
              }`}
            >
              {node.label}
            </span>
          </motion.button>
        ))}
        </div>

        <div className="absolute bottom-3 left-3 right-3 z-40 rounded-xl border border-white/10 bg-black/60 p-3 backdrop-blur-md sm:bottom-4 sm:left-4 sm:right-4 sm:p-4">
          <p className="text-right font-mono text-[9px] text-emerald-400/90 sm:text-[10px]">
            {NEURAL_EDGES.length} synapses
          </p>
          <p className="mt-1 text-[11px] leading-snug text-zinc-400 sm:text-xs">
            {MY_BRAIN.description}
          </p>
          <p className="mt-2 font-display text-xs font-medium text-zinc-200 sm:text-sm">
            {MY_BRAIN.pipeline}
          </p>
          <p className="mt-3 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-indigo-200/80 sm:text-[11px]">
            {MY_BRAIN.preview3d}
          </p>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/10 sm:mt-3">
            <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-indigo-500/70 via-indigo-400/50 to-violet-500/40" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
