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
  current_page?: number;
  next_url?: string;
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
      console.log(`🚀 Triggering ${type} sync...`);
      
      const { data, error: syncError } = await supabase.functions.invoke('encar-sync', {
        body: { type }
      });

      // Handle various error scenarios with robust null checking
      if (syncError) {
        console.error('❌ Sync function error:', syncError);
        
        // Safely extract error message with null checks
        const errorMessage = syncError?.message || syncError?.details || String(syncError) || 'Unknown error';
        
        // Check for specific error types
        if (errorMessage.includes('JWT') || errorMessage.includes('auth')) {
          throw new Error('Authentication error - please refresh the page');
        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          throw new Error('Request timeout - sync may still be running');
        } else if (errorMessage.includes('500') || errorMessage.includes('Internal')) {
          throw new Error('Server error - please try again');
        } else {
          throw new Error(errorMessage);
        }
      }

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from sync function');
      }

      // Check if sync operation failed with safe property access
      if (data && typeof data === 'object' && data.success === false) {
        console.error('❌ Sync failed with response:', data);
        const errorMsg = data.error || data.message || 'Sync operation failed';
        throw new Error(String(errorMsg));
      }
      
      // Handle case where data doesn't have success property
      if (data && typeof data === 'object' && !('success' in data)) {
        console.warn('⚠️ Response missing success field:', data);
        // Assume success if no explicit failure indicators
      }

      console.log('✅ Sync triggered successfully:', data);
      
      // Immediate status refresh
      await getSyncStatus();
      
      // Schedule periodic refreshes for ongoing syncs
      if (data.status === 'paused' || data.status === 'in_progress') {
        const refreshInterval = setInterval(async () => {
          await getSyncStatus();
          
          // Stop refreshing if sync is done
          const currentStatus = await supabase
            .from('sync_metadata')
            .select('status')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (currentStatus.data?.status === 'completed' || currentStatus.data?.status === 'failed') {
            clearInterval(refreshInterval);
            if (type === 'incremental') {
              fetchCars(1, 100);
            }
          }
        }, 5000);
        
        // Stop refreshing after 10 minutes max
        setTimeout(() => clearInterval(refreshInterval), 600000);
      } else if (type === 'incremental') {
        // For completed syncs, refresh cars immediately
        setTimeout(() => fetchCars(1, 100), 1000);
      }
      
    } catch (err) {
      console.error('❌ Error triggering sync:', err);
      
      // Robust error message extraction
      let errorMessage = 'Failed to trigger sync';
      if (err && typeof err === 'object') {
        if ('message' in err && typeof err.message === 'string') {
          errorMessage = err.message;
        } else if ('error' in err && typeof err.error === 'string') {
          errorMessage = err.error;
        } else if ('details' in err && typeof err.details === 'string') {
          errorMessage = err.details;
        } else {
          errorMessage = String(err);
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
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
        .maybeSingle();

      if (statusError) {
        console.error('❌ Error fetching sync status:', statusError);
        throw statusError;
      }

      setSyncStatus(data);
    } catch (err) {
      console.error('❌ Error fetching sync status:', err);
      // Don't set error state for status fetch failures
      // Just log them and keep the UI working
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
          console.log('📡 Sync status updated:', payload);
          if (payload.new && typeof payload.new === 'object') {
            setSyncStatus(payload.new as SyncStatus);
          }
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
          console.log('🚗 New car added:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newCar = payload.new as Car;
            if (newCar.source_api === 'auctionapis') {
              setCars(prev => [newCar, ...prev]);
              setTotalCount(prev => prev + 1);
            }
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