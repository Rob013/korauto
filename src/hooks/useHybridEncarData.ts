/**
 * Hybrid Encar Data Hook
 * 
 * Intelligently switches between Supabase cache and direct API calls
 * Falls back to API if cache is unavailable or stale
 */

import { useEncarCache, useEncarCacheHealth } from './useEncarCache';
import { useSecureAuctionAPI } from './useSecureAuctionAPI';
import { APIFilters } from '@/utils/catalog-filter';

interface UseHybridEncarDataOptions {
    preferCache?: boolean; // Default: true
    maxCacheAge?: number; // Minutes, default: 30
    fallbackToAPI?: boolean; // Default: true
}

/**
 * Hook that provides car data from cache OR API
 * Automatically falls back to API if cache is unavailable
 */
export function useHybridEncarData(
    filters: APIFilters = {},
    page: number = 1,
    perPage: number = 200,
    options: UseHybridEncarDataOptions = {}
) {
    const {
        preferCache = true,
        maxCacheAge = 30,
        fallbackToAPI = true
    } = options;

    // Check cache health
    const { data: cacheHealth } = useEncarCacheHealth();

    // Determine if we should use cache
    const shouldUseCache = preferCache &&
        cacheHealth?.available &&
        cacheHealth?.carCount > 0 &&
        (!cacheHealth?.minutesSinceSync || cacheHealth.minutesSinceSync <= maxCacheAge);

    // Fetch from cache
    const cacheQuery = useEncarCache(filters, page, perPage, {
        enabled: shouldUseCache
    });

    // Fetch from API (old method)
    const apiHook = useSecureAuctionAPI();

    // Determine which source to use
    const usingCache = shouldUseCache && !cacheQuery.isError;
    const usingAPI = !usingCache && fallbackToAPI;

    if (usingCache) {
        console.log(`📦 Using Supabase cache (${cacheHealth?.carCount} cars, last sync: ${cacheHealth?.minutesSinceSync}min ago)`);

        return {
            cars: cacheQuery.data?.cars || [],
            loading: cacheQuery.isLoading,
            error: cacheQuery.error,
            totalCount: cacheQuery.data?.totalCount || 0,
            hasMorePages: (cacheQuery.data?.page || 0) < (cacheQuery.data?.totalPages || 0),
            source: 'cache' as const,
            cacheHealth,
            isStale: cacheHealth?.isStale || false,

            // Pass through other API methods (not applicable to cache)
            setCars: () => console.warn('setCars not available in cache mode'),
            setTotalCount: () => console.warn('setTotalCount not available in cache mode'),
            fetchCars: () => Promise.resolve(),
            fetchAllCars: () => Promise.resolve([]),
            filters,
            setFilters: () => console.warn('setFilters not available in cache mode - use component state'),
            loadMore: () => console.warn('loadMore not available in cache mode - use pagination'),
            refreshInventory: () => () => { },
            clearCarsCache: () => console.warn('clearCarsCache not available in cache mode')
        };
    }

    if (usingAPI) {
        console.log(`🌐 Using Encar API (cache unavailable or disabled)`);

        return {
            ...apiHook,
            source: 'api' as const,
            cacheHealth,
            isStale: false
        };
    }

    // No data source available
    console.error('❌ No data source available (cache disabled and API fallback disabled)');

    return {
        cars: [],
        loading: false,
        error: new Error('No data source available'),
        totalCount: 0,
        hasMorePages: false,
        source: 'none' as const,
        cacheHealth,
        isStale: true,

        setCars: () => { },
        setTotalCount: () => { },
        fetchCars: () => Promise.resolve(),
        fetchAllCars: () => Promise.resolve([]),
        filters,
        setFilters: () => { },
        loadMore: () => { },
        refreshInventory: () => () => { },
        clearCarsCache: () => { }
    };
}

/**
 * Simple hook that always uses cache (no API fallback)
 * Useful for components that only need cached data
 */
export function useCachedEncarData(
    filters: APIFilters = {},
    page: number = 1,
    perPage: number = 200
) {
    return useHybridEncarData(filters, page, perPage, {
        preferCache: true,
        fallbackToAPI: false
    });
}

/**
 * Simple hook that always uses API (no cache)
 * Useful for real-time data requirements
 */
export function useLiveEncarData(
    filters: APIFilters = {},
    page: number = 1,
    perPage: number = 200
) {
    return useHybridEncarData(filters, page, perPage, {
        preferCache: false,
        fallbackToAPI: true
    });
}
