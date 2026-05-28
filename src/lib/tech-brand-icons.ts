import {
  siCelery,
  siDocker,
  siFastapi,
  siFirebase,
  siFramer,
  siGreensock,
  siHuggingface,
  siJavascript,
  siNextdotjs,
  siNodedotjs,
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
  JavaScript: siJavascript,
  "Tailwind CSS": siTailwindcss,
  "Framer Motion": siFramer,
  GSAP: siGreensock,
  Vite: siVite,
  "Node.js": siNodedotjs,
  FastAPI: siFastapi,
  Supabase: siSupabase,
  Firebase: siFirebase,
  Redis: siRedis,
  Celery: siCelery,
  Docker: siDocker,
  PostgreSQL: siPostgresql,
  Python: siPython,
  DistilBERT: siHuggingface,
  spaCy: siSpacy,
};

export function getTechBrandIcon(tech: string): TechBrandIconData | null {
  return techBrandIconMap[tech] ?? null;
}
