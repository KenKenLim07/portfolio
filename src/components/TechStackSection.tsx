"use client";

import { TECH_STACK } from "@/lib/constants";
import { TechBrandIcon } from "@/components/TechBrandIcon";
import { useScrubBlockReveal } from "@/hooks/useScrubBlockReveal";
import { Section } from "@/components/ui/Section";
import { MegaTitleText } from "@/components/ui/SectionHeading";

const STACK_CATEGORIES = [
  { key: "frontend" as const, label: "Frontend" },
  { key: "backend" as const, label: "Backend" },
  { key: "ai" as const, label: "AI & Data" },
] as const;

function TechChip({ tech }: { tech: string }) {
  return (
    <div className="glass radius-control flex cursor-default items-center gap-2.5 border border-border px-4 py-3 text-foreground transition-[color,background-color,border-color,box-shadow] duration-200 ease-out hover:border-[color-mix(in_srgb,var(--accent-from)_40%,var(--border))] hover:bg-[var(--fill-hover)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-from)_22%,transparent)] motion-reduce:transition-none">
      <TechBrandIcon tech={tech} className="h-4 w-4" />
      <span className="whitespace-nowrap text-sm font-medium tracking-tight">
        {tech}
      </span>
    </div>
  );
}

export function TechStackSection() {
  const scopeRef = useScrubBlockReveal();

  return (
    <Section id="tech-stack">
      <div ref={scopeRef}>
        <div data-scrub-reveal className="gsap-reveal mb-14 md:mb-20">
          <h2 className="section-mega">
            <MegaTitleText title="My Stack" />
          </h2>
        </div>

        <div className="flex flex-col gap-10 md:gap-12">
          {STACK_CATEGORIES.map((category) => (
            <div key={category.key}>
              <p
                data-scrub-reveal
                className="gsap-reveal mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted md:mb-5"
              >
                {category.label}
              </p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                {TECH_STACK[category.key].map((tech) => (
                  <div key={tech} data-scrub-reveal className="gsap-reveal">
                    <TechChip tech={tech} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
