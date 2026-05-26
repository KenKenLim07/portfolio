import { cn } from "@/lib/utils";
import { AnimatedItem, AnimatedSection } from "./AnimatedSection";

type SectionHeadingProps = {
  label: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  /** Tajmirul-style uppercase mega title */
  variant?: "default" | "mega";
};

export function SectionHeading({
  label,
  title,
  description,
  align = "left",
  className,
  variant = "mega",
}: SectionHeadingProps) {
  return (
    <AnimatedSection
      className={cn(
        "mb-14 md:mb-20",
        align === "center" && "mx-auto max-w-3xl text-center",
        className,
      )}
    >
      {label && (
        <AnimatedItem>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            {label}
          </p>
        </AnimatedItem>
      )}
      <AnimatedItem>
        <h2
          className={cn(
            variant === "mega"
              ? "section-mega text-foreground"
              : "font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl",
          )}
        >
          {title}
        </h2>
      </AnimatedItem>
      {description && (
        <AnimatedItem>
          <p
            className={cn(
              "mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        </AnimatedItem>
      )}
    </AnimatedSection>
  );
}
