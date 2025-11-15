import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Kalo në mënyrën e ditës" : "Kalo në mënyrën e natës"}
      className={cn(
        "group relative inline-flex h-9 w-[4.5rem] items-center rounded-full border border-border/60 bg-background/80 px-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDark ? "shadow-inner" : "shadow-sm"
      )}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-white/70 via-white/10 to-transparent opacity-80 transition-opacity duration-300 dark:from-slate-800/80 dark:via-transparent dark:to-transparent" />
      <span
        className={cn(
          "absolute top-1 bottom-1 w-7 rounded-full bg-card shadow-sm transition-transform duration-300 ease-out dark:bg-slate-900/90",
          isDark ? "translate-x-6" : "translate-x-0"
        )}
        aria-hidden="true"
      />
      <span className="relative z-10 flex w-full items-center justify-between text-xs font-medium">
        <Sun
          className={cn(
            "h-4 w-4 transition-colors duration-300",
            isDark ? "text-muted-foreground/60" : "text-amber-500"
          )}
          aria-hidden="true"
        />
        <Moon
          className={cn(
            "h-4 w-4 transition-colors duration-300",
            isDark ? "text-blue-200" : "text-muted-foreground/60"
          )}
          aria-hidden="true"
        />
      </span>
      <span className="sr-only">Ndrysho temën vizuale</span>
    </button>
  );
}
