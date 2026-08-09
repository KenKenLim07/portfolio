"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const themeListeners = new Set<() => void>();

function notifyThemeListeners() {
  themeListeners.forEach((listener) => listener());
}

function subscribeToTheme(listener: () => void) {
  themeListeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onStorage = (event: StorageEvent) => {
    if (event.key === "theme") listener();
  };
  media.addEventListener("change", listener);
  window.addEventListener("storage", onStorage);
  return () => {
    themeListeners.delete(listener);
    media.removeEventListener("change", listener);
    window.removeEventListener("storage", onStorage);
  };
}

function applyTheme(theme: Theme) {
  // Always keep dark shell; `sun` flips type/chrome for the bright reverse view
  document.documentElement.classList.add("dark");
  document.documentElement.classList.toggle("sun", theme === "light");
  localStorage.setItem("theme", theme);
}

function readTheme(): Theme {
  // Do not infer from `.dark` — that class is always on for the cockpit UI
  try {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "dark";
}

function getServerTheme(): Theme {
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    readTheme,
    getServerTheme,
  );

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    notifyThemeListeners();
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    notifyThemeListeners();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
