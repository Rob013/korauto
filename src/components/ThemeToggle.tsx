import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggle}
      aria-label={`Kalo në temën ${isDark ? "të lehtë" : "të errët"}`}
      className="relative inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <Sun
        className={`h-4 w-4 transition-all duration-300 ${
          isDark ? "text-muted-foreground opacity-50" : "text-amber-500"
        }`}
      />
      <div className="relative h-5 w-10 rounded-full bg-muted/70 dark:bg-slate-800 shadow-inner">
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full shadow transition-transform duration-300 ${
            isDark
              ? "translate-x-5 bg-slate-900"
              : "translate-x-1 bg-amber-400"
          }`}
        />
      </div>
      <Moon
        className={`h-4 w-4 transition-all duration-300 ${
          isDark ? "text-indigo-200" : "text-muted-foreground opacity-50"
        }`}
      />
      <span className="hidden sm:inline text-[11px] uppercase tracking-wide text-muted-foreground">
        {isDark ? "Natë" : "Ditë"}
      </span>
    </Button>
  );
}