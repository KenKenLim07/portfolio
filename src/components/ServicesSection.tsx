"use client";

import {
  BarChart3,
  Brain,
  Globe,
  Layers,
  Palette,
  Search,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { SERVICES } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedItem, AnimatedStagger } from "@/components/ui/AnimatedSection";
import { cn } from "@/lib/utils";

const iconMap: Record<(typeof SERVICES)[number]["icon"], LucideIcon> = {
  Globe,
  UtensilsCrossed,
  Layers,
  Brain,
  Palette,
  Search,
  BarChart3,
};

export function ServicesSection() {
  return (
    <Section id="services" className="border-t border-white/5 bg-surface/30">
      <SectionHeading
        label="Services"
        title="What I build for clients"
        description="From premium marketing sites to intelligent dashboards — focused offerings designed for modern brands and growing businesses."
      />

      <AnimatedStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => {
          const Icon = iconMap[service.icon];
          return (
            <AnimatedItem key={service.title}>
              <div
                className={cn(
                  "radius-panel group h-full cursor-default border border-white/10 bg-background/60 p-6 transition-colors duration-200",
                  "hover:border-white/20 hover:bg-white/[0.03]",
                )}
              >
                <div className="radius-control mb-5 inline-flex border border-white/10 bg-white/5 p-3 transition-colors duration-200 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10">
                  <Icon className="h-5 w-5 text-indigo-300" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {service.description}
                </p>
              </div>
            </AnimatedItem>
          );
        })}
      </AnimatedStagger>
    </Section>
  );
}
