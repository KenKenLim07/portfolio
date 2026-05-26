"use client";

import { EXPERIENCE } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/AnimatedSection";

export function ExperienceSection() {
  return (
    <Section id="experience" className="border-t border-white/5">
      <SectionHeading
        label=""
        title="My Experience"
        description="Roles and projects where I shipped full-stack products, AI systems, and client-facing platforms."
      />

      <AnimatedStagger className="space-y-0">
        {EXPERIENCE.map((job, index) => (
          <AnimatedItem key={`${job.company}-${job.period}`}>
            <article
              className={`group grid gap-4 border-white/10 py-8 md:grid-cols-[1fr_auto] md:gap-8 md:py-10 ${
                index > 0 ? "border-t" : ""
              }`}
            >
              <div>
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground transition-colors duration-200 group-hover:text-indigo-200/90 md:text-2xl">
                  {job.company}
                </h3>
                <p className="mt-1 text-sm font-medium text-indigo-300/80">
                  {job.role}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
                  {job.description}
                </p>
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-zinc-500 md:text-right md:pt-1">
                {job.period}
              </p>
            </article>
          </AnimatedItem>
        ))}
      </AnimatedStagger>
    </Section>
  );
}
