import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ThemeProvider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  const handleToggle = () => setTheme(isDark ? "light" : "dark")

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Kalo në mënyrën e ditës" : "Kalo në mënyrën e natës"}
      className="relative h-10 w-10 rounded-2xl border border-border/70 bg-gradient-to-br from-white/95 via-white/80 to-white/60 text-foreground shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/40"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[1px] rounded-[1.05rem] bg-white/70 backdrop-blur-md transition-all duration-300 dark:bg-slate-950/60"
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute -inset-5 blur-2xl opacity-40 transition-all duration-500 ${isDark ? "bg-amber-300/50" : "bg-primary/40"}`}
      />
        <span className="relative z-10 flex h-5 w-5 items-center justify-center">
          <Sun
            className={`absolute h-5 w-5 transition-all duration-300 ${isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"} text-primary drop-shadow-sm`}
          />
          <Moon
            className={`absolute h-4 w-4 transition-all duration-300 ${isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"} text-amber-200 drop-shadow-md`}
          />
        </span>
      <span className="sr-only">Ndrysho temën vizuale</span>
    </Button>
  )
}
