import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const nextThemeLabel = isDark ? "light" : "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="relative inline-flex h-9 w-16 items-center justify-between gap-0 rounded-full border border-border/60 bg-white/80 px-3 shadow-sm transition-all duration-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-zinc-900/70"
      aria-label={`Switch to ${nextThemeLabel} mode`}
      aria-pressed={isDark}
    >
      <span className="sr-only">{`Enable ${nextThemeLabel} theme`}</span>
      <span
        aria-hidden="true"
        className={`absolute top-1 h-7 w-7 rounded-full border border-black/5 bg-white shadow-md transition-all duration-300 dark:border-white/10 dark:bg-black/70 ${
          isDark ? "right-1 left-auto" : "left-1 right-auto"
        }`}
      />
      <Sun
        aria-hidden="true"
        className={`relative z-10 h-3.5 w-3.5 transition-colors duration-300 ${
          isDark ? "text-muted-foreground" : "text-amber-400"
        }`}
      />
      <Moon
        aria-hidden="true"
        className={`relative z-10 h-3.5 w-3.5 transition-colors duration-300 ${
          isDark ? "text-indigo-200" : "text-muted-foreground/70"
        }`}
      />
    </Button>
  );
}