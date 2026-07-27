"use client";

import { TECH_STACK } from "@/lib/constants";
import { TechBrandIcon } from "@/components/TechBrandIcon";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";

const groups = [
  { key: "frontend" as const, label: "Frontend" },
  { key: "backend" as const, label: "Backend" },
  { key: "ai" as const, label: "AI / Data" },
];

export function TechStackSection() {
  return (
    <Section id="tech-stack">
      <SectionHeading
        label=""
        title="My Stack"
        description="Tools I use to build fast interfaces, reliable backends, and intelligent data products."
      />

      <AnimatedSection variant="tail">
        <AnimatedItem>
          <div className="grid gap-6 md:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.key}
                className="radius-panel group h-full cursor-default border border-border bg-surface p-6 transition-colors duration-200 hover:border-border"
              >
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="h-px w-14 bg-[color-mix(in_srgb,var(--accent-from)_42%,transparent)]"
                  aria-hidden
                />
                <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                  {group.label}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {TECH_STACK[group.key].map((tech) => (
                  <div
                    key={tech}
                    className="flex items-center gap-2.5 text-muted transition-colors duration-200 group-hover:text-foreground"
                  >
                    <TechBrandIcon tech={tech} />
                    <span className="text-xs leading-tight">{tech}</span>
                  </div>
                ))}
              </div>
              </div>
            ))}
          </div>
        </AnimatedItem>
      </AnimatedSection>
    </Section>
  );
}
