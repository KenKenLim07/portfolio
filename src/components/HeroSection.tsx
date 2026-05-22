"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { SITE } from "@/lib/constants";
import { easeOut } from "@/lib/motion";
import { HeroVisual } from "@/components/HeroVisual";

const headlineLines = [
  { text: "Building", accent: false },
  { text: "Intelligent", accent: true },
  { text: "Digital Experiences", accent: false },
];

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();

  const fade = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: easeOut },
        };

  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden pt-28 pb-16 md:pt-32 md:pb-24"
    >
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-25" />
      <div
        className="pointer-events-none absolute -left-20 top-1/4 select-none font-display text-[clamp(8rem,22vw,18rem)] font-bold leading-none tracking-tighter text-white/[0.02]"
        aria-hidden
      >
        {SITE.name.split(" ")[0]}
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 md:px-8 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10 xl:gap-14">
          {/* Editorial left — asymmetric, not centered stack */}
          <div className="lg:col-span-7">
            <motion.div
              className="mb-8 flex items-center gap-4"
              {...fade(0.05)}
            >
              <span className="font-mono text-xs text-zinc-500">01</span>
              <span className="h-px w-12 bg-white/15" />
              <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
                {SITE.role}
              </span>
            </motion.div>

            <h1 className="font-display font-semibold tracking-tight">
              {headlineLines.map((line, i) => (
                <motion.span
                  key={line.text}
                  className="block overflow-hidden"
                  {...fade(0.15 + i * 0.1)}
                >
                  <span
                    className={`block text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.05] ${
                      line.accent
                        ? "text-zinc-400"
                        : "text-foreground"
                    }`}
                  >
                    {line.text}
                  </span>
                </motion.span>
              ))}
            </h1>

            <motion.p
              className="mt-8 max-w-lg text-base leading-relaxed text-muted md:text-lg"
              {...fade(0.45)}
            >
              {SITE.description}
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
              {...fade(0.55)}
            >
              <Link
                href="#projects"
                className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-colors duration-200 hover:bg-zinc-200"
              >
                View Projects
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#contact"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-foreground transition-colors duration-200 hover:border-white/25 hover:bg-white/5"
              >
                Start a project
              </Link>
            </motion.div>

            <motion.div
              className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-8"
              {...fade(0.65)}
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400/90" />
                </span>
                <span className="text-sm text-zinc-400">
                  Available for new projects
                </span>
              </div>
              <span className="hidden h-4 w-px bg-white/15 sm:block" />
              <span className="text-sm text-muted">
                Premium web · AI systems · Fullstack
              </span>
            </motion.div>
          </div>

          {/* Right — engineering depth visual, not empty glow */}
          <motion.div
            className="lg:col-span-5 lg:pl-4"
            {...fade(0.35)}
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-muted md:flex"
        {...fade(0.85)}
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <ArrowDown className="h-4 w-4 opacity-50" />
      </motion.div>
    </section>
  );
}
