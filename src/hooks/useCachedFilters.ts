/**
 * Optimized filters hook for cached data
 * Provides instant filter calculations without blocking UI
 */

import { useMemo } from 'react';

interface FilterOptions<T> {
  data: T[];
  extractValue: (item: T) => string | number | null | undefined;
  extractCount?: (item: T) => number;
  sortFn?: (a: any, b: any) => number;
}

/**
 * Optimized hook to extract and memoize unique filter values from cached data
 * Uses efficient Set operations for instant performance
 */
export function useCachedFilterOptions<T>({
  data,
  extractValue,
  extractCount,
  sortFn
}: FilterOptions<T>) {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    // Use Map for O(1) lookups and automatic deduplication
    const valuesMap = new Map<string, { value: string; count: number }>();

    // Single pass through data
    for (const item of data) {
      const value = extractValue(item);
      if (!value) continue;

      const key = String(value);
      const existing = valuesMap.get(key);
      const count = extractCount ? extractCount(item) : 1;

      if (existing) {
        existing.count += count;
      } else {
        valuesMap.set(key, { value: key, count });
      }
    }

    // Convert to array and sort if needed
    const options = Array.from(valuesMap.values());
    
    if (sortFn) {
      options.sort(sortFn);
    }

    return options;
  }, [data, extractValue, extractCount, sortFn]);
}

/**
 * Calculate min/max range for numeric filters
 * Optimized for cached data with single pass
 */
export function useCachedRange<T>(
  data: T[],
  extractValue: (item: T) => number | null | undefined
) {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return { min: 0, max: 0 };
    }

    let min = Infinity;
    let max = -Infinity;

    for (const item of data) {
      const value = extractValue(item);
      if (value != null) {
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }

    // Handle edge case where no valid values found
    if (min === Infinity || max === -Infinity) {
      return { min: 0, max: 0 };
    }

    return { min, max };
  }, [data, extractValue]);
}

/**
 * Batch filter state updates to prevent multiple re-renders
 */
export function batchFilterUpdates<T extends Record<string, any>>(
  updates: Partial<T>,
  currentState: T
): T {
  return {
    ...currentState,
    ...updates
  };
}
