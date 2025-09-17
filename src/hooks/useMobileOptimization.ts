import { useMemo } from 'react';
import { useIsMobile } from './use-mobile';
import { getMobileOptimizedConfig } from '@/utils/performanceOptimizer';

// Hook to provide mobile-optimized configurations
export const useMobileOptimization = () => {
  const isMobile = useIsMobile();
  
  const config = useMemo(() => ({
    ...getMobileOptimizedConfig(),
    isMobile,
    // Grid configurations
    gridConfig: {
      overscanCount: isMobile ? 1 : 2,
      itemSize: isMobile ? 280 : 320,
      windowSize: isMobile ? 5 : 10,
    },
    // Image configurations
    imageConfig: {
      quality: isMobile ? 60 : 80,
      maxWidth: isMobile ? 400 : 800,
      lazyLoadMargin: isMobile ? '150px' : '100px',
    },
    // Performance configurations
    performanceConfig: {
      debounceDelay: isMobile ? 300 : 150,
      throttleDelay: isMobile ? 200 : 100,
      batchSize: isMobile ? 10 : 20,
    }
  }), [isMobile]);

  return config;
};

export default useMobileOptimization;