# Project Details Pages (Selected Projects) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dedicated `/projects/[id]` details pages and make the homepage “Selected Projects” cards open those details with a Back button.

**Architecture:** Keep the existing static `PROJECTS` data in `src/lib/constants.ts`. Add a new Next.js route `src/app/projects/[id]/page.tsx` that renders story + full tech stack + links. Update `src/components/ProjectCard.tsx` to support a minimal “title + few chips” mode and update `src/components/ProjectsSection.tsx` so clicking cards navigates to `/projects/[id]`.

**Tech Stack:** Next.js App Router (`src/app`), Tailwind CSS, `next/image`, `simple-icons` (via `TechBrandIcon`), existing `Badge` + project card styling, no CMS.

---

### Task 1: Add `/projects/[id]` details page

**Files:**
- Create: `src/app/projects/[id]/page.tsx`

- [ ] Step 1: Write the failing test
  - No automated tests exist for routing in this repo; we’ll validate via `npm run build`.

- [ ] Step 2: Run test to verify it fails
  - Not applicable.

- [ ] Step 3: Write minimal implementation

  ```tsx
  // src/app/projects/[id]/page.tsx
  import Image from "next/image";
  import Link from "next/link";
  import { notFound } from "next/navigation";
  import { ExternalLink, ArrowLeft } from "lucide-react";
  import { Section } from "@/components/ui/Section";
  import { Badge } from "@/components/ui/Badge";
  import { TechBrandIcon } from "@/components/TechBrandIcon";
  import { GitHubIcon } from "@/components/icons/BrandIcons";
  import { PROJECTS } from "@/lib/constants";

  export function generateStaticParams() {
    return PROJECTS.map((p) => ({ id: p.id }));
  }

  export const dynamicParams = false;

  type PageProps = {
    params: { id: string };
  };

  export default function ProjectDetailsPage({ params }: PageProps) {
    const project = PROJECTS.find((p) => p.id === params.id);
    if (!project) return notFound();

    return (
      <Section id="project-details" className="border-t border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/#projects"
            className="radius-control inline-flex items-center gap-2 border border-border bg-subtle px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:border-border hover:bg-[var(--fill-hover)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
        </div>

        <div className="mt-10 overflow-hidden rounded-t-panel-lg border border-border bg-surface">
          <div className="relative aspect-[2/1] overflow-hidden rounded-t-panel-lg bg-zinc-950">
            <div
              className={`absolute inset-0 bg-gradient-to-br opacity-20 ${project.gradient}`}
            />
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="object-cover"
              style={{ objectPosition: project.imagePosition ?? "center top" }}
              sizes="(max-width: 768px) 100vw, 1280px"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/65 via-transparent to-transparent" />
          </div>

          <div className="p-6 md:p-8">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-4xl">
              {project.title}
            </h1>

            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted md:text-lg">
              {project.description}
            </p>

            <div className="mt-8">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                Full Tech Stack
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((tech, i) => (
                  <Badge key={`${project.id}-${tech}-${i}`} className="gap-2">
                    <TechBrandIcon tech={tech} className="h-3 w-3" />
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            {(project.liveUrl || project.githubUrl) && (
              <div className="mt-8">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                  Links
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="radius-control inline-flex cursor-pointer items-center gap-2 border border-border bg-subtle px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:border-border hover:bg-[var(--fill-hover)]"
                    >
                      Live Demo
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="radius-control inline-flex cursor-pointer items-center gap-2 border border-border bg-subtle px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:border-border hover:bg-[var(--fill-hover)]"
                    >
                      GitHub
                      <GitHubIcon />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>
    );
  }
  ```

- [ ] Step 4: Run it and verify it passes
  - After code changes: `npm run build` should succeed.

- [ ] Step 5: Commit
  - Optional (repo guardrails may require user confirmation).

### Task 2: Update `ProjectCard` to minimal clickable UI

**Files:**
- Modify: `src/components/ProjectCard.tsx:1-173`

- [ ] Step 1: Write minimal failing test
  - Not applicable.

- [ ] Step 2: Run test to verify it fails
  - Not applicable.

