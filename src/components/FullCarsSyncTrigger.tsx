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
      // Also get actual car counts from database
      const [syncResponse, cacheCountResponse] = await Promise.all([
        supabase
          .from('sync_status')
          .select('*')
          .eq('id', 'cars-sync-main')
          .single(),
        supabase
          .from('cars_cache')
          .select('*', { count: 'exact', head: true })
      ]);

      if (syncResponse.error && syncResponse.error.code !== 'PGRST116') {
        console.error('Error checking sync status:', syncResponse.error);
        return;
      }

      if (syncResponse.data) {
        // Update with real car count if sync count is 0 but we have cars
        const realCarCount = cacheCountResponse.count || 0;
        const syncData = { 
          ...syncResponse.data,
          // If sync shows 0 but we have cars, show the real count
          records_processed: syncResponse.data.records_processed || realCarCount
        };
        
        setSyncStatus(syncData);
        updateProgressMessage(syncData);
        
        if (syncData.status === 'running') {
          setIsLoading(true);
        }
        
        console.log('📊 Sync Status Check:', {
          status: syncData.status,
          syncRecordsProcessed: syncResponse.data.records_processed,
          realCarsInCache: realCarCount,
          usingRealCount: syncResponse.data.records_processed === 0 && realCarCount > 0
        });
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

  const getProgressPercentage = () => {
    if (!syncStatus || !syncStatus.records_processed) return 0;
    // Estimate based on typical API having ~200k cars
    const estimatedTotal = 200000;
    return Math.min(100, (syncStatus.records_processed / estimatedTotal) * 100);
  };

  const getEstimatedTime = () => {
    if (!syncStatus || !syncStatus.started_at || syncStatus.status !== 'running') return 'N/A';
    
    const startTime = new Date(syncStatus.started_at).getTime();
    const elapsed = Date.now() - startTime;
    const processed = syncStatus.records_processed || 0;
    
    if (processed < 100) return 'Calculating...';
    
    const rate = processed / (elapsed / 1000 / 60); // cars per minute
    const remaining = 200000 - processed;
    const eta = remaining / rate; // minutes
    
    if (eta < 60) return `${Math.round(eta)}m`;
    if (eta < 24 * 60) return `${Math.round(eta / 60)}h`;
    return `${Math.round(eta / 60 / 24)}d`;
  };

  const isActive = syncStatus?.status === 'running';
  const isCompleted = syncStatus?.status === 'completed';

  return (
    <div className="p-6 border rounded-lg bg-card space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {getSyncStatusIcon()}
          <h3 className="text-lg font-semibold">Smart Cars Sync System</h3>
        </div>
        
        {/* Real-time progress and ETA beside title */}
        {syncStatus && (
          <div className="flex items-center gap-4 text-sm">
            {/* Progress count */}
            <div className="text-right">
              <div className="font-semibold text-primary">
                {syncStatus.records_processed?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-muted-foreground">cars synced</div>
            </div>
            
            {/* ETA */}
            {isActive && (
              <div className="text-right">
                <div className="font-semibold text-blue-600">
                  {getEstimatedTime()}
                </div>
                <div className="text-xs text-muted-foreground">ETA</div>
              </div>
            )}
            
            {/* Completion percentage */}
            <div className="text-right">
              <div className="font-semibold text-emerald-600">
                {getProgressPercentage().toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">complete</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Intelligent sync system with error handling, rate limiting, and automatic retries. 
          Syncs all 190,000+ cars safely and runs daily at 2 AM UTC.
        </p>
        
        {syncStatus && (
          <div className="space-y-4">
            {/* Enhanced Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Sync Progress</span>
                <div className="text-right">
                  <div className="text-sm font-bold">
                    {syncStatus.records_processed?.toLocaleString() || 0} cars
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getProgressPercentage().toFixed(1)}% complete
                  </div>
                </div>
              </div>
              
              {/* Main Progress Bar */}
              <div className="relative">
                <div className="w-full bg-muted rounded-full h-4 overflow-hidden shadow-inner">
                  <div 
                    className={`h-4 rounded-full transition-all duration-700 ease-out relative ${
                      isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      syncStatus.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    }`}
                    style={{ width: `${Math.max(2, getProgressPercentage())}%` }}
                  >
                    {/* Animated stripe overlay for active sync */}
                    {isActive && (
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{ 
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.2) 8px, rgba(255,255,255,0.2) 16px)',
                          animation: 'slide 1.5s linear infinite'
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Progress percentage overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow-md">
                      {getProgressPercentage() > 8 ? `${getProgressPercentage().toFixed(1)}%` : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Detailed Progress Stats */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-muted/50 p-3 rounded">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Page:</span>
                    <span className="font-medium">{syncStatus.current_page?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium capitalize ${
                      isCompleted ? 'text-green-600' : 
                      isActive ? 'text-blue-600' : 
                      syncStatus.status === 'failed' ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      {syncStatus.status}
                      {isActive && <span className="ml-1 animate-pulse">●</span>}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Total:</span>
                    <span className="font-medium">~200k cars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ETA:</span>
                    <span className="font-medium">{getEstimatedTime()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Status Info */}
            <div className="text-sm space-y-1 border-t pt-3">
              {syncStatus.started_at && (
                <p><strong>Started:</strong> {new Date(syncStatus.started_at).toLocaleString()}</p>
              )}
              {syncStatus.completed_at && (
                <p><strong>Completed:</strong> {new Date(syncStatus.completed_at).toLocaleString()}</p>
              )}
              {syncStatus.last_activity_at && isActive && (
                <p><strong>Last Activity:</strong> {new Date(syncStatus.last_activity_at).toLocaleString()}</p>
              )}
            </div>
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