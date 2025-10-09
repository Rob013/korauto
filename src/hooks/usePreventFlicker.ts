import { useEffect, useState } from 'react';

/**
 * Hook to prevent content flickering during loading
 * Ensures smooth transitions and prevents layout shifts
 */
export const usePreventFlicker = (isLoading: boolean, minDisplayTime: number = 300) => {
  const [shouldShow, setShouldShow] = useState(!isLoading);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!isLoading && !shouldShow) {
      // Content is ready, show it with transition
      setIsTransitioning(true);
      
      // Use RAF for smooth transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShouldShow(true);
          
          timeoutId = setTimeout(() => {
            setIsTransitioning(false);
          }, 300);
        });
      });
    } else if (isLoading && shouldShow) {
      // Starting to load, maintain display for minimum time
      timeoutId = setTimeout(() => {
        setIsTransitioning(true);
        
        requestAnimationFrame(() => {
          setShouldShow(false);
          
          setTimeout(() => {
            setIsTransitioning(false);
          }, 150);
        });
      }, minDisplayTime);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, shouldShow, minDisplayTime]);

  return {
    shouldShow,
    isTransitioning,
    className: isTransitioning ? 'animate-fade-in' : ''
  };
};

/**
 * Hook to stabilize content during rapid state changes
 */
export const useStableContent = <T,>(value: T, delay: number = 150): T => {
  const [stableValue, setStableValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value !== stableValue) {
        requestAnimationFrame(() => {
          setStableValue(value);
        });
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay, stableValue]);

  return stableValue;
};
