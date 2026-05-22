"use client";

import { motion, useReducedMotion } from "framer-motion";

const nodes = [
  { id: "ui", label: "Premium UI", x: 18, y: 22 },
  { id: "api", label: "FastAPI", x: 72, y: 18 },
  { id: "ai", label: "AI Pipeline", x: 82, y: 58 },
  { id: "data", label: "Real-time Data", x: 42, y: 72 },
  { id: "web", label: "Next.js", x: 12, y: 58 },
];

const edges: [string, string][] = [
  ["web", "ui"],
  ["ui", "api"],
  ["api", "ai"],
  ["ai", "data"],
  ["data", "web"],
];

function getNode(id: string) {
  return nodes.find((n) => n.id === id)!;
}

export function HeroVisual() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative aspect-[4/5] w-full max-w-md lg:max-w-none">
      <div className="absolute inset-0 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-black" />
      <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_70%_20%,rgba(99,102,241,0.12),transparent_55%)]" />

      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full p-6"
        aria-hidden
      >
        <defs>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
        </defs>
        {edges.map(([from, to], i) => {
          const a = getNode(from);
          const b = getNode(to);
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#edgeGrad)"
              strokeWidth="0.35"
              strokeDasharray="2 2"
            >
              {!prefersReducedMotion && (
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-4"
                  dur={`${3 + i * 0.4}s`}
                  repeatCount="indefinite"
                />
              )}
            </line>
          );
        })}
      </svg>

      {nodes.map((node, i) => (
        <motion.div
          key={node.id}
          className="absolute"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
        >
          <div className="-translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-zinc-950/90 px-3 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400/80" />
              <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-zinc-300">
                {node.label}
              </span>
            </div>
          </div>
        </motion.div>
      ))}

      <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
          System layer
        </p>
        <p className="mt-1 font-display text-sm font-medium text-zinc-200">
          Design → Build → Deploy → Optimize
        </p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-zinc-500 via-zinc-300 to-zinc-500"
            initial={{ width: "0%" }}
            animate={{ width: "72%" }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }
            }
          />
        </div>
      </div>
    </div>
  );
}
