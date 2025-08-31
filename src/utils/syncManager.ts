import { supabase } from '@/integrations/supabase/client';

export interface SyncProgress {
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentPage: number;
  totalProcessed: number;
  completionPercentage: number;
  estimatedTimeLeft?: string;
  errors: number;
  startTime: string;
  lastUpdate: string;
}

export interface SyncOptions {
  resume?: boolean;
  fromPage?: number;
  batchSize?: number;
  maxConcurrency?: number;
  includImages?: boolean;
}

export class SyncManager {
  private syncId = 'cars-sync-enhanced';
  private listeners: ((progress: SyncProgress) => void)[] = [];
  
  constructor() {
    this.setupRealTimeUpdates();
  }

  // Subscribe to sync progress updates
  subscribe(callback: (progress: SyncProgress) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Start or resume sync
  async startSync(options: SyncOptions = {}): Promise<boolean> {
    try {
      console.log('🚀 Starting enhanced sync with options:', options);
      
      const { data, error } = await supabase.functions.invoke('enhanced-cars-sync', {
        body: {
          resume: options.resume || false,
          fromPage: options.fromPage || 1,
          batchSize: options.batchSize || 1000,
          maxConcurrency: options.maxConcurrency || 3,
          includeImages: options.includImages !== false
        }
      });

      if (error) {
        console.error('❌ Sync start failed:', error);
        throw error;
      }

      console.log('✅ Sync started successfully:', data);
      return true;

    } catch (error) {
      console.error('❌ Failed to start sync:', error);
      throw error;
    }
  }

  // Resume failed sync
  async resumeSync(): Promise<boolean> {
    const status = await this.getSyncStatus();
    if (status.status === 'running') {
      throw new Error('Sync is already running');
    }

    return this.startSync({
      resume: true,
      fromPage: status.currentPage
    });
  }

  // Stop running sync
  async stopSync(): Promise<boolean> {
    try {
      // Update status to stopped
      await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          error_message: 'Manually stopped',
          completed_at: new Date().toISOString()
        })
        .eq('id', this.syncId);

      return true;
    } catch (error) {
      console.error('❌ Failed to stop sync:', error);
      throw error;
    }
  }

  // Get current sync status
  async getSyncStatus(): Promise<SyncProgress> {
    try {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', this.syncId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return {
          status: 'idle',
          currentPage: 1,
          totalProcessed: 0,
          completionPercentage: 0,
          errors: 0,
          startTime: new Date().toISOString(),
          lastUpdate: new Date().toISOString()
        };
      }

      const progress: SyncProgress = {
        status: data.status as SyncProgress['status'],
        currentPage: data.current_page || 1,
        totalProcessed: data.records_processed || 0,
        completionPercentage: data.completion_percentage || 0,
        errors: data.retry_count || 0,
        startTime: data.started_at || data.created_at,
        lastUpdate: data.last_activity_at || data.created_at
      };

      // Calculate estimated time left
      if (progress.status === 'running' && progress.completionPercentage > 5) {
        const elapsed = Date.now() - new Date(progress.startTime).getTime();
        const remainingPercentage = 100 - progress.completionPercentage;
        const estimatedTotal = elapsed * (100 / progress.completionPercentage);
        const estimatedRemaining = estimatedTotal - elapsed;
        
        if (estimatedRemaining > 0) {
          const hours = Math.floor(estimatedRemaining / (1000 * 60 * 60));
          const minutes = Math.floor((estimatedRemaining % (1000 * 60 * 60)) / (1000 * 60));
          progress.estimatedTimeLeft = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }
      }

      return progress;

    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      throw error;
    }
  }

  // Get sync errors
  async getSyncErrors(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('sync_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get sync errors:', error);
      throw error;
    }
  }

  // Clear sync errors
  async clearSyncErrors(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sync_errors')
        .delete()
        .neq('id', 'never'); // Delete all

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Failed to clear sync errors:', error);
      throw error;
    }
  }

  // Setup real-time updates
  private setupRealTimeUpdates(): void {
    const channel = supabase
      .channel('sync-progress')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sync_status',
        filter: `id=eq.${this.syncId}`
      }, (payload) => {
        console.log('📡 Sync progress update:', payload.new);
        this.notifyListeners(payload.new as any);
      })
      .subscribe();

    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        supabase.removeChannel(channel);
      });
    }
  }

  private notifyListeners(statusData: any): void {
    const progress: SyncProgress = {
      status: statusData.status,
      currentPage: statusData.current_page || 1,
      totalProcessed: statusData.records_processed || 0,
      completionPercentage: statusData.completion_percentage || 0,
      errors: statusData.retry_count || 0,
      startTime: statusData.started_at || statusData.created_at,
      lastUpdate: statusData.last_activity_at || statusData.updated_at
    };

    this.listeners.forEach(callback => callback(progress));
  }
}

// Export singleton instance
export const syncManager = new SyncManager();