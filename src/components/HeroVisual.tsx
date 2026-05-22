"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { useHeroEntrance } from "@/hooks/useHeroEntrance";
import { useMouseTilt } from "@/hooks/useMouseTilt";
import { easeOut } from "@/lib/motion";
import {
  BRAIN_CLIP_PATH,
  BRAIN_OUTER_PATH,
  BRAIN_SULCI_PATHS,
  NEURAL_CORE,
  NEURAL_EDGES,
  NEURAL_MACRO,
  NEURAL_MICRO,
  getNeuralNode,
  synapsePath,
} from "@/lib/neural-brain-graph";

const PULSE_COUNT = 18;

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
      className="relative mx-auto w-full max-w-sm md:max-w-md lg:mx-0 lg:max-w-none"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/50 sm:aspect-[4/5]">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 50% at ${spotlight.x}% ${spotlight.y}%, rgba(99,102,241,0.12), transparent 70%)`,
          }}
        />

        <div className="pointer-events-none absolute left-1/2 top-[48%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="pointer-events-none absolute left-[30%] top-[46%] h-28 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="pointer-events-none absolute left-[70%] top-[46%] h-28 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-2xl" />

        {!prefersReducedMotion && (
          <>
            <div className="hero-brain-pulse pointer-events-none absolute left-1/2 top-[48%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/25" />
            <div className="hero-brain-pulse-delayed pointer-events-none absolute left-1/2 top-[48%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/15" />
          </>
        )}

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
            <radialGradient id="brainGlow" cx="50%" cy="48%" r="42%">
              <stop offset="0%" stopColor="rgba(99,102,241,0.16)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0)" />
            </radialGradient>
            <clipPath id="brainClip">
              <path d={BRAIN_CLIP_PATH} />
            </clipPath>
            <filter id="synapseGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.15" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Brain body */}
          <path
            d={BRAIN_OUTER_PATH}
            fill="url(#brainGlow)"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="0.45"
          />
          {BRAIN_SULCI_PATHS.map((d, i) => (
            <path
              key={`sulci-${i}`}
              d={d}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="0.22"
              strokeLinecap="round"
            />
          ))}

          {/* Synapse mesh clipped to brain shape */}
          <g clipPath="url(#brainClip)" filter="url(#synapseGlow)">
            {NEURAL_EDGES.map((edge) => {
              const a = getNeuralNode(edge.from);
              const b = getNeuralNode(edge.to);
              const lit = edgeLit(edge.from, edge.to);
              const d = synapsePath(a.x, a.y, b.x, b.y, edge.primary ? 0.14 : 0.22);
              const isMicro = a.tier === "micro" && b.tier === "micro";
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
                  opacity={lit ? (edge.primary ? 0.85 : 0.45) : 0.12}
                  className="transition-all duration-300"
                />
              );
            })}

          {/* Traveling impulses along primary synapses */}
          {!prefersReducedMotion &&
            pulseEdges.map((edge, i) => {
              const a = getNeuralNode(edge.from);
              const b = getNeuralNode(edge.to);
              const d = synapsePath(a.x, a.y, b.x, b.y, 0.14);
              return (
                <circle key={`pulse-${i}`} r="0.55" fill="rgba(224,231,255,0.9)">
                  <animateMotion
                    dur={`${1.8 + (i % 7) * 0.35}s`}
                    repeatCount="indefinite"
                    path={d}
                  />
                </circle>
              );
            })}

          {/* Micro neurons (inside brain) */}
          {NEURAL_MICRO.map((n, i) => {
            const lit = nodeLit(n.id);
            return (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={lit && activeId ? 0.55 : 0.38}
                fill={lit ? "rgba(199,210,254,0.7)" : "rgba(255,255,255,0.18)"}
                className="transition-all duration-300"
              >
                {!prefersReducedMotion && lit && i % 9 === 0 && (
                  <animate
                    attributeName="opacity"
                    values="0.4;1;0.4"
                    dur={`${2 + (i % 5)}s`}
                    repeatCount="indefinite"
                  />
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
                  ? "border-indigo-300/50 bg-indigo-500/25 shadow-[0_0_32px_rgba(99,102,241,0.35)]"
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

        {/* Macro region labels */}
        {NEURAL_MACRO.map((node, i) => (
          <motion.button
            key={node.id}
            type="button"
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-default border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 rounded-full"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={
              ready
                ? { opacity: 1, scale: activeId === node.id ? 1.08 : 1 }
                : { opacity: 0, scale: 0.8 }
            }
            transition={{ delay: 0.52 + i * 0.04, duration: 0.4 }}
            onMouseEnter={() => setActiveId(node.id)}
            onMouseLeave={() => setActiveId(null)}
            aria-label={node.label}
          >
            <span
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 backdrop-blur-md transition-all duration-200 sm:gap-1.5 sm:px-2.5 sm:py-1 ${
                activeId === node.id
                  ? "border-indigo-300/40 bg-indigo-500/20 text-indigo-100 shadow-md shadow-indigo-500/20"
                  : "border-white/10 bg-zinc-950/80 text-zinc-400"
              }`}
            >
              <span
                className={`h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5 ${
                  activeId === node.id ? "bg-indigo-200" : "bg-indigo-500/60"
                }`}
              />
              <span className="whitespace-nowrap text-[8px] font-medium uppercase tracking-wider sm:text-[9px]">
                {node.label}
              </span>
            </span>
          </motion.button>
        ))}

        <div className="absolute bottom-3 left-3 right-3 z-40 rounded-xl border border-white/10 bg-black/60 p-3 backdrop-blur-md sm:bottom-4 sm:left-4 sm:right-4 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-500 sm:text-[10px]">
              Neural mesh
            </p>
            <span className="font-mono text-[9px] text-emerald-400/90 sm:text-[10px]">
              {NEURAL_EDGES.length} synapses
            </span>
          </div>
          <p className="mt-1 font-display text-xs font-medium text-zinc-200 sm:text-sm">
            Ingest → Encode → Reason → Deliver
          </p>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/10 sm:mt-3">
            <motion.div
              className="hero-progress-bar h-full rounded-full"
              initial={{ width: "0%" }}
              animate={ready ? { width: "82%" } : { width: "0%" }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { delay: 0.75, duration: 1.4, ease: easeOut }
              }
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
