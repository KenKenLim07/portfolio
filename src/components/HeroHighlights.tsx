"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Brain, Layers, Rocket } from "lucide-react";
import {
  HERO_CAPABILITIES,
  HERO_WORK_LABELS,
  PROJECTS,
} from "@/lib/constants";
import { HeroEntranceItem } from "@/components/ui/HeroEntrance";

const CAPABILITY_ICONS = [Brain, Layers, Rocket] as const;

export function HeroHighlights() {
  const featured = PROJECTS.find((p) => p.featured) ?? PROJECTS[0];
  const others = PROJECTS.filter((p) => p.id !== featured.id);
  const featuredMeta = HERO_WORK_LABELS[featured.id];

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-5">
      <HeroEntranceItem delay={0.35}>
        <Link
          href={featured.liveUrl ?? "#projects"}
          target={featured.liveUrl ? "_blank" : undefined}
          rel={featured.liveUrl ? "noopener noreferrer" : undefined}
          className="radius-panel-lg group relative block cursor-pointer overflow-hidden border border-white/10 bg-surface transition-colors duration-200 hover:border-indigo-400/35"
        >
          <div className="relative aspect-[2/1] overflow-hidden rounded-t-panel-lg">
            <div
              className={`absolute inset-0 bg-gradient-to-br opacity-50 ${featured.gradient}`}
            />
            <Image
              src={featured.image}
              alt={featured.title}
              fill
              className="object-cover object-[center_top] transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 560px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          </div>
          <div className="relative border-t border-white/10 p-4 sm:p-5">
            {featuredMeta && (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-300/90">
                {featuredMeta.tag}
              </p>
            )}
            <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {featuredMeta?.shortTitle ?? featured.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
              {featured.description}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-200/90 transition-colors duration-200 group-hover:text-indigo-100">
              View live
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      </HeroEntranceItem>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {others.map((project, i) => {
          const meta = HERO_WORK_LABELS[project.id];
          return (
            <HeroEntranceItem key={project.id} delay={0.45 + i * 0.08}>
              <Link
                href={project.liveUrl ?? "#projects"}
                target={project.liveUrl ? "_blank" : undefined}
                rel={project.liveUrl ? "noopener noreferrer" : undefined}
                className="radius-panel group flex h-full cursor-pointer flex-col overflow-hidden border border-white/10 bg-surface transition-colors duration-200 hover:border-white/20"
              >
                <div className="relative aspect-[2/1] overflow-hidden rounded-t-panel">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br opacity-40 ${project.gradient}`}
                  />
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover object-[center_top] opacity-90 transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="280px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col border-t border-white/10 p-3 sm:p-4">
                  {meta && (
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                      {meta.tag}
                    </p>
                  )}
                  <p className="mt-1 font-display text-sm font-medium text-foreground">
                    {meta?.shortTitle ?? project.title}
                  </p>
                </div>
              </Link>
            </HeroEntranceItem>
          );
        })}
      </div>

      <HeroEntranceItem delay={0.62}>
        <div className="radius-panel border border-white/10 bg-zinc-950/80 p-4 sm:p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            What I build
          </p>
          <ul className="mt-4 space-y-4">
            {HERO_CAPABILITIES.map((item, i) => {
              const Icon = CAPABILITY_ICONS[i] ?? Layers;
              return (
                <li key={item.title} className="flex gap-3">
                  <span className="radius-control mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-white/5 text-indigo-300/90">
                    <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link
            href="#projects"
            className="radius-control mt-5 inline-flex cursor-pointer items-center gap-2 border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-foreground transition-colors duration-200 hover:border-white/20 hover:bg-white/10"
          >
            All projects
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </HeroEntranceItem>
    </div>
  );
}
