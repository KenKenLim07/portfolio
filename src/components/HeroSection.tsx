"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { SITE } from "@/lib/constants";
import { fadeInUp, easeOut } from "@/lib/motion";
import { useHeroEntrance } from "@/hooks/useHeroEntrance";
import { HeroVisual } from "@/components/HeroVisual";
import { HeroAurora } from "@/components/HeroAurora";
import { HeroRotatingText } from "@/components/HeroRotatingText";
import {
  HeroEntranceGroup,
  HeroEntranceChild,
  HeroEntranceItem,
} from "@/components/ui/HeroEntrance";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { ready, prefersReducedMotion } = useHeroEntrance();

  const [scrollFx, setScrollFx] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setScrollFx(mq.matches);
    const handler = () => setScrollFx(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const visualY = useTransform(scrollYProgress, [0.5, 1], [0, 48]);
  const contentOpacity = useTransform(scrollYProgress, [0.82, 1], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0.82, 1], [0, 32]);

  const useScrollEffects = scrollFx && !prefersReducedMotion;

  const entrance = (delay: number) => {
    if (prefersReducedMotion) return {};
    return {
      initial: fadeInUp.hidden,
      animate: ready ? fadeInUp.visible : fadeInUp.hidden,
      transition: { duration: 0.6, delay, ease: easeOut },
    };
  };

  const headlineClass =
    "block text-[clamp(2.25rem,8vw,5rem)] leading-[1.05]";

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-[100dvh] overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20 md:min-h-[105vh] md:pt-32 md:pb-28"
    >
      <HeroAurora />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-20" />

      <div className="pointer-events-none absolute -left-12 top-[14%] hidden select-none font-display text-[clamp(6rem,18vw,14rem)] font-bold leading-none tracking-tighter text-white/[0.025] sm:block">
        {SITE.name.split(" ")[0]}
      </div>

      <motion.div
        className="relative mx-auto w-full max-w-7xl px-5 sm:px-6 md:px-8 lg:px-12"
        style={
          useScrollEffects
            ? { opacity: contentOpacity, y: contentY }
            : undefined
        }
      >
        <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-12 lg:items-stretch lg:gap-6 xl:gap-10">
          <div className="lg:col-span-5 xl:col-span-5">
            <HeroEntranceItem
              className="mb-6 flex flex-wrap items-center gap-3 sm:mb-8 sm:gap-4"
              delay={0.05}
            >
              <span className="font-mono text-xs tabular-nums text-zinc-500">
                01
              </span>
              <span className="h-px w-8 bg-white/15 sm:w-14" />
              <HeroRotatingText />
            </HeroEntranceItem>

            <h1 className="font-display font-semibold tracking-tight">
              <HeroEntranceGroup delay={0.1}>
                <HeroEntranceChild>
                  <span className={`${headlineClass} text-foreground`}>
                    Building
                  </span>
                </HeroEntranceChild>
                <HeroEntranceChild>
                  <span
                    className={`${headlineClass} hero-shimmer-text`}
                  >
                    Intelligent
                  </span>
                </HeroEntranceChild>
                <HeroEntranceChild>
                  <span className={`${headlineClass} text-foreground`}>
                    Digital Experiences
                  </span>
                </HeroEntranceChild>
              </HeroEntranceGroup>
            </h1>

            <HeroEntranceItem
              as="p"
              className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:mt-8 md:text-lg"
              delay={0.4}
            >
              {SITE.description}
            </HeroEntranceItem>

            <HeroEntranceItem
              className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4"
              delay={0.5}
            >
              <Link
                href="#projects"
                className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-colors duration-200 hover:bg-zinc-200 sm:px-7"
              >
                View Projects
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#contact"
                className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-foreground transition-colors duration-200 hover:border-white/25 hover:bg-white/5 sm:px-7"
              >
                Start a project
              </Link>
            </HeroEntranceItem>

            <HeroEntranceItem
              className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 sm:mt-14 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8"
              delay={0.6}
            >
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  {!prefersReducedMotion && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40 opacity-75" />
                  )}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400/90" />
                </span>
                <span className="text-sm text-zinc-400">
                  Available for new projects
                </span>
              </div>
              <div className="flex flex-wrap gap-4 font-mono text-xs text-zinc-500 sm:gap-6">
                <span>
                  <span className="text-foreground">5+</span> stacks
                </span>
                <span>
                  <span className="text-foreground">AI</span> native
                </span>
                <span>
                  <span className="text-foreground">24h</span> response
                </span>
              </div>
            </HeroEntranceItem>
          </div>

          <div className="flex lg:col-span-7 lg:pl-0 xl:col-span-7">
            <motion.div
              className="w-full lg:flex lg:min-h-[720px] lg:items-center xl:min-h-[800px]"
              style={useScrollEffects ? { y: visualY } : undefined}
            >
              <HeroVisual />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        style={useScrollEffects ? { opacity: contentOpacity } : undefined}
        {...entrance(0.75)}
      >
        <motion.div
          animate={ready && !prefersReducedMotion ? { y: [0, 5, 0] } : undefined}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-4 w-4 text-zinc-500" />
        </motion.div>
        <span className="text-[10px] uppercase tracking-[0.35em] text-zinc-600">
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
