import { cn } from "@/lib/utils";

type ProcessStepCardProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Process step card. Parent `[data-process-step]` drives:
 * - `data-active` → accent border stays on
 * - `data-glow` → one-shot gradient blob (set once when the node fills)
 */
export function ProcessStepCard({ children, className }: ProcessStepCardProps) {
  return (
    <div className={cn("process-card relative md:max-w-md", className)}>
      {/* Animated accent blob — sits behind the glass face */}
      <div className="process-card-blob" aria-hidden />

      <article className="process-card-face glass radius-panel relative z-10 p-6 md:p-8">
        {children}
      </article>
    </div>
  );
}
