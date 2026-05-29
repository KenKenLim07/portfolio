"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PROJECTS } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedItem } from "@/components/ui/AnimatedSection";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

function projectIndexLabel(index: number) {
  return String(index + 1).padStart(2, "0");
}

type ProjectTitleProps = {
  index: number;
  title: string;
  className?: string;
};

function ProjectTitle({ index, title, className }: ProjectTitleProps) {
  return (
    <h3
      className={cn(
        "font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl",
        className,
      )}
    >
      <span className="font-mono text-[0.85em] font-medium tracking-[0.12em] text-muted">
        {projectIndexLabel(index)}
      </span>{" "}
      <span>{title}</span>
    </h3>
  );
}

export function ProjectsSection() {
  const router = useRouter();
  const projects = useMemo(() => PROJECTS, []);
  const [activeId, setActiveId] = useState<string>(projects[0]?.id ?? "");
  const [showPreview, setShowPreview] = useState(false);

  const activeIndex = useMemo(
    () => projects.findIndex((p) => p.id === activeId),
    [activeId, projects],
  );

  const active = useMemo(
    () => projects.find((p) => p.id === activeId) ?? projects[0],
    [activeId, projects],
  );

  const openProject = useCallback(
    (id: string) => {
      router.push(`/projects/${id}`);
    },
    [router],
  );

  return (
    <Section id="projects" className="border-t border-border">
      <SectionHeading
        label=""
        title="Selected Projects"
        description="AI platforms, production web apps, and commerce tooling — shipped and maintained."
      />

      {projects.length === 0 ? (
        <p className="radius-panel border border-border bg-surface px-6 py-12 text-center text-sm text-muted">
          No projects yet.
        </p>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-start">
          <div
            className="space-y-8 lg:space-y-0"
            onMouseLeave={() => setShowPreview(false)}
          >
            {projects.map((project, index) => {
                  const isActive = project.id === active?.id;
                  const stackPreview = project.stack.slice(0, 3);
                  const overflow = project.stack.length - stackPreview.length;

              return (
                <AnimatedItem key={project.id}>
                  <button
                    type="button"
                      className={cn(
                        "group w-full cursor-pointer text-left transition-colors duration-200",
                        "p-0 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "lg:border-b lg:border-border/60 lg:py-6 lg:first:pt-0 lg:last:border-b-0",
                        isActive && showPreview ? "lg:text-foreground" : "lg:text-muted",
                      )}
                      onClick={() => openProject(project.id)}
                      onMouseEnter={() => {
                        setActiveId(project.id);
                        setShowPreview(true);
                      }}
                      onFocus={() => {
                        setActiveId(project.id);
                        setShowPreview(true);
                      }}
                      onBlur={() => setShowPreview(false)}
                      aria-label={`Open ${project.title} details`}
                    >
                      {/* Mobile: full-width within section padding, then title + stack */}
                      <div className="relative aspect-[2/1] overflow-hidden rounded-panel-lg bg-zinc-950 lg:hidden">
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

                      <div className="mt-4 lg:mt-0">
                        <ProjectTitle index={index} title={project.title} />

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
                  </button>
                </AnimatedItem>
              );
            })}
          </div>

          <AnimatedItem className="sticky top-28 hidden lg:block">
            <div>
                {showPreview && active && activeIndex >= 0 ? (
                  <div className="radius-panel-lg overflow-hidden bg-surface">
                    <div className="relative aspect-[2/1] bg-zinc-950">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br opacity-20 ${active.gradient}`}
                        aria-hidden
                      />
                      <Image
                        src={active.image}
                        alt={active.title}
                        fill
                        className="object-cover"
                        style={{
                          objectPosition: active.imagePosition ?? "center top",
                        }}
                        sizes="420px"
                        priority
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/65 via-transparent to-transparent"
                        aria-hidden
                      />
                    </div>

                    <div className="p-5">
                      <ProjectTitle index={activeIndex} title={active.title} />
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {active.stack.map((tech, i) => (
                          <Badge
                            key={`${active.id}-${tech}-${i}`}
                            className="text-[10px]"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
            ) : (
              <div className="h-[12px]" aria-hidden />
            )}
            </div>
          </AnimatedItem>
        </div>
      )}
    </Section>
  );
}
