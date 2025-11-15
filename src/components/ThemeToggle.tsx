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
      size="icon"
      onClick={handleToggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Kalo në mënyrën e ditës" : "Kalo në mënyrën e natës"}
      className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-card/80 text-foreground shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] dark:bg-slate-900/60"
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-[1rem] bg-gradient-to-br from-white/90 via-white/50 to-white/20 dark:from-slate-900/85 dark:via-slate-900/60 dark:to-slate-900/30"
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-[1rem] border border-white/40 dark:border-white/10"
      />
      <span className="relative z-10 flex h-5 w-5 items-center justify-center">
        <Sun
          className={cn(
            "absolute h-5 w-5 transition-all duration-200",
            isDark
              ? "scale-75 opacity-0"
              : "scale-100 opacity-100 text-primary drop-shadow-sm",
          )}
        />
        <Moon
          className={cn(
            "absolute h-4 w-4 transition-all duration-200",
            isDark
              ? "scale-100 opacity-100 text-amber-200 drop-shadow-md"
              : "scale-75 opacity-0 text-muted-foreground",
          )}
        />
      </span>
      <span className="sr-only">Ndrysho temën vizuale</span>
    </Button>
  );
}
