"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/constants";

export type ProjectShowcaseItem = Pick<
  Project,
  "id" | "title" | "image" | "imagePosition" | "gradient" | "stack"
> & {
  href: string;
};

type ProjectShowcaseProps = {
  projects: ProjectShowcaseItem[];
  className?: string;
  onProjectClick?: (id: string) => void;
};

export function ProjectShowcase({
  projects,
  className,
  onProjectClick,
}: ProjectShowcaseProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor;

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mouseRef.current.x, 0.15),
        y: lerp(prev.y, mouseRef.current.y, 0.15),
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    mouseRef.current = mousePosition;
  }, [mousePosition]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setIsVisible(false);
  };

  if (projects.length === 0) {
    return (
      <p className="radius-panel border border-border bg-surface px-6 py-12 text-center text-sm text-muted">
        No projects yet.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn("relative w-full", className)}
    >
      {/* Desktop: image follows cursor */}
      <div
        className="pointer-events-none absolute z-50 hidden overflow-hidden radius-panel-lg shadow-2xl lg:block"
        style={{
          left: 0,
          top: 0,
          transform: `translate3d(${smoothPosition.x + 24}px, ${smoothPosition.y - 140}px, 0)`,
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.85,
          transition:
            "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), scale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        aria-hidden
      >
        <div className="relative h-[220px] w-[440px] overflow-hidden radius-panel-lg bg-zinc-950">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="absolute inset-0 transition-all duration-500 ease-out"
              style={{
                opacity: hoveredIndex === index ? 1 : 0,
                transform:
                  hoveredIndex === index ? "scale(1)" : "scale(1.04)",
                filter: hoveredIndex === index ? "none" : "blur(8px)",
              }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br opacity-20 ${project.gradient}`}
              />
              <Image
                src={project.image}
                alt=""
                fill
                className="object-contain"
                sizes="440px"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-0">
        {projects.map((project, index) => {
          const stackPreview = project.stack.slice(0, 3);
          const stackOverflow = project.stack.length - stackPreview.length;

          return (
          <div key={project.id} data-scrub-reveal className="gsap-reveal">
            <a
              href={project.href}
              className="group block cursor-pointer border-t border-border outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => {
                if (!onProjectClick) return;
                e.preventDefault();
                onProjectClick(project.id);
              }}
            >
              {/* Mobile: image always visible */}
              <div className="relative mt-8 aspect-[2/1] overflow-hidden radius-panel-lg bg-zinc-950 first:mt-0 lg:hidden">
                <div
                  className={`absolute inset-0 bg-gradient-to-br opacity-20 ${project.gradient}`}
                  aria-hidden
                />
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover"
                  style={{
                    objectPosition: project.imagePosition ?? "center top",
                  }}
                  sizes="(max-width: 1024px) 100vw, 720px"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/65 via-transparent to-transparent"
                  aria-hidden
                />
              </div>

              <div className="py-5 lg:py-7">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="shrink-0 font-mono text-xl font-medium tracking-[0.12em] text-muted sm:text-2xl">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-3xl tracking-tight text-foreground transition-colors duration-200 group-hover:text-foreground/80 sm:text-4xl lg:text-5xl">
                      {project.title}
                    </span>
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    <div className="flex flex-wrap gap-2 lg:hidden">
                      {stackPreview.map((tech) => (
                        <Badge
                          key={`${project.id}-${tech}-mobile`}
                          className="px-3.5 py-1.5 text-[11px] sm:text-xs"
                        >
                          {tech}
                        </Badge>
                      ))}
                      {stackOverflow > 0 && (
                        <Badge className="px-3.5 py-1.5 text-[11px] sm:text-xs">
                          +{stackOverflow}
                        </Badge>
                      )}
                    </div>

                    <div className="hidden flex-wrap gap-2 lg:flex">
                      {project.stack.map((tech) => (
                        <Badge
                          key={`${project.id}-${tech}-desktop`}
                          className="px-3.5 py-1.5 text-xs"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </a>
          </div>
          );
        })}
      </div>
    </div>
  );
}
