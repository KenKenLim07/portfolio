"use client";

import { TECH_STACK } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/AnimatedSection";

const groups = [
  { key: "frontend" as const, label: "Frontend", accent: "from-blue-500/20 to-indigo-500/5" },
  { key: "backend" as const, label: "Backend", accent: "from-emerald-500/15 to-teal-500/5" },
  { key: "ai" as const, label: "AI / Data", accent: "from-violet-500/20 to-fuchsia-500/5" },
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
              <div className="flex flex-wrap gap-2">
                {TECH_STACK[group.key].map((tech) => (
                  <Badge
                    key={tech}
                    className="transition-colors duration-200 group-hover:border-border group-hover:bg-[var(--fill-hover)]"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </AnimatedItem>
        ))}
      </AnimatedStagger>
    </Section>
  );
}
