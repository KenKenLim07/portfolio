"use client";

import { HERO_LAYOUT_DEBUG, HERO_METRICS } from "@/lib/constants";
import { HeroRevealItem } from "@/components/ui/HeroRevealItem";
import { cn } from "@/lib/utils";

type HeroMetricsProps = {
  className?: string;
  /** Mobile pinned footer: compact row, no top border. */
  compact?: boolean;
  /** Desktop right column: stacked under CTAs. */
  variant?: "row" | "column";
};

export function HeroMetrics({
  className,
  compact = false,
  variant = "row",
}: HeroMetricsProps) {
  const stacked = variant === "column";

  return (
    <HeroRevealItem
      group="tail"
      className={cn(
        "overflow-visible",
        HERO_LAYOUT_DEBUG &&
          "rounded-sm border-2 border-dashed border-fuchsia-400 bg-fuchsia-400/5 p-1",
        className,
      )}
    >
      <div
        className={cn(
          stacked
            ? "flex w-full flex-col gap-5 lg:gap-6"
            : compact
              ? "grid grid-cols-3 justify-items-center gap-4 text-center sm:gap-5"
              : "grid grid-cols-3 justify-items-center gap-4 text-center sm:gap-5",
          HERO_LAYOUT_DEBUG && "rounded-sm border-2 border-fuchsia-300/90",
        )}
      >
        {HERO_METRICS.map((metric) => (
          <div
            key={metric.label}
            className={cn(
              "flex min-w-0 flex-col",
              stacked ? "w-full items-start text-left" : "items-center text-center",
            )}
          >
            <p
              className={cn(
                "font-display font-semibold leading-none tracking-tight text-foreground",
                compact
                  ? "text-xl sm:text-2xl"
                  : stacked
                    ? "text-2xl lg:text-4xl xl:text-5xl"
                    : "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl",
              )}
            >
              {metric.value}
            </p>
            <p
              className={cn(
                "mt-1.5 uppercase leading-snug tracking-[0.12em] text-muted",
                compact
                  ? "text-xs sm:text-sm"
                  : "text-xs sm:text-sm lg:mt-2 lg:text-base lg:tracking-[0.14em]",
              )}
            >
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </HeroRevealItem>
  );
}
