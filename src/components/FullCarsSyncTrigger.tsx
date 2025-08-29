import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SyncStatus {
  id?: string;
  status: string; // Make flexible to match database
  current_page: number;
  records_processed: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  last_activity_at?: string;
  sync_type: string;
  [key: string]: any; // Allow other database fields
}

export const FullCarsSyncTrigger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [progress, setProgress] = useState<string>('');
  const { toast } = useToast();

  // Real-time sync status monitoring
  useEffect(() => {
    // Get initial sync status
    checkSyncStatus();
    
    // Subscribe to sync status changes
    const subscription = supabase
      .channel('sync-status')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sync_status',
          filter: 'id=eq.cars-sync-main'
        },
        (payload) => {
          console.log('Sync status update:', payload);
          if (payload.new) {
            setSyncStatus(payload.new as SyncStatus);
            updateProgressMessage(payload.new as SyncStatus);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSyncStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'cars-sync-main')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking sync status:', error);
        return;
      }

      if (data) {
        setSyncStatus(data);
        updateProgressMessage(data);
        
        if (data.status === 'running') {
          setIsLoading(true);
        }
      }
    } catch (err) {
      console.error('Failed to check sync status:', err);
    }
  };

  const updateProgressMessage = (status: SyncStatus) => {
    if (!status) return;

    const { status: state, current_page, records_processed, error_message } = status;

    switch (state) {
      case 'running':
        setProgress(`Syncing in progress... Page ${current_page}, ${records_processed} cars processed`);
        break;
      case 'completed':
        setProgress(`✅ Sync completed! ${records_processed} cars synchronized`);
        break;
      case 'failed':
        setProgress(`❌ Sync failed: ${error_message || 'Unknown error'}`);
        break;
      case 'paused':
        setProgress(`⏸️ Sync paused at page ${current_page}. ${records_processed} cars processed so far.`);
        break;
      default:
        setProgress('Sync status: ' + state);
    }
  };

  const startSmartSync = async () => {
    setIsLoading(true);
    setProgress('Initiating smart sync...');

    try {
      toast({
        title: "Starting Smart Cars Sync",
        description: "Intelligent sync with error handling and automatic retries. This will sync all cars safely.",
      });

      // Call the smart cars-sync edge function
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: { 
          smartSync: true,
          source: 'manual'
        }
      });

      if (error) {
        // Check if it's already running
        if (error.message?.includes('already running') || data?.status === 'running') {
          toast({
            title: "Sync Already Running",
            description: "A sync is already in progress. Monitor progress below.",
          });
          return;
        }
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Smart Sync Started!",
          description: "Background sync initiated. Progress will be updated in real-time below.",
        });
        
        setProgress('Smart sync started in background...');
        
        // Check status periodically for immediate feedback
        const statusCheck = setInterval(async () => {
          await checkSyncStatus();
          if (syncStatus?.status === 'completed' || syncStatus?.status === 'failed') {
            clearInterval(statusCheck);
            setIsLoading(false);
            
            if (syncStatus?.status === 'completed') {
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }
          }
        }, 5000);
        
      } else {
        throw new Error(data?.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('Smart sync failed:', error);
      setProgress('Smart sync failed. Please try again.');
      setIsLoading(false);
      
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to start smart sync. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resumeSync = async () => {
    if (!syncStatus || syncStatus.status !== 'paused') return;
    
    try {
      toast({
        title: "Resuming Sync",
        description: "Continuing from where it left off...",
      });

      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: { 
          smartSync: true,
          resume: true,
          fromPage: syncStatus.current_page
        }
      });

      if (error) throw error;

      setIsLoading(true);
      setProgress('Resuming sync...');
    } catch (error) {
      console.error('Failed to resume sync:', error);
      toast({
        title: "Resume Failed",
        description: error.message || "Failed to resume sync.",
        variant: "destructive",
      });
    }
  };

  const getSyncStatusIcon = () => {
    if (!syncStatus) return <Clock className="h-4 w-4" />;
    
    switch (syncStatus.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
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

  const canStartSync = !isLoading && (!syncStatus || ['completed', 'failed'].includes(syncStatus.status));
  const canResumeSync = syncStatus?.status === 'paused';

  return (
    <div className="p-6 border rounded-lg bg-card space-y-4">
      <div className="flex items-center gap-2">
        {getSyncStatusIcon()}
        <h3 className="text-lg font-semibold">Smart Cars Sync System</h3>
      </div>
      
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Intelligent sync system with error handling, rate limiting, and automatic retries. 
          Syncs all 190,000+ cars safely and runs daily at 2 AM UTC.
        </p>
        
        {syncStatus && (
          <div className="text-sm space-y-1">
            <p><strong>Status:</strong> {syncStatus.status}</p>
            <p><strong>Current Page:</strong> {syncStatus.current_page}</p>
            <p><strong>Cars Processed:</strong> {syncStatus.records_processed?.toLocaleString() || 0}</p>
            {syncStatus.started_at && (
              <p><strong>Started:</strong> {new Date(syncStatus.started_at).toLocaleString()}</p>
            )}
            {syncStatus.completed_at && (
              <p><strong>Completed:</strong> {new Date(syncStatus.completed_at).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>
      
      {progress && (
        <div className="p-3 bg-muted rounded text-sm">
          <p>{progress}</p>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button 
          onClick={startSmartSync} 
          disabled={!canStartSync}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            'Start Smart Sync'
          )}
        </Button>
        
        {canResumeSync && (
          <Button 
            onClick={resumeSync}
            variant="outline"
          >
            Resume Sync
          </Button>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>🤖 <strong>Auto Features:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Daily sync at 2 AM UTC</li>
          <li>Automatic error recovery</li>
          <li>Rate limit handling</li>
          <li>Old car cleanup (7 days)</li>
          <li>Real-time progress tracking</li>
        </ul>
      </div>
    </div>
  );
};