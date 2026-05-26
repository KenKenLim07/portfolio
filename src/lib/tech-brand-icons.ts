import {
  siApachekafka,
  siCelery,
  siDocker,
  siFastapi,
  siFramer,
  siHuggingface,
  siNextdotjs,
  siPostgresql,
  siPython,
  siReact,
  siRedis,
  siSpacy,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siVite,
  type SimpleIcon,
} from "simple-icons";

export type TechBrandIconData = Pick<SimpleIcon, "title" | "path" | "hex">;

const techBrandIconMap: Record<string, TechBrandIconData> = {
  "Next.js": siNextdotjs,
  React: siReact,
  TypeScript: siTypescript,
  "Tailwind CSS": siTailwindcss,
  "Framer Motion": siFramer,
  Vite: siVite,
  FastAPI: siFastapi,
  Supabase: siSupabase,
  Redis: siRedis,
  Celery: siCelery,
  Docker: siDocker,
  PostgreSQL: siPostgresql,
  Python: siPython,
  DistilBERT: siHuggingface,
  spaCy: siSpacy,
  "Real-Time Data Pipelines": siApachekafka,
};

export function getTechBrandIcon(tech: string): TechBrandIconData | null {
  return techBrandIconMap[tech] ?? null;
}
