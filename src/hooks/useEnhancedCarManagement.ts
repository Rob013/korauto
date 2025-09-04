import { useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface EnhancedCarManagementOptions {
  immediate_removal?: boolean;
  cleanup_related_data?: boolean;
  car_ids?: string[];
  delete_reason?: string;
  batch_size?: number;
}

interface EnhancedCarManagementResult {
  success: boolean;
  operation: string;
  result?: any;
  error?: string;
  timestamp: string;
}

interface EnhancedSyncStatus {
  id: string;
  sync_type: string;
  status: 'running' | 'completed' | 'completed_with_errors' | 'failed';
  started_at: string;
  completed_at?: string;
  current_page: number;
  total_pages: number;
  records_processed: number;
  total_records: number;
  cars_processed: number;
  archived_lots_processed: number;
  error_message?: string;
  last_activity_at: string;
}

interface UseEnhancedCarManagementReturn {
  // Sync operations
  triggerEnhancedSync: (type?: 'full' | 'incremental' | 'daily') => Promise<any>;
  syncStatus: EnhancedSyncStatus | null;
  
  // Car removal operations
  removeSoldCars: (immediate?: boolean, cleanupRelated?: boolean) => Promise<EnhancedCarManagementResult>;
  bulkDeleteCars: (carIds: string[], reason?: string) => Promise<EnhancedCarManagementResult>;
  processImageCleanup: (batchSize?: number) => Promise<EnhancedCarManagementResult>;
  
  // State
  loading: boolean;
  error: string | null;
  lastOperation: string | null;
  
  // Real-time updates
  activeCarsCount: number;
  totalCarsCount: number;
  
  // Utilities
  clearError: () => void;
  getSyncStatus: () => Promise<void>;
}

export const useEnhancedCarManagement = (): UseEnhancedCarManagementReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<EnhancedSyncStatus | null>(null);
  const [lastOperation, setLastOperation] = useState<string | null>(null);
  const [activeCarsCount, setActiveCarsCount] = useState(0);
  const [totalCarsCount, setTotalCarsCount] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Enhanced sync trigger
  const triggerEnhancedSync = useCallback(async (type: 'full' | 'incremental' | 'daily' = 'incremental') => {
    try {
      setLoading(true);
      setError(null);
      setLastOperation(`enhanced_sync_${type}`);
      
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(`/functions/v1/enhanced-encar-sync?type=${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Enhanced sync failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Enhanced sync failed');
      }

      console.log('✅ Enhanced sync completed:', result);
      return result;
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Enhanced sync request aborted');
        return null;
      }
      
      const errorMessage = error.message || 'Enhanced sync failed';
      setError(errorMessage);
      console.error('❌ Enhanced sync error:', error);
      throw error;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  // Enhanced car management operations
  const performCarManagementOperation = useCallback(async (
    action: 'remove_sold_cars' | 'bulk_delete_cars' | 'process_image_cleanup',
    options: EnhancedCarManagementOptions = {}
  ): Promise<EnhancedCarManagementResult> => {
    try {
      setLoading(true);
      setError(null);
      setLastOperation(action);
      
      const response = await fetch('/functions/v1/enhanced-car-management', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`Car management operation failed: ${response.statusText}`);
      }

      const result: EnhancedCarManagementResult = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Car management operation failed');
      }

      console.log(`✅ ${action} completed:`, result);
      
      // Update counts after operations that affect car visibility
      if (action === 'remove_sold_cars' || action === 'bulk_delete_cars') {
        await updateCarCounts();
      }
      
      return result;
      
    } catch (error: any) {
      const errorMessage = error.message || `${action} failed`;
      setError(errorMessage);
      console.error(`❌ ${action} error:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Specific car management methods
  const removeSoldCars = useCallback(async (
    immediate: boolean = false, 
    cleanupRelated: boolean = true
  ): Promise<EnhancedCarManagementResult> => {
    return performCarManagementOperation('remove_sold_cars', {
      immediate_removal: immediate,
      cleanup_related_data: cleanupRelated
    });
  }, [performCarManagementOperation]);

  const bulkDeleteCars = useCallback(async (
    carIds: string[], 
    reason: string = 'admin_bulk_delete'
  ): Promise<EnhancedCarManagementResult> => {
    if (!carIds || carIds.length === 0) {
      throw new Error('No car IDs provided for bulk deletion');
    }
    
    return performCarManagementOperation('bulk_delete_cars', {
      car_ids: carIds,
      delete_reason: reason
    });
  }, [performCarManagementOperation]);

  const processImageCleanup = useCallback(async (
    batchSize: number = 100
  ): Promise<EnhancedCarManagementResult> => {
    return performCarManagementOperation('process_image_cleanup', {
      batch_size: batchSize
    });
  }, [performCarManagementOperation]);

  // Get sync status
  const getSyncStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.warn('Could not fetch sync status:', error);
        return;
      }

      setSyncStatus(data as EnhancedSyncStatus);
    } catch (error) {
      console.warn('Error fetching sync status:', error);
    }
  }, []);

  // Update car counts
  const updateCarCounts = useCallback(async () => {
    try {
      // Get active cars count (using active_cars view)
      const { count: activeCount, error: activeError } = await supabase
        .from('active_cars')
        .select('*', { count: 'exact', head: true });

      if (activeError) {
        console.warn('Could not fetch active cars count:', activeError);
      } else {
        setActiveCarsCount(activeCount || 0);
      }

      // Get total cars count
      const { count: totalCount, error: totalError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.warn('Could not fetch total cars count:', totalError);
      } else {
        setTotalCarsCount(totalCount || 0);
      }
    } catch (error) {
      console.warn('Error updating car counts:', error);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    // Real-time sync status updates
    const syncChannel = supabase
      .channel('enhanced-sync-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sync_status'
      }, (payload) => {
        console.log('🔄 Enhanced sync status update:', payload.new);
        if (payload.new && typeof payload.new === 'object') {
          setSyncStatus(payload.new as EnhancedSyncStatus);
        }
      })
      .subscribe();

    // Real-time car changes for count updates
    const carsChannel = supabase
      .channel('enhanced-cars-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cars'
      }, (payload) => {
        console.log('🚗 Enhanced car update:', payload.eventType);
        // Debounce count updates
        setTimeout(updateCarCounts, 1000);
      })
      .subscribe();

    // Initial data load
    getSyncStatus();
    updateCarCounts();

    // Cleanup
    return () => {
      supabase.removeChannel(syncChannel);
      supabase.removeChannel(carsChannel);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [getSyncStatus, updateCarCounts]);

  return {
    // Sync operations
    triggerEnhancedSync,
    syncStatus,
    
    // Car removal operations
    removeSoldCars,
    bulkDeleteCars,
    processImageCleanup,
    
    // State
    loading,
    error,
    lastOperation,
    
    // Real-time updates
    activeCarsCount,
    totalCarsCount,
    
    // Utilities
    clearError,
    getSyncStatus
  };
};