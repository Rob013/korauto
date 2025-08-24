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

  return (
    <div className={cn(
      "flex items-center justify-center",
      className
    )}>
      <div className="relative">
        {/* Animated logo with pulse and rotate effects */}
        <img 
          src="/lovable-uploads/d1ff645d-f293-44ab-b806-ae5eb2483633.png"
          alt="KORAUTO Logo Loading"
          className={cn(
            sizeClasses[size],
            "object-contain dark:invert dark:brightness-0 dark:contrast-100",
            "animate-pulse transition-all duration-300"
          )}
        />
        
        {/* Spinning ring around logo */}
        <div className={cn(
          "absolute inset-0 border-2 border-primary/30 border-t-primary rounded-full",
          "animate-spin",
          {
            "w-8 h-8": size === "sm",
            "w-12 h-12": size === "md", 
            "w-16 h-16": size === "lg",
            "w-20 h-20": size === "xl"
          }
        )} />
        
        {/* Pulsing dots around logo */}
        <div className="absolute -inset-2 flex items-center justify-center">
          <div className="relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
              <div className="w-1 h-1 bg-primary rounded-full animate-ping" 
                   style={{ animationDelay: '0s' }} />
            </div>
            <div className="absolute top-1/2 right-0 transform translate-x-4 -translate-y-1/2">
              <div className="w-1 h-1 bg-primary rounded-full animate-ping" 
                   style={{ animationDelay: '0.5s' }} />
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4">
              <div className="w-1 h-1 bg-primary rounded-full animate-ping" 
                   style={{ animationDelay: '1s' }} />
            </div>
            <div className="absolute top-1/2 left-0 transform -translate-x-4 -translate-y-1/2">
              <div className="w-1 h-1 bg-primary rounded-full animate-ping" 
                   style={{ animationDelay: '1.5s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingLogo;