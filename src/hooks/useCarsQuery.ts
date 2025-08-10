import { useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';
import { FilterState } from '@/hooks/useFiltersFromUrl';
import { useCarsResults, useCarsFacets, useCarsSearchPrefetch } from '@/hooks/useCarsSearch';
import type { SearchReq } from '@/lib/search/types';

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  location?: string;
  images?: string[];
}

interface CarsResponse {
  cars: Car[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface Model {
  id: string;
  name: string;
  brandId: string;
}

// Helpers to map UI filter state to Supabase RPC request
const normalize = (v?: string) => (typeof v === 'string' ? v.trim() : undefined);

const mapSort = (sort?: string): SearchReq['sort'] => {
  switch (sort) {
    case 'price_asc': return { field: 'price_eur', dir: 'asc' };
    case 'price_desc': return { field: 'price_eur', dir: 'desc' };
    case 'year_asc': return { field: 'year', dir: 'asc' };
    case 'year_desc': return { field: 'year', dir: 'desc' };
    case 'mileage_asc': return { field: 'mileage_km', dir: 'asc' };
    case 'mileage_desc': return { field: 'mileage_km', dir: 'desc' };
    default: return { field: 'listed_at', dir: 'desc' };
  }
};

const mapFiltersToSearchReq = (filters: FilterState): SearchReq => {
  const f = {
    make: normalize(filters.brand) ? [normalize(filters.brand)!] : undefined,
    model: normalize(filters.model) ? [normalize(filters.model)!] : undefined,
    fuel: normalize(filters.fuel) ? [normalize(filters.fuel)!] : undefined,
    transmission: normalize(filters.transmission) ? [normalize(filters.transmission)!] : undefined,
    body: normalize(filters.bodyType) ? [normalize(filters.bodyType)!] : undefined,
    exterior_color: normalize(filters.color) ? [normalize(filters.color)!] : undefined,
    region: normalize(filters.location) ? [normalize(filters.location)!] : undefined,
    year: (filters.yearMin != null || filters.yearMax != null) ? { min: filters.yearMin as number, max: filters.yearMax as number } : undefined,
    price_eur: (filters.priceMin != null || filters.priceMax != null) ? { min: filters.priceMin as number, max: filters.priceMax as number } : undefined,
    mileage_km: (filters.mileageMin != null || filters.mileageMax != null) ? { min: filters.mileageMin as number, max: filters.mileageMax as number } : undefined,
  } as SearchReq['filters'];

  return {
    q: normalize(filters.search),
    filters: f,
    sort: mapSort(filters.sort),
    page: filters.page || 1,
    pageSize: filters.pageSize || 20,
    mode: 'results',
  };
};

const mapHitToCar = (hit: any): Car => ({
  id: hit.id,
  make: hit.make,
  model: hit.model,
  year: hit.year,
  price: hit.price_eur,
  mileage: hit.mileage_km,
  images: hit.thumbnail ? [hit.thumbnail] : [],
});

export const useCarsQuery = (filters: FilterState) => {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const request = mapFiltersToSearchReq(filters);

  // Main results from Supabase RPC (server-side filtering and sorting on full dataset)
  const resultsQuery = useCarsResults(request, { enabled: true, keepPreviousData: true });

  // Models facet for dependent filter (based on selected brand)
  const facetsQuery = useCarsFacets(
    { q: request.q, filters: request.filters, sort: request.sort },
    ['model'],
    { enabled: !!filters.brand }
  );

  const total = resultsQuery.data?.total || 0;
  const pageSize = request.pageSize || 20;
  const hasMore = (request.page || 1) * pageSize < total;

  const models: Model[] = (() => {
    if (!filters.brand) return [];
    const modelFacet = facetsQuery.data?.facets?.model || {};
    return Object.keys(modelFacet).map((m) => ({ id: m, name: m, brandId: filters.brand! }));
  })();

  const { prefetchPage } = useCarsSearchPrefetch();

  const prefetchNextPage = useCallback(() => {
    if (hasMore) {
      prefetchPage({ ...request }, (filters.page || 1) + 1);
    }
  }, [hasMore, prefetchPage, request, filters.page]);

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['cars-search'] });
  }, [queryClient]);

  const cancelPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    // Data
    cars: (resultsQuery.data?.hits || []).map(mapHitToCar),
    total,
    totalPages: Math.ceil(total / pageSize),
    hasMore,
    models,

    // Loading states
    isLoading: resultsQuery.isLoading,
    isFetching: resultsQuery.isFetching,
    isLoadingModels: facetsQuery.isLoading,

    // Error states
    error: resultsQuery.error as Error | null,
    modelsError: facetsQuery.error as Error | null,

    // Actions
    refetch: resultsQuery.refetch,
    prefetchNextPage,
    invalidateQueries,
    cancelPreviousRequest,
  };
};
