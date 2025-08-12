import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SearchReq, SearchRes, FACET_FIELDS } from '@/lib/search/types';
import { createFiltersHash } from '@/lib/search/buildFilter';

const STALE_TIME = 60_000; // 60 seconds
const CACHE_TIME = 5 * 60_000; // 5 minutes

interface UseCarsSearchOptions {
  enabled?: boolean;
  keepPreviousData?: boolean;
}

/**
 * React Query hook for cars search with two-phase fetching support
 */
export const useCarsSearch = (
  request: SearchReq,
  options: UseCarsSearchOptions = {}
) => {
  const { enabled = true, keepPreviousData = true } = options;

  // Generate query key
  const queryKey = ['cars-search', {
    q: request.q,
    filters: request.filters,
    sort: request.sort,
    page: request.page,
    pageSize: request.pageSize,
    mode: request.mode || 'full',
    facets: request.facets,
  }];

  const queryFn = async ({ signal }: { signal?: AbortSignal }): Promise<SearchRes> => {
    console.log('🔍 Fetching cars (DB-first, API fallback):', request);

    // 1) Try DB first (cars_cache)
    try {
      let qb: any = (supabase as any)
        .from('cars_cache')
        .select('id, make, model, year, price, images, mileage, created_at', { count: 'exact' });

      const f = request.filters || {};
      if (f.make?.length) qb = qb.in('make', f.make);
      if (f.model?.length) qb = qb.in('model', f.model);
      if (f.fuel?.length) qb = qb.in('fuel', f.fuel as any);
      if (f.transmission?.length) qb = qb.in('transmission', f.transmission as any);
      if (f.exterior_color?.length) qb = qb.in('color', f.exterior_color as any);
      if (f.year) {
        if (f.year.min != null) qb = qb.gte('year', f.year.min);
        if (f.year.max != null) qb = qb.lte('year', f.year.max);
      }
      if (f.price_eur) {
        if (f.price_eur.min != null) qb = qb.gte('price', f.price_eur.min);
        if (f.price_eur.max != null) qb = qb.lte('price', f.price_eur.max);
      }
      // Basic search on make/model
      if (request.q && request.q.trim()) {
        const q = request.q.trim();
        qb = qb.or(`make.ilike.%${q}%,model.ilike.%${q}%`);
      }

      // Sorting
      const sortFieldMap: Record<string, string> = {
        listed_at: 'created_at',
        price_eur: 'price',
        year: 'year',
        mileage_km: 'created_at', // no numeric mileage column available
      };
      const sort = request.sort || { field: 'listed_at', dir: 'desc' };
      const dbSortField = sortFieldMap[sort.field] || 'created_at';
      qb = qb.order(dbSortField as any, { ascending: sort.dir === 'asc', nullsFirst: false });

      // Pagination
      const page = request.page || 1;
      const pageSize = request.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      qb = qb.range(from, to);

      const { data: rows, error, count } = await qb;
      if (error) throw error;

      const hits = (rows || []).map((r: any) => {
        const imgs = Array.isArray(r.images) ? r.images : [];
        // mileage is stored as string like "12,345 km"; extract digits
        const mileageNum = typeof r.mileage === 'string' ? parseInt(String(r.mileage).replace(/[^0-9]/g, '')) : undefined;
        return {
          id: r.id,
          make: r.make,
          model: r.model,
          year: r.year,
          price_eur: r.price ?? 0,
          mileage_km: mileageNum || 0,
          thumbnail: imgs[0] || undefined,
          listed_at: r.created_at,
        };
      });

      if ((count || 0) > 0) {
        return {
          hits,
          total: count || hits.length,
          page,
          totalPages: Math.max(1, Math.ceil((count || hits.length) / pageSize)),
          hasMore: page * pageSize < (count || hits.length),
        } as SearchRes;
      }
    } catch (e) {
      console.warn('DB fetch failed, will fallback to API:', e);
    }

    // 2) Fallback to Edge Function (live API)
    const { data, error } = await (supabase as any).functions.invoke('cars-search', {
      body: request as any,
    });
    if (error) {
      console.error('❌ cars-search edge function error:', error);
      throw new Error((error as any).message || 'Failed to search cars');
    }
    return data as unknown as SearchRes;
  };

  return useQuery<SearchRes, Error>({
    queryKey,
    queryFn,
    enabled,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    placeholderData: keepPreviousData ? (prev) => prev : undefined,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Invalid request')) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};

/**
 * Hook for results-only search (for fast filtering and pagination)
 */
export const useCarsResults = (
  request: Omit<SearchReq, 'mode'>,
  options: UseCarsSearchOptions = {}
) => {
  return useCarsSearch(
    { ...request, mode: 'results' },
    options
  );
};

/**
 * Hook for facets-only search (for filter options)
 */
export const useCarsFacets = (
  request: Omit<SearchReq, 'mode' | 'page' | 'pageSize'>,
  facets: string[] = [...FACET_FIELDS],
  options: UseCarsSearchOptions = {}
) => {
  return useCarsSearch(
    { 
      ...request, 
      mode: 'facets',
      facets,
      page: 1,
      pageSize: 1, // Minimal page size for facets-only
    },
    options
  );
};

/**
 * Prefetch hook for pagination and dropdowns
 */
export const useCarsSearchPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchPage = async (request: SearchReq, page: number) => {
    const prefetchRequest = { ...request, page, mode: 'results' as const };
    
    await queryClient.prefetchQuery({
      queryKey: ['cars-search', {
        q: prefetchRequest.q,
        filters: prefetchRequest.filters,
        sort: prefetchRequest.sort,
        page: prefetchRequest.page,
        pageSize: prefetchRequest.pageSize,
        mode: prefetchRequest.mode,
        facets: prefetchRequest.facets,
      }],
      queryFn: async () => {
        const { data, error } = await (supabase as any).functions.invoke('cars-search', {
          body: prefetchRequest as any,
        });

        if (error) {
          throw new Error((error as any).message || 'Failed to prefetch cars');
        }

        return data as unknown as SearchRes;
      },
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
    });
  };

  const prefetchMakeResults = async (make: string, currentRequest: SearchReq) => {
    const prefetchRequest: SearchReq = {
      ...currentRequest,
      filters: {
        ...currentRequest.filters,
        make: [make],
      },
      page: 1,
      mode: 'results',
    };

    await queryClient.prefetchQuery({
      queryKey: ['cars-search', {
        q: prefetchRequest.q,
        filters: prefetchRequest.filters,
        sort: prefetchRequest.sort,
        page: prefetchRequest.page,
        pageSize: prefetchRequest.pageSize,
        mode: prefetchRequest.mode,
        facets: prefetchRequest.facets,
      }],
      queryFn: async () => {
        const { data, error } = await (supabase as any).functions.invoke('cars-search', {
          body: prefetchRequest as any,
        });

        if (error) {
          throw new Error((error as any).message || 'Failed to prefetch cars');
        }

        return data as unknown as SearchRes;
      },
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
    });
  };

  const prefetchFacets = async (request: Omit<SearchReq, 'mode'>, facets: string[]) => {
    const prefetchRequest: SearchReq = {
      ...request,
      mode: 'facets',
      facets,
      page: 1,
      pageSize: 1,
    };

    await queryClient.prefetchQuery({
      queryKey: ['cars-search', {
        q: prefetchRequest.q,
        filters: prefetchRequest.filters,
        sort: prefetchRequest.sort,
        page: prefetchRequest.page,
        pageSize: prefetchRequest.pageSize,
        mode: prefetchRequest.mode,
        facets: prefetchRequest.facets,
      }],
      queryFn: async () => {
        const { data, error } = await (supabase as any).functions.invoke('cars-search', {
          body: prefetchRequest as any,
        });

        if (error) {
          throw new Error((error as any).message || 'Failed to prefetch facets');
        }

        return data as unknown as SearchRes;
      },
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
    });
  };

  return {
    prefetchPage,
    prefetchMakeResults,
    prefetchFacets,
  };
};

/**
 * Hook to get cached search results without triggering a new request
 */
export const useCachedCarsSearch = (request: SearchReq): SearchRes | undefined => {
  const queryClient = useQueryClient();
  
  const queryKey = ['cars-search', {
    q: request.q,
    filters: request.filters,
    sort: request.sort,
    page: request.page,
    pageSize: request.pageSize,
    mode: request.mode || 'full',
    facets: request.facets,
  }];

  return queryClient.getQueryData(queryKey);
};

/**
 * Hook to invalidate cars search cache
 */
export const useInvalidateCarsSearch = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['cars-search'] });
  };

  const invalidateFilters = (filters: SearchReq['filters']) => {
    const hash = createFiltersHash(filters);
    queryClient.invalidateQueries({ 
      queryKey: ['cars-search'],
      predicate: (query) => {
        const key = query.queryKey[1] as any;
        return createFiltersHash(key.filters) === hash;
      }
    });
  };

  return {
    invalidateAll,
    invalidateFilters,
  };
};