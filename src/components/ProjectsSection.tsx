"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PROJECTS } from "@/lib/constants";
import { useScrubBlockReveal } from "@/hooks/useScrubBlockReveal";
import { Section } from "@/components/ui/Section";
import { SectionMegaHeading } from "@/components/ui/SectionHeading";
import {
  ProjectShowcase,
  type ProjectShowcaseItem,
} from "@/components/ui/project-showcase";

export function ProjectsSection() {
  const router = useRouter();
  const scopeRef = useScrubBlockReveal();

  const items = useMemo<ProjectShowcaseItem[]>(
    () =>
      PROJECTS.map((project) => ({
        id: project.id,
        title: project.title,
        image: project.image,
        imagePosition: project.imagePosition,
        gradient: project.gradient,
        stack: project.stack,
        href: `/projects/${project.id}`,
      })),
    [],
  );

  const openProject = useCallback(
    (id: string) => {
      router.push(`/projects/${id}`);
    },
    [router],
  );

  return (
    <Section id="projects">
      <div ref={scopeRef}>
        <div data-scrub-reveal className="gsap-reveal mb-14 md:mb-20">
          <SectionMegaHeading title="Selected Projects" />
        </div>

        <ProjectShowcase projects={items} onProjectClick={openProject} />
      </div>
    </Section>
  );
}
