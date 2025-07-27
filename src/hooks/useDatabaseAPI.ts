import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  status?: string;
  api_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface Filters {
  makes?: string[];
  yearRange?: [number, number];
  priceRange?: [number, number];
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface UseDatabaseAPIReturn {
  cars: Car[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  loadCars: (filters?: Filters, page?: number) => Promise<void>;
  loadMoreCars: () => Promise<void>;
  searchCars: (query: string, filters?: Filters) => Promise<void>;
  triggerBulkSync: () => Promise<void>;
  totalCarsCount: number;
}

export const useDatabaseAPI = (): UseDatabaseAPIReturn => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCarsCount, setTotalCarsCount] = useState(0);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: true
  });
  const { toast } = useToast();

  useEffect(() => {
    getTotalCarsCount();
    loadCars();
  }, []);

  const getTotalCarsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setTotalCarsCount(count || 0);
    } catch (err) {
      console.error('Error getting total cars count:', err);
    }
  };

  const buildCarQuery = (filters?: Filters) => {
    let query = supabase
      .from('cars')
      .select('*', { count: 'exact' });

    if (filters) {
      if (filters.makes && filters.makes.length > 0) {
        query = query.in('make', filters.makes);
      }

      if (filters.yearRange) {
        query = query
          .gte('year', filters.yearRange[0])
          .lte('year', filters.yearRange[1]);
      }

      if (filters.priceRange) {
        query = query
          .gte('price', filters.priceRange[0])
          .lte('price', filters.priceRange[1]);
      }

      if (filters.search) {
        query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
      }
    }

    return query;
  };

  const loadCars = useCallback(async (filters?: Filters, page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const query = buildCarQuery(filters);
      const offset = (page - 1) * pagination.limit;

      const { data, error, count } = await query
        .order('updated_at', { ascending: false })
        .range(offset, offset + pagination.limit - 1);

      if (error) throw error;

      if (page === 1) {
        setCars(data as Car[] || []);
      } else {
        setCars(prev => [...prev, ...(data as Car[] || [])]);
      }

      setPagination(prev => ({
        ...prev,
        page,
        total: count || 0,
        hasMore: (data?.length || 0) === prev.limit
      }));

    } catch (err) {
      console.error('Error loading cars:', err);
      setError('Failed to load cars');
      toast({
        title: "Error",
        description: "Failed to load cars from database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, toast]);

  const loadMoreCars = useCallback(async () => {
    if (!pagination.hasMore || loading) return;
    await loadCars(undefined, pagination.page + 1);
  }, [pagination.hasMore, pagination.page, loading, loadCars]);

  const searchCars = useCallback(async (query: string, filters?: Filters) => {
    const searchFilters = { ...filters, search: query };
    await loadCars(searchFilters, 1);
  }, [loadCars]);

  const triggerBulkSync = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('bulk-api-sync', {
        body: { action: 'sync-all-cars' }
      });

      if (response.error) {
        throw new Error('Failed to sync cars');
      }

      toast({
        title: "Success",
        description: `Bulk sync completed. Synced ${response.data?.synced || 0} cars`,
      });

      await getTotalCarsCount();
      await loadCars();

    } catch (err) {
      console.error('Error in bulk sync:', err);
      setError('Failed to sync data');
      toast({
        title: "Error",
        description: "Failed to sync data from API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSyncStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting sync status:', err);
      return [];
    }
  };

  return {
    cars,
    loading,
    error,
    pagination,
    loadCars,
    loadMoreCars,
    searchCars,
    triggerBulkSync,
    totalCarsCount
  };
};