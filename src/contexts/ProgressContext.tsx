import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ProgressKey = string;

interface StartOptions {
  /**
   * Optional key to identify this progress task. When omitted a key is generated.
   */
  key?: ProgressKey;
  /**
   * Automatically completes the task after the provided number of milliseconds.
   */
  autoCompleteMs?: number;
}

interface ProgressContextValue {
  /**
   * Start (or continue) a progress indicator. Returns the key used for the task.
   */
  startProgress: (options?: StartOptions) => ProgressKey;
  /**
   * Complete a progress task. When key is omitted, all active tasks are completed.
   */
  completeProgress: (key?: ProgressKey) => void;
  /**
   * Mark the current progress as failed and hide the bar after a short delay.
   */
  failProgress: (key?: ProgressKey) => void;
  /**
   * Current numeric progress (0-100).
   */
  progress: number;
  /**
   * Whether the progress bar should be visible.
   */
  isVisible: boolean;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

const MIN_VISIBLE_PROGRESS = 6;
const MAX_AUTO_PROGRESS = 92;

export const GlobalProgressProvider = memo(
  ({ children }: { children: ReactNode }) => {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const activeKeysRef = useRef<Set<ProgressKey>>(new Set());
    const animationFrameRef = useRef<number | null>(null);
    const hideTimeoutRef = useRef<number | null>(null);
    const autoCompleteTimeoutsRef = useRef<Map<ProgressKey, number>>(
      new Map(),
    );
    const keyCounterRef = useRef(0);

    const clearAnimationFrame = useCallback(() => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }, []);

    const scheduleAutoIncrement = useCallback(() => {
      if (animationFrameRef.current !== null) {
        return;
      }

      const step = () => {
        animationFrameRef.current = requestAnimationFrame(() => {
          animationFrameRef.current = null;
          if (activeKeysRef.current.size === 0) {
            return;
          }

          setProgress((current) => {
            if (current >= MAX_AUTO_PROGRESS) {
              return current;
            }
            const increment = Math.max((100 - current) * 0.08, 0.5);
            return Math.min(current + increment, MAX_AUTO_PROGRESS);
          });

          scheduleAutoIncrement();
        });
      };

      step();
    }, []);

    const resetHideTimeout = useCallback(() => {
      if (hideTimeoutRef.current !== null) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }, []);

    const flushAutoComplete = useCallback((key?: ProgressKey) => {
      if (key) {
        const timeoutId = autoCompleteTimeoutsRef.current.get(key);
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
          autoCompleteTimeoutsRef.current.delete(key);
        }
        return;
      }

      autoCompleteTimeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      autoCompleteTimeoutsRef.current.clear();
    }, []);

    const completeAll = useCallback(() => {
      activeKeysRef.current.clear();
      clearAnimationFrame();
      setProgress(100);
      resetHideTimeout();

      hideTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
        hideTimeoutRef.current = null;
      }, 240);
    }, [clearAnimationFrame, resetHideTimeout]);

    const startProgress = useCallback(
      (options?: StartOptions) => {
        const key =
          options?.key ??
          `progress-${++keyCounterRef.current}-${performance.now()}`;

        resetHideTimeout();

        if (!activeKeysRef.current.has(key)) {
          activeKeysRef.current.add(key);
        }

        setIsVisible(true);
        setProgress((current) =>
          current < MIN_VISIBLE_PROGRESS ? MIN_VISIBLE_PROGRESS : current,
        );

        scheduleAutoIncrement();

        if (
          typeof options?.autoCompleteMs === "number" &&
          options.autoCompleteMs > 0
        ) {
          const timeoutId = window.setTimeout(() => {
            autoCompleteTimeoutsRef.current.delete(key);
            activeKeysRef.current.delete(key);
            if (activeKeysRef.current.size === 0) {
              completeAll();
            }
          }, options.autoCompleteMs);

          autoCompleteTimeoutsRef.current.set(key, timeoutId);
        }

        return key;
      },
      [completeAll, resetHideTimeout, scheduleAutoIncrement],
    );

    const completeProgress = useCallback(
      (key?: ProgressKey) => {
        if (key) {
          flushAutoComplete(key);
          activeKeysRef.current.delete(key);
        } else {
          flushAutoComplete();
          activeKeysRef.current.clear();
        }

        if (activeKeysRef.current.size === 0) {
          completeAll();
        }
      },
      [completeAll, flushAutoComplete],
    );

    const failProgress = useCallback(
      (key?: ProgressKey) => {
        if (key) {
          flushAutoComplete(key);
          activeKeysRef.current.delete(key);
        } else {
          flushAutoComplete();
          activeKeysRef.current.clear();
        }

        clearAnimationFrame();
        resetHideTimeout();

        setProgress(100);

        hideTimeoutRef.current = window.setTimeout(() => {
          setIsVisible(false);
          setProgress(0);
          hideTimeoutRef.current = null;
        }, 360);
      },
      [clearAnimationFrame, flushAutoComplete, resetHideTimeout],
    );

    const value = useMemo<ProgressContextValue>(
      () => ({
        startProgress,
        completeProgress,
        failProgress,
        progress,
        isVisible,
      }),
      [startProgress, completeProgress, failProgress, progress, isVisible],
    );

    return (
      <ProgressContext.Provider value={value}>
        {children}
      </ProgressContext.Provider>
    );
  },
);

GlobalProgressProvider.displayName = "GlobalProgressProvider";

export const useGlobalProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error(
      "useGlobalProgress must be used within a GlobalProgressProvider",
    );
  }
  return context;
};
