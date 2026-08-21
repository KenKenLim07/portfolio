import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { TechBrandIcon } from "@/components/TechBrandIcon";
import { GitHubIcon } from "@/components/icons/BrandIcons";
import { PROJECTS } from "@/lib/constants";

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ id: project.id }));
}

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const project = PROJECTS.find((p) => p.id === id);
  if (!project) return notFound();

  return (
    <Section className="border-t border-border">
      <div className="flex items-center gap-3">
        <Link
          href="/#projects"
          className="radius-control inline-flex items-center gap-2 border border-border bg-subtle px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-foreground transition-colors duration-200 hover:border-border hover:bg-[var(--fill-hover)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>
      </div>

      <div className="mt-10 overflow-hidden rounded-panel-lg border border-border bg-surface">
        <div className="relative aspect-[2/1] overflow-hidden rounded-t-panel-lg bg-zinc-950">
          <div
            className={`absolute inset-0 bg-gradient-to-br opacity-20 ${project.gradient}`}
            aria-hidden
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
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/65 via-transparent to-transparent"
            aria-hidden
          />
        </div>

        <div className="p-6 md:p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-4xl">
            {project.title}
          </h1>

          <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted md:text-lg">
            {project.description}
          </p>

          <div className="mt-10">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
              Full Tech Stack
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.stack.map((tech, i) => (
                <Badge key={`${project.id}-${tech}-${i}`} className="gap-2">
                  <TechBrandIcon tech={tech} className="h-3 w-3" />
                  <span>{tech}</span>
                </Badge>
              ))}
            </div>
          </div>

          {(project.liveUrl || project.githubUrl) && (
            <div className="mt-10">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                Links
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="radius-control inline-flex cursor-pointer items-center gap-2 border border-border bg-subtle px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-foreground transition-[color,background-color,border-color,box-shadow] duration-200 ease-out hover:border-[color-mix(in_srgb,var(--accent-from)_40%,var(--border))] hover:bg-[var(--fill-hover)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-from)_22%,transparent)] motion-reduce:transition-none"
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
                    className="radius-control inline-flex cursor-pointer items-center gap-2 border border-border bg-subtle px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-foreground transition-[color,background-color,border-color,box-shadow] duration-200 ease-out hover:border-[color-mix(in_srgb,var(--accent-from)_40%,var(--border))] hover:bg-[var(--fill-hover)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-from)_22%,transparent)] motion-reduce:transition-none"
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

