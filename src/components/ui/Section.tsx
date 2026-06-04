"use client";

import { SectionReveal } from "@/components/ui/SectionReveal";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  /** Contact/footer: staggered enter only, no vacuum on scroll-out */
  enterOnly?: boolean;
};

export function Section({
  id,
  children,
  className,
  containerClassName,
  enterOnly = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("relative scroll-mt-28 py-24 md:py-32", className)}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-7xl px-6 md:px-8 lg:px-12",
          containerClassName,
        )}
      >
        <SectionReveal enterOnly={enterOnly}>{children}</SectionReveal>
      </div>
    </section>
  );
}
