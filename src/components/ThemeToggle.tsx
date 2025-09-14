import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ThemeProvider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light")
    } else if (theme === "light") {
      setTheme("dark")
    } else {
      setTheme("system")
    }
  }

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-4 w-4" />
    }
    if (theme === "light") {
      return <Sun className="h-4 w-4" />
    }
    return <Moon className="h-4 w-4" />
  }

  const getAriaLabel = () => {
    if (theme === "system") {
      return "Current theme: System (click to switch to Light)"
    }
    if (theme === "light") {
      return "Current theme: Light (click to switch to Dark)"
    }
    return "Current theme: Dark (click to switch to System)"
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="w-9 h-9 p-0"
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
    >
      {getIcon()}
    </Button>
  )
}