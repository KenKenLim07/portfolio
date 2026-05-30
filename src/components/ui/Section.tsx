"use client";

import { useRef } from "react";
import { useSectionScrollReveal } from "@/hooks/useSectionScrollReveal";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  /** Scrubbed enter/exit for all `[data-gsap-reveal]` inside (default: true) */
  animated?: boolean;
  /** Clip exit motion so tail slide does not paint over the section above */
  clipOnScroll?: boolean;
};

export function Section({
  id,
  children,
  className,
  containerClassName,
  animated = true,
  clipOnScroll = true,
}: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  useSectionScrollReveal(ref, { enabled: animated });

  return (
    <section
      ref={ref}
      id={id}
      data-section-scroll={animated ? "" : undefined}
      className={cn(
        "relative scroll-mt-28 py-24 md:py-32",
        animated && clipOnScroll && "overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-7xl px-6 md:px-8 lg:px-12",
          containerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
