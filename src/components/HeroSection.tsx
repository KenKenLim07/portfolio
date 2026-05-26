"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import {
  ENABLE_HERO_BRAIN,
  HERO_AVAILABILITY,
  HERO_LAYOUT_DEBUG,
  SITE,
} from "@/lib/constants";
import { easeOut } from "@/lib/motion";
import { useHeroEntrance } from "@/hooks/useHeroEntrance";
import { HeroVisual } from "@/components/HeroVisual";
import { HeroRotatingText } from "@/components/HeroRotatingText";
import { HeroMetrics } from "@/components/HeroMetrics";
import {
  HeroEntranceGroup,
  HeroEntranceChild,
  HeroEntranceItem,
} from "@/components/ui/HeroEntrance";
import { cn } from "@/lib/utils";

function HeroCtas({
  delay = 0.5,
  className,
  variant = "inline",
}: {
  delay?: number;
  className?: string;
  variant?: "inline" | "stack";
}) {
  const stacked = variant === "stack";

  return (
    <HeroEntranceItem
      className={cn(
        "overflow-visible",
        HERO_LAYOUT_DEBUG && "rounded-sm border-2 border-dashed border-sky-400 bg-sky-400/5 p-1",
        className,
      )}
      delay={delay}
    >
      <div
        className={cn(
          stacked
            ? "flex w-full min-w-0 flex-col gap-3"
            : "flex flex-row flex-wrap items-center gap-2 sm:gap-3",
          HERO_LAYOUT_DEBUG && "rounded-sm border border-sky-300/80",
        )}
      >
        <Link
          href="#projects"
          className={cn(
            "radius-control group inline-flex cursor-pointer items-center justify-center gap-1.5 bg-foreground font-medium text-background transition-colors duration-200 hover:bg-zinc-200",
            stacked
              ? "w-full px-5 py-2.5 text-sm lg:px-5 lg:py-2.5"
              : "px-4 py-2.5 text-xs sm:px-5 sm:py-3 sm:text-sm",
          )}
        >
          View projects
          <ArrowRight
            className={cn(
              "shrink-0 transition-transform duration-200 group-hover:translate-x-0.5",
              stacked ? "h-4 w-4" : "h-3.5 w-3.5 sm:h-4 sm:w-4",
            )}
          />
        </Link>
        <Link
          href="#contact"
          className={cn(
            "radius-control inline-flex cursor-pointer items-center justify-center border border-white/15 font-medium text-foreground transition-colors duration-200 hover:border-white/25 hover:bg-white/5",
            stacked
              ? "w-full px-5 py-2.5 text-sm lg:px-5 lg:py-2.5"
              : "px-4 py-2.5 text-xs sm:px-5 sm:py-3 sm:text-sm",
          )}
        >
          Get in touch
        </Link>
      </div>
    </HeroEntranceItem>
  );
}

