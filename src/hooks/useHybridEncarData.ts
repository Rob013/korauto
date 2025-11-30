/**
 * Hybrid Encar Data Hook
 * 
 * Intelligently switches between Supabase cache and direct API calls
 * Falls back to API if cache is unavailable or stale
 * 
 * Provides the same interface as useSecureAuctionAPI for backward compatibility
 */

import { useState, useCallback, useEffect } from 'react';
import { useEncarCache, useEncarCacheHealth } from './useEncarCache';
import { useSecureAuctionAPI } from './useSecureAuctionAPI';
import { APIFilters } from '@/utils/catalog-filter';

interface UseHybridEncarDataOptions {
    preferCache?: boolean; // Default: true
    maxCacheAge?: number; // Minutes, default: 60
    fallbackToAPI?: boolean; // Default: true
}

/**
 * Hook that provides car data from cache OR API
 * Automatically falls back to API if cache is unavailable
 * Manages its own state to match useSecureAuctionAPI interface
 */
export function useHybridEncarData(options: UseHybridEncarDataOptions = {}) {
    const {
        preferCache = true,
        maxCacheAge = 60,
        fallbackToAPI = true
    } = options;

    // Internal state
    const [filters, setFilters] = useState<APIFilters>({});
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 200;

    // ALWAYS call all hooks - never conditional
    // Check cache health
    const { data: cacheHealth } = useEncarCacheHealth();

    // Determine if we should use cache
    const shouldUseCache = preferCache &&
        cacheHealth?.available &&
        cacheHealth?.carCount > 0 &&
        (!cacheHealth?.minutesSinceSync || cacheHealth.minutesSinceSync <= maxCacheAge);

    // ALWAYS fetch from cache (but we'll decide whether to use it later)
    const cacheQuery = useEncarCache(filters, currentPage, perPage, {
        enabled: shouldUseCache // React Query will handle enabling/disabling
    });

    // ALWAYS fetch from API hook (but we'll decide whether to use it later)
    const apiHook = useSecureAuctionAPI();

    // Determine which source to use
    const usingCache = shouldUseCache && !cacheQuery.isError && cacheQuery.data;
    const usingAPI = !usingCache && fallbackToAPI;

    useEffect(() => {
        if (usingCache) {
            console.log(`📦 Using Supabase cache (${cacheHealth?.carCount} cars, last sync: ${cacheHealth?.minutesSinceSync}min ago)`);
        } else if (usingAPI) {
            console.log(`🌐 Using live API (cache not available or stale)`);
        }
    }, [usingCache, usingAPI, cacheHealth]);

    // Unified interface
    if (usingCache) {
        // Cache mode - provide API-compatible interface
        const fetchCars = useCallback(async (page: number, newFilters: APIFilters, resetList: boolean) => {
            setCurrentPage(page);
            setFilters(newFilters);
        }, []);

        const fetchAllCars = useCallback(async () => {
            // For cache, we'd need to fetch all pages - simplified for now
            return cacheQuery.data?.cars || [];
        }, [cacheQuery.data?.cars]);

        const loadMore = useCallback(async () => {
            setCurrentPage(prev => prev + 1);
        }, []);

        const refreshInventory = useCallback(() => {
            return () => {
                // Invalidate and refetch
                cacheQuery.refetch();
            };
        }, [cacheQuery]);

        const clearCarsCache = useCallback(() => {
            // For cache mode, we can just reset to page 1
            setCurrentPage(1);
            setFilters({});
        }, []);

        return {
            cars: cacheQuery.data?.cars || [],
            setCars: (newCars: any[]) => {
                console.warn('setCars not directly supported in cache mode');
            },
            loading: cacheQuery.isLoading,
            error: cacheQuery.error ? String(cacheQuery.error) : null,
            totalCount: cacheQuery.data?.totalCount || 0,
            setTotalCount: (count: number) => {
                console.warn('setTotalCount not supported in cache mode');
            },
            hasMorePages: (cacheQuery.data?.page || 0) < (cacheQuery.data?.totalPages || 0),
            fetchCars,
            fetchAllCars,
            filters,
            setFilters,
            loadMore,
            refreshInventory,
            clearCarsCache,
            source: 'cache' as const,
            cacheHealth,
            isStale: cacheHealth?.isStale || false
        };
    }

    // API mode - pass through the API hook
    if (usingAPI) {
        return {
            ...apiHook,
            source: 'api' as const,
            cacheHealth: null,
            isStale: false
        };
    }

    // No source available
    return {
        cars: [],
        setCars: () => { },
        loading: false,
        error: 'No data source available',
        totalCount: 0,
        setTotalCount: () => { },
        hasMorePages: false,
        fetchCars: async () => { },
        fetchAllCars: async () => [],
        filters: {},
        setFilters: () => { },
        loadMore: async () => { },
        refreshInventory: () => () => { },
        clearCarsCache: () => { },
        source: 'none' as const,
        cacheHealth: null,
        isStale: false
    };
}

/**
 * Hook that ONLY uses cache (no API fallback)
 * Useful when you want to ensure data comes from cache
 */
export function useCachedEncarData(
    filters: APIFilters = {},
    page: number = 1,
    perPage: number = 200
) {
    return useHybridEncarData({ preferCache: true, fallbackToAPI: false });
}

/**
 * Hook that ONLY uses the live API (no cache)
 * Useful for real-time data requirements
 */
export function useLiveEncarData() {
    return useHybridEncarData({ preferCache: false, fallbackToAPI: true });
}
