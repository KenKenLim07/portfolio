import { PROJECTS } from "@/lib/constants";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "@/components/ProjectCard";

export function ProjectsSection() {
  return (
    <Section id="projects" className="border-t border-white/5">
      <SectionHeading
        label="Featured Work"
        title="Premium product showcases"
        description="Selected projects spanning AI platforms, cinematic brand experiences, and high-conversion commerce — built with engineering depth and intentional design."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <ProjectCard project={PROJECTS[0]} featured />
        {PROJECTS.slice(1).map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </Section>
  );
}
