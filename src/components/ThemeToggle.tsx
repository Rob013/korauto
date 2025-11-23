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
      className="group relative h-9 w-9 rounded-full bg-gradient-to-br from-background/80 to-muted/60 backdrop-blur-md border border-border/40 transition-all duration-300 hover:border-border/60 hover:scale-110 hover:shadow-lg active:scale-95 overflow-hidden"
    >
      {/* Animated background glow */}
      <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isDark
          ? "bg-gradient-to-br from-indigo-500/10 to-purple-500/10"
          : "bg-gradient-to-br from-amber-300/10 to-orange-400/10"
        }`} />

      {/* Icon container with rotation */}
      <div className="relative h-full w-full flex items-center justify-center">
        <Sun
          className={`absolute h-5 w-5 transition-all duration-500 ${isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
            }`}
        />
        <Moon
          className={`absolute h-5 w-5 transition-all duration-500 ${isDark
              ? "rotate-0 scale-100 opacity-100 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"
              : "-rotate-90 scale-0 opacity-0"
            }`}
        />
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full"
        style={{ animation: "shimmer 2s infinite" }} />

      <span className="sr-only">Toggle theme</span>
    </button>
  );
}