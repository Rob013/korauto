import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface AnimatedCountOptions {
  duration?: number;
  easing?: (t: number) => number;
  disabled?: boolean;
}

export const useAnimatedCount = (
  targetValue: number,
  { duration = 600, easing = easeOutCubic, disabled = false }: AnimatedCountOptions = {},
) => {
  const [displayValue, setDisplayValue] = useState(() =>
    Number.isFinite(targetValue) ? Math.round(targetValue) : 0,
  );
  const rafRef = useRef<number>();
  const previousValueRef = useRef<number>(displayValue);

  useEffect(() => {
    if (!Number.isFinite(targetValue)) {
      setDisplayValue(0);
      return;
    }

    if (disabled || duration <= 0) {
      setDisplayValue(Math.round(targetValue));
      previousValueRef.current = Math.round(targetValue);
      return;
    }

    const startValue = previousValueRef.current;
    const endValue = Math.round(targetValue);

    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    const startTimeRef = { current: 0 };

    const step = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easing(progress);
      const nextValue = Math.round(startValue + (endValue - startValue) * eased);

      setDisplayValue(nextValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        previousValueRef.current = endValue;
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, duration, easing, disabled]);

  return displayValue;
};
