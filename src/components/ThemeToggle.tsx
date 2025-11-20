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
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative h-9 w-9 rounded-full hover:bg-accent/10 transition-colors"
    >
      <Sun className={`absolute h-5 w-5 rotate-0 scale-100 transition-all duration-300 ${isDark ? "-rotate-90 scale-0" : ""}`} />
      <Moon className={`absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 ${isDark ? "rotate-0 scale-100" : ""}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}