import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from '@/utils/performance';

interface UseDebouncedSearchOptions {
  delay?: number;
  minLength?: number;
  immediate?: boolean;
}

interface SearchResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
}

/**
 * Hook for debounced search with caching and optimizations
 */
export const useDebouncedSearch = <T = any>(
  searchFunction: (query: string) => Promise<T[]>,
  options: UseDebouncedSearchOptions = {}
) => {
  const {
    delay = 300,
    minLength = 2,
    immediate = false
  } = options;

  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult<T>>({
    data: [],
    loading: false,
    error: null,
    hasSearched: false
  });

  // Cache for search results
  const cacheRef = useRef(new Map<string, T[]>());
  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    // Check cache first
    if (cacheRef.current.has(searchQuery)) {
      setResult({
        data: cacheRef.current.get(searchQuery)!,
        loading: false,
        error: null,
        hasSearched: true
      });
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setResult(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      const data = await searchFunction(searchQuery);
      
      // Only update if this is still the current search
      if (!abortControllerRef.current?.signal.aborted) {
        // Cache successful results
        cacheRef.current.set(searchQuery, data);
        
        // Limit cache size to prevent memory leaks
        if (cacheRef.current.size > 50) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }

        setResult({
          data,
          loading: false,
          error: null,
          hasSearched: true
        });
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        setResult({
          data: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Search failed',
          hasSearched: true
        });
      }
    }
  }, [searchFunction]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (searchQuery.length >= minLength) {
        performSearch(searchQuery);
      } else if (searchQuery.length === 0) {
        setResult({
          data: [],
          loading: false,
          error: null,
          hasSearched: false
        });
      }
    }, delay, immediate),
    [performSearch, minLength, delay, immediate]
  );

  // Effect to trigger search when query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const clearResults = useCallback(() => {
    setResult({
      data: [],
      loading: false,
      error: null,
      hasSearched: false
    });
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    result,
    clearCache,
    clearResults,
    isSearching: result.loading,
    hasResults: result.data.length > 0,
    cacheSize: cacheRef.current.size
  };
};

export default useDebouncedSearch;