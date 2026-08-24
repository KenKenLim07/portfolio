import { Bot, Code2, Cpu, MessageSquare, Monitor, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTechBrandIcon } from "@/lib/tech-brand-icons";

const fallbackIconMap: Record<string, LucideIcon> = {
  "VADER NLP": MessageSquare,
  Transformers: Bot,
  DistilBERT: Cpu,
  Playwright: Monitor,
};

type TechBrandIconProps = {
  tech: string;
  className?: string;
  colored?: boolean;
};

export function TechBrandIcon({ tech, className, colored = true }: TechBrandIconProps) {
  const brand = getTechBrandIcon(tech);

  if (brand) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        aria-hidden
        className={cn("h-5 w-5 shrink-0", className)}
        style={colored ? { color: `#${brand.hex}` } : undefined}
        fill="currentColor"
      >
        <title>{brand.title}</title>
        <path d={brand.path} />
      </svg>
    );
  }

  const FallbackIcon = fallbackIconMap[tech] ?? Code2;

  return (
    <FallbackIcon
      aria-hidden
      className={cn("h-5 w-5 shrink-0 text-muted", className)}
      strokeWidth={1.5}
    />
  );
}
