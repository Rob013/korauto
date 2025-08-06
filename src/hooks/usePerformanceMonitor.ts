import { useRef, useCallback, useEffect } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  navigationTime: number;
  apiCallTime: number;
  cacheHitRate: number;
}

interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: any;
}

export const usePerformanceMonitor = () => {
  const performanceEntries = useRef<PerformanceEntry[]>([]);
  const timers = useRef<Map<string, number>>(new Map());
  const cacheStats = useRef({ hits: 0, misses: 0 });

  const startTimer = useCallback((name: string, metadata?: any) => {
    const startTime = performance.now();
    timers.current.set(name, startTime);
    
    console.log(`⏱️ [${name}] Started at ${startTime.toFixed(2)}ms`, metadata);
    return startTime;
  }, []);

  const endTimer = useCallback((name: string, metadata?: any) => {
    const endTime = performance.now();
    const startTime = timers.current.get(name);
    
    if (startTime !== undefined) {
      const duration = endTime - startTime;
      const entry: PerformanceEntry = {
        name,
        startTime,
        endTime,
        duration,
        metadata
      };
      
      performanceEntries.current.push(entry);
      timers.current.delete(name);
      
      console.log(`✅ [${name}] Completed in ${duration.toFixed(2)}ms`, metadata);
      return duration;
    }
    
    console.warn(`⚠️ [${name}] Timer not found`);
    return 0;
  }, []);

  const recordCacheHit = useCallback(() => {
    cacheStats.current.hits++;
  }, []);

  const recordCacheMiss = useCallback(() => {
    cacheStats.current.misses++;
  }, []);

  const getCacheHitRate = useCallback(() => {
    const { hits, misses } = cacheStats.current;
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 0;
  }, []);

  const getMetrics = useCallback((): PerformanceMetrics => {
    const entries = performanceEntries.current;
    const loadEntries = entries.filter(e => e.name.includes('load'));
    const renderEntries = entries.filter(e => e.name.includes('render'));
    const navigationEntries = entries.filter(e => e.name.includes('navigation'));
    const apiEntries = entries.filter(e => e.name.includes('api'));

    return {
      loadTime: loadEntries.reduce((sum, e) => sum + e.duration, 0),
      renderTime: renderEntries.reduce((sum, e) => sum + e.duration, 0),
      navigationTime: navigationEntries.reduce((sum, e) => sum + e.duration, 0),
      apiCallTime: apiEntries.reduce((sum, e) => sum + e.duration, 0),
      cacheHitRate: getCacheHitRate()
    };
  }, [getCacheHitRate]);

  const logPerformanceReport = useCallback(() => {
    const metrics = getMetrics();
    console.group('📊 Performance Report');
    console.log('Load Time:', `${metrics.loadTime.toFixed(2)}ms`);
    console.log('Render Time:', `${metrics.renderTime.toFixed(2)}ms`);
    console.log('Navigation Time:', `${metrics.navigationTime.toFixed(2)}ms`);
    console.log('API Call Time:', `${metrics.apiCallTime.toFixed(2)}ms`);
    console.log('Cache Hit Rate:', `${metrics.cacheHitRate.toFixed(1)}%`);
    console.groupEnd();
  }, [getMetrics]);

  const clearMetrics = useCallback(() => {
    performanceEntries.current = [];
    timers.current.clear();
    cacheStats.current = { hits: 0, misses: 0 };
  }, []);

  // Log performance report every 30 seconds
  useEffect(() => {
    const interval = setInterval(logPerformanceReport, 30000);
    return () => clearInterval(interval);
  }, [logPerformanceReport]);

  // Measure initial page load
  useEffect(() => {
    const loadStart = performance.timing.navigationStart;
    const domContentLoaded = performance.timing.domContentLoadedEventEnd;
    const loadComplete = performance.timing.loadEventEnd;

    if (domContentLoaded > 0) {
      const domLoadTime = domContentLoaded - loadStart;
      console.log(`📊 DOM Content Loaded: ${domLoadTime}ms`);
    }

    if (loadComplete > 0) {
      const totalLoadTime = loadComplete - loadStart;
      console.log(`📊 Page Load Complete: ${totalLoadTime}ms`);
    }
  }, []);

  return {
    startTimer,
    endTimer,
    recordCacheHit,
    recordCacheMiss,
    getCacheHitRate,
    getMetrics,
    logPerformanceReport,
    clearMetrics,
    performanceEntries: performanceEntries.current
  };
};