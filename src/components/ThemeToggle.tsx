import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Kalo në mënyrën e ditës" : "Kalo në mënyrën e natës"}
      className="relative inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-full border border-border/70 bg-gradient-to-r from-card/80 via-card/70 to-card/50 px-1.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:from-slate-900/70 dark:to-slate-900/40"
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/60 via-white/20 to-transparent opacity-70 dark:from-white/10 dark:via-white/5 dark:to-transparent" />
      <span
        className={cn(
          "absolute top-1 bottom-1 w-7 rounded-full bg-white text-foreground shadow-lg transition-transform duration-200 ease-out dark:bg-slate-900/90",
          isDark ? "translate-x-6" : "translate-x-0",
        )}
      >
        <span className="flex h-full w-full items-center justify-center">
          {isDark ? (
            <Moon className="h-3.5 w-3.5 text-amber-200 drop-shadow" />
          ) : (
            <Sun className="h-4 w-4 text-primary drop-shadow" />
          )}
        </span>
      </span>
      <Sun
        className={cn(
          "absolute left-3 h-4 w-4 transition-opacity duration-200",
          isDark ? "opacity-20 text-muted-foreground" : "opacity-100 text-primary",
        )}
        aria-hidden="true"
      />
      <Moon
        className={cn(
          "absolute right-3 h-4 w-4 transition-opacity duration-200",
          isDark ? "opacity-100 text-amber-300" : "opacity-30 text-muted-foreground",
        )}
        aria-hidden="true"
      />
      <span className="sr-only">Ndrysho temën vizuale</span>
    </Button>
  );
}
