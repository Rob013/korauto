import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/utils/performance-optimizer';

interface PerformanceMetrics {
  renderTime: number;
  renderCount: number;
  memoryUsage?: number;
  componentName: string;
}

export const usePerformanceOptimization = (componentName: string) => {
  const renderStartTime = useRef<number>();
  const renderCountRef = useRef(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    renderCount: 0,
    componentName
  });

  // Track render start
  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCountRef.current++;
  });

  // Track render end and calculate metrics
  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        renderCount: renderCountRef.current,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      }));

      // Warn about slow renders
      if (renderTime > 16) {
        logger.warn(`🐌 ${componentName} slow render: ${renderTime.toFixed(2)}ms`);
      }
    }
  });

  // Memory leak detection
  const checkMemoryLeaks = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;
      
      if (memoryUsage > 0.9) {
        logger.warn(`🔥 High memory usage detected in ${componentName}: ${(memoryUsage * 100).toFixed(1)}%`);
      }
    }
  }, [componentName]);

  // Bundle size analyzer
  const analyzeBundleSize = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const totalSize = scripts.reduce((acc, script) => {
        const size = (script as HTMLScriptElement).src.length;
        return acc + size;
      }, 0);
      
      logger.info(`📦 Estimated bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
    }
  }, []);

  // Performance recommendations
  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    
    if (metrics.renderTime > 16) {
      recommendations.push('Consider memoizing expensive calculations');
    }
    
    if (metrics.renderCount > 10) {
      recommendations.push('Check for unnecessary re-renders');
    }
    
    if (metrics.memoryUsage && metrics.memoryUsage > 50 * 1024 * 1024) {
      recommendations.push('Consider optimizing memory usage');
    }
    
    return recommendations;
  }, [metrics]);

  // Auto-optimization suggestions
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const recommendations = getRecommendations();
      if (recommendations.length > 0) {
        logger.info(`💡 Performance suggestions for ${componentName}:`, recommendations);
      }
    }
  }, [componentName, getRecommendations]);

  return {
    metrics,
    checkMemoryLeaks,
    analyzeBundleSize,
    getRecommendations
  };
};

// Hook for lazy loading optimization
export const useLazyLoadOptimization = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    const element = elementRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold]);

  return { elementRef, isVisible };
};

// Hook for debounced search optimization
export const useOptimizedSearch = (
  searchFn: (term: string) => void,
  delay = 300
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debounceTimer = useRef<NodeJS.Timeout>();

  const debouncedSearch = useCallback((term: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchFn(term);
    }, delay);
  }, [searchFn, delay]);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    searchTerm,
    handleSearchChange
  };
};