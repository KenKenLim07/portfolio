"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  PROJECT_FILTERS,
  PROJECTS,
  type ProjectFilterId,
} from "@/lib/constants";
import {
  filterProjects,
  railProjects,
  resolveFeaturedProject,
} from "@/lib/projects";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "@/components/ProjectCard";
import { cn } from "@/lib/utils";

export function ProjectsSection() {
  const prefersReducedMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<ProjectFilterId>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterProjects(PROJECTS, filter),
    [filter],
  );

  const featured = useMemo(
    () => resolveFeaturedProject(filtered, selectedId),
    [filtered, selectedId],
  );

  const rail = useMemo(
    () => railProjects(filtered, featured),
    [filtered, featured],
  );

  const handleFilter = useCallback((id: ProjectFilterId) => {
    setFilter(id);
    setSelectedId(null);
  }, []);

  const scrollRail = useCallback(
    (direction: -1 | 1) => {
      const el = railRef.current;
      if (!el) return;
      const amount = Math.min(el.clientWidth * 0.85, 340);
      el.scrollBy({
        left: direction * amount,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    },
    [prefersReducedMotion],
  );

  return (
    <Section id="projects" className="border-t border-white/5">
      <SectionHeading
        label=""
        title="Selected Projects"
        description="AI platforms, production web apps, and commerce tooling — shipped and maintained."
      />

      <div className="mb-8 flex flex-wrap gap-2 sm:mb-10">
        {PROJECT_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleFilter(item.id)}
            className={cn(
              "radius-chip cursor-pointer border px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors duration-200 sm:text-[11px]",
              filter === item.id
                ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-100"
                : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200",
            )}
            aria-pressed={filter === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      {featured ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${filter}-${featured.id}`}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProjectCard project={featured} variant="featured" />
          </motion.div>
        </AnimatePresence>
      ) : (
        <p className="radius-panel border border-white/10 bg-surface px-6 py-12 text-center text-sm text-muted">
          No projects in this category yet.
        </p>
      )}

      {rail.length > 0 && (
        <div className="relative mt-8 sm:mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                More work
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                <span className="sm:hidden">Swipe to browse · tap to feature above</span>
                <span className="hidden sm:inline">Tap a project to feature it above</span>
              </p>
            </div>
            <div className="hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollRail(-1)}
                className="radius-chip inline-flex h-9 w-9 cursor-pointer items-center justify-center border border-white/10 bg-white/5 text-zinc-400 transition-colors duration-200 hover:border-white/20 hover:text-foreground"
                aria-label="Scroll projects left"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scrollRail(1)}
                className="radius-chip inline-flex h-9 w-9 cursor-pointer items-center justify-center border border-white/10 bg-white/5 text-zinc-400 transition-colors duration-200 hover:border-white/20 hover:text-foreground"
                aria-label="Scroll projects right"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="relative -mx-6 md:-mx-8 lg:-mx-12">
            <div
              className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-background to-transparent sm:w-8 md:w-12"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute right-0 top-0 z-10 hidden h-full w-8 bg-gradient-to-l from-background to-transparent sm:block md:w-12"
              aria-hidden
            />
            <div
              ref={railRef}
              className="project-rail flex gap-3 overflow-x-auto scroll-px-6 px-6 pb-2 sm:scroll-px-8 sm:gap-5 sm:px-8 lg:scroll-px-12 lg:px-12"
            >
              {rail.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  variant="rail"
                  isActive={false}
                  onSelect={() => setSelectedId(project.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
