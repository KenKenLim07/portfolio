"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SITE } from "@/lib/constants";
import { easeOut } from "@/lib/motion";

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();

  const fade = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: easeOut },
        };

  return (
    <section
      id="home"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden pt-28 pb-20"
    >
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[720px] -translate-x-1/2 glow-orb" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/5 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl px-6 md:px-8 lg:px-12">
        <motion.div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted"
          {...fade(0.1)}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          {SITE.role}
        </motion.div>

        <motion.h1
          className="font-display max-w-4xl text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          {...fade(0.2)}
        >
          <span className="text-gradient">{SITE.tagline}</span>
        </motion.h1>

        <motion.p
          className="mt-8 max-w-2xl text-lg leading-relaxed text-muted md:text-xl"
          {...fade(0.35)}
        >
          {SITE.description}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
          {...fade(0.5)}
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
            className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-medium text-foreground transition-colors duration-200 hover:border-white/25 hover:bg-white/10"
          >
            Contact Me
          </Link>
        </motion.div>

        <motion.div
          className="mt-20 grid max-w-3xl grid-cols-3 gap-6 border-t border-white/10 pt-10"
          {...fade(0.65)}
          aria-hidden
        >
          {[
            { value: "Fullstack", label: "Engineering" },
            { value: "AI Systems", label: "Intelligence" },
            { value: "Premium UX", label: "Product Design" },
          ].map((item) => (
            <div key={item.label} className="text-center sm:text-left">
              <p className="font-display text-sm font-semibold text-foreground md:text-base">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-muted">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block">
        <motion.div
          animate={prefersReducedMotion ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-10 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"
        />
      </div>
    </section>
  );
}
