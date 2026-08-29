"use client";

import { PROCESS_STEPS } from "@/lib/constants";
import { useProcessRoadmap } from "@/hooks/useProcessRoadmap";
import { useScrubBlockReveal } from "@/hooks/useScrubBlockReveal";
import { Section } from "@/components/ui/Section";
import { SectionMegaHeading } from "@/components/ui/SectionHeading";
import { ProcessStepCard } from "@/components/ui/process-step-card";
import { cn } from "@/lib/utils";

export function ProcessSection() {
  const scopeRef = useScrubBlockReveal();
  const trackRef = useProcessRoadmap();

  return (
    <Section id="process">
      <div ref={scopeRef}>
        <div data-scrub-reveal className="gsap-reveal mb-14 md:mb-20">
          <SectionMegaHeading title="How I Work" />
        </div>

        <div ref={trackRef} className="relative mx-auto max-w-5xl">
          {/* Track + scroll-filled progress */}
          <div
            className="absolute bottom-4 left-[1.125rem] top-4 w-px md:left-1/2 md:-translate-x-px"
            aria-hidden
          >
            <div className="absolute inset-0 bg-border" />
            <div
              data-process-progress
              className="absolute inset-0 origin-top scale-y-0 bg-[var(--accent-from)]"
            />
          </div>

          <ol className="relative m-0 grid list-none gap-8 p-0 md:gap-12">
            {PROCESS_STEPS.map((step, index) => {
              const reverse = index % 2 === 1;

              return (
                <li
                  key={step.title}
                  data-scrub-reveal
                  data-process-step
                  className="gsap-reveal relative md:grid md:grid-cols-2 md:items-center md:gap-16"
                >
                  <span
                    data-process-node
                    data-active="false"
                    className="process-node absolute left-0 top-1 z-10 flex h-9 w-9 items-center justify-center rounded-full font-mono text-[11px] font-medium tracking-wider shadow-[0_0_0_4px_var(--background)] md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
                    aria-hidden
                  >
                    {step.step}
                  </span>

                  <div
                    className={cn(
                      "ml-14 md:ml-0",
                      reverse
                        ? "md:col-start-2"
                        : "md:col-start-1 md:row-start-1 md:justify-self-end md:text-right",
                    )}
                  >
                    <ProcessStepCard>
                      <h3 className="font-display text-xl font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted">
                        {step.description}
                      </p>
                    </ProcessStepCard>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </Section>
  );
}
