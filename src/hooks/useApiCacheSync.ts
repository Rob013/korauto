import { useState } from 'react';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

interface SyncOptions {
  fullSync?: boolean;
  startPage?: number;
  maxPages?: number;
}

interface SyncResult {
  success: boolean;
  totalSynced?: number;
  pagesProcessed?: number;
  startPage?: number;
  endPage?: number;
  error?: string;
}

export const useApiCacheSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const syncApiData = async (options: SyncOptions = {}): Promise<SyncResult> => {
    setSyncing(true);
    setError(null);
    setProgress(0);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/api-cache-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          fullSync: options.fullSync || false,
          startPage: options.startPage || 1,
          maxPages: options.maxPages || 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result = await response.json();
      setProgress(100);
      
      return {
        success: true,
        ...result,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error during sync';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setSyncing(false);
    }
  };

  const syncBatch = async (startPage: number, batchSize: number = 50): Promise<SyncResult> => {
    return syncApiData({ startPage, maxPages: batchSize, fullSync: false });
  };

  const fullSync = async (): Promise<SyncResult> => {
    return syncApiData({ fullSync: true, startPage: 1, maxPages: 500 });
  };

  return {
    syncing,
    progress,
    error,
    syncApiData,
    syncBatch,
    fullSync,
  };
};
