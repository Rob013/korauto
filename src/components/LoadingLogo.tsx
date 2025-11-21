import React from "react";
import { cn } from "@/lib/utils";

interface LoadingLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const LoadingLogo: React.FC<LoadingLogoProps> = ({
  size = "md",
  className
}) => {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto",
    lg: "h-16 w-auto",
    xl: "h-20 w-auto"
  };

  const ringSize = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  };

  const dotOffset = {
    sm: "translate-y-6",
    md: "translate-y-8",
    lg: "translate-y-10",
    xl: "translate-y-12"
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      className
    )}>
      <div className="relative flex items-center justify-center">
        {/* Outer slow-spinning gradient ring */}
        <div
          className={cn(
            "absolute rounded-full animate-[spin_3s_linear_infinite] motion-reduce:animate-none will-change-transform",
            ringSize[size]
          )}
          style={{
            background: 'conic-gradient(from 0deg, hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.8))',
            padding: '2px',
            WebkitMaskImage: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))',
            maskImage: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))'
          }}
        />

        {/* Inner fast-spinning ring */}
        <div
          className={cn(
            "absolute border-2 border-transparent rounded-full animate-[spin_1s_linear_infinite] motion-reduce:animate-none will-change-transform",
            ringSize[size]
          )}
          style={{
            borderTopColor: 'hsl(var(--primary))',
            borderRightColor: 'hsl(var(--primary) / 0.4)',
            borderBottomColor: 'hsl(var(--primary) / 0.1)',
            borderLeftColor: 'hsl(var(--primary) / 0.4)',
          }}
        />

        {/* Logo with subtle pulse */}
        <img
          src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png"
          alt="KORAUTO Logo Loading"
          className={cn(
            sizeClasses[size],
            "object-contain dark:invert dark:brightness-0 dark:contrast-100 relative z-10 animate-pulse-subtle"
          )}
          style={{
            animation: 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />
      </div>

      {/* Loading text with dots animation */}
      <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <span>Loading</span>
        <span className="flex gap-0.5">
          <span className="animate-[bounce_1s_infinite_0ms]">.</span>
          <span className="animate-[bounce_1s_infinite_200ms]">.</span>
          <span className="animate-[bounce_1s_infinite_400ms]">.</span>
        </span>
      </div>
    </div>
  );
};

export default LoadingLogo;