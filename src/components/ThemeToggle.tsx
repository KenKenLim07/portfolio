"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "cursor-pointer p-2 transition-colors duration-200",
        className ?? "text-muted hover:text-foreground",
      )}
      aria-label={
        theme === "dark"
          ? "Turn toward the hollow"
          : "Turn forward through space"
      }
      suppressHydrationWarning
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      ) : (
        <Moon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}
