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
        {/* Spinning ring around logo - perfectly centered */}
        <div className={cn(
          "absolute border-2 border-primary/30 border-t-primary rounded-full animate-spin",
          ringSize[size]
        )} />
        
        {/* Animated logo - centered */}
        <img 
          src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png"
          alt="KORAUTO Logo Loading"
          className={cn(
            sizeClasses[size],
            "object-contain dark:invert dark:brightness-0 dark:contrast-100",
            "animate-pulse transition-all duration-300 relative z-10"
          )}
        />
        
        {/* Pulsing dots around logo - perfectly positioned */}
        <div className={cn("absolute inset-0 flex items-center justify-center", ringSize[size])}>
          {/* Top dot */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" 
                 style={{ animationDelay: '0s' }} />
          </div>
          
          {/* Right dot */}
          <div className="absolute top-1/2 right-0 translate-x-2 -translate-y-1/2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" 
                 style={{ animationDelay: '0.5s' }} />
          </div>
          
          {/* Bottom dot */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" 
                 style={{ animationDelay: '1s' }} />
          </div>
          
          {/* Left dot */}
          <div className="absolute top-1/2 left-0 -translate-x-2 -translate-y-1/2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" 
                 style={{ animationDelay: '1.5s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingLogo;