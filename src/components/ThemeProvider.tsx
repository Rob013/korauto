import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    finished?: Promise<void>
  }
}

const THEME_TRANSITION_TIMEOUT = 650

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext =
  createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme
    }

    const storedTheme = window.localStorage.getItem(storageKey) as Theme | null

    if (storedTheme) {
      return storedTheme
    }

    if (defaultTheme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }

    return defaultTheme
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const root = window.document.documentElement

    const applyTheme = (value: Theme) => {
      root.classList.add("theme-transitioning")

      requestAnimationFrame(() => {
        root.classList.remove("light", "dark")

        if (value === "system") {
          const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"

          root.classList.add(systemTheme)
        } else {
          root.classList.add(value)
        }
      })

      const timeout = window.setTimeout(() => {
        root.classList.remove("theme-transitioning")
      }, THEME_TRANSITION_TIMEOUT)

      return () => window.clearTimeout(timeout)
    }

    const cleanUp = applyTheme(theme)
    return cleanUp
  }, [theme])

  const setTheme = useCallback(
    (value: Theme) => {
      if (typeof window === "undefined") return

      window.localStorage.setItem(storageKey, value)

      const doc = window.document as DocumentWithViewTransition
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

      const start = () => setThemeState(value)

      if (!prefersReducedMotion && typeof doc.startViewTransition === "function") {
        try {
          doc.startViewTransition(() => start())
          return
        } catch {
          // Fallback to default state update below
        }
      }

      start()
    },
    [storageKey]
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      if (theme === "system") {
        setThemeState(
          mediaQuery.matches ? "dark" : "light"
        )
      }
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme]
  )

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
