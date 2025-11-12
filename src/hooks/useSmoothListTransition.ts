import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

interface SmoothListOptions {
  /**
   * When true (default), the previous value is kept while loading new data to prevent flicker.
   */
  holdDuringLoading?: boolean;
  /**
   * Duration of the fade transition in milliseconds. Defaults to 220ms.
   */
  transitionMs?: number;
}

/**
 * Keeps list-like data stable during loading states and applies a subtle fade transition
 * when new data arrives, improving perceived performance and preventing flicker.
 */
export const useSmoothListTransition = <T>(
  value: T,
  isLoading: boolean,
  { holdDuringLoading = true, transitionMs = 220 }: SmoothListOptions = {},
) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const previousRef = useRef<T>(value);
  const [currentValue, setCurrentValue] = useState<T>(value);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isLoading && holdDuringLoading) {
      setCurrentValue(previousRef.current);
      setIsTransitioning(false);
      return;
    }

    previousRef.current = value;
    setCurrentValue(value);

    if (prefersReducedMotion || transitionMs <= 0) {
      setIsTransitioning(false);
      return;
    }

    setIsTransitioning(true);

    let timeoutId: number | undefined;
    if (typeof window !== "undefined") {
      timeoutId = window.setTimeout(() => setIsTransitioning(false), transitionMs);
    } else {
      setIsTransitioning(false);
    }

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [value, isLoading, holdDuringLoading, transitionMs, prefersReducedMotion]);

  return {
    currentValue,
    isTransitioning,
  };
};
