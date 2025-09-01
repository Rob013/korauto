/**
 * Car Sync Hook
 * 
 * This hook provides sync functionality and events to notify components
 * when new car data is available from sync operations.
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SyncState {
  syncing: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  totalSynced: number;
}

interface SyncEventListener {
  (event: { type: 'sync_completed' | 'sync_started' | 'sync_failed'; data?: any }): void;
}

class SyncEventManager {
  private listeners: SyncEventListener[] = [];

  subscribe(listener: SyncEventListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event: { type: 'sync_completed' | 'sync_started' | 'sync_failed'; data?: any }) {
    this.listeners.forEach(listener => listener(event));
  }
}

const syncEventManager = new SyncEventManager();

export const useCarSync = () => {
  const [state, setState] = useState<SyncState>({
    syncing: false,
    error: null,
    lastSyncTime: null,
    totalSynced: 0
  });

  /**
   * Start a car sync operation
   */
  const startSync = useCallback(async () => {
    setState(prev => ({ ...prev, syncing: true, error: null }));
    
    try {
      console.log('🚀 Starting cars sync...');
      
      // Emit sync started event
      syncEventManager.emit({ type: 'sync_started' });
      
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      const totalSynced = data?.totalSynced || data?.synced || 0;
      
      setState(prev => ({
        ...prev,
        syncing: false,
        lastSyncTime: new Date(),
        totalSynced,
        error: null
      }));

      console.log('✅ Sync completed:', data);
      
      // Emit sync completed event
      syncEventManager.emit({ 
        type: 'sync_completed', 
        data: { totalSynced, ...data } 
      });

      return { success: true, totalSynced, data };
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      
      setState(prev => ({
        ...prev,
        syncing: false,
        error: errorMessage
      }));

      // Emit sync failed event
      syncEventManager.emit({ 
        type: 'sync_failed', 
        data: { error: errorMessage } 
      });

      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Subscribe to sync events
   */
  const onSyncEvent = useCallback((listener: SyncEventListener) => {
    return syncEventManager.subscribe(listener);
  }, []);

  /**
   * Check if sync is needed (based on last sync time)
   */
  const isSyncNeeded = useCallback(() => {
    if (!state.lastSyncTime) return true;
    
    const hoursSinceLastSync = (Date.now() - state.lastSyncTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastSync > 6; // Sync needed if more than 6 hours
  }, [state.lastSyncTime]);

  return {
    ...state,
    startSync,
    onSyncEvent,
    isSyncNeeded
  };
};

/**
 * Hook to automatically refresh car data when sync completes
 */
export const useAutoRefreshOnSync = (refreshFunction: () => void | Promise<void>) => {
  useEffect(() => {
    const unsubscribe = syncEventManager.subscribe(async (event) => {
      if (event.type === 'sync_completed') {
        console.log('🔄 Auto-refreshing car data after sync completion...');
        await refreshFunction();
      }
    });

    return unsubscribe;
  }, [refreshFunction]);
};