function HeroCopy({
  introClassName,
  compact = false,
}: {
  introClassName?: string;
  compact?: boolean;
}) {
  const { prefersReducedMotion } = useHeroEntrance();
  const reduced = prefersReducedMotion;

  return (
    <>
      <HeroEntranceItem
        className={cn(
          "flex flex-wrap items-center gap-2 sm:gap-3",
          compact ? "mb-4" : "mb-7 sm:mb-8 lg:mb-8",
        )}
        delay={0.05}
      >
        <span className="radius-chip inline-flex items-center gap-2 border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-emerald-300/90">
          <span className="relative flex h-1.5 w-1.5">
            {!reduced && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50" />
            )}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          {HERO_AVAILABILITY}
        </span>
        <span className="hidden h-px w-8 bg-white/15 sm:block" />
        <HeroRotatingText />
      </HeroEntranceItem>

      <h1 className="font-display font-semibold tracking-tight">
        <HeroEntranceGroup delay={0.12}>
          <HeroEntranceChild>
            <span className="hero-mega text-foreground">Full-Stack</span>
          </HeroEntranceChild>
          <HeroEntranceChild>
            <span className="hero-mega hero-mega-muted">&amp; AI Systems</span>
          </HeroEntranceChild>
          <HeroEntranceChild>
            <span className="hero-mega text-foreground">Engineer</span>
          </HeroEntranceChild>
        </HeroEntranceGroup>
      </h1>

      <HeroEntranceItem
        as="p"
        className={cn(
          "max-w-xl leading-relaxed text-muted",
          compact
            ? "mt-3 line-clamp-3 text-sm"
            : "mt-6 text-base leading-relaxed sm:mt-7 sm:text-[1.0625rem] lg:mt-10 lg:text-lg",
          introClassName,
        )}
        delay={0.35}
      >
        Hi! I&apos;m {SITE.name.split(" ").slice(0, 2).join(" ")}. {SITE.description}
      </HeroEntranceItem>
    </>
  );
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { ready, prefersReducedMotion } = useHeroEntrance();
  const reduced = prefersReducedMotion;

  if (ENABLE_HERO_BRAIN) {
    return (
      <section
        ref={sectionRef}
        id="home"
        className="relative min-h-[100dvh] overflow-x-hidden pt-24 pb-16 md:min-h-[105vh] md:pt-32 md:pb-28"
      >
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-10" />
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-6 md:px-8 lg:px-12">
          <HeroVisual />
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="home"
      className={cn(
        "relative overflow-x-hidden lg:h-dvh lg:max-h-dvh lg:overflow-hidden",
        HERO_LAYOUT_DEBUG && "border-4 border-red-500",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />

      {/* Mobile: min full viewport — content from top; quiet space below metrics, no flex spacer */}
      <div
        className={cn(
          "relative mx-auto box-border flex min-h-dvh w-full max-w-7xl flex-col px-5 pb-20 pt-[max(4.5rem,env(safe-area-inset-top))] sm:px-6 sm:pb-24 md:px-8 lg:hidden",
          HERO_LAYOUT_DEBUG && "border-2 border-orange-400 bg-orange-400/5",
        )}
      >
        <div
          className={cn(
            HERO_LAYOUT_DEBUG &&
              "rounded-sm border-2 border-dashed border-lime-400 bg-lime-400/5 p-1",
          )}
        >
          <HeroCopy />
        </div>
        <HeroCtas delay={0.5} className="mt-9 sm:mt-10" />
        <HeroMetrics delay={0.58} className="mt-8 sm:mt-9" />
      </div>

      {/* Desktop: locked to one viewport — content scaled to fit */}
      <div
        className={cn(
          "relative mx-auto hidden h-full max-h-full w-full max-w-7xl flex-col justify-center box-border px-8 pb-14 pt-16 lg:flex lg:px-12",
          HERO_LAYOUT_DEBUG && "border-2 border-orange-400 bg-orange-400/5",
        )}
      >
        <div className="grid grid-cols-12 items-center gap-6 xl:gap-8">
          <div
            className={cn(
              "col-span-7 xl:col-span-7",
              HERO_LAYOUT_DEBUG &&
                "rounded-sm border-2 border-dashed border-lime-400 bg-lime-400/5 p-1",
            )}
          >
            <HeroCopy introClassName="lg:mt-4 lg:max-w-lg lg:text-base" />
          </div>
          <div
            className={cn(
              "col-span-5 xl:col-span-5",
              HERO_LAYOUT_DEBUG &&
                "rounded-sm border-2 border-dashed border-violet-400 bg-violet-400/5 p-1",
            )}
          >
            <div className="flex w-full flex-col gap-5">
              <HeroCtas delay={0.5} variant="stack" className="w-full" />
              <HeroMetrics delay={0.62} variant="column" className="w-full" />
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5"
        initial={reduced ? false : { opacity: 0 }}
        animate={ready ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.7, duration: 0.5, ease: easeOut }}
      >
        <motion.div
          animate={ready && !reduced ? { y: [0, 5, 0] } : undefined}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-4 w-4 text-zinc-600" aria-hidden />
        </motion.div>
        <span className="text-[10px] uppercase tracking-[0.35em] text-zinc-600">
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
