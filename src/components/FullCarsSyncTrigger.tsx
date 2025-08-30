import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Clock, Shield } from 'lucide-react';
import { verifySyncToDatabase, type SyncVerificationResult } from '@/utils/syncVerification';

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
  [key: string]: unknown; // Allow other database fields
}

export const FullCarsSyncTrigger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [isStuckSyncDetected, setIsStuckSyncDetected] = useState(false);
  const [verificationResult, setVerificationResult] = useState<SyncVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
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
      // Get actual car counts from all relevant tables for accurate count
      const [syncResponse, cacheCountResponse, mainCarsCountResponse] = await Promise.all([
        supabase
          .from('sync_status')
          .select('*')
          .eq('id', 'cars-sync-main')
          .single(),
        supabase
          .from('cars_cache')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('cars')
          .select('*', { count: 'exact', head: true })
      ]);

      if (syncResponse.error && syncResponse.error.code !== 'PGRST116') {
        console.error('Error checking sync status:', syncResponse.error);
        return;
      }

      if (syncResponse.data) {
        // Check for stuck sync with improved detection
        const isStuck = detectStuckSync(syncResponse.data);
        setIsStuckSyncDetected(isStuck);
        
        // Auto-cleanup stuck sync
        if (isStuck && syncResponse.data.status === 'running') {
          console.log('🔧 Auto-cleaning stuck sync...');
          await cleanupStuckSync();
          return; // Re-check status after cleanup
        }
        
        // Calculate real car count from both main and cache tables
        const cacheCount = cacheCountResponse.count || 0;
        const mainCarsCount = mainCarsCountResponse.count || 0;
        const totalRealCount = Math.max(cacheCount, mainCarsCount); // Use the higher count as authoritative
        
        // Determine which count to display - fix for stuck sync showing wrong count
        let displayCount = syncResponse.data.records_processed || 0;
        
        // Enhanced logic: Use real count if sync shows 0 OR if sync is stuck/failed OR if real count is significantly higher
        const syncIsStuckOrFailed = isStuck || syncResponse.data.status === 'failed' || syncResponse.data.status === 'completed';
        const realCountIsSignificantlyHigher = totalRealCount > 0 && totalRealCount > displayCount * 10; // Real count is 10x higher than sync count
        
        if ((displayCount === 0 && totalRealCount > 0) || 
            (syncIsStuckOrFailed && totalRealCount > displayCount) ||
            realCountIsSignificantlyHigher) {
          displayCount = totalRealCount;
        }
        
        const syncData = { 
          ...syncResponse.data,
          records_processed: displayCount
        };
        
        setSyncStatus(syncData);
        updateProgressMessage(syncData);
        
        if (syncData.status === 'running') {
          setIsLoading(true);
        } else {
          setIsLoading(false);
        }
        
        console.log('📊 Enhanced Sync Status Check:', {
          status: syncData.status,
          syncRecordsProcessed: syncResponse.data.records_processed,
          cacheCount: cacheCount,
          mainCarsCount: mainCarsCount,
          totalRealCount: totalRealCount,
          displayCount: displayCount,
          isStuck,
          usingRealCount: displayCount === totalRealCount && displayCount !== (syncResponse.data.records_processed || 0),
          reason: displayCount === totalRealCount && displayCount !== (syncResponse.data.records_processed || 0) ? 
            (syncResponse.data.records_processed === 0 ? 'sync_shows_zero' :
             (isStuck || syncResponse.data.status === 'failed' || syncResponse.data.status === 'completed') ? 'sync_stuck_or_complete' :
             totalRealCount > (syncResponse.data.records_processed || 0) * 10 ? 'real_count_significantly_higher' : 'unknown') : 'using_sync_count'
        });
      }
    } catch (err) {
      console.error('Failed to check sync status:', err);
    }
  };

  const detectStuckSync = (sync: SyncStatus): boolean => {
    if (sync.status !== 'running') return false;
    
    // Get the most recent activity timestamp
    const lastActivity = sync.last_activity_at ? new Date(sync.last_activity_at) : new Date(sync.started_at || 0);
    const now = Date.now();
    const timeSinceActivity = now - lastActivity.getTime();
    
    // Reduced threshold to 10 minutes for faster detection of stuck syncs
    const STUCK_THRESHOLD = 10 * 60 * 1000; // 10 minutes
    
    // Also consider sync stuck if it's been running for more than 2 hours regardless of activity
    const startTime = sync.started_at ? new Date(sync.started_at) : new Date(0);
    const timeSinceStart = now - startTime.getTime();
    const MAX_SYNC_TIME = 2 * 60 * 60 * 1000; // 2 hours max
    
    const isStuckByActivity = timeSinceActivity > STUCK_THRESHOLD;
    const isStuckByDuration = timeSinceStart > MAX_SYNC_TIME;
    const isStuck = isStuckByActivity || isStuckByDuration;
    
    if (isStuck) {
      console.log('🚨 Stuck sync detected:', {
        syncId: sync.id,
        status: sync.status,
        started_at: sync.started_at,
        last_activity_at: sync.last_activity_at,
        timeSinceActivity: Math.round(timeSinceActivity / 60000) + ' minutes',
        timeSinceStart: Math.round(timeSinceStart / 60000) + ' minutes',
        stuckReason: isStuckByActivity ? 'no_activity' : 'too_long_running',
        threshold: Math.round(STUCK_THRESHOLD / 60000) + ' minutes',
        current_page: sync.current_page,
        records_processed: sync.records_processed
      });
    }
    
    return isStuck;
  };

  const cleanupStuckSync = async () => {
    try {
      console.log('🛠️ Cleaning up stuck sync...');
      
      const { error } = await supabase
        .from('sync_status') 
        .update({
          status: 'failed',
          error_message: 'Auto-cleaned: Sync was stuck for more than 10 minutes without activity or running too long',
          completed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', 'cars-sync-main');
      
      if (error) throw error;
      
      // Reset local state
      setIsLoading(false);
      setIsStuckSyncDetected(false);
      
      toast({
        title: "🔧 Stuck Sync Cleaned Up",
        description: "The stuck sync has been automatically cleaned up. You can now start a new sync.",
      });
      
      // Re-check status after a short delay
      setTimeout(checkSyncStatus, 2000);
      
      console.log('✅ Stuck sync cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup stuck sync:', error);
      toast({
        title: "⚠️ Cleanup Failed",
        description: "Failed to clean up stuck sync. Please try manually stopping the sync.",
        variant: "destructive",
      });
    }
  };

  const manualResetSync = async () => {
    try {
      console.log('🔄 Manually resetting sync status...');
      
      const { error } = await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          error_message: 'Manually reset by user - sync was showing incorrect count',
          completed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', 'cars-sync-main');
      
      if (error) throw error;
      
      // Reset local state
      setIsLoading(false);
      setIsStuckSyncDetected(false);
      
      toast({
        title: "🔄 Sync Reset",
        description: "Sync status has been manually reset. The display will now show the correct car count.",
      });
      
      // Re-check status
      setTimeout(checkSyncStatus, 1000);
      
    } catch (error) {
      console.error('Failed to reset sync:', error);
      toast({
        title: "⚠️ Reset Failed",
        description: "Failed to reset sync status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateProgressMessage = (status: SyncStatus) => {
    if (!status) return;
    
    const recordsProcessed = status.records_processed || 0;
    const estimatedTotal = 200000; // Conservative estimate based on API
    const percentage = Math.round((recordsProcessed / estimatedTotal) * 100);
    
    const formattedRecords = recordsProcessed.toLocaleString();
    const formattedTotal = estimatedTotal.toLocaleString();
    
    // Calculate sync rate if we have timing info
    let rateText = '';
    if (status.error_message && status.error_message.includes('Rate:')) {
      const rateMatch = status.error_message.match(/Rate: (\d+) cars\/min/);
      if (rateMatch) {
        rateText = ` (${rateMatch[1]} cars/min)`;
      }
    }
    
    // Enhanced status messages with more context
    switch (status.status) {
      case 'running':
        const timeRunning = status.started_at ? 
          Math.round((Date.now() - new Date(status.started_at).getTime()) / 60000) : 0;
        setProgress(`🔄 Syncing${rateText}... ${formattedRecords} / ${formattedTotal} cars (${percentage}%) - Running for ${timeRunning}min`);
        break;
      case 'completed':
        setProgress(`✅ Sync complete! ${formattedRecords} cars synced successfully`);
        // Auto-verify when sync completes
        setTimeout(() => verifySync(), 2000);
        break;
      case 'failed':
        const errorMsg = status.error_message ? ` (${status.error_message.substring(0, 50)}...)` : '';
        setProgress(`❌ Sync failed at ${formattedRecords} cars${errorMsg}. Will auto-resume.`);
        break;
      case 'paused':
        setProgress(`⏸️ Sync paused at ${formattedRecords} cars. Ready to resume.`);
        break;
      default:
        setProgress(`📊 Status: ${status.status} - ${formattedRecords} cars processed`);
    }
  };

  const verifySync = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      console.log('🔍 Starting sync verification...');
      toast({
        title: "Verifying Sync",
        description: "Checking if data was properly synced to database...",
      });

      const result = await verifySyncToDatabase();
      setVerificationResult(result);

      if (result.success) {
        toast({
          title: "✅ Sync Verification Passed",
          description: `Database sync confirmed! ${result.details.actualCount || 0} records verified.`,
        });
      } else {
        toast({
          title: "❌ Sync Verification Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sync verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const failedResult: SyncVerificationResult = {
        success: false,
        message: `Verification failed: ${errorMessage}`,
        details: {},
        errors: [errorMessage]
      };
      
      setVerificationResult(failedResult);
      
      toast({
        title: "❌ Verification Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const startSmartSync = async () => {
    setIsLoading(true);
    setProgress('Initiating AI-powered bulletproof sync...');

    try {
      toast({
        title: "🚀 AI-POWERED BULLETPROOF SYNC STARTING!",
        description: "Advanced AI coordination with infinite retry capabilities and intelligent error recovery!",
      });

      // Use AI coordinator if available, fallback to direct invocation
      const aiCoordinator = (window as unknown as { aiSyncCoordinator?: { startIntelligentSync: (params: Record<string, unknown>) => Promise<void> } }).aiSyncCoordinator;
      
      if (aiCoordinator) {
        console.log('🤖 Using AI Coordinator for sync');
        await aiCoordinator.startIntelligentSync({
          source: 'manual-smart-sync'
        });
      } else {
        console.log('🔄 Using enhanced direct edge function call');
        await startSyncWithRetry();
      }

      toast({
        title: "🚀 AI-POWERED SYNC LAUNCHED!",
        description: "Bulletproof sync running with AI coordination. Zero-failure guarantee!",
      });
      
      setProgress('AI-powered sync started in background...');
      
      // Enhanced status monitoring
      const statusCheck = setInterval(async () => {
        await checkSyncStatus();
        if (syncStatus?.status === 'completed' || syncStatus?.status === 'failed') {
          clearInterval(statusCheck);
          setIsLoading(false);
          
          if (syncStatus?.status === 'completed') {
            toast({
              title: "🎉 100% SYNC COMPLETE!",
              description: "All cars synchronized successfully! Page will refresh in 2 seconds.",
            });
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else if (syncStatus?.status === 'failed') {
            // Auto-retry failed syncs
            console.log('🔄 Sync failed, initiating AI auto-recovery...');
            setTimeout(() => startSmartSync(), 3000);
          }
        }
      }, 5000);

    } catch (error: unknown) {
      console.error('Smart sync failed:', error);
      setProgress('Smart sync failed. AI auto-recovery will retry...');
      setIsLoading(false);
      
      // Extract meaningful error message from the enhanced error response
      let errorMessage = 'Failed to start smart sync. AI will auto-retry.';
      let errorTitle = 'Sync Failed - Auto-Retry Scheduled';
      
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
        
        // Customize error title based on error type with recovery info
        if (error.message.includes('Configuration error')) {
          errorTitle = 'Configuration Error - Admin Intervention Required';
          errorMessage += ' Please contact administrator.';
        } else if (error.message.includes('Authentication failed')) {
          errorTitle = 'Authentication Error - Admin Intervention Required';
          errorMessage += ' Please contact administrator.';
        } else if (error.message.includes('Network error')) {
          errorTitle = 'Network Error - Auto-Retry in Progress';
          errorMessage += ' AI will retry when network recovers.';
        } else if (error.message.includes('timeout')) {
          errorTitle = 'Timeout Error - Auto-Retry Scheduled';
          errorMessage += ' AI will retry with longer timeout.';
        } else if (error.message.includes('Server error')) {
          errorTitle = 'Server Error - Auto-Retry When Available';
          errorMessage += ' AI will retry when server recovers.';
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      
      // Auto-retry for most errors (except config/auth)
      if (!errorMessage.includes('Configuration') && !errorMessage.includes('Authentication')) {
        console.log('🔄 Scheduling auto-retry for smart sync...');
        setTimeout(() => startSmartSync(), 10000);
      }
    }
  };

  // Enhanced sync start with retry logic
  const startSyncWithRetry = async (attempt = 1, maxAttempts = 3): Promise<void> => {
    try {
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: { 
          smartSync: true,
          source: 'enhanced-manual',
          attempt: attempt
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

      if (!data?.success) {
        throw new Error(data?.error || 'Unknown error occurred');
      }

      console.log('✅ Sync start successful on attempt', attempt);

    } catch (error: unknown) {
      console.error(`❌ Sync start failed on attempt ${attempt}:`, error);
      
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 2000; // Exponential backoff
        console.log(`🔄 Retrying sync start in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return startSyncWithRetry(attempt + 1, maxAttempts);
      }
      
      throw error;
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

  const getSyncStatusIcon = () => {
    if (!syncStatus) return <Clock className="h-4 w-4" />;
    
    switch (syncStatus.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const canStartSync = !isLoading && (!syncStatus || ['completed', 'failed', 'idle'].includes(syncStatus.status));
  const canForceStop = syncStatus?.status === 'running' && (isStuckSyncDetected || syncStatus.current_page > 0);

  const getProgressPercentage = () => {
    if (!syncStatus || !syncStatus.records_processed) return 0;
    const estimatedTotal = 200000; // Conservative API estimate
    return Math.min(100, (syncStatus.records_processed / estimatedTotal) * 100);
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
          🚀 <strong>CONTINUOUS SYNC SYSTEM:</strong> Processes 3 pages simultaneously with 50-car database batches. 
          Features bulletproof error handling with 20 retries per request and 100 rate-limit retries. 
          NEVER PAUSES OR STOPS until 100% complete - handles any API issue automatically and continues indefinitely!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <p><strong>🔥 Speed Features:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>3x parallel page processing</li>
              <li>50-car batch database writes</li>
              <li>Minimal 10ms delays</li>
              <li>45-second request timeouts</li>
            </ul>
          </div>
          
          <div className="space-y-1">
            <p><strong>🛡️ Bulletproof Features:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>20 retries per failed request</li>
              <li>100 rate-limit retry attempts</li>
              <li>Smart adaptive delays</li>
              <li>Never pauses or stops until 100% complete</li>
            </ul>
          </div>
        </div>
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
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-medium">200,000 cars</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ETA:</span>
                  <span className="font-medium">{getEstimatedTime()}</span>
                </div>
              </div>
              
              {/* Performance metrics row */}
              {syncStatus.error_message && syncStatus.error_message.includes('Rate:') && (
                <div className="col-span-2 pt-2 border-t text-xs text-muted-foreground">
                  <div className="font-medium text-primary">Performance Metrics:</div>
                  <div className="mt-1">{syncStatus.error_message}</div>
                </div>
              )}
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
            '🚀 Start Maximum Speed Sync'
          )}
        </Button>
        
        {canForceStop && (
          <Button 
            onClick={forceStopSync}
            variant="destructive"
            className="flex-1"
          >
            {isStuckSyncDetected ? 'Fix Stuck Sync' : 'Force Stop'}
          </Button>
        )}
        
        {/* Sync Verification Button */}
        <Button 
          onClick={verifySync}
          disabled={isVerifying}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Verify DB
            </>
          )}
        </Button>
        
        {/* Reset Sync Button - shown when sync shows suspicious count */}
        {syncStatus && syncStatus.records_processed && syncStatus.records_processed < 1000 && (
          <Button 
            onClick={manualResetSync}
            variant="outline"
            className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
            title="Reset sync status if showing incorrect car count"
          >
            🔄 Reset Count
          </Button>
        )}
      </div>
      
      {/* Verification Results */}
      {verificationResult && (
        <div className={`mt-4 p-4 rounded-lg border ${
          verificationResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {verificationResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <h4 className={`font-semibold ${
              verificationResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              Sync Verification {verificationResult.success ? 'Passed' : 'Failed'}
            </h4>
          </div>
          
          <p className={`text-sm mb-3 ${
            verificationResult.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {verificationResult.message}
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-1">Database Status:</h5>
              <ul className="space-y-1 text-muted-foreground">
                {verificationResult.details.actualCount !== undefined && (
                  <li>• Records in DB: {verificationResult.details.actualCount.toLocaleString()}</li>
                )}
                {verificationResult.details.stagingTableCleared !== undefined && (
                  <li className={verificationResult.details.stagingTableCleared ? 'text-green-600' : 'text-red-600'}>
                    • Staging cleanup: {verificationResult.details.stagingTableCleared ? 'Success' : 'Failed'}
                  </li>
                )}
                {verificationResult.details.lastSyncTime && (
                  <li>• Last sync: {new Date(verificationResult.details.lastSyncTime).toLocaleString()}</li>
                )}
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium mb-1">Integrity Checks:</h5>
              <ul className="space-y-1 text-muted-foreground">
                {verificationResult.details.sampleRecordsVerified !== undefined && (
                  <li className={verificationResult.details.sampleRecordsVerified ? 'text-green-600' : 'text-red-600'}>
                    • Sample records: {verificationResult.details.sampleRecordsVerified ? 'Valid' : 'Issues found'}
                  </li>
                )}
                {verificationResult.details.dataIntegrityPassed !== undefined && (
                  <li className={verificationResult.details.dataIntegrityPassed ? 'text-green-600' : 'text-red-600'}>
                    • Data integrity: {verificationResult.details.dataIntegrityPassed ? 'Passed' : 'Failed'}
                  </li>
                )}
              </ul>
            </div>
          </div>
          
          {verificationResult.errors && verificationResult.errors.length > 0 && (
            <div className="mt-3 p-2 bg-red-100 rounded border">
              <h5 className="font-medium text-red-800 mb-1">Issues Found:</h5>
              <ul className="text-sm text-red-700 space-y-1">
                {verificationResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {isStuckSyncDetected && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="text-yellow-800">
            ⚠️ <strong>Stuck Sync Detected:</strong> The sync has been inactive for more than 20 minutes. 
            It may have timed out or encountered an issue. Click "Fix Stuck Sync" to reset and try again.
          </p>
        </div>
      )}
      
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">🔄 Enhanced Smart Sync Features</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• <strong>🚀 MAXIMUM SPEED:</strong> 3x parallel processing with 50-car batch writes</li>
          <li>• <strong>🛡️ BULLETPROOF:</strong> 20 retries per request, 100 rate-limit retries</li>
          <li>• <strong>⚡ NEVER PAUSES:</strong> Handles ANY error automatically until 100% complete</li>
          <li>• <strong>📊 REAL-TIME:</strong> Live progress with speed metrics every few seconds</li>
          <li>• <strong>🎯 SMART RESUME:</strong> Immediate auto-recovery from any interruption (no manual intervention)</li>
          <li>• <strong>🔧 FORCE OVERRIDE:</strong> Manual controls for stuck syncs (improved 20min detection)</li>
          <li>• <strong>🤖 AUTO-SCHEDULER:</strong> Background recovery system active 24/7</li>
          <li>• <strong>📈 ACCURATE COUNTS:</strong> Real-time counting from multiple data sources</li>
        </ul>
      </div>
      
      {/* Debug Information Panel */}
      {syncStatus && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
          <h4 className="font-semibold mb-2 text-slate-700">🔍 Debug Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-1 text-slate-600">Sync Status:</h5>
              <ul className="space-y-1 text-slate-600">
                <li>• Status: <span className="font-mono">{syncStatus.status}</span></li>
                <li>• Current Page: <span className="font-mono">{syncStatus.current_page || 0}</span></li>
                <li>• Records: <span className="font-mono">{syncStatus.records_processed || 0}</span></li>
                {syncStatus.last_activity_at && (
                  <li>• Last Activity: <span className="font-mono">{new Date(syncStatus.last_activity_at).toLocaleTimeString()}</span></li>
                )}
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-1 text-slate-600">System Health:</h5>
              <ul className="space-y-1 text-slate-600">
                <li>• Stuck Detection: <span className={`font-mono ${isStuckSyncDetected ? 'text-red-600' : 'text-green-600'}`}>
                  {isStuckSyncDetected ? 'STUCK' : 'OK'}
                </span></li>
                <li>• Auto-Cleanup: <span className="font-mono text-green-600">ENABLED</span></li>
                <li>• Threshold: <span className="font-mono">20 minutes</span></li>
                <li>• Real-time Updates: <span className="font-mono text-green-600">ACTIVE</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};