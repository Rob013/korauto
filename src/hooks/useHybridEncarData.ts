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
    fallbackToAPI?: boolean; // Default: false (cache-only for instant performance)
}

/**
 * Hook that provides car data from cache OR API
 * Automatically falls back to API if cache is unavailable
 * Manages its own state to match useSecureAuctionAPI interface
 */
export function useHybridEncarData(options: UseHybridEncarDataOptions = {}) {
    const {
        preferCache = true,
        maxCacheAge = 360, // 6 hours - match sync schedule
        fallbackToAPI = false // Cache-only by default for instant performance
    } = options;

    // Internal state
    const [filters, setFilters] = useState<APIFilters>({});
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 200;

    // ALWAYS call all hooks - never conditional
    // Check cache health
    const { data: cacheHealth } = useEncarCacheHealth();

    // Determine if we should use cache
    // Simplified: use cache if we prefer it AND it has data OR if API fallback is disabled
    const hasCacheData = cacheQuery.data?.cars && cacheQuery.data.cars.length > 0;
    const shouldUseCache = preferCache && (hasCacheData || cacheHealth?.carCount > 0);

    // Determine which source to use
    const usingCache = shouldUseCache && !cacheQuery.isError;
    const usingAPI = !usingCache && fallbackToAPI;

    // Define all callbacks unconditionally to follow Rules of Hooks
    const fetchCarsCache = useCallback(async (page: number, newFilters: APIFilters, resetList: boolean) => {
        setCurrentPage(page);
        setFilters(newFilters);
    }, []);

    const fetchAllCarsCache = useCallback(async () => {
        return cacheQuery?.data?.cars || [];
    }, [cacheQuery?.data?.cars]);

    const loadMoreCache = useCallback(async () => {
        setCurrentPage(prev => prev + 1);
    }, []);

    const refreshInventoryCache = useCallback(() => {
        return () => {
            cacheQuery?.refetch?.();
        };
    }, [cacheQuery?.refetch]);

    const clearCarsCacheFunc = useCallback(() => {
        setCurrentPage(1);
        setFilters({});
    }, []);

    useEffect(() => {
        if (usingCache) {
            console.log(`📦 Using Supabase cache (${cacheHealth?.carCount} cars, last sync: ${cacheHealth?.minutesSinceSync}min ago)`);
        } else if (usingAPI) {
            console.log(`🌐 Using live API (cache not available or stale)`);
        }
    }, [usingCache, usingAPI, cacheHealth]);

    // Return based on mode
    if (usingCache) {
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
            fetchCars: fetchCarsCache,
            fetchAllCars: fetchAllCarsCache,
            filters,
            setFilters,
            loadMore: loadMoreCache,
            refreshInventory: refreshInventoryCache,
            clearCarsCache: clearCarsCacheFunc,
            source: 'cache' as const,
            cacheHealth,
            isStale: cacheHealth?.isStale || false
        };
    }

    if (usingAPI) {
        return {
            ...apiHook,
            source: 'api' as const,
            cacheHealth: null,
            isStale: false
        };
    }

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
