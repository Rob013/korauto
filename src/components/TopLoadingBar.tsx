import { memo } from "react";
import { useGlobalProgress } from "@/contexts/ProgressContext";
import { cn } from "@/lib/utils";

export const TopLoadingBar = memo(() => {
  const { progress, isVisible } = useGlobalProgress();

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] transition-opacity duration-200 ease-out",
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="relative h-full w-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 shadow-[0_0_12px_rgba(0,0,0,0.12)] transition-transform duration-150 ease-out"
          style={{
            transform: `scaleX(${Math.max(progress, 2) / 100})`,
            transformOrigin: "0% 50%",
          }}
        />
      </div>
    </div>
  );
});

TopLoadingBar.displayName = "TopLoadingBar";
