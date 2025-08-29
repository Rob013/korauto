import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AutoResumeSchedulerProps {
  enabled?: boolean;
  checkIntervalMinutes?: number;
}

export const AutoResumeScheduler = ({ 
  enabled = true, 
  checkIntervalMinutes = 30 
}: AutoResumeSchedulerProps = {}) => {
  
  useEffect(() => {
    if (!enabled) return;

    const checkAndResumeStuckSyncs = async () => {
      try {
        console.log('🔍 Auto-resume: Checking for failed syncs to resume...');
        
        // Check for failed syncs that should be resumed
        const { data: failedSyncs } = await supabase
          .from('sync_status')
          .select('*')
          .eq('status', 'failed')
          .gt('records_processed', 0) // Only resume syncs that had made progress
          .order('completed_at', { ascending: false })
          .limit(1);

        if (failedSyncs && failedSyncs.length > 0) {
          const lastFailedSync = failedSyncs[0];
          const timeSinceFailure = Date.now() - new Date(lastFailedSync.completed_at).getTime();
          const RESUME_DELAY = 10 * 60 * 1000; // Wait 10 minutes before resuming
          
          if (timeSinceFailure > RESUME_DELAY) {
            console.log(`🔄 Auto-resume: Attempting to resume sync from page ${lastFailedSync.current_page}...`);
            
            // Attempt to resume the sync
            const { data, error } = await supabase.functions.invoke('cars-sync', {
              body: { 
                smartSync: true,
                resume: true,
                fromPage: lastFailedSync.current_page,
                reconcileProgress: true,
                source: 'auto-resume'
              }
            });

            if (error) {
              console.error('❌ Auto-resume failed:', error);
            } else {
              console.log('✅ Auto-resume: Successfully triggered sync resume');
            }
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
    
    console.log(`🤖 Auto-resume scheduler started (checking every ${checkIntervalMinutes} minutes)`);
    
    return () => {
      clearInterval(interval);
      console.log('🛑 Auto-resume scheduler stopped');
    };
  }, [enabled, checkIntervalMinutes]);

  // This component doesn't render anything
  return null;
};