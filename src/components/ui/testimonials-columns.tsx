"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Testimonial } from "@/lib/constants";
import { cn } from "@/lib/utils";

function TestimonialAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-subtle font-mono text-xs font-medium text-foreground"
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function TestimonialsRow({
  className,
  testimonials,
  duration = 40,
  /** Slide the opposite way (rightward) for alternating rows */
  reverse = false,
}: {
  className?: string;
  testimonials: readonly Testimonial[];
  duration?: number;
  reverse?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const loop = prefersReducedMotion ? [0] : [0, 1];

  return (
    <div
      className={cn(
        "overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
    >
      <motion.div
        animate={
          prefersReducedMotion
            ? undefined
            : { x: reverse ? "0%" : "-50%" }
        }
        initial={prefersReducedMotion ? undefined : { x: reverse ? "-50%" : "0%" }}
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
        className="flex w-max gap-6 pr-6"
      >
        {loop.map((copy) => (
          <Fragment key={copy}>
            {testimonials.map((item) => (
              <figure
                key={`${copy}-${item.name}`}
                className="glass radius-panel w-80 max-w-[min(100%,20rem)] shrink-0 border border-border p-6 md:p-8"
              >
                <blockquote className="text-sm leading-relaxed text-muted">
                  {item.text}
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <TestimonialAvatar name={item.name} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium tracking-tight text-foreground">
                      {item.name}
                    </div>
                    <div className="truncate text-xs tracking-tight text-muted">
                      {item.role}
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </Fragment>
        ))}
      </motion.div>
    </div>
  );
}

/** @deprecated Prefer TestimonialsRow — kept for older imports */
export const TestimonialsColumn = TestimonialsRow;
