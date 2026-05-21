"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GitHubIcon } from "@/components/icons/BrandIcons";
import type { Project } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  featured?: boolean;
};

export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.article
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-surface transition-colors duration-300 hover:border-white/20",
        featured && "lg:col-span-2",
      )}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          featured ? "aspect-[16/9]" : "aspect-[16/10]",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            project.gradient,
          )}
        />
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover opacity-60 transition-transform duration-700 ease-out group-hover:scale-105"
          sizes={featured ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 1024px) 100vw, 50vw"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.2),transparent_50%)]" />
      </div>

      <div className="relative p-6 md:p-8">
        <h3 className="font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          {project.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
          {project.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {project.liveUrl && (
            <Link
              href={project.liveUrl}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors duration-200 hover:bg-zinc-200"
            >
              Live Demo
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
          {project.githubUrl && (
            <Link
              href={project.githubUrl}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:border-white/25 hover:bg-white/10"
            >
              GitHub
              <GitHubIcon />
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}
