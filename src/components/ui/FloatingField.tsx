"use client";

import { useId, useRef } from "react";
import { cn } from "@/lib/utils";

type FloatingFieldProps = {
  id?: string;
  name: string;
  label: string;
  type?: "text" | "email";
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  autoComplete?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

/** Floated label sits on the top border; bg must match --form-surface to cut the line cleanly */
const LABEL_FLOAT =
  "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:px-1.5 peer-focus:text-xs peer-focus:leading-none peer-focus:bg-[var(--form-surface)] peer-focus:text-zinc-400 " +
  "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:px-1.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:leading-none peer-[:not(:placeholder-shown)]:bg-[var(--form-surface)] peer-[:not(:placeholder-shown)]:text-zinc-400";

export function FloatingField({
  id: idProp,
  name,
  label,
  type = "text",
  multiline = false,
  rows = 5,
  required,
  autoComplete,
  error,
  value,
  onChange,
  onBlur,
}: FloatingFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const focusInput = () => inputRef.current?.focus();

  const sharedInputClass = cn(
    "peer w-full bg-transparent text-sm leading-normal text-foreground outline-none placeholder-transparent",
    multiline ? "min-h-[120px] resize-y py-0 leading-relaxed" : "h-12 py-0",
  );

  const labelClass = cn(
    "pointer-events-none absolute left-3 z-10 text-sm text-muted transition-all duration-200",
    multiline ? "top-3" : "top-1/2 -translate-y-1/2",
    LABEL_FLOAT,
  );

  return (
    <div className="w-full">
      <div
        role="presentation"
        onClick={focusInput}
        className={cn(
          "relative flex cursor-text rounded-md border bg-[var(--form-surface)] px-3 transition-colors duration-200",
          multiline ? "items-start py-3" : "min-h-12 items-center",
          "border-white/15",
          "focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/10",
          error &&
            "border-red-500/70 focus-within:border-red-500/70 focus-within:ring-red-500/20",
        )}
      >
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            id={id}
            name={name}
            rows={rows}
            required={required}
            autoComplete={autoComplete}
            placeholder=" "
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={sharedInputClass}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            id={id}
            name={name}
            type={type}
            required={required}
            autoComplete={autoComplete}
            placeholder=" "
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={sharedInputClass}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        )}
        <label htmlFor={id} className={labelClass}>
          {label}
          {required && <span className="sr-only"> (required)</span>}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
