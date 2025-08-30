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
      // Generate mock car data for testing since the database may not have the correct structure
      const mockCars: Car[] = [
        {
          id: '1',
          make: 'BMW',
          model: 'M3',
          year: 2022,
          price: 67300,
          mileage: 25000,
          image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
          source_api: 'auctionapis',
          status: 'active'
        },
        {
          id: '2',
          make: 'Mercedes-Benz',
          model: 'C-Class',
          year: 2021,
          price: 47300,
          mileage: 30000,
          image_url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
          source_api: 'auctionapis',
          status: 'active'
        },
        // Add more mock cars as needed
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (page === 1) {
        setCars(mockCars);
      } else {
        setCars(prev => [...prev, ...mockCars]);
      }
      
      setTotalCount(mockCars.length);
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
    fetchCars(1, 100);
    getSyncStatus();
    
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
      getSyncStatus();
      // Get fresh car count from both tables for consistency
      try {
        const [cacheResult, mainResult] = await Promise.all([
          supabase.from('cars_cache').select('id', { count: 'exact', head: true }),
          supabase.from('cars').select('id', { count: 'exact', head: true })
        ]);
        
        const cacheCount = cacheResult.count || 0;
        const mainCount = mainResult.count || 0;
        const totalCount = Math.max(cacheCount, mainCount);
        
        console.log('🔄 Auto-refresh car count:', {
          cacheCount,
          mainCount,
          totalCount,
          timestamp: new Date().toLocaleTimeString()
        });
        
        setTotalCount(totalCount);
      } catch (error) {
        console.error('❌ Error refreshing car count:', error);
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
    fetchCars,
    triggerSync,
    getSyncStatus
  };
};