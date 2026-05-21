import { cn } from "@/lib/utils";
import { AnimatedItem, AnimatedSection } from "./AnimatedSection";

type SectionHeadingProps = {
  label: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  label,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <AnimatedSection
      className={cn(
        "mb-16 md:mb-20",
        align === "center" && "text-center mx-auto max-w-3xl",
        className,
      )}
    >
      <AnimatedItem>
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted">
          {label}
        </p>
      </AnimatedItem>
      <AnimatedItem>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          {title}
        </h2>
      </AnimatedItem>
      {description && (
        <AnimatedItem>
          <p
            className={cn(
              "mt-5 max-w-2xl text-lg leading-relaxed text-muted",
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
