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
  // Enhanced intelligent sync fields
  auto_fix_count?: number;
  network_error_count?: number;
  api_error_count?: number;
  validation_error_count?: number;
  success_rate?: number;
  throughput_cars_per_min?: number;
  last_error_type?: string;
  intelligence_level?: string;
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
    const STUCK_THRESHOLD = 15 * 60 * 1000; // 15 minutes
    
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
    const estimatedTotal = 200000; // Conservative estimate based on API
    const percentage = Math.round((recordsProcessed / estimatedTotal) * 100);
    
    const formattedRecords = recordsProcessed.toLocaleString();
    const formattedTotal = estimatedTotal.toLocaleString();
    
    // Enhanced progress with intelligent metrics
    let rateText = '';
    let intelligentInfo = '';
    
    if (status.throughput_cars_per_min) {
      rateText = ` (${Math.round(status.throughput_cars_per_min)} cars/min)`;
    } else if (status.error_message && status.error_message.includes('Rate:')) {
      const rateMatch = status.error_message.match(/Rate: (\d+) cars\/min/);
      if (rateMatch) {
        rateText = ` (${rateMatch[1]} cars/min)`;
      }
    }
    
    // Add intelligent sync information
    if (status.auto_fix_count && status.auto_fix_count > 0) {
      intelligentInfo += ` 🔧 ${status.auto_fix_count} auto-fixes`;
    }
    if (status.success_rate && status.success_rate < 100) {
      intelligentInfo += ` 📊 ${status.success_rate.toFixed(1)}% success`;
    }
    if (status.intelligence_level === 'enhanced') {
      intelligentInfo += ' 🧠 AI Enhanced';
    }
    
    switch (status.status) {
      case 'running':
        setProgress(`🔄 Intelligent Sync${rateText}${intelligentInfo}... ${formattedRecords} / ${formattedTotal} cars (${percentage}%)`);
        break;
      case 'completed':
        setProgress(`✅ Intelligent sync complete!${intelligentInfo} ${formattedRecords} cars synced`);
        break;
      case 'failed':
        setProgress(`❌ Sync failed${intelligentInfo} at ${formattedRecords} cars. Auto-recovery active.`);
        break;
      case 'paused':
        setProgress(`⏸️ Sync paused${intelligentInfo} at ${formattedRecords} cars. Click Resume to continue.`);
        break;
      default:
        setProgress(`Status: ${status.status}${intelligentInfo} - ${formattedRecords} cars`);
    }
  };

  const startSmartSync = async () => {
    setIsLoading(true);
    setProgress('Initiating intelligent sync...');

    try {
      toast({
        title: "🚀 SUPABASE PRO INTELLIGENT SYNC STARTING!",
        description: "Maximum throughput with smart error handling and auto-fixing capabilities!",
      });

      // Call the enhanced smart cars-sync edge function
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: { 
          smartSync: true,
          intelligentMode: true,
          source: 'manual_intelligent'
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
          title: "🚀 SUPABASE PRO INTELLIGENT SYNC LAUNCHED!",
          description: "Maximum throughput sync with AI-powered error handling running in background. Real-time analytics below.",
        });
        
        setProgress('Intelligent sync started with enhanced capabilities...');
        
        // Check status periodically for immediate feedback
        const statusCheck = setInterval(async () => {
          await checkSyncStatus();
          if (syncStatus?.status === 'completed' || syncStatus?.status === 'failed') {
            clearInterval(statusCheck);
            setIsLoading(false);
            
            if (syncStatus?.status === 'completed') {
              toast({
                title: "✅ Intelligent Sync Complete!",
                description: `Successfully synced with ${syncStatus.auto_fix_count || 0} auto-fixes applied.`,
              });
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
      console.error('Intelligent sync failed:', error);
      setProgress('Intelligent sync failed. Auto-recovery may be active.');
      setIsLoading(false);
      
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to start intelligent sync. Auto-recovery system will retry.",
        variant: "destructive",
      });
    }
  };

  const resumeSync = async () => {
    if (!syncStatus || syncStatus.status !== 'paused') return;
    
    try {
      toast({
        title: "Resuming Intelligent Sync", 
        description: "Smart resume with progress reconciliation and enhanced error handling...",
      });

      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: { 
          smartSync: true,
          intelligentMode: true,
          resume: true,
          fromPage: syncStatus.current_page,
          reconcileProgress: true
        }
      });

      if (error) throw error;

      setIsLoading(true);
      setProgress('Resuming intelligent sync with smart recovery...');
    } catch (error) {
      console.error('Failed to resume intelligent sync:', error);
      toast({
        title: "Resume Failed",
        description: error.message || "Failed to resume intelligent sync.",
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
          🚀 <strong>MAXIMUM SPEED SYNC SYSTEM:</strong> Processes 3 pages simultaneously with 50-car database batches. 
          Features bulletproof error handling with 20 retries per request and 100 rate-limit retries. 
          NEVER STOPS until complete - handles any API issue automatically!
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
              <li>Never stops until 100% complete</li>
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
            '🚀 Start Intelligent Sync (Supabase Pro)'
          )}
        </Button>
        
        {canResumeSync && (
          <Button 
            onClick={resumeSync}
            variant="outline"
            className="flex-1"
          >
            Resume Intelligent Sync
          </Button>
        )}
        
        {canForceStop && (
          <Button 
            onClick={forceStopSync}
            variant="destructive"
            className="flex-1"
          >
            {isStuckSyncDetected ? 'Fix Stuck Sync' : 'Force Stop'}
          </Button>
        )}
      </div>
      
      {isStuckSyncDetected && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="text-yellow-800">
            ⚠️ <strong>Stuck Sync Detected:</strong> The sync has been inactive for more than 15 minutes. 
            It may have timed out. Click "Fix Stuck Sync" to reset and try again.
          </p>
        </div>
      )}
      
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">🧠 Supabase Pro Intelligent Sync Features</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• <strong>⚡ SUPABASE PRO:</strong> 16x parallel processing with 200-car batch writes</li>
          <li>• <strong>🧠 INTELLIGENT ERRORS:</strong> AI-powered error analysis with auto-fixing</li>
          <li>• <strong>🔧 AUTO-FIX:</strong> Automatically resolves network, API & validation errors</li>
          <li>• <strong>🛡️ BULLETPROOF:</strong> 500 retries per request, 2000 rate-limit retries</li>
          <li>• <strong>📊 ANALYTICS:</strong> Real-time success rates and throughput monitoring</li>
          <li>• <strong>🎯 SMART RESUME:</strong> Intelligent recovery with progress reconciliation</li>
          <li>• <strong>🔧 ENHANCED OVERRIDE:</strong> Manual controls with stuck sync detection</li>
          <li>• <strong>🤖 AUTO-SCHEDULER:</strong> 4-hour intelligent sync + hourly recovery checks</li>
          <li>• <strong>📈 PERFORMANCE:</strong> Adaptive pacing based on error patterns</li>
        </ul>
      </div>
    </div>
  );
};