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
    <Section id="tech-stack" className="border-t border-white/5">
      <SectionHeading
        label="Tech Stack"
        title="Modern tooling, production-ready"
        description="A curated stack for premium interfaces, scalable backends, and intelligent data systems."
      />

      <AnimatedStagger className="grid gap-6 md:grid-cols-3">
        {groups.map((group) => (
          <AnimatedItem key={group.key}>
            <div className="group h-full cursor-default rounded-2xl border border-white/10 bg-surface p-6 transition-colors duration-200 hover:border-white/20">
              <div
                className={`mb-6 h-1 w-12 rounded-full bg-gradient-to-r ${group.accent}`}
              />
              <h3 className="font-display mb-5 text-sm font-semibold uppercase tracking-widest text-foreground">
                {group.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK[group.key].map((tech) => (
                  <Badge
                    key={tech}
                    className="transition-colors duration-200 group-hover:border-white/20 group-hover:bg-white/10"
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
