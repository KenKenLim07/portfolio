"use client";

import { HERO_LAYOUT_DEBUG, HERO_METRICS } from "@/lib/constants";
import { AnimatedItem } from "@/components/ui/AnimatedSection";
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
    <AnimatedItem
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
            ? "flex w-full flex-col gap-3 border-t border-border pt-4 lg:gap-3.5 lg:pt-4"
            : compact
              ? "grid grid-cols-3 gap-2 border-t border-border pt-4 sm:gap-3 sm:pt-5"
              : "grid grid-cols-3 gap-2 border-t border-border pt-4 sm:gap-3 sm:pt-5 lg:flex lg:flex-wrap lg:items-start lg:justify-between lg:gap-6 lg:pt-8",
          HERO_LAYOUT_DEBUG && "rounded-sm border-2 border-fuchsia-300/90",
        )}
      >
        {HERO_METRICS.map((metric, i) => (
          <div
            key={metric.label}
            className={cn(
              "min-w-0",
              stacked
                ? i > 0 && "border-t border-border pt-3.5 lg:pt-4"
                : compact
                  ? undefined
                  : cn(
                      "lg:flex-1 lg:basis-auto",
                      i > 0 && "lg:border-l lg:border-border lg:pl-8",
                    ),
            )}
          >
            <p
              className={cn(
                "font-display font-semibold leading-tight tracking-tight text-foreground",
                compact
                  ? "text-base sm:text-lg"
                  : stacked
                    ? "text-lg lg:text-xl"
                    : "text-base sm:text-lg lg:text-2xl xl:text-3xl",
              )}
            >
              {metric.value}
            </p>
            <p
              className={cn(
                "mt-0.5 uppercase leading-snug tracking-[0.12em] text-muted",
                compact
                  ? "text-[9px]"
                  : "text-[9px] sm:text-[10px] lg:mt-1.5 lg:text-xs lg:tracking-[0.14em]",
              )}
            >
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </AnimatedItem>
  );
}
