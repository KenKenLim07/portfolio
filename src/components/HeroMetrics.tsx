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

/** 2% below Tailwind scale — keeps hierarchy, slightly tighter hero metrics */
const METRIC_TYPE = {
  valueRow:
    "text-[calc(1.25rem*0.98)] sm:text-[calc(1.5rem*0.98)] lg:text-[calc(1.875rem*0.98)] xl:text-[calc(2.25rem*0.98)]",
  valueStacked:
    "text-[calc(1.25rem*0.98)] lg:text-[calc(1.875rem*0.98)] xl:text-[calc(2.25rem*0.98)]",
  valueCompact:
    "text-[calc(1.125rem*0.98)] sm:text-[calc(1.25rem*0.98)]",
  label: "text-[calc(0.6875rem*0.98)] sm:text-[calc(0.75rem*0.98)]",
  labelLg: "lg:text-[calc(0.875rem*0.98)]",
} as const;

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
                  ? METRIC_TYPE.valueCompact
                  : stacked
                    ? METRIC_TYPE.valueStacked
                    : METRIC_TYPE.valueRow,
              )}
            >
              {metric.value}
            </p>
            <p
              className={cn(
                "mt-1.5 uppercase leading-snug tracking-[0.12em] text-muted",
                METRIC_TYPE.label,
                !compact && "lg:mt-2 lg:tracking-[0.14em]",
                !compact && METRIC_TYPE.labelLg,
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
