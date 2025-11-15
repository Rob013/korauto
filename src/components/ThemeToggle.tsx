import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [systemPrefersDark, setSystemPrefersDark] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemPrefersDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const resolvedTheme = theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme;
  const isDark = resolvedTheme === "dark";

  const handleToggle = () => setTheme(isDark ? "light" : "dark");
  const indicatorTransform = isDark ? "translateX(100%)" : "translateX(0%)";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Kalo në mënyrën e ditës" : "Kalo në mënyrën e natës"}
      className={cn(
        "relative inline-flex h-10 w-[5.5rem] items-center justify-between overflow-hidden rounded-full border border-border/60 bg-background/80 px-1 text-xs font-semibold uppercase tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDark ? "shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]" : "shadow-sm"
      )}
    >
      <span className="sr-only">Ndrysho temën vizuale</span>
      <span className="absolute inset-1 rounded-full bg-muted/30 dark:bg-slate-900/40" aria-hidden="true" />
      <span
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-primary/15 backdrop-blur-sm transition-transform duration-300 ease-out"
        style={{ transform: indicatorTransform }}
        aria-hidden="true"
      />
      <span className="relative z-10 flex w-full items-center justify-between">
        <span
          className={cn(
            "flex h-8 w-1/2 items-center justify-center gap-1 rounded-full transition-colors duration-300",
            !isDark ? "text-foreground" : "text-muted-foreground/70"
          )}
        >
          <Sun className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Day</span>
        </span>
        <span
          className={cn(
            "flex h-8 w-1/2 items-center justify-center gap-1 rounded-full transition-colors duration-300",
            isDark ? "text-foreground" : "text-muted-foreground/70"
          )}
        >
          <Moon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Night</span>
        </span>
      </span>
    </button>
  );
}
