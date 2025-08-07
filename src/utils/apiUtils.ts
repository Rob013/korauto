// Shared API utilities to reduce duplication across API hooks

import { useState, useCallback, useRef } from 'react';

// Common cache implementation
export class APICache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private duration: number;

  constructor(duration = 60000) {
    this.duration = duration;
  }

  get(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.duration) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }

  createKey(endpoint: string, params: any) {
    return `${endpoint}-${JSON.stringify(params)}`;
  }
}

// Global cache instance
export const apiCache = new APICache();

// Common hook pattern for API state management
export const useAPIState = <T>() => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);

  const resetState = useCallback(() => {
    setData([]);
    setError(null);
  }, []);

  const shouldSkipRequest = useCallback((minInterval = 2000) => {
    const now = Date.now();
    return now - lastFetchTime.current < minInterval;
  }, []);

  const updateLastFetchTime = useCallback(() => {
    lastFetchTime.current = Date.now();
  }, []);

  return {
    data,
    setData,
    loading,
    setLoading,
    error,
    setError,
    resetState,
    shouldSkipRequest,
    updateLastFetchTime
  };
};

// Common request wrapper with error handling
export const makeAPIRequest = async <T>(
  requestFn: () => Promise<T>,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): Promise<T | null> => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await requestFn();
    setLoading(false);
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    setError(errorMessage);
    setLoading(false);
    console.error('API Request failed:', err);
    return null;
  }
};

// Common delay utility
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Rate limiting utility
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests: number[] = [];
  
  return () => {
    const now = Date.now();
    // Remove old requests outside the window
    while (requests.length > 0 && requests[0] <= now - windowMs) {
      requests.shift();
    }
    
    if (requests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    requests.push(now);
    return true; // Request allowed
  };
};