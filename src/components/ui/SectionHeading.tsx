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

/** Leading words outlined; last word solid fill — matches hero mega-outline. */
export function MegaTitleText({ title }: { title: string }) {
  const parts = title.trim().split(/\s+/);
  if (parts.length < 2) {
    return <span className="text-foreground">{title}</span>;
  }

  const last = parts.at(-1)!;
  const lead = parts.slice(0, -1).join(" ");

  return (
    <>
      <span className="mega-outline">{lead} </span>
      <span className="text-foreground">{last}</span>
    </>
  );
}

/** Section h2 — same mega type scale + outline pairing as the hero. */
export function SectionMegaHeading({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <h2 className={cn("section-mega", className)}>
      <MegaTitleText title={title} />
    </h2>
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
        {variant === "mega" ? (
          <SectionMegaHeading title={title} />
        ) : (
          <h2 className="section-mega text-foreground">{title}</h2>
        )}
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
