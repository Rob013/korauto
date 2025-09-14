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
        {/* Spinning ring around logo - perfectly centered - smoother animation */}
        <div className={cn(
          "absolute border-2 border-primary/20 border-t-primary rounded-full",
          "animate-spin transition-all duration-300 ease-linear",
          ringSize[size]
        )} 
        style={{ 
          animation: 'spin 2s linear infinite',
          borderTopColor: 'hsl(var(--primary))',
          borderRightColor: 'hsl(var(--primary) / 0.3)',
          borderBottomColor: 'hsl(var(--primary) / 0.1)',
          borderLeftColor: 'hsl(var(--primary) / 0.3)'
        }} />
        
        {/* Animated logo - centered - smoother pulse */}
        <img 
          src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png"
          alt="KORAUTO Logo Loading"
          className={cn(
            sizeClasses[size],
            "object-contain dark:invert dark:brightness-0 dark:contrast-100",
            "transition-all duration-300 relative z-10"
          )}
          style={{
            animation: 'pulse 2s ease-in-out infinite alternate'
          }}
        />
        

      </div>
    </div>
  );
};

export default LoadingLogo;