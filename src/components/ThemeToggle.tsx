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
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-background/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "dark:bg-slate-900/80"
      )}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/60 via-white/10 to-transparent opacity-70 transition-opacity duration-300 dark:from-white/10 dark:via-transparent dark:to-transparent" />
      <Sun
        className={cn(
          "relative h-5 w-5 text-amber-500 transition-all duration-200",
          isDark
            ? "-translate-y-2 scale-75 opacity-0 rotate-90"
            : "translate-y-0 scale-100 opacity-100 rotate-0"
        )}
        aria-hidden="true"
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 text-blue-200 transition-all duration-200",
          isDark
            ? "translate-y-0 scale-100 opacity-100 rotate-0"
            : "translate-y-2 scale-75 opacity-0 -rotate-90"
        )}
        aria-hidden="true"
      />
      <span className="sr-only">Ndrysho temën vizuale</span>
    </Button>
  );
}
