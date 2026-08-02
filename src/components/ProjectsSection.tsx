"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PROJECTS } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";
import {
  ProjectShowcase,
  type ProjectShowcaseItem,
} from "@/components/ui/project-showcase";

export function ProjectsSection() {
  const router = useRouter();

  const items = useMemo<ProjectShowcaseItem[]>(
    () =>
      PROJECTS.map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
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
      <SectionHeading
        label=""
        title="Selected Projects"
        description="AI platforms, production web apps, and commerce tooling — shipped and maintained."
      />

      <AnimatedSection variant="tail">
        <AnimatedItem>
          <ProjectShowcase projects={items} onProjectClick={openProject} />
        </AnimatedItem>
      </AnimatedSection>
    </Section>
  );
}
