"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GitHubIcon } from "@/components/icons/BrandIcons";
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
  const stackPreview = isRail ? project.stack.slice(0, 3) : project.stack;
  const stackOverflow = isRail ? project.stack.length - stackPreview.length : 0;

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
                ? "border-indigo-400/40 ring-1 ring-indigo-400/30"
                : "border-border hover:border-border",
              onSelect && "cursor-pointer",
            )
          : "border-border hover:border-border",
      )}
      layout={!prefersReducedMotion && !isRail}
    >
      {/* 2:1 matches exported screenshots (1400×700) — avoids crop from 16:9 frames */}
      <div className="relative aspect-[2/1] overflow-hidden rounded-t-panel-lg bg-image-well">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-40",
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-image-well/80 via-transparent to-transparent" />
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
        <p
          className={cn(
            "mt-2 leading-relaxed text-muted",
            isRail
              ? "line-clamp-2 text-xs sm:text-sm"
              : "text-sm md:text-base",
          )}
        >
          {project.description}
        </p>

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

        {!isRail && (
          <div className="mt-6 flex flex-wrap gap-3">
            {project.liveUrl && (
              <Link
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="radius-control inline-flex cursor-pointer items-center gap-2 bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors duration-200 hover:opacity-90"
                onClick={(e) => e.stopPropagation()}
              >
                Live Demo
                <ExternalLink className="h-4 w-4" aria-hidden />
              </Link>
            )}
            {project.githubUrl && (
              <Link
                href={project.githubUrl}
                className="radius-control inline-flex cursor-pointer items-center gap-2 border border-border bg-subtle px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:border-border hover:bg-[var(--fill-hover)]"
                onClick={(e) => e.stopPropagation()}
              >
                GitHub
                <GitHubIcon />
              </Link>
            )}
          </div>
        )}

        {isRail && (project.liveUrl || project.githubUrl) && (
          <div className="mt-3 flex gap-2">
            {project.liveUrl && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-indigo-300/90">
                Live
                <ExternalLink className="h-3 w-3" aria-hidden />
              </span>
            )}
            {project.githubUrl && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted">
                Code
                <GitHubIcon className="h-3 w-3" />
              </span>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );

  if (isRail && onSelect) {
    return (
      <button
        type="button"
        className={cn(
          "radius-panel-lg h-full shrink-0 snap-start text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          RAIL_CARD_WIDTH,
        )}
        onClick={onSelect}
        aria-label={`Show ${project.title} as featured project`}
        aria-pressed={isActive}
      >
        {card}
      </button>
    );
  }

  return card;
}
