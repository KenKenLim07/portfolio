"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import type { Project } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/** Leaves ~7.5rem visible for the next rail card on mobile (swipe affordance) */
const RAIL_CARD_WIDTH =
  "w-[calc(100vw-7.5rem)] max-w-[300px] sm:w-[300px] md:w-[320px]";

type ProjectCardProps = {
  project: Project;
  variant?: "featured" | "rail";
  isActive?: boolean;
  onSelect?: () => void;
};

export function ProjectCard({
  project,
  variant = "featured",
  isActive = false,
  onSelect,
}: ProjectCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const isRail = variant === "rail";
  const stackPreviewCount = isRail ? 3 : 4;
  const stackPreview = project.stack.slice(0, stackPreviewCount);
  const stackOverflow = project.stack.length - stackPreview.length;

  useGsapReveal(cardRef, {
    y: isRail ? 20 : 32,
    start: "top 92%",
  });

  const card = (
    <motion.article
      ref={cardRef}
      className={cn(
        "gsap-reveal radius-panel-lg group relative overflow-hidden border bg-surface text-left transition-colors duration-300",
        isRail
          ? cn(
              cn("h-full shrink-0 snap-start", RAIL_CARD_WIDTH),
              isActive
                ? "border-[var(--accent-from)]/40 ring-1 ring-[var(--accent-from)]/25"
                : "border-border hover:border-border",
              onSelect ? "cursor-pointer" : "cursor-default",
            )
          : cn(
              "border-border hover:border-border",
              onSelect ? "cursor-pointer" : "cursor-default",
            ),
      )}
      layout={!prefersReducedMotion && !isRail}
    >
      {/* 2:1 matches exported screenshots (1400×700) — avoids crop from 16:9 frames */}
      <div className="relative aspect-[2/1] overflow-hidden rounded-t-[var(--radius-panel-lg)] bg-zinc-950">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-20",
            project.gradient,
          )}
        />
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          style={{ objectPosition: project.imagePosition ?? "center top" }}
          sizes={
            isRail
              ? "320px"
              : "(max-width: 1024px) 100vw, 1280px"
          }
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/65 via-transparent to-transparent" />
      </div>

      <div className={cn("relative", isRail ? "p-4 sm:p-5" : "p-6 md:p-8")}>
        <h3
          className={cn(
            "font-display font-semibold tracking-tight text-foreground",
            isRail ? "text-base sm:text-lg" : "text-xl md:text-2xl",
          )}
        >
          {project.title}
        </h3>

        <div className={cn("flex flex-wrap gap-1.5", isRail ? "mt-3" : "mt-5 gap-2")}>
          {stackPreview.map((tech, i) => (
            <Badge key={`${project.id}-${tech}-${i}`} className={isRail ? "text-[10px]" : undefined}>
              {tech}
            </Badge>
          ))}
          {stackOverflow > 0 && (
            <Badge className={isRail ? "text-[10px]" : undefined}>
              +{stackOverflow}
            </Badge>
          )}
        </div>
      </div>
    </motion.article>
  );

  if (!onSelect) return card;

  if (isRail) {
    return (
      <button
        type="button"
        className={cn(
          "radius-panel-lg h-full shrink-0 snap-start text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-from)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          RAIL_CARD_WIDTH,
        )}
        onClick={onSelect}
        aria-label={`Open ${project.title} details`}
        aria-pressed={isActive}
      >
        {card}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-from)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={onSelect}
      aria-label={`Open ${project.title} details`}
      aria-pressed={isActive}
    >
      {card}
    </button>
  );
}
