import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AutoResumeSchedulerProps {
  enabled?: boolean;
  checkIntervalMinutes?: number;
}

export const AutoResumeScheduler = ({ 
  enabled = true, 
  checkIntervalMinutes = 0.5 // Check every 30 seconds for MAXIMUM SPEED recovery
}: AutoResumeSchedulerProps = {}) => {
  
  useEffect(() => {
    if (!enabled) return;

    const checkAndResumeStuckSyncs = async () => {
      try {
        console.log('🔍 Enhanced Auto-resume: Checking for failed syncs with smart retry logic...');
        
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
          const RESUME_DELAY = 30 * 1000; // Wait 30 seconds for normal issues
          
          // Check if this sync has failed too many times recently (prevent infinite loops)
          const recentFailureThreshold = 10 * 60 * 1000; // 10 minutes
          const failureCount = (lastFailedSync.error_message || '').includes('Auto-detected') ? 
            ((lastFailedSync.error_message || '').match(/attempt/g) || []).length : 0;
          
          // Check for different types of failures that should prevent auto-resume
          const isDeploymentFailure = (lastFailedSync.error_message || '').includes('Edge Function not accessible') ||
                                     (lastFailedSync.error_message || '').includes('Failed to send') ||
                                     (lastFailedSync.error_message || '').includes('network or deployment issue') ||
                                     (lastFailedSync.error_message || '').includes('Connection test timed out');
          
          const isRateLimitFailure = (lastFailedSync.error_message || '').includes('Rate limit exceeded') ||
                                    (lastFailedSync.error_message || '').includes('rate limited') ||
                                    (lastFailedSync.error_message || '').includes('too many requests');
          
          const isApiUnavailable = (lastFailedSync.error_message || '').includes('503') ||
                                  (lastFailedSync.error_message || '').includes('Service Unavailable') ||
                                  (lastFailedSync.error_message || '').includes('temporarily unavailable');
          
          // Use longer delays for rate limiting issues
          const adjustedDelay = isRateLimitFailure ? 300 * 1000 : RESUME_DELAY; // 5 minutes for rate limits
          
          if (timeSinceFailure > adjustedDelay && failureCount < 5 && !isDeploymentFailure && !isApiUnavailable) {
            console.log(`🔄 Enhanced Auto-resume: Attempting resume of sync from page ${lastFailedSync.current_page} with AI coordination (attempt ${failureCount + 1}) after ${Math.round(timeSinceFailure/1000)}s...`);
            
            // Use AI coordinator if available, fallback to direct call
            const aiCoordinator = (window as unknown as { aiSyncCoordinator?: { startIntelligentSync: (params: Record<string, unknown>) => Promise<void> } }).aiSyncCoordinator;
            
            if (aiCoordinator) {
              console.log('🤖 Using AI Coordinator for auto-resume');
              try {
                await aiCoordinator.startIntelligentSync({
                  resume: true,
                  fromPage: lastFailedSync.current_page,
                  reconcileProgress: true,
                  source: 'immediate-auto-resume',
                  attemptNumber: failureCount + 1
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
          } else if (failureCount >= 5) {
            console.warn(`⚠️ Enhanced Auto-resume: Sync has failed ${failureCount} times recently, pausing auto-resume to prevent loops`);
          } else if (isDeploymentFailure) {
            console.warn(`⚠️ Enhanced Auto-resume: Skipping auto-resume due to deployment failure: ${lastFailedSync.error_message}`);
          } else if (isRateLimitFailure) {
            const remainingWait = Math.max(0, adjustedDelay - timeSinceFailure);
            console.warn(`⚠️ Enhanced Auto-resume: Rate limit detected, waiting ${Math.round(remainingWait/1000)}s more before retry`);
          } else if (isApiUnavailable) {
            console.warn(`⚠️ Enhanced Auto-resume: API unavailable, skipping auto-resume: ${lastFailedSync.error_message}`);
          } else if (timeSinceFailure <= adjustedDelay) {
            console.log(`⏰ Enhanced Auto-resume: Waiting ${Math.round((adjustedDelay - timeSinceFailure)/1000)}s before retry attempt`);
          }
        }
        
        // Remove legacy pause cleanup since we no longer pause
        // All syncs now run continuously until completion
        
        // Check for running syncs that might be stuck (no activity for 10 minutes - increased from 3)
        const { data: runningSyncs } = await supabase
          .from('sync_status')
          .select('*')
          .eq('status', 'running')
          .lt('last_activity_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // 10 minutes to allow for rate limiting

        if (runningSyncs && runningSyncs.length > 0) {
          for (const stuckSync of runningSyncs) {
            // Check if this might be rate limiting related
            const timeSinceActivity = Date.now() - new Date(stuckSync.last_activity_at).getTime();
            const isLikelyRateLimit = timeSinceActivity < 30 * 60 * 1000; // Less than 30 minutes
            
            if (isLikelyRateLimit) {
              console.log(`⏰ Enhanced Auto-resume: Sync ${stuckSync.id} inactive for ${Math.round(timeSinceActivity/60000)}m, likely rate limited - extending timeout`);
              // Don't mark as failed yet, just update activity to extend timeout
              await supabase
                .from('sync_status')
                .update({
                  last_activity_at: new Date().toISOString(),
                  error_message: 'Auto-detected: Sync appears rate limited, extending timeout'
                })
                .eq('id', stuckSync.id);
            } else {
              console.log(`🚨 Enhanced Auto-resume: Detected stuck sync ${stuckSync.id} after ${Math.round(timeSinceActivity/60000)}m, marking as failed...`);
              
              await supabase
                .from('sync_status')
                .update({
                  status: 'failed',
                  error_message: `Auto-detected: Sync was stuck with no activity for ${Math.round(timeSinceActivity/60000)}+ minutes`,
                  completed_at: new Date().toISOString()
                })
                .eq('id', stuckSync.id);
            }
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