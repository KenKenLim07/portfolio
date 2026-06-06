"use client";

import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { useHeroScrollReveal } from "@/hooks/useHeroScrollReveal";
import { gsap, initGsap } from "@/lib/gsap";
import {
  ENABLE_HERO_BRAIN,
  HERO_AVAILABILITY,
  HERO_LAYOUT_DEBUG,
  SITE,
} from "@/lib/constants";
import { HeroVisual } from "@/components/HeroVisual";
import { HeroRotatingText } from "@/components/HeroRotatingText";
import { HeroMetrics } from "@/components/HeroMetrics";
import { HeroRevealItem } from "@/components/ui/HeroRevealItem";
import { cn } from "@/lib/utils";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function HeroAvailability() {
  const prefersReducedMotion = useGsapReducedMotion();

  return (
    <p className="mt-3 flex items-center gap-2 text-xs text-muted sm:mt-3.5 sm:text-sm">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {!prefersReducedMotion && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50 dark:bg-emerald-400/50" />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
      </span>
      {HERO_AVAILABILITY}
    </p>
  );
}

function HeroCtas({ className }: { className?: string }) {
  return (
    <div
      data-hero-cta-panel
      className={cn(
        "relative z-30 overflow-visible",
        HERO_LAYOUT_DEBUG && "rounded-sm border-2 border-dashed border-sky-400 bg-sky-400/5 p-1",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-row flex-wrap items-center gap-2 sm:gap-3",
          HERO_LAYOUT_DEBUG && "rounded-sm border border-sky-300/80",
        )}
      >
        <Link
          href="#projects"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("projects");
          }}
          className="radius-control group relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 bg-foreground px-4 py-2.5 text-xs font-medium text-background transition-colors duration-200 hover:opacity-90 sm:px-5 sm:py-3 sm:text-sm"
        >
          View projects
          <ArrowDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-y-0.5" />
        </Link>
        <Link
          href="#contact"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("contact");
          }}
          className="radius-control relative z-10 inline-flex cursor-pointer items-center justify-center border border-border bg-subtle px-4 py-2.5 text-xs font-medium text-foreground transition-colors duration-200 hover:border-border hover:bg-[var(--fill-hover)] sm:px-5 sm:py-3 sm:text-sm"
        >
          Get in touch
        </Link>
      </div>
      <HeroAvailability />
    </div>
  );
}

function HeroCopy({
  introClassName,
  compact = false,
}: {
  introClassName?: string;
  compact?: boolean;
}) {
  return (
    <>
      <HeroRevealItem
        group="copy"
        className={cn(compact ? "mb-4" : "mb-6 sm:mb-7 lg:mb-8")}
      >
        <HeroRotatingText />
      </HeroRevealItem>

      <div
        className="font-display font-semibold tracking-tight"
        role="heading"
        aria-level={1}
      >
        <HeroRevealItem group="copy" className="block">
          <span className="hero-mega text-foreground">Full-Stack</span>
        </HeroRevealItem>
        <HeroRevealItem group="copy" className="block">
          <span className="hero-mega hero-mega-muted">&amp; AI Systems</span>
        </HeroRevealItem>
        <HeroRevealItem group="copy" className="block">
          <span className="hero-mega text-foreground">Engineer</span>
        </HeroRevealItem>
      </div>

      <HeroRevealItem
        group="copy"
        className={cn(
          compact ? "mt-3" : "mt-5 sm:mt-6 lg:mt-10",
          introClassName,
        )}
      >
        <p
          className={cn(
            "max-w-xl leading-relaxed text-muted",
            compact
              ? "line-clamp-3 text-sm"
              : "max-w-[36ch] text-[1.0625rem] leading-relaxed sm:max-w-xl sm:text-lg lg:max-w-xl lg:text-lg",
          )}
        >
          Hi! I&apos;m{" "}
          <span className="font-semibold text-foreground">
            {SITE.name}
          </span>
          . {SITE.description}
        </p>
      </HeroRevealItem>
    </>
  );
}