- [ ] Step 3: Write minimal implementation

  Replace `src/components/ProjectCard.tsx` with the following updated code (same file path):

  ```tsx
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
                "h-full shrink-0 snap-start",
                onSelect ? "cursor-pointer" : "cursor-default",
                isActive
                  ? "border-indigo-400/40 ring-1 ring-indigo-400/30"
                  : "border-border hover:border-border",
              )
            : cn(
                "w-full",
                onSelect ? "cursor-pointer" : "cursor-default",
                isActive
                  ? "border-indigo-400/40 ring-1 ring-indigo-400/30"
                  : "border-border hover:border-border",
              ),
        )}
        layout={!prefersReducedMotion && !isRail}
      >
        {/* 2:1 matches exported screenshots (1400×700) — avoids crop from 16:9 frames */}
        <div className="relative aspect-[2/1] overflow-hidden rounded-t-panel-lg bg-zinc-950">
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
            sizes={isRail ? "320px" : "(max-width: 1024px) 100vw, 1280px"}
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

          <div className={cn("mt-3 flex flex-wrap gap-1.5", isRail ? "" : "mt-5 gap-2")}>
            {stackPreview.map((tech, i) => (
              <Badge
                key={`${project.id}-${tech}-${i}`}
                className={isRail ? "text-[10px]" : undefined}
              >
                {tech}
              </Badge>
            ))}
            {stackOverflow > 0 && (
              <Badge className={isRail ? "text-[10px]" : undefined}>+{stackOverflow}</Badge>
            )}
          </div>
        </div>
      </motion.article>
    );

    if (onSelect) {
      if (isRail) {
        return (
          <button
            type="button"
            className={cn(
              "radius-panel-lg h-full shrink-0 snap-start text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
          className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={onSelect}
          aria-label={`Open ${project.title} details`}
          aria-pressed={isActive}
        >
          {card}
        </button>
      );
    }

    return card;
  }
  ```

- [ ] Step 4: Run `npm run build` and verify no lint/type errors

- [ ] Step 5: Commit
  - Optional.

### Task 3: Update `ProjectsSection` to navigate to `/projects/[id]`

**Files:**
- Modify: `src/components/ProjectsSection.tsx:1-165`

- [ ] Step 1: Write minimal failing test
  - Not applicable.

- [ ] Step 2: Run it to verify it fails
  - Not applicable.

- [ ] Step 3: Implement

  Replace `src/components/ProjectsSection.tsx` with the following updated code:

  ```tsx
  "use client";

  import { useCallback, useMemo, useRef, useState } from "react";
  import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
  import { ChevronLeft, ChevronRight } from "lucide-react";
  import { useRouter } from "next/navigation";
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
    const router = useRouter();
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

    const openProject = useCallback(
      (id: string) => {
        setSelectedId(id);
        router.push(`/projects/${id}`);
      },
      [router],
    );

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
      <Section id="projects" className="border-t border-border">
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
                  ? "border-indigo-600/35 bg-indigo-600/12 text-indigo-950 dark:border-indigo-400/40 dark:bg-indigo-500/15 dark:text-indigo-100"
                  : "border-border bg-subtle text-muted hover:border-border hover:text-foreground",
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
              <ProjectCard
                project={featured}
                variant="featured"
                onSelect={() => openProject(featured.id)}
                isActive
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="radius-panel border border-border bg-surface px-6 py-12 text-center text-sm text-muted">
            No projects in this category yet.
          </p>
        )}

        {rail.length > 0 && (
          <div className="relative mt-8 sm:mt-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                  More work
                </p>
                <p className="mt-1 text-sm text-muted">
                  <span className="sm:hidden">Swipe to browse · tap for details</span>
                  <span className="hidden sm:inline">Tap a project to open details</span>
                </p>
              </div>

              <div className="hidden gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => scrollRail(-1)}
                  className="radius-chip inline-flex h-9 w-9 cursor-pointer items-center justify-center border border-border bg-subtle text-muted transition-colors duration-200 hover:border-border hover:text-foreground"
                  aria-label="Scroll projects left"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRail(1)}
                  className="radius-chip inline-flex h-9 w-9 cursor-pointer items-center justify-center border border-border bg-subtle text-muted transition-colors duration-200 hover:border-border hover:text-foreground"
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
                    onSelect={() => openProject(project.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>
    );
  }
  ```

- [ ] Step 4: Run `npm run build` and verify clicking cards navigates

- [ ] Step 5: Commit
  - Optional.

### Task 4: Normalize `PROJECTS` stack naming for brand icons

**Files:**
- Modify: `src/lib/constants.ts` (replace `"VADER"` with `"VADER NLP"` in the `news-intelligence` stack)

- [ ] Step 1: Implement the normalization
  - Update the `PROJECTS` entry for `"news-intelligence"`:
    - Change `stack: [..., "VADER", ...]` → `stack: [..., "VADER NLP", ...]`

- [ ] Step 2: Run `npm run build` and confirm no type errors

### Task 5: Verification

- [ ] Step 1: Run lint
  - `npm run lint`
  - Expected: no ESLint errors.

- [ ] Step 2: Run build
  - `npm run build`
  - Expected: Next.js compiles and prerenders pages without errors.

- [ ] Step 3: Manual UI smoke test
  - On homepage, under “Selected Projects”, click featured card.
  - Confirm details page loads with:
    - Back button to `/#projects`
    - Full story (`project.description`)
    - Full tech stack chips
    - Live/GitHub links

