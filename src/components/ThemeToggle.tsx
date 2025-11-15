import { useCallback, useEffect, useMemo, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const getSystemThemePreference = (): "light" | "dark" => {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const transitionTimeoutRef = useRef<number | null>(null);

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (!theme || theme === "system") {
      return getSystemThemePreference();
    }
    return theme === "dark" ? "dark" : "light";
  }, [theme]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current && typeof window !== "undefined") {
        window.clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.add("theme-transitioning");
      if (typeof window !== "undefined") {
        if (transitionTimeoutRef.current) {
          window.clearTimeout(transitionTimeoutRef.current);
        }
        transitionTimeoutRef.current = window.setTimeout(() => {
          root.classList.remove("theme-transitioning");
          transitionTimeoutRef.current = null;
        }, 450);
      }
    }
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={`Ndrysho në modalitetin ${isDark ? "e ndritshëm" : "e errët"}`}
      className={cn(
        "group relative inline-flex h-10 w-[106px] items-center justify-between rounded-full border border-border/60 bg-gradient-to-r from-muted/70 via-background to-muted/70 px-1.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "dark:from-muted/20 dark:via-background/80 dark:to-muted/20",
      )}
    >
      <span className="sr-only">
        {isDark ? "Kalo në modalitetin e ndritshëm" : "Kalo në modalitetin e errët"}
      </span>
      <span
        className={cn(
          "pointer-events-none absolute inset-y-1.5 left-1.5 flex w-[calc(50%-4px)] items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg shadow-black/5 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "dark:bg-slate-900/80 dark:text-white/90 dark:shadow-black/30",
          isDark ? "translate-x-[calc(100%+4px)]" : "translate-x-0",
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-primary to-primary/70" />
      </span>
      <span
        className={cn(
          "relative flex flex-1 items-center justify-between gap-1.5 px-1 text-[0.65rem]",
          "transition-colors duration-300",
        )}
      >
        <span
          className={cn(
            "flex items-center gap-1",
            isDark ? "text-muted-foreground/70" : "text-foreground",
          )}
        >
          <Sun className="h-3.5 w-3.5 transition-all duration-300 group-hover:scale-105" />
          Light
        </span>
        <span
          className={cn(
            "flex items-center gap-1",
            isDark ? "text-foreground" : "text-muted-foreground/70",
          )}
        >
          Dark
          <Moon className="h-3.5 w-3.5 transition-all duration-300 group-hover:scale-105" />
        </span>
      </span>
    </button>
  );
}