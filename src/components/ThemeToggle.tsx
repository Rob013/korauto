import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="group relative h-8 w-14 rounded-full bg-muted/50 backdrop-blur-sm border border-border/30 transition-all duration-300 hover:bg-muted/70 hover:border-border/50 hover:scale-105"
    >
      {/* Sliding indicator */}
      <div
        className={`absolute top-0.5 h-7 w-7 rounded-full bg-gradient-to-br transition-all duration-300 ease-out shadow-sm ${isDark
            ? "right-0.5 from-slate-700 to-slate-900"
            : "left-0.5 from-amber-400 to-orange-500"
          }`}
      />

      {/* Icons */}
      <div className="relative flex items-center justify-between px-1.5 h-full">
        <Sun className={`h-4 w-4 transition-all duration-300 z-10 ${isDark ? "text-muted-foreground/40" : "text-white drop-shadow-sm"
          }`} />
        <Moon className={`h-4 w-4 transition-all duration-300 z-10 ${isDark ? "text-white drop-shadow-sm" : "text-muted-foreground/40"
          }`} />
      </div>

      <span className="sr-only">Toggle theme</span>
    </button>
  );
}