function HeroScrollCue({ className }: { className?: string }) {
  const iconRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useGsapReducedMotion();

  useGSAP(
    () => {
      initGsap();
      const el = iconRef.current;
      if (!el || prefersReducedMotion) return;

      gsap.to(el, {
        y: 5,
        duration: 1.1,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: iconRef, dependencies: [prefersReducedMotion] },
  );

  return (
    <HeroRevealItem
      group="cue"
      className={cn("pointer-events-none flex items-center justify-center", className)}
    >
      <span ref={iconRef} className="inline-flex" aria-hidden>
        <svg viewBox="0 0 12 8" className="h-3 w-3 text-muted" fill="currentColor">
          <path d="M6 8 0 0h12L6 8z" />
        </svg>
      </span>
    </HeroRevealItem>
  );
}

export function HeroSection() {
  const heroContentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useGsapReducedMotion();

  useHeroScrollReveal(heroContentRef);

  if (ENABLE_HERO_BRAIN) {
    return (
      <section
        id="home"
        className="relative min-h-[100dvh] overflow-x-hidden pt-24 pb-16 md:min-h-[105vh] md:pt-32 md:pb-28"
      >
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-6 md:px-8 lg:px-12">
          <HeroVisual />
        </div>
      </section>
    );
  }

  return (
    <section
      id="home"
      className={cn(
        "relative isolate z-[1] overflow-x-hidden",
        "lg:h-dvh lg:max-h-dvh lg:overflow-hidden",
        HERO_LAYOUT_DEBUG && "border-4 border-red-500",
      )}
    >
      <div ref={heroContentRef} className="relative z-[2] lg:h-full lg:min-h-0">
        <div
          data-hero-panel="mobile"
          className={cn(
            "relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 pb-[max(5rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,calc(env(safe-area-inset-top)+2.75rem))] sm:px-6 sm:pt-[max(5rem,calc(env(safe-area-inset-top)+3rem))] md:px-8 lg:hidden",
            HERO_LAYOUT_DEBUG && "border-2 border-orange-400 bg-orange-400/5",
          )}
        >
          <div
            className={cn(
              "shrink-0",
              HERO_LAYOUT_DEBUG &&
                "rounded-sm border-2 border-dashed border-lime-400 bg-lime-400/5 p-1",
            )}
          >
            <HeroCopy />
          </div>

          <div
            className={cn(
              "relative mt-auto flex w-full flex-col gap-6 pt-8 pb-12 sm:gap-7 sm:pt-9 sm:pb-14",
              HERO_LAYOUT_DEBUG && "rounded-sm border-2 border-dashed border-amber-400/80",
            )}
          >
            <HeroCtas />
            <HeroMetrics variant="row" />
            {!prefersReducedMotion && (
              <HeroScrollCue className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2" />
            )}
          </div>
        </div>

        <div
          data-hero-panel="desktop"
          className={cn(
            "relative mx-auto hidden h-full min-h-0 w-full max-w-7xl flex-col justify-center box-border px-8 pb-16 lg:flex lg:px-12",
            /* h-16 nav + 2.5rem breathing room — centers in the band below the bar */
            "lg:pt-[calc(4rem+2.5rem)]",
            HERO_LAYOUT_DEBUG && "border-2 border-orange-400 bg-orange-400/5",
          )}
        >
          <div className="grid grid-cols-12 items-center gap-8 xl:gap-10">
            <div
              className={cn(
                "col-span-12 lg:col-span-8",
                HERO_LAYOUT_DEBUG &&
                  "rounded-sm border-2 border-dashed border-lime-400 bg-lime-400/5 p-1",
              )}
            >
              <HeroCopy introClassName="lg:mt-6 lg:max-w-xl" />
            </div>

            <div
              className={cn(
                "col-span-12 flex w-full flex-col gap-5 lg:col-span-4",
                HERO_LAYOUT_DEBUG &&
                  "rounded-sm border-2 border-dashed border-amber-400 bg-amber-400/5 p-1",
              )}
            >
              <HeroCtas className="w-full" />
              <HeroMetrics variant="column" className="w-full" />
            </div>
          </div>

          {!prefersReducedMotion && (
            <HeroScrollCue className="absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10" />
          )}
        </div>
      </div>
    </section>
  );
}
