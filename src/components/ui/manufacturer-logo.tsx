import React, { useState, useEffect } from 'react';
import { getManufacturerLogoFallbacks } from '@/utils/manufacturerLogos';
import { cn } from '@/lib/utils';

interface ManufacturerLogoProps {
  manufacturerName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallbackText?: boolean;
}

export const ManufacturerLogo: React.FC<ManufacturerLogoProps> = ({
  manufacturerName,
  size = 'sm',
  className,
  fallbackText = true
}) => {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [logoError, setLogoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const logoUrls = getManufacturerLogoFallbacks(manufacturerName);
  const currentLogoUrl = logoUrls[currentLogoIndex];
  
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };
  
  const handleImageError = () => {
    // Try next fallback URL
    if (currentLogoIndex < logoUrls.length - 1) {
      setCurrentLogoIndex(currentLogoIndex + 1);
      setIsLoading(true);
      setLogoError(false);
    } else {
      // All fallbacks failed
      setLogoError(true);
      setIsLoading(false);
    }
  };
  
  const handleImageLoad = () => {
    setIsLoading(false);
    setLogoError(false);
  };
  
  // Reset when manufacturer changes
  useEffect(() => {
    setCurrentLogoIndex(0);
    setLogoError(false);
    setIsLoading(true);
  }, [manufacturerName]);
  
  // If no logo URLs available or all failed, show fallback
  if (!currentLogoUrl || (logoError && !fallbackText)) {
    return (
      <div 
        className={cn(
          sizeClasses[size],
          'rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground',
          className
        )}
      >
        {manufacturerName.substring(0, 2).toUpperCase()}
      </div>
    );
  }
  
  // Show fallback text if image failed and fallbackText is enabled
  if (logoError && fallbackText) {
    return (
      <div 
        className={cn(
          sizeClasses[size],
          'rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground',
          className
        )}
      >
        {manufacturerName.substring(0, 2).toUpperCase()}
      </div>
    );
  }
  
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {isLoading && (
        <div 
          className={cn(
            'absolute inset-0 rounded-full bg-muted animate-pulse',
            sizeClasses[size]
          )}
        />
      )}
      <img
        src={currentLogoUrl}
        alt={`${manufacturerName} logo`}
        className={cn(
          'object-contain transition-opacity',
          sizeClasses[size],
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};