"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/constants";

export type ProjectShowcaseItem = Pick<
  Project,
  "id" | "title" | "description" | "image" | "imagePosition" | "gradient" | "stack"
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
      {/* Desktop: image follows cursor — sized to show full 2:1 screenshots */}
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
          const overflow = project.stack.length - stackPreview.length;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={project.id}
              data-scrub-reveal
              className="gsap-reveal"
            >
              <a
                href={project.href}
                className="group block cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                  if (!onProjectClick) return;
                  e.preventDefault();
                  onProjectClick(project.id);
                }}
              >
              {/* Mobile still shows a static image */}
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

              <div className="relative border-t border-border py-5 transition-all duration-300 ease-out lg:py-6">
                <div
                  className={cn(
                    "absolute inset-0 -mx-4 rounded-lg bg-surface/60 px-4 transition-all duration-300 ease-out",
                    isHovered
                      ? "scale-100 opacity-100"
                      : "scale-95 opacity-0",
                  )}
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-2">
                      <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                        <span className="font-mono text-[0.85em] font-medium tracking-[0.12em] text-muted">
                          {String(index + 1).padStart(2, "0")}
                        </span>{" "}
                        <span className="relative text-foreground">
                          {project.title}
                          <span
                            className={cn(
                              "absolute left-0 -bottom-0.5 h-px bg-foreground transition-all duration-300 ease-out",
                              isHovered ? "w-full" : "w-0",
                            )}
                          />
                        </span>
                      </h3>
                      <ArrowUpRight
                        className={cn(
                          "h-4 w-4 text-muted transition-all duration-300 ease-out",
                          isHovered
                            ? "translate-x-0 translate-y-0 opacity-100"
                            : "-translate-x-2 translate-y-2 opacity-0",
                        )}
                      />
                    </div>

                    <p
                      className={cn(
                        "mt-2 hidden line-clamp-2 text-sm leading-relaxed text-muted transition-colors duration-300 lg:block",
                        isHovered && "text-foreground/70",
                      )}
                    >
                      {project.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {stackPreview.map((tech, i) => (
                        <Badge
                          key={`${project.id}-${tech}-${i}`}
                          className="text-[10px]"
                        >
                          {tech}
                        </Badge>
                      ))}
                      {overflow > 0 && (
                        <Badge className="text-[10px]">+{overflow}</Badge>
                      )}
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
