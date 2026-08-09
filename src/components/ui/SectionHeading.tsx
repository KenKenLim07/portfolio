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

/** Leading words outlined; last word solid fill. Sun mode adapts via globals.css. */
export function MegaTitleText({ title }: { title: string }) {
  const parts = title.trim().split(/\s+/);
  if (parts.length < 2) {
    return <span className="text-foreground">{title}</span>;
  }

  const last = parts.at(-1)!;
  const lead = parts.slice(0, -1).join(" ");

  return (
    <>
      <span className="section-mega-outline">
        {lead}{" "}
      </span>
      <span className="text-foreground">{last}</span>
    </>
  );
}

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
      delay={0.15}
      className={cn(
        "mb-14 md:mb-20",
        align === "center" && "mx-auto max-w-3xl text-center",
        className,
      )}
    >
      {label && (
        <AnimatedItem>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {label}
          </p>
        </AnimatedItem>
      )}
      <AnimatedItem>
        <h2
          className={cn(
            variant === "mega"
              ? "section-mega"
              : "font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl",
          )}
        >
          {variant === "mega" ? <MegaTitleText title={title} /> : title}
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
