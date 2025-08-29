import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AutoResumeSchedulerProps {
  enabled?: boolean;
  checkIntervalMinutes?: number;
}

export const AutoResumeScheduler = ({ 
  enabled = true, 
  checkIntervalMinutes = 1 // Check every minute for fastest recovery
}: AutoResumeSchedulerProps = {}) => {
  
  useEffect(() => {
    if (!enabled) return;

    const checkAndResumeStuckSyncs = async () => {
      try {
        console.log('🔍 Smart Auto-resume: Checking for failed syncs with intelligent retry logic...');
        
        // Check for failed syncs that should be resumed
        const { data: failedSyncs } = await supabase
          .from('sync_status')
          .select('*')
          .in('status', ['failed', 'paused'])
          .gte('records_processed', 0)
          .order('last_activity_at', { ascending: false })
          .limit(1);

        if (failedSyncs && failedSyncs.length > 0) {
          const lastFailedSync = failedSyncs[0];
          const timeSinceFailure = Date.now() - new Date(lastFailedSync.completed_at || lastFailedSync.last_activity_at).getTime();
          
          // Check if this is a database timeout or rate limit issue
          const isDatabaseTimeout = lastFailedSync.error_message?.includes('canceling statement due to statement timeout') ||
                                   lastFailedSync.error_message?.includes('520:') ||
                                   lastFailedSync.error_message?.includes('Sync timeout');
          
          // Get retry count from error message or default to 0
          const retryCount = (lastFailedSync.error_message?.match(/Retry (\d+)/) || [null, 0])[1];
          const currentRetryCount = parseInt(retryCount as string) || 0;
          
          // Progressive delay: 5min, 15min, 30min, 1hr, then stop
          let requiredDelay = 5 * 60 * 1000; // 5 minutes base
          if (currentRetryCount >= 1) requiredDelay = 15 * 60 * 1000; // 15 minutes after 1st retry
          if (currentRetryCount >= 2) requiredDelay = 30 * 60 * 1000; // 30 minutes after 2nd retry
          if (currentRetryCount >= 3) requiredDelay = 60 * 60 * 1000; // 1 hour after 3rd retry
          if (currentRetryCount >= 4) {
            console.log('🛑 Auto-resume: Sync failed too many times, stopping auto-resume to prevent endless loops');
            return;
          }
          
          // For database timeouts, wait longer
          if (isDatabaseTimeout) {
            requiredDelay = Math.max(requiredDelay, 10 * 60 * 1000); // At least 10 minutes for DB issues
          }
          
          if (timeSinceFailure > requiredDelay) {
            console.log(`🔄 Smart Auto-resume: Attempting to resume sync (retry ${currentRetryCount + 1}/4) after ${Math.round(timeSinceFailure / 60000)} minutes...`);
            
            // Attempt to resume the sync with retry tracking
            const { data, error } = await supabase.functions.invoke('cars-sync', {
              body: { 
                smartSync: true,
                resume: true,
                fromPage: lastFailedSync.current_page,
                reconcileProgress: true,
                source: `smart-auto-resume-retry-${currentRetryCount + 1}`,
                retryCount: currentRetryCount + 1
              }
            });

            if (error) {
              console.error('❌ Smart Auto-resume failed:', error);
            } else {
              console.log('✅ Smart Auto-resume: Successfully triggered sync resume with intelligent retry logic');
            }
          } else {
            const waitMinutes = Math.round((requiredDelay - timeSinceFailure) / 60000);
            console.log(`⏳ Smart Auto-resume: Waiting ${waitMinutes} more minutes before retry ${currentRetryCount + 1}/4`);
          }
        }
        
        // Also check for paused syncs older than 1 hour and mark them as failed
        const { data: pausedSyncs } = await supabase
          .from('sync_status')
          .select('*')
          .eq('status', 'paused')
          .lt('last_activity_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

        if (pausedSyncs && pausedSyncs.length > 0) {
          for (const pausedSync of pausedSyncs) {
            console.log(`🧹 Auto-resume: Cleaning up old paused sync ${pausedSync.id}...`);
            
            await supabase
              .from('sync_status')
              .update({
                status: 'failed',
                error_message: 'Auto-cleaned: Paused sync was inactive for more than 1 hour',
                completed_at: new Date().toISOString()
              })
              .eq('id', pausedSync.id);
          }
        }
        
      } catch (error) {
        console.error('❌ Auto-resume scheduler error:', error);
      }
    };

    // Run immediately
    checkAndResumeStuckSyncs();
    
    // Set up interval
    const interval = setInterval(checkAndResumeStuckSyncs, checkIntervalMinutes * 60 * 1000);
    
    console.log(`🤖 ULTRA-FAST Auto-resume scheduler started (checking every ${checkIntervalMinutes} minute for maximum recovery speed)`);
    
    return () => {
      clearInterval(interval);
      console.log('🛑 ULTRA-FAST Auto-resume scheduler stopped');
    };
  }, [enabled, checkIntervalMinutes]);

  // This component doesn't render anything
  return null;
};