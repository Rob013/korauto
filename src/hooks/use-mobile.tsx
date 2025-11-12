import * as React from "react";
import { useViewportSize } from "./use-viewport";

const DEFAULT_BREAKPOINT = 768;

export function useIsMobile(breakpoint: number = DEFAULT_BREAKPOINT) {
  const { width } = useViewportSize();
  const [isMobile, setIsMobile] = React.useState<boolean>(() => width < breakpoint);

  // Respond immediately to viewport width changes (handles zoom + orientation).
  React.useEffect(() => {
    const next = width < breakpoint;
    setIsMobile((prev) => (prev === next ? prev : next));
  }, [width, breakpoint]);

  // Keep a media-query listener as a safety net for browsers that do not update
  // visual viewport metrics during zoom but do fire media query changes.
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const matches = "matches" in event ? event.matches : mediaQuery.matches;
      setIsMobile((prev) => (prev === matches ? prev : matches));
    };

    handleChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }

    return undefined;
  }, [breakpoint]);

  return isMobile;
}
