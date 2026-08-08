"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TECH_STACK } from "@/lib/constants";
import { TechBrandIcon } from "@/components/TechBrandIcon";
import { useScrubBlockReveal } from "@/hooks/useScrubBlockReveal";
import { Section } from "@/components/ui/Section";
import { MegaTitleText } from "@/components/ui/SectionHeading";

const rows = [
  { key: "backend" as const, duration: 42, reverse: false },
  { key: "frontend" as const, duration: 48, reverse: true },
  { key: "ai" as const, duration: 36, reverse: false },
] as const;

function TechStackRow({
  items,
  duration,
  reverse = false,
}: {
  items: readonly string[];
  duration: number;
  reverse?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  // Short lists (e.g. AI) need more copies so the marquee fills the viewport
  const copyCount = prefersReducedMotion
    ? 1
    : Math.max(2, Math.ceil(10 / Math.max(items.length, 1)));
  const loop = Array.from({ length: copyCount }, (_, i) => i);

  return (
    <div className="overflow-hidden">
      <motion.div
        animate={
          prefersReducedMotion ? undefined : { x: reverse ? "0%" : "-50%" }
        }
        initial={
          prefersReducedMotion ? undefined : { x: reverse ? "-50%" : "0%" }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop",
              }
        }
        className="flex w-max gap-3 pr-3 md:gap-4 md:pr-4"
      >
        {loop.map((copy) => (
          <Fragment key={copy}>
            {items.map((tech) => (
              <div
                key={`${copy}-${tech}`}
                className="glass radius-panel flex shrink-0 items-center gap-2.5 border border-border px-4 py-3 text-foreground transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--accent-from)_35%,var(--border))]"
              >
                <TechBrandIcon tech={tech} className="h-4 w-4" />
                <span className="whitespace-nowrap text-sm font-medium tracking-tight">
                  {tech}
                </span>
              </div>
            ))}
          </Fragment>
        ))}
      </motion.div>
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

        <div className="flex flex-col gap-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] md:gap-8">
          {rows.map((row) => (
            <div key={row.key} data-scrub-reveal className="gsap-reveal">
              <TechStackRow
                items={TECH_STACK[row.key]}
                duration={row.duration}
                reverse={row.reverse}
              />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
