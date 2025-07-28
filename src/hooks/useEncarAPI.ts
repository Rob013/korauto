import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Car {
  id: string;
  external_id?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  photo_urls?: string[];
  image?: string;
  lot_number?: string;
  location?: string;
  fuel?: string;
  transmission?: string;
  color?: string;
  condition?: string;
  vin?: string;
  title?: string;
  domain_name?: string;
  source_api?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string;
}

interface SyncStatus {
  id: string;
  sync_type: string;
  status: string;
  total_records: number;
  synced_records: number;
  last_updated: string;
  error_message?: string;
  created_at: string;
}

interface UseEncarAPIReturn {
  cars: Car[];
  loading: boolean;
  error: string | null;
  syncStatus: SyncStatus | null;
  totalCount: number;
  fetchCars: (page?: number, limit?: number, filters?: CarFilters) => Promise<void>;
  triggerSync: (type?: 'full' | 'incremental') => Promise<void>;
  getSyncStatus: () => Promise<void>;
}

interface CarFilters {
  make?: string[];
  model?: string[];
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  search?: string;
}

export const useEncarAPI = (): UseEncarAPIReturn => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCars = async (page: number = 1, limit: number = 100, filters?: CarFilters) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('cars')
        .select('*', { count: 'exact' })
        .eq('source_api', 'auctionapis')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.make && filters.make.length > 0) {
          query = query.in('make', filters.make);
        }
        if (filters.model && filters.model.length > 0) {
          query = query.in('model', filters.model);
        }
        if (filters.yearFrom) {
          query = query.gte('year', filters.yearFrom);
        }
        if (filters.yearTo) {
          query = query.lte('year', filters.yearTo);
        }
        if (filters.priceFrom) {
          query = query.gte('price', filters.priceFrom);
        }
        if (filters.priceTo) {
          query = query.lte('price', filters.priceTo);
        }
        if (filters.mileageFrom) {
          query = query.gte('mileage', filters.mileageFrom);
        }
        if (filters.mileageTo) {
          query = query.lte('mileage', filters.mileageTo);
        }
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
        }
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (page === 1) {
        setCars(data || []);
      } else {
        setCars(prev => [...prev, ...(data || [])]);
      }
      
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cars');
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async (type: 'full' | 'incremental' = 'incremental') => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: syncError } = await supabase.functions.invoke('encar-sync', {
        body: { type }
      });

      if (syncError) {
        console.error('Sync function error:', syncError);
        throw new Error(syncError.message || 'Sync function failed');
      }

      // ✅ BETTER ERROR HANDLING: Check if response indicates failure
      if (data && !data.success) {
        console.error('Sync failed with response:', data);
        throw new Error(data.error || 'Sync operation failed');
      }

      console.log('✅ Sync triggered successfully:', data);
      
      // Refresh sync status and cars after a short delay
      setTimeout(() => {
        getSyncStatus();
        if (type === 'incremental') {
          fetchCars(1, 100);
        }
      }, 1000);
      
    } catch (err) {
      console.error('❌ Error triggering sync:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger sync';
      setError(errorMessage);
      throw err; // Re-throw so calling component can handle it
    } finally {
      setLoading(false);
    }
  };

  const getSyncStatus = async () => {
    try {
      const { data, error: statusError } = await supabase
        .from('sync_metadata')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (statusError && statusError.code !== 'PGRST116') {
        throw statusError;
      }

      setSyncStatus(data);
    } catch (err) {
      console.error('Error fetching sync status:', err);
    }
  };

  // Real-time subscription for sync status updates
  useEffect(() => {
    const channel = supabase
      .channel('sync-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_metadata'
        },
        (payload) => {
          console.log('Sync status updated:', payload);
          setSyncStatus(payload.new as SyncStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Real-time subscription for new cars
  useEffect(() => {
    const channel = supabase
      .channel('cars-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cars'
        },
        (payload) => {
          console.log('New car added:', payload);
          const newCar = payload.new as Car;
          if (newCar.source_api === 'auctionapis') {
            setCars(prev => [newCar, ...prev]);
            setTotalCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial load with larger batch for better performance
  useEffect(() => {
    fetchCars(1, 100);
    getSyncStatus();
  }, []);

  return {
    cars,
    loading,
    error,
    syncStatus,
    totalCount,
    fetchCars,
    triggerSync,
    getSyncStatus
  };
};