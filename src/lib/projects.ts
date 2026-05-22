import {
  PROJECTS,
  type Project,
  type ProjectFilterId,
} from "@/lib/constants";

export function filterProjects(
  projects: readonly Project[],
  filter: ProjectFilterId,
): Project[] {
  if (filter === "all") return [...projects];
  return projects.filter((p) => p.category === filter);
}

export function resolveFeaturedProject(
  projects: Project[],
  selectedId: string | null,
): Project | undefined {
  if (projects.length === 0) return undefined;
  if (selectedId) {
    const picked = projects.find((p) => p.id === selectedId);
    if (picked) return picked;
  }
  return projects.find((p) => p.featured) ?? projects[0];
}

export function railProjects(
  projects: Project[],
  featured: Project | undefined,
): Project[] {
  if (!featured) return projects;
  return projects.filter((p) => p.id !== featured.id);
}

export { PROJECTS };
