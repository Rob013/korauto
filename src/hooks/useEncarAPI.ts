import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getFallbackCars, type FallbackCar } from '@/data/fallbackCars';

interface Car {
  id: string;
  external_id?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  title?: string;
  vin?: string;
  color?: string;
  fuel?: string;
  transmission?: string;
  condition?: string;
  location?: string;
  lot_number?: string;
  current_bid?: number;
  buy_now_price?: number;
  final_bid?: number;
  sale_date?: string;
  image_url?: string;
  images?: string; // JSON string
  source_api?: string;
  domain_name?: string;
  status?: string;
  is_live?: boolean;
  keys_available?: boolean;
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string;
}

interface SyncStatus {
  id: string;
  sync_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  current_page?: number;
  total_pages?: number;
  records_processed?: number;
  total_records?: number;
  next_url?: string;
  last_successful_url?: string;
  error_message?: string;
  retry_count?: number;
  started_at?: string;
  completed_at?: string;
  last_activity_at?: string;
  created_at?: string;
}

interface UseEncarAPIReturn {
  cars: Car[];
  loading: boolean;
  error: string | null;
  syncStatus: SyncStatus | null;
  totalCount: number;
  isUsingFallbackData: boolean;
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
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);

  const fetchCars = async (page: number = 1, limit: number = 100, filters?: CarFilters) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚗 Fetching cars from Supabase:', { page, limit, filters });
      
      // Build query for cars from Supabase
      let query = supabase
        .from('cars')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.make?.length) {
        query = query.in('make', filters.make);
      }
      if (filters?.model?.length) {
        query = query.in('model', filters.model);
      }
      if (filters?.yearFrom) {
        query = query.gte('year', filters.yearFrom);
      }
      if (filters?.yearTo) {
        query = query.lte('year', filters.yearTo);
      }
      if (filters?.priceFrom) {
        query = query.gte('price', filters.priceFrom);
      }
      if (filters?.priceTo) {
        query = query.lte('price', filters.priceTo);
      }
      if (filters?.mileageFrom) {
        query = query.gte('mileage', filters.mileageFrom);
      }
      if (filters?.mileageTo) {
        query = query.lte('mileage', filters.mileageTo);
      }
      if (filters?.search) {
        // Search in title, make, model, and vin
        query = query.or(`title.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,vin.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        console.error('❌ Error fetching cars from Supabase:', queryError);
        throw queryError;
      }

      const cars = data || [];
      console.log(`✅ Fetched ${cars.length} cars from Supabase (total: ${count})`);
      
      if (page === 1) {
        setCars(cars);
      } else {
        setCars(prev => [...prev, ...cars]);
      }
      
      setTotalCount(count || 0);
      setIsUsingFallbackData(false);
    } catch (err) {
      console.error('Error fetching cars:', err);
      
      // Extract error message more robustly
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        if ('message' in err && typeof err.message === 'string') {
          errorMessage = err.message;
        } else if ('details' in err && typeof err.details === 'string') {
          errorMessage = err.details;
        } else {
          errorMessage = JSON.stringify(err);
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      console.log('🔍 Error analysis:', { 
        errorMessage, 
        errorType: typeof err,
        errorConstructor: err?.constructor?.name,
        errorDetails: err 
      });

      // For Supabase connection errors, always use fallback data in development
      // Since we're in a development environment without proper Supabase setup
      const isDevelopmentError = (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('TypeError') ||
        errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
        errorMessage.includes('ERR_NETWORK_CHANGED') ||
        // Check the raw error object for connection issues
        String(err).includes('TypeError') ||
        String(err).includes('Failed to fetch')
      );

      // In development, always use fallback for any Supabase error
      const shouldUseFallback = isDevelopmentError || !navigator.onLine || process.env.NODE_ENV === 'development';

      console.log('🔍 Should use fallback:', { shouldUseFallback, isDevelopmentError, isOnline: navigator.onLine });

      if (shouldUseFallback) {
        console.log('🔄 Supabase unavailable, using fallback data for development');
        
        // Use fallback data when Supabase is unavailable (development mode)
        const fallbackResult = getFallbackCars(page, limit, filters);
        
        if (page === 1) {
          setCars(fallbackResult.data as Car[]);
        } else {
          setCars(prev => [...prev, ...fallbackResult.data as Car[]]);
        }
        
        setTotalCount(fallbackResult.totalCount);
        setIsUsingFallbackData(true);
        
        // Clear error when using fallback data
        setError(null);
        
        console.log(`✅ Using fallback data: ${fallbackResult.data.length} cars (total: ${fallbackResult.totalCount})`);
      } else {
        // For other errors, show the original error
        setError(errorMessage);
        setIsUsingFallbackData(false);
      }
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
      if (data.status === 'paused' || data.status === 'running') {
        const refreshInterval = setInterval(async () => {
          await getSyncStatus();
          
          // Stop refreshing if sync is done
          const currentStatus = await supabase
            .from('sync_status')
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
        .from('sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (statusError) {
        console.error('❌ Error fetching sync status:', statusError);
        throw statusError;
      }

      setSyncStatus(data as SyncStatus);
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
          table: 'sync_status'
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

  // Enhanced initial load with real-time updates
  useEffect(() => {
    const initializeData = async () => {
      // Get initial car count
      const { count } = await supabase
        .from('cars')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (count !== null) {
        setTotalCount(count);
        console.log(`📊 Total cars in database: ${count.toLocaleString()}`);
      }
      
      // Fetch initial cars
      await fetchCars(1, 100);
      await getSyncStatus();
    };
    
    initializeData();
    
    // Set up real-time sync status updates
    const syncChannel = supabase
      .channel('sync-status-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sync_status'
      }, (payload) => {
        console.log('🔄 Real-time sync status update:', payload.new);
        if (payload.new && typeof payload.new === 'object') {
          setSyncStatus(payload.new as SyncStatus);
        }
      })
      .subscribe();

    // Set up real-time car count updates 
    const carsChannel = supabase
      .channel('cars-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'cars'
      }, (payload) => {
        console.log('🚗 New real car added live:', payload.new);
        setTotalCount(prev => prev + 1);
        
        // If it's a new car and we're showing cars, refresh the list
        if (cars.length > 0) {
          fetchCars(1, 100);
        }
      })
      .subscribe();

    // Auto-refresh every 30 seconds to get latest counts
    const refreshInterval = setInterval(async () => {
      await getSyncStatus();
      // Get fresh car count
      const { count } = await supabase
        .from('cars')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (count !== null) {
        setTotalCount(count);
      }
    }, 30000);

    return () => {
      supabase.removeChannel(syncChannel);
      supabase.removeChannel(carsChannel);
      clearInterval(refreshInterval);
    };
  }, []);

  return {
    cars,
    loading,
    error,
    syncStatus,
    totalCount,
    isUsingFallbackData,
    fetchCars,
    triggerSync,
    getSyncStatus
  };
};