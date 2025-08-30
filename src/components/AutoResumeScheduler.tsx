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
        console.log('🔍 Enhanced Auto-resume: Checking for failed syncs with immediate AI coordination...');
        
        // Check for failed syncs that should be resumed immediately (no delays)
        const { data: failedSyncs } = await supabase
          .from('sync_status')
          .select('*')
          .in('status', ['failed']) // Remove 'paused' since we no longer pause
          .gte('records_processed', 0) // Resume any sync regardless of progress
          .order('last_activity_at', { ascending: false })
          .limit(1);

        if (failedSyncs && failedSyncs.length > 0) {
          const lastFailedSync = failedSyncs[0];
          const timeSinceFailure = Date.now() - new Date(lastFailedSync.completed_at || lastFailedSync.last_activity_at).getTime();
          const RESUME_DELAY = 10 * 1000; // Wait only 10 seconds before resuming for immediate continuity
          
          if (timeSinceFailure > RESUME_DELAY) {
            console.log(`🔄 Enhanced Auto-resume: Attempting immediate resume of sync from page ${lastFailedSync.current_page} with AI coordination...`);
            
            // Use AI coordinator if available, fallback to direct call
            const aiCoordinator = (window as unknown as { aiSyncCoordinator?: { startIntelligentSync: (params: Record<string, unknown>) => Promise<void> } }).aiSyncCoordinator;
            
            if (aiCoordinator) {
              console.log('🤖 Using AI Coordinator for auto-resume');
              try {
                await aiCoordinator.startIntelligentSync({
                  resume: true,
                  fromPage: lastFailedSync.current_page,
                  reconcileProgress: true,
                  source: 'immediate-auto-resume'
                });
                console.log('✅ Enhanced Auto-resume: Successfully triggered immediate AI-coordinated sync resume');
              } catch (error) {
                console.error('❌ Enhanced Auto-resume: AI coordinator failed, falling back to direct call:', error);
                await fallbackResumeAttempt(lastFailedSync);
              }
            } else {
              console.log('🔄 AI Coordinator not available, using immediate direct resume');
              await fallbackResumeAttempt(lastFailedSync);
            }
          }
        }
        
        // Remove legacy pause cleanup since we no longer pause
        // All syncs now run continuously until completion
        
        // Check for running syncs that might be stuck (no activity for 5 minutes)
        const { data: runningSyncs } = await supabase
          .from('sync_status')
          .select('*')
          .eq('status', 'running')
          .lt('last_activity_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Reduced from 10 to 5 minutes

        if (runningSyncs && runningSyncs.length > 0) {
          for (const stuckSync of runningSyncs) {
            console.log(`🚨 Enhanced Auto-resume: Detected stuck running sync ${stuckSync.id}, marking as failed for immediate auto-resume...`);
            
            await supabase
              .from('sync_status')
              .update({
                status: 'failed',
                error_message: 'Auto-detected: Sync was stuck with no activity for 5+ minutes - will auto-resume immediately',
                completed_at: new Date().toISOString()
              })
              .eq('id', stuckSync.id);
          }
        }
        
      } catch (error) {
        console.error('❌ Enhanced Auto-resume scheduler error:', error);
      }
    };

    // Enhanced fallback resume attempt with retry logic
    const fallbackResumeAttempt = async (failedSync: Record<string, unknown>, attempt = 1, maxAttempts = 3) => {
      try {
        console.log(`🔄 Fallback resume attempt ${attempt}/${maxAttempts} for sync ${failedSync.id}`);
        
        const { data, error } = await supabase.functions.invoke('cars-sync', {
          body: { 
            smartSync: true,
            resume: true,
            fromPage: failedSync.current_page,
            reconcileProgress: true,
            source: 'immediate-auto-resume-fallback',
            attempt: attempt
          }
        });

        if (error) {
          throw error;
        }

        console.log('✅ Enhanced Auto-resume: Successfully triggered immediate fallback sync resume');
      } catch (error: unknown) {
        console.error(`❌ Enhanced Auto-resume: Fallback attempt ${attempt} failed:`, error);
        
        if (attempt < maxAttempts) {
          const delay = Math.pow(2, attempt) * 1000; // Reduced delay for faster resumption
          console.log(`🔄 Retrying immediate resume in ${delay}ms...`);
          setTimeout(() => fallbackResumeAttempt(failedSync, attempt + 1, maxAttempts), delay);
        } else {
          console.error('💥 Enhanced Auto-resume: All immediate resume attempts failed');
        }
      }
    };

    // Run immediately
    checkAndResumeStuckSyncs();
    
    // Set up interval with more frequent checks
    const interval = setInterval(checkAndResumeStuckSyncs, checkIntervalMinutes * 60 * 1000);
    
    console.log(`🤖 Enhanced Auto-resume scheduler started (checking every ${checkIntervalMinutes} minute with immediate AI coordination)`);
    
    return () => {
      clearInterval(interval);
      console.log('🛑 Enhanced Auto-resume scheduler stopped');
    };
  }, [enabled, checkIntervalMinutes]);

  // This component doesn't render anything
  return null;
};