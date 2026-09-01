"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGsapReducedMotion } from "@/hooks/useGsapReducedMotion";
import { useAnimationWhenVisible } from "@/hooks/useAnimationWhenVisible";
import { useHeroScrollReveal } from "@/hooks/useHeroScrollReveal";
import {
  ENABLE_HERO_BRAIN,
  HERO_AVAILABILITY,
  HERO_LAYOUT_DEBUG,
  SITE,
} from "@/lib/constants";
import { HeroVisual } from "@/components/HeroVisual";
import { HeroRotatingText } from "@/components/HeroRotatingText";
import { HeroScrollCue } from "@/components/HeroScrollCue";
import { HeroMetrics } from "@/components/HeroMetrics";
import { HeroRevealItem } from "@/components/ui/HeroRevealItem";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";
import { scrollToSection } from "@/lib/scroll-to";

function HeroAvailability({ className }: { className?: string }) {
  const prefersReducedMotion = useGsapReducedMotion();

  return (
    <p
      className={cn(
        "availability-badge inline-flex items-center gap-2.5 px-3.5 py-1.5 text-xs sm:text-sm",
        className,
      )}
    >
      <span className="availability-badge-inner inline-flex items-center gap-2.5">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {!prefersReducedMotion && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50 dark:bg-emerald-400/50" />
          )}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
        </span>
        <span className="text-foreground/90">{HERO_AVAILABILITY}</span>
      </span>
    </p>
  );
}

const HERO_CTA_SIZE =
  "px-[calc(1.03rem*1.02)] py-[calc(0.644rem*1.02)] text-[calc(0.721rem*1.02)] lg:px-[calc(1.25rem*1.02)] lg:py-[calc(0.75rem*1.02)] lg:text-[calc(0.7rem*1.02)]";

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
          "flex flex-row flex-wrap items-center gap-2.5 sm:gap-3",
          HERO_LAYOUT_DEBUG && "rounded-sm border border-sky-300/80",
        )}
      >
        <GradientButton asChild>
          <Link
            href="#projects"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("projects");
            }}
            className={cn(
              "radius-control relative z-10 font-medium uppercase tracking-[0.08em]",
              HERO_CTA_SIZE,
            )}
          >
            View projects
          </Link>
        </GradientButton>
        <GradientButton asChild variant="variant">
          <Link
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("contact");
            }}
            className={cn(
              "radius-control relative z-10 font-medium uppercase tracking-[0.08em]",
              HERO_CTA_SIZE,
            )}
          >
            Get in touch
          </Link>
        </GradientButton>
      </div>
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
  const { ref: headingRef, isVisible: headingInView } =
    useAnimationWhenVisible<HTMLDivElement>({ threshold: 0.15 });

  return (
    <>
      <HeroRevealItem
        group="copy"
        className={cn(compact ? "mb-3" : "mb-4 sm:mb-5")}
      >
        <HeroAvailability />
      </HeroRevealItem>

      <HeroRevealItem
        group="copy"
        className={cn(compact ? "mb-4" : "mb-6 sm:mb-7 lg:mb-8")}
      >
        <HeroRotatingText />
      </HeroRevealItem>

      <div
        ref={headingRef}
        className={cn(
          "hero-mega-heading font-display space-y-0 tracking-tight",
          headingInView && "hero-mega-heading--animate",
        )}
        role="heading"
        aria-level={1}
      >
        <HeroRevealItem group="copy" className="block">
          <span className="hero-mega-solid hero-mega-solid-gradient uppercase">
            FULL-STACK
          </span>
        </HeroRevealItem>
        <HeroRevealItem group="copy" className="block">
          <span className="hero-mega-solid hero-mega-solid-gradient uppercase">
            DEVELOPER
          </span>
        </HeroRevealItem>
        <HeroRevealItem group="copy" className="block">
          <span className="hero-mega mega-outline">• AI Systems</span>
        </HeroRevealItem>
      </div>

      <HeroRevealItem
        group="intro"
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
          Hi, I&apos;m{" "}
          <span className="font-semibold text-foreground">
            {SITE.name}
          </span>
          , {SITE.description}
        </p>
      </HeroRevealItem>
    </>
  );
}

export function HeroSection() {
  const heroContentRef = useRef<HTMLDivElement>(null);

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
        "relative min-h-svh overflow-hidden",
        "lg:h-dvh lg:max-h-dvh",
        HERO_LAYOUT_DEBUG && "border-4 border-red-500",
      )}
    >
      <HeroScrollCue />

      <div ref={heroContentRef} className="relative z-10 lg:h-full lg:min-h-0">
        <div
          data-hero-panel="mobile"
          className={cn(
            "relative z-10 mx-auto flex min-h-svh w-full max-w-7xl flex-col px-5 pb-[max(5rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,calc(env(safe-area-inset-top)+2.75rem))] sm:px-6 sm:pt-[max(5rem,calc(env(safe-area-inset-top)+3rem))] md:px-8 lg:hidden",
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
          </div>
        </div>

        <div
          data-hero-panel="desktop"
          className={cn(
            "relative z-10 mx-auto hidden h-full min-h-0 w-full max-w-7xl flex-col justify-center box-border px-8 pb-16 lg:flex lg:px-12",
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
        </div>
      </div>
    </section>
  );
}
