import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StatusRefreshOptions {
  intervalHours?: number;
  enabled?: boolean;
}

/**
 * Hook to manage periodic status refresh for car data
 * Refreshes car status from API every 6 hours and removes sold cars after 24 hours
 */
export const useStatusRefresh = (options: StatusRefreshOptions = {}) => {
  const { intervalHours = 6, enabled = true } = options;
  const { toast } = useToast();

  const refreshCarStatuses = useCallback(async () => {
    if (!enabled) return;

    try {
      console.log('🔄 Starting car status refresh...');
      
      // Call the sync function to refresh status data
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: {
          action: 'status_refresh',
          type: 'incremental'
        }
      });

      if (error) {
        console.error('❌ Status refresh failed:', error);
        return;
      }

      // Archive cars that have been sold for more than 24 hours
      await archiveOldSoldCars();

      console.log('✅ Car status refresh completed:', data);
      
    } catch (error) {
      console.error('❌ Error during status refresh:', error);
    }
  }, [enabled]);

  const archiveOldSoldCars = useCallback(async () => {
    try {
      // Use a more efficient query with limit to avoid timeouts
      // Process in smaller batches to prevent database timeout
      const batchSize = 100;
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('cars_cache')
        .update({ 
          sale_status: 'archived',
          updated_at: new Date().toISOString()
        })
        .or('sale_status.eq.sold,car_data->>status.eq.3')
        .lt('updated_at', cutoffDate)
        .order('updated_at', { ascending: true })
        .limit(batchSize);

      if (error) {
        // Log but don't crash on timeout - it's not critical
        console.error('❌ Error archiving old sold cars:', error);
        return;
      }

      console.log('🗂️ Archived old sold cars (batch):', data);
    } catch (error) {
      console.error('❌ Error in archiveOldSoldCars:', error);
    }
  }, []);

  // Setup automatic refresh interval
  useEffect(() => {
    if (!enabled) return;

    // Don't run initial refresh on page load to avoid timeouts
    // Only run on interval
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const interval = setInterval(refreshCarStatuses, intervalMs);

    console.log(`⏰ Status refresh scheduled every ${intervalHours} hours`);

    return () => {
      clearInterval(interval);
    };
  }, [refreshCarStatuses, intervalHours, enabled]);

  return {
    refreshCarStatuses,
    archiveOldSoldCars
  };
};