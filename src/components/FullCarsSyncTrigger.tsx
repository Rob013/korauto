import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SyncStatus {
  id: string;
  sync_type: string;
  status: string; // Make this flexible since it comes from database
  current_page: number;
  total_pages: number;
  records_processed: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  last_activity_at: string;
}

type SyncStatusType = 'running' | 'completed' | 'failed' | 'paused' | 'pending';

export const FullCarsSyncTrigger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [progress, setProgress] = useState<string>('');
  const { toast } = useToast();

  // Poll sync status every 5 seconds when sync is running
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (syncStatus?.status === 'running') {
      interval = setInterval(async () => {
        await fetchSyncStatus();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [syncStatus?.status]);

  // Fetch current sync status
  const fetchSyncStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'cars-sync-main')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching sync status:', error);
        return;
      }

      if (data) {
        setSyncStatus(data);
        updateProgressMessage(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  const updateProgressMessage = (status: SyncStatus) => {
    const { status: syncState, current_page, records_processed, started_at } = status;
    const startTime = new Date(started_at);
    const elapsedMinutes = Math.floor((Date.now() - startTime.getTime()) / 60000);

    switch (syncState) {
      case 'running':
        setProgress(`Running: Page ${current_page}, ${records_processed.toLocaleString()} cars synced (${elapsedMinutes}m elapsed)`);
        break;
      case 'completed':
        setProgress(`✅ Completed: ${records_processed.toLocaleString()} cars synchronized successfully!`);
        break;
      case 'failed':
        setProgress(`❌ Failed: ${status.error_message || 'Unknown error occurred'}`);
        break;
      case 'paused':
        setProgress(`⏸️ Paused: ${records_processed.toLocaleString()} cars synced, paused due to rate limits`);
        break;
      default:
        setProgress('Ready to sync');
    }
  };

  // Load initial status on component mount
  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const startFullSync = async () => {
    setIsLoading(true);
    setProgress('Starting intelligent sync system...');

    try {
      toast({
        title: "Starting Smart Cars Sync",
        description: "Intelligent sync system will handle all errors and sync all cars. This runs in the background.",
      });

      // Call the smart cars-sync edge function
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: { 
          fullSync: true,
          smartSync: true 
        }
      });

      if (error) {
        throw error;
      }

      // Check if error is actually success with error flag
      if (data && !data.success && data.error) {
        throw new Error(data.error);
      }

      setProgress('Smart sync started successfully! Monitoring progress...');
      
      toast({
        title: "Smart Sync Started!",
        description: "The system is now syncing all cars in the background. Progress will update automatically.",
      });

      // Start polling for updates
      setTimeout(fetchSyncStatus, 2000);

    } catch (error) {
      console.error('Sync failed:', error);
      setProgress('Sync failed to start. Please try again.');
      
      toast({
        title: "Sync Failed to Start",
        description: error.message || "Failed to start sync. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resumeSync = async () => {
    if (!syncStatus || syncStatus.status !== 'paused') return;
    await startFullSync();
  };

  const getStatusIcon = () => {
    if (!syncStatus) return <Clock className="h-4 w-4" />;
    
    switch (syncStatus.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getProgressPercentage = () => {
    if (!syncStatus || !syncStatus.records_processed) return 0;
    // Estimate based on typical API having ~200k cars
    const estimatedTotal = 200000;
    return Math.min(100, (syncStatus.records_processed / estimatedTotal) * 100);
  };

  const isActive = syncStatus?.status === 'running';
  const canResume = syncStatus?.status === 'paused';
  const isCompleted = syncStatus?.status === 'completed';

  return (
    <div className="p-6 border rounded-lg bg-card">
      <div className="flex items-center gap-2 mb-4">
        {getStatusIcon()}
        <h3 className="text-lg font-semibold">Smart Cars Database Sync</h3>
      </div>
      
      <p className="text-muted-foreground mb-4">
        Intelligent sync system that handles all 190,000+ cars with automatic error recovery, 
        rate limit management, and daily updates. Runs automatically at 2 AM UTC daily.
      </p>

      {/* Progress Bar */}
      {syncStatus && syncStatus.records_processed > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{syncStatus.records_processed.toLocaleString()} cars synced</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500" 
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Status Information */}
      {progress && (
        <div className="mb-4 p-3 bg-muted rounded">
          <p className="text-sm font-mono">{progress}</p>
          {syncStatus?.last_activity_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Last update: {new Date(syncStatus.last_activity_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Sync Status Details */}
      {syncStatus && (
        <div className="mb-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-medium ${
              isCompleted ? 'text-green-600' : 
              isActive ? 'text-blue-600' : 
              syncStatus.status === 'failed' ? 'text-red-600' : 
              'text-yellow-600'
            }`}>
              {syncStatus.status.charAt(0).toUpperCase() + syncStatus.status.slice(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Current Page:</span>
            <span>{syncStatus.current_page?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Cars Synced:</span>
            <span>{syncStatus.records_processed?.toLocaleString() || 0}</span>
          </div>
          {syncStatus.started_at && (
            <div className="flex justify-between">
              <span>Started:</span>
              <span>{new Date(syncStatus.started_at).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {!isActive && !canResume && (
          <Button 
            onClick={startFullSync} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Smart Sync...
              </>
            ) : (
              'Start Smart Cars Sync'
            )}
          </Button>
        )}

        {canResume && (
          <Button 
            onClick={resumeSync} 
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <Loader2 className="mr-2 h-4 w-4" />
            Resume Paused Sync
          </Button>
        )}

        {isActive && (
          <div className="w-full p-3 bg-blue-50 dark:bg-blue-950 rounded border text-center">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Smart sync is running in the background...
            </p>
          </div>
        )}

        {isCompleted && (
          <div className="w-full p-3 bg-green-50 dark:bg-green-950 rounded border text-center">
            <p className="text-sm text-green-700 dark:text-green-300">
              Sync completed! Cars are updated daily at 2 AM UTC.
            </p>
          </div>
        )}
      </div>

      {/* Daily Sync Info */}
      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        <p>🕐 <strong>Automatic Daily Sync:</strong> Runs at 2 AM UTC to update cars and remove sold ones</p>
        <p>🔄 <strong>Smart Recovery:</strong> Handles rate limits, API errors, and database issues automatically</p>
        <p>📊 <strong>Progress Tracking:</strong> Real-time updates and resumable sync operations</p>
      </div>
    </div>
  );
};