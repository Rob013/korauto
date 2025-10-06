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
      "flex items-center justify-center",
      className
    )}>
      <div className="relative flex items-center justify-center">
        {/* Spinning ring around logo - using Tailwind animate-spin */}
        <div 
          className={cn(
            "absolute border-2 rounded-full animate-spin",
            ringSize[size]
          )} 
          style={{ 
            borderTopColor: 'hsl(var(--primary))',
            borderRightColor: 'hsl(var(--primary) / 0.3)',
            borderBottomColor: 'hsl(var(--primary) / 0.1)',
            borderLeftColor: 'hsl(var(--primary) / 0.3)',
          }} 
        />
        
        {/* Static logo - no animation for stability */}
        <img 
          src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png"
          alt="KORAUTO Logo Loading"
          className={cn(
            sizeClasses[size],
            "object-contain dark:invert dark:brightness-0 dark:contrast-100 relative z-10"
          )}
        />
      </div>
    </div>
  );
};

export default LoadingLogo;