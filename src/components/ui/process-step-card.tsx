import { cn } from "@/lib/utils";

type ProcessStepCardProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Process step card. Parent `[data-process-step]` drives accent border via `data-active`.
 */
export function ProcessStepCard({ children, className }: ProcessStepCardProps) {
  return (
    <div className={cn("process-card relative md:max-w-md", className)}>
      <article className="process-card-face glass radius-panel relative z-10 p-6 md:p-8">
        {children}
      </article>
    </div>
  );
}
