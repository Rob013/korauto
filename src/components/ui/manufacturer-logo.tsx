import React, { useState, useEffect, useCallback } from 'react';
import { getManufacturerLogoFallbacks } from '@/utils/manufacturerLogos';
import { generateLogoSources } from '@/services/logoAPI';
import { cn } from '@/lib/utils';

interface ManufacturerLogoProps {
  manufacturerName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallbackText?: boolean;
  showTooltip?: boolean;
}

export const ManufacturerLogo: React.FC<ManufacturerLogoProps> = ({
  manufacturerName,
  size = 'sm',
  className,
  fallbackText = true,
  showTooltip = false
}) => {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [logoError, setLogoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  // Get logo URLs from both old and new systems for maximum compatibility
  const legacyLogoUrls = getManufacturerLogoFallbacks(manufacturerName);
  const apiLogoSources = generateLogoSources(manufacturerName);
  
  // Combine both sources, preferring API sources but keeping legacy as fallback
  const allLogoUrls = [
    ...apiLogoSources.map(source => source.url),
    ...legacyLogoUrls.filter(url => !apiLogoSources.some(source => source.url === url))
  ];
  
  const currentLogoUrl = allLogoUrls[currentLogoIndex];
  
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };
  
  const handleImageError = useCallback(() => {
    console.log(`Logo error for ${manufacturerName}, trying next fallback. Current index: ${currentLogoIndex}, URL: ${currentLogoUrl}`);
    
    // Try next fallback URL
    if (currentLogoIndex < allLogoUrls.length - 1) {
      setCurrentLogoIndex(prev => prev + 1);
      setIsLoading(true);
      setLogoError(false);
      setRetryCount(prev => prev + 1);
    } else {
      // All fallbacks failed
      console.warn(`All logo sources failed for ${manufacturerName}. Total attempts: ${allLogoUrls.length}`);
      setLogoError(true);
      setIsLoading(false);
    }
  }, [currentLogoIndex, allLogoUrls.length, manufacturerName, currentLogoUrl]);
  
  const handleImageLoad = useCallback(() => {
    console.log(`Logo loaded successfully for ${manufacturerName} from: ${currentLogoUrl}`);
    setIsLoading(false);
    setLogoError(false);
  }, [manufacturerName, currentLogoUrl]);
  
  // Reset when manufacturer changes
  useEffect(() => {
    setCurrentLogoIndex(0);
    setLogoError(false);
    setIsLoading(true);
    setRetryCount(0);
  }, [manufacturerName]);
  
  // Create fallback component
  const FallbackComponent = () => {
    const initials = manufacturerName.length >= 2 
      ? manufacturerName.substring(0, 2).toUpperCase()
      : manufacturerName.charAt(0).toUpperCase();
      
    return (
      <div 
        className={cn(
          sizeClasses[size],
          'rounded-sm bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-xs font-bold text-primary border border-primary/20',
          className
        )}
        title={showTooltip ? `${manufacturerName} (logo not available)` : undefined}
      >
        {initials}
      </div>
    );
  };
  
  // If no logo URLs available, show fallback immediately
  if (!currentLogoUrl || allLogoUrls.length === 0) {
    return <FallbackComponent />;
  }
  
  // Show fallback if all sources failed
  if (logoError) {
    return <FallbackComponent />;
  }
  
  return (
    <div 
      className={cn('relative flex-shrink-0', sizeClasses[size], className)}
      title={showTooltip ? `${manufacturerName} logo` : undefined}
    >
      {isLoading && (
        <div 
          className={cn(
            'absolute inset-0 rounded-sm bg-muted animate-pulse border border-border/20',
            sizeClasses[size]
          )}
        />
      )}
      <img
        src={currentLogoUrl}
        alt={`${manufacturerName} logo`}
        className={cn(
          'object-contain transition-all duration-200 rounded-sm',
          sizeClasses[size],
          isLoading ? 'opacity-0' : 'opacity-100',
          'hover:scale-105' // Subtle hover effect
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy" // Improve performance with lazy loading
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div 
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            sizeClasses[size]
          )}
        >
          <div className="w-2 h-2 bg-primary/50 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};