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
  const [isStuckSyncDetected, setIsStuckSyncDetected] = useState(false);
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
        // Check for stuck sync (running for more than 15 minutes without activity)
        const isStuck = detectStuckSync(syncResponse.data);
        setIsStuckSyncDetected(isStuck);
        
        // Auto-cleanup stuck sync
        if (isStuck && syncResponse.data.status === 'running') {
          console.log('🔧 Auto-cleaning stuck sync...');
          await cleanupStuckSync();
          return; // Re-check status after cleanup
        }
        
        // Update with real car count for accurate progress display
        const realCarCount = cacheCountResponse.count || 0;
        const syncData = { 
          ...syncResponse.data,
          // Always show the actual cars in database as baseline progress
          records_processed: Math.max(syncResponse.data.records_processed || 0, realCarCount),
          // Add the real count for reference
          actual_cars_in_db: realCarCount
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
          usingRealCount: syncResponse.data.records_processed === 0 && realCarCount > 0,
          isStuck
        });
      }
    } catch (err) {
      console.error('Failed to check sync status:', err);
    }
  };

  const detectStuckSync = (sync: SyncStatus): boolean => {
    if (sync.status !== 'running') return false;
    
    const lastActivity = sync.last_activity_at ? new Date(sync.last_activity_at) : new Date(sync.started_at || 0);
    const timeSinceActivity = Date.now() - lastActivity.getTime();
    const STUCK_THRESHOLD = 10 * 60 * 1000; // 10 minutes (reduced from 15)
    
    return timeSinceActivity > STUCK_THRESHOLD;
  };

  const cleanupStuckSync = async () => {
    try {
      const { error } = await supabase
        .from('sync_status') 
        .update({
          status: 'failed',
          error_message: 'Auto-cleaned: Sync was stuck for more than 15 minutes',
          completed_at: new Date().toISOString()
        })
        .eq('id', 'cars-sync-main');
      
      if (error) throw error;
      
      toast({
        title: "Stuck Sync Cleaned Up",
        description: "The stuck sync has been automatically cleaned up. You can now start a new sync.",
      });
      
      // Re-check status
      setTimeout(checkSyncStatus, 1000);
    } catch (error) {
      console.error('Failed to cleanup stuck sync:', error);
    }
  };

  const updateProgressMessage = (status: SyncStatus) => {
    if (!status) return;
    
    const recordsProcessed = status.records_processed || 0;
    const actualCarsInDb = (status as any).actual_cars_in_db || recordsProcessed;
    const estimatedTotal = 200000; // Conservative estimate based on API
    
    // Use the higher of current sync progress or actual database count for accurate progress
    const displayProgress = Math.max(recordsProcessed, actualCarsInDb);
    const percentage = Math.round((displayProgress / estimatedTotal) * 100);
    
    const formattedRecords = displayProgress.toLocaleString();
    const formattedTotal = estimatedTotal.toLocaleString();
    
    // Show additional info if there's a discrepancy
    const progressNote = actualCarsInDb > recordsProcessed && status.status !== 'running' 
      ? ` (${actualCarsInDb.toLocaleString()} in database)`
      : '';
    
    // Calculate sync rate if we have timing info
    let rateText = '';
    if (status.error_message && status.error_message.includes('Rate:')) {
      const rateMatch = status.error_message.match(/Rate: (\d+) cars\/min/);
      if (rateMatch) {
        rateText = ` (${rateMatch[1]} cars/min)`;
      }
    }
    
    // Determine specific rate limit type and guidance
    let rateLimitDetails = '';
    if (status.error_message) {
      if (status.error_message.includes('API_RATE_LIMIT') || status.error_message.includes('HTTP 429')) {
        rateLimitDetails = ' - External API rate limiting (will auto-resume with longer delays)';
      } else if (status.error_message.includes('NETWORK_TIMEOUT')) {
        rateLimitDetails = ' - Network timeout/connection issues (will auto-retry)';
      } else if (status.error_message.includes('Database rate limit')) {
        rateLimitDetails = ' - Database rate limiting (internal throttling)';
      } else if (status.error_message.toLowerCase().includes('rate limit')) {
        rateLimitDetails = ' - Rate limiting detected (will auto-resume)';
      }
    }
    
    switch (status.status) {
      case 'running':
        setProgress(`🔄 Syncing${rateText}... ${formattedRecords} / ${formattedTotal} cars (${percentage}%)${progressNote}`);
        break;
      case 'completed':
        setProgress(`✅ Sync complete! ${formattedRecords} cars synced`);
        break;
      case 'failed':
        setProgress(`❌ Sync failed${progressNote}${rateLimitDetails}.`);
        break;
      case 'paused':
        setProgress(`⏸️ Sync paused at ${formattedRecords} cars. Click Resume to continue.`);
        break;
      case 'idle':
        setProgress(`💤 Ready to sync${progressNote}. ${formattedRecords} cars currently in database.`);
        break;
      default:
        setProgress(`Status: ${status.status} - ${formattedRecords} cars${progressNote}`);
    }
  };

  const startSmartSync = async () => {
    setIsLoading(true);
    setProgress('Initiating smart sync...');

    try {
      toast({
        title: "🚀 MAXIMUM SPEED SYNC STARTING!",
        description: "Bulletproof sync with 3x parallel processing and never-stop error handling!",
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
          title: "🚀 MAXIMUM SPEED SYNC LAUNCHED!",
          description: "Ultra-fast bulletproof sync running in background. Progress updates in real-time below.",
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
        description: "Smart resume with progress reconciliation...",
      });

      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: { 
          smartSync: true,
          resume: true,
          fromPage: syncStatus.current_page,
          reconcileProgress: true // Always reconcile to fix stuck syncs
        }
      });

      if (error) throw error;

      setIsLoading(true);
      setProgress('Resuming sync with smart recovery...');
    } catch (error) {
      console.error('Failed to resume sync:', error);
      toast({
        title: "Resume Failed",
        description: error.message || "Failed to resume sync.",
        variant: "destructive",
      });
    }
  };

  const forceStopSync = async () => {
    try {
      toast({
        title: "Force Stopping Sync",
        description: "Manually stopping the current sync...",
      });

      const { error } = await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          error_message: 'Manually stopped by admin',
          completed_at: new Date().toISOString()
        })
        .eq('id', 'cars-sync-main');

      if (error) throw error;

      setIsLoading(false);
      setIsStuckSyncDetected(false);
      
      toast({
        title: "Sync Stopped",
        description: "Sync has been manually stopped. You can start a new sync now.",
      });
      
      // Re-check status
      setTimeout(checkSyncStatus, 1000);
    } catch (error) {
      console.error('Failed to force stop sync:', error);
      toast({
        title: "Force Stop Failed",
        description: error.message || "Failed to force stop sync.",
        variant: "destructive",
      });
    }
  };

  const forceResetSync = async () => {
    try {
      toast({
        title: "Force Resetting Sync",
        description: "Completely resetting sync progress to start fresh...",
      });

      // Force reset the sync to start from page 1
      const { error } = await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          current_page: 1,
          records_processed: 0,
          error_message: 'Manually reset - restarting from beginning',
          completed_at: new Date().toISOString()
        })
        .eq('id', 'cars-sync-main');

      if (error) throw error;

      setIsLoading(false);
      setIsStuckSyncDetected(false);
      
      toast({
        title: "Sync Reset Complete",
        description: "Sync has been reset. You can now start a fresh sync from the beginning.",
      });
      
      // Re-check status
      setTimeout(checkSyncStatus, 1000);
    } catch (error) {
      console.error('Failed to force reset sync:', error);
      toast({
        title: "Force Reset Failed",
        description: error.message || "Failed to force reset sync.",
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

  const canStartSync = !isLoading && (!syncStatus || ['completed', 'failed', 'idle'].includes(syncStatus.status));
  const canResumeSync = syncStatus?.status === 'paused';
  const canForceStop = syncStatus?.status === 'running' && !isStuckSyncDetected && syncStatus.current_page > 0;
  const canForceReset = syncStatus?.status === 'running' && isStuckSyncDetected;

  const getProgressPercentage = () => {
    if (!syncStatus) return 0;
    const recordsProcessed = syncStatus.records_processed || 0;
    const actualCarsInDb = (syncStatus as any).actual_cars_in_db || recordsProcessed;
    const displayProgress = Math.max(recordsProcessed, actualCarsInDb);
    const estimatedTotal = 200000; // Conservative API estimate
    return Math.min(100, (displayProgress / estimatedTotal) * 100);
  };

  const getEstimatedTime = () => {
    if (!syncStatus || syncStatus.status !== 'running' || !syncStatus.records_processed) {
      return 'Calculating...';
    }
    
    // Extract rate from error_message if available
    let carsPerMinute = 0;
    if (syncStatus.error_message && syncStatus.error_message.includes('Rate:')) {
      const rateMatch = syncStatus.error_message.match(/Rate: (\d+) cars\/min/);
      if (rateMatch) {
        carsPerMinute = parseInt(rateMatch[1]);
      }
    }
    
    if (carsPerMinute === 0) {
      // Fallback calculation
      const startTime = new Date(syncStatus.started_at).getTime();
      const elapsed = Date.now() - startTime;
      carsPerMinute = Math.round((syncStatus.records_processed / elapsed) * 60000);
    }
    
    if (carsPerMinute <= 0) return 'Calculating...';
    
    const remaining = 200000 - syncStatus.records_processed;
    const minutesRemaining = Math.ceil(remaining / carsPerMinute);
    
    if (minutesRemaining <= 0) return 'Almost done...';
    
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = minutesRemaining % 60;
    
    if (hours > 0) {
      return `~${hours}h ${minutes}m remaining`;
    }
    return `~${minutes}m remaining`;
  };

  const getRateLimitInfo = () => {
    if (!syncStatus?.error_message) return null;
    
    const message = syncStatus.error_message;
    
    if (message.includes('API_RATE_LIMIT') || message.includes('HTTP 429')) {
      return {
        type: 'API Rate Limit',
        icon: '🌐',
        description: 'External API is throttling requests',
        action: 'System will automatically retry with exponential backoff delays',
        severity: 'warning'
      };
    } else if (message.includes('NETWORK_TIMEOUT')) {
      return {
        type: 'Network Timeout',
        icon: '📡',
        description: 'Connection timeout or network issues',
        action: 'System will automatically retry the failed requests',
        severity: 'warning'
      };
    } else if (message.includes('Database rate limit')) {
      return {
        type: 'Database Rate Limit',
        icon: '🗃️',
        description: 'Internal database rate limiting active',
        action: 'Wait for the rate limit window to reset',
        severity: 'info'
      };
    } else if (message.toLowerCase().includes('rate limit')) {
      return {
        type: 'Rate Limit',
        icon: '⏰',
        description: 'Generic rate limiting detected',
        action: 'System will automatically handle the rate limit',
        severity: 'info'
      };
    }
    
    return null;
  };

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
      
      <div className="text-sm text-muted-foreground">
        High-speed car sync system with automatic error recovery.
      </div>
        
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
            
            {/* Simple Progress Stats */}
            <div className="flex justify-between items-center text-sm bg-muted/50 p-3 rounded">
              <div>
                <span className="text-muted-foreground">Page:</span>
                <span className="ml-2 font-medium">{syncStatus.current_page?.toLocaleString() || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className={`ml-2 font-medium capitalize ${
                  isCompleted ? 'text-green-600' : 
                  isActive ? 'text-blue-600' : 
                  syncStatus.status === 'failed' ? 'text-red-600' : 
                  'text-yellow-600'
                }`}>
                  {syncStatus.status}
                  {isActive && <span className="ml-1 animate-pulse">●</span>}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">ETA:</span>
                <span className="ml-2 font-medium">{getEstimatedTime()}</span>
              </div>
            </div>
          </div>
          
        </div>
      )}
      
      {progress && (
        <div className="p-3 bg-muted rounded text-sm">
          <p>{progress}</p>
        </div>
      )}
      
      {/* Rate Limit Information */}
      {getRateLimitInfo() && (
        <div className={`p-4 rounded-lg border ${
          getRateLimitInfo()?.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
          getRateLimitInfo()?.severity === 'info' ? 'bg-blue-50 border-blue-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{getRateLimitInfo()?.icon}</span>
            <div className="flex-1">
              <h4 className={`font-semibold ${
                getRateLimitInfo()?.severity === 'warning' ? 'text-yellow-800' :
                getRateLimitInfo()?.severity === 'info' ? 'text-blue-800' :
                'text-gray-800'
              }`}>
                {getRateLimitInfo()?.type} Detected
              </h4>
              <p className={`text-sm mt-1 ${
                getRateLimitInfo()?.severity === 'warning' ? 'text-yellow-700' :
                getRateLimitInfo()?.severity === 'info' ? 'text-blue-700' :
                'text-gray-700'
              }`}>
                {getRateLimitInfo()?.description}
              </p>
              <p className={`text-sm mt-2 font-medium ${
                getRateLimitInfo()?.severity === 'warning' ? 'text-yellow-800' :
                getRateLimitInfo()?.severity === 'info' ? 'text-blue-800' :
                'text-gray-800'
              }`}>
                ✓ {getRateLimitInfo()?.action}
              </p>
            </div>
          </div>
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
            'Start Sync'
          )}
        </Button>
        
        {canResumeSync && (
          <Button 
            onClick={resumeSync}
            variant="outline"
            className="flex-1"
          >
            Resume Sync
          </Button>
        )}
        
        {canForceStop && (
          <Button 
            onClick={forceStopSync}
            variant="destructive"
            className="flex-1"
          >
            Force Stop
          </Button>
        )}
        
        {canForceReset && (
          <Button 
            onClick={forceResetSync}
            variant="destructive"
            className="flex-1"
          >
            Reset Stuck Sync
          </Button>
        )}
      </div>
      
      {isStuckSyncDetected && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="text-yellow-800">
            ⚠️ <strong>Stuck Sync Detected:</strong> The sync has been inactive for more than 10 minutes. 
            It may have timed out. Click "Reset Stuck Sync" to reset progress and start fresh.
          </p>
        </div>
      )}
      
    </div>
  );
};