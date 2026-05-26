"use client";

import { TECH_STACK } from "@/lib/constants";
import { TechBrandIcon } from "@/components/TechBrandIcon";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/AnimatedSection";

const groups = [
  { key: "frontend" as const, label: "Frontend", accent: "from-amber-600/25 to-stone-600/6" },
  { key: "backend" as const, label: "Backend", accent: "from-amber-700/20 to-stone-700/5" },
  { key: "ai" as const, label: "AI / Data", accent: "from-amber-500/22 to-stone-600/6" },
];

export function TechStackSection() {
  return (
    <Section id="tech-stack" className="border-t border-border">
      <SectionHeading
        label=""
        title="My Stack"
        description="Tools I use to build fast interfaces, reliable backends, and intelligent data products."
      />

      <AnimatedStagger className="grid gap-6 md:grid-cols-3">
        {groups.map((group) => (
          <AnimatedItem key={group.key}>
            <div className="radius-panel group h-full cursor-default border border-border bg-surface p-6 transition-colors duration-200 hover:border-border">
              <div
                className={`mb-6 h-1 w-12 rounded-full bg-gradient-to-r ${group.accent}`}
              />
              <h3 className="mb-5 font-mono text-xs font-medium lowercase tracking-[0.15em] text-muted">
                {group.key}
              </h3>
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
          </AnimatedItem>
        ))}
      </AnimatedStagger>
    </Section>
  );
}
