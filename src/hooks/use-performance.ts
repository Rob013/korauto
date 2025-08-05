import { useEffect, useRef, useCallback } from 'react';
import { PerformanceMonitor, scheduleIdleTask } from '@/utils/performance';

interface UsePerformanceOptions {
  name: string;
  enabled?: boolean;
  logToConsole?: boolean;
}

export const usePerformance = ({ name, enabled = true, logToConsole = false }: UsePerformanceOptions) => {
  const monitor = PerformanceMonitor.getInstance();
  const timerRef = useRef<(() => void) | null>(null);
  const renderCountRef = useRef(0);

  const startTimer = useCallback(() => {
    if (enabled) {
      timerRef.current = monitor.startTimer(name);
    }
  }, [name, enabled, monitor]);

  const endTimer = useCallback(() => {
    if (timerRef.current) {
      timerRef.current();
      timerRef.current = null;
    }
  }, []);

  const logMetrics = useCallback(() => {
    if (enabled && logToConsole) {
      scheduleIdleTask(() => {
        monitor.logMetrics();
      });
    }
  }, [enabled, logToConsole, monitor]);

  // Track render count
  useEffect(() => {
    renderCountRef.current += 1;
  });

  // Auto-start timer on mount
  useEffect(() => {
    startTimer();
    return () => {
      endTimer();
    };
  }, [startTimer, endTimer]);

  return {
    startTimer,
    endTimer,
    logMetrics,
    renderCount: renderCountRef.current,
    averageTime: monitor.getAverageTime(name),
  };
};

// Hook for measuring specific operations
export const useMeasureOperation = (operationName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  
  return useCallback((operation: () => void) => {
    const endTimer = monitor.startTimer(operationName);
    operation();
    endTimer();
  }, [operationName, monitor]);
};

// Hook for measuring async operations
export const useMeasureAsyncOperation = (operationName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  
  return useCallback(async (operation: () => Promise<void>) => {
    const endTimer = monitor.startTimer(operationName);
    try {
      await operation();
    } finally {
      endTimer();
    }
  }, [operationName, monitor]);
}; 