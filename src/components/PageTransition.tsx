import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LazyLoadErrorBoundary } from "./LazyLoadErrorBoundary";
import { useGlobalProgress } from "@/contexts/ProgressContext";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const [isReady, setIsReady] = useState(false);
  const { completeProgress } = useGlobalProgress();

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (isReady) {
      completeProgress("navigation");
    }
  }, [isReady, completeProgress]);

  return (
    <LazyLoadErrorBoundary>
      <div
        className={cn("page-transition", isReady && "page-transition--ready")}
        style={{
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          isolation: "isolate",
          contain: "layout style paint",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {children}
      </div>
    </LazyLoadErrorBoundary>
  );
};

export default PageTransition;
