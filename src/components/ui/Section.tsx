"use client";

import { useRef } from "react";
import { useSectionScrollReveal } from "@/hooks/useSectionScrollReveal";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
};

export function Section({
  id,
  children,
  className,
  containerClassName,
}: SectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useSectionScrollReveal(sectionRef);

  return (
    <section
      ref={sectionRef}
      id={id}
      className={cn("relative scroll-mt-28 py-24 md:py-32", className)}
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
