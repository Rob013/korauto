import { useEffect, useLayoutEffect, useRef } from "react";
import { useGlobalProgress } from "@/contexts/ProgressContext";
import { useLocation } from "react-router-dom";

const NAVIGATION_PROGRESS_KEY = "navigation";

export const NavigationProgressListener = () => {
  const location = useLocation();
  const { startProgress, completeProgress } = useGlobalProgress();
  const previousLocationKeyRef = useRef<string | null>(null);
  const pendingCompletionRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (location.key === previousLocationKeyRef.current) {
      return;
    }
    previousLocationKeyRef.current = location.key;

    startProgress({ key: NAVIGATION_PROGRESS_KEY });
  }, [location.key, startProgress]);

  useEffect(() => {
    if (pendingCompletionRef.current !== null) {
      clearTimeout(pendingCompletionRef.current);
      pendingCompletionRef.current = null;
    }

    pendingCompletionRef.current = window.setTimeout(() => {
      completeProgress(NAVIGATION_PROGRESS_KEY);
      pendingCompletionRef.current = null;
    }, 1200);

    return () => {
      if (pendingCompletionRef.current !== null) {
        clearTimeout(pendingCompletionRef.current);
        pendingCompletionRef.current = null;
      }
    };
  }, [completeProgress, location.pathname, location.search]);

  return null;
};
