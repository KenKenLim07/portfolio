"use client";

import { PROCESS_STEPS } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/AnimatedSection";

export function ProcessSection() {
  return (
    <Section id="process" className="border-t border-white/5 bg-surface/30">
      <SectionHeading
        label="Process"
        title="A focused workflow from idea to launch"
        description="A minimal, repeatable process that keeps strategy, design, and engineering aligned."
        align="center"
      />

      <AnimatedStagger className="relative">
        <div
          className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-indigo-500/40 via-white/10 to-transparent md:block lg:left-1/2 lg:-translate-x-px"
          aria-hidden
        />

        <div className="grid gap-6 md:gap-8">
          {PROCESS_STEPS.map((step, index) => (
            <AnimatedItem key={step.title}>
              <div
                className={`relative flex flex-col gap-4 md:flex-row md:items-center md:gap-10 ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className="flex items-center gap-4 md:w-1/2 lg:justify-end lg:pr-12">
                  <span className="font-display text-4xl font-light text-white/15 md:hidden lg:block lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:text-5xl">
                    {step.step}
                  </span>
                  <div
                    className={`glass w-full rounded-2xl p-6 md:p-8 ${
                      index % 2 === 1 ? "lg:ml-auto" : "lg:mr-auto"
                    } lg:max-w-md`}
                  >
                    <p className="mb-2 text-xs font-medium uppercase tracking-widest text-indigo-300">
                      Step {step.step}
                    </p>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
                <div className="hidden md:block md:w-1/2" aria-hidden />
              </div>
            </AnimatedItem>
          ))}
        </div>
      </AnimatedStagger>
    </Section>
  );
}
