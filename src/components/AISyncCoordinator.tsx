import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncStatus {
  id?: string;
  status: string;
  current_page: number;
  records_processed: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  last_activity_at?: string;
  sync_type: string;
  [key: string]: unknown;
}

interface AISyncCoordinatorProps {
  enabled?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * AI-Powered Sync Coordinator
 * 
 * Provides intelligent sync management with:
 * - Bulletproof retry mechanisms
 * - Smart error classification and recovery
 * - Adaptive timeout strategies
 * - Progress validation and reconciliation
 * - Auto-healing capabilities
 */
export const AISyncCoordinator = ({ 
  enabled = true, 
  maxRetries = 5,
  retryDelayMs = 2000
}: AISyncCoordinatorProps = {}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const { toast } = useToast();

  // AI-powered error classification and recovery strategy
  const classifyErrorAndGetStrategy = useCallback((error: unknown): {
    category: 'network' | 'auth' | 'timeout' | 'server' | 'config' | 'critical' | 'edge_function';
    recoverable: boolean;
    delayMs: number;
    action: 'retry' | 'reset' | 'abort';
  } => {
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? String(error.message) 
      : String(error) || 'Unknown error';
    
    // Edge function specific errors
    if (errorMessage.includes('Edge Function') || errorMessage.includes('Deno') || errorMessage.includes('Function Error')) {
      return { category: 'edge_function', recoverable: true, delayMs: 5000, action: 'retry' };
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      return { category: 'timeout', recoverable: true, delayMs: 5000, action: 'retry' };
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND')) {
      return { category: 'network', recoverable: true, delayMs: 3000, action: 'retry' };
    }
    
    if (errorMessage.includes('Authentication') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return { category: 'auth', recoverable: false, delayMs: 0, action: 'abort' };
    }
    
    if (errorMessage.includes('HTTP 5') || errorMessage.includes('Server error') || errorMessage.includes('Internal Server Error')) {
      return { category: 'server', recoverable: true, delayMs: 8000, action: 'retry' };
    }
    
    if (errorMessage.includes('Configuration') || errorMessage.includes('environment variables') || errorMessage.includes('Missing required')) {
      return { category: 'config', recoverable: false, delayMs: 0, action: 'abort' };
    }
    
    // Default to network issue - most common and recoverable
    return { category: 'network', recoverable: true, delayMs: retryDelayMs, action: 'retry' };
  }, [retryDelayMs]);

  // Enhanced edge function invocation with bulletproof retry logic
  const invokeEdgeFunctionWithRetry = useCallback(async (params: Record<string, unknown>, attempt = 1): Promise<unknown> => {
    console.log(`🤖 AI Coordinator: Invoking edge function (attempt ${attempt}/${maxRetries})...`);
    console.log(`🤖 AI Coordinator: Params:`, JSON.stringify(params, null, 2));
    console.log(`🤖 AI Coordinator: Supabase URL:`, supabase.supabaseUrl);
    
    try {
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: params,
        headers: {
          'x-sync-attempt': attempt.toString(),
          'x-coordinator': 'ai-powered'
        }
      });

      if (error) {
        console.error('🚨 AI Coordinator: Edge function returned error:', error);
        console.error('🚨 AI Coordinator: Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          details: error
        });
        throw error;
      }

      console.log('✅ AI Coordinator: Edge function successful');
      console.log('✅ AI Coordinator: Response data:', data);
      return data;

    } catch (error: unknown) {
      console.error(`❌ AI Coordinator: Edge function failed (attempt ${attempt}):`, error);
      console.error(`❌ AI Coordinator: Full error details:`, {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });
      
      const strategy = classifyErrorAndGetStrategy(error);
      console.log(`🤖 AI Coordinator: Error strategy:`, strategy);
      
      if (!strategy.recoverable || attempt >= maxRetries) {
        console.error(`💥 AI Coordinator: Giving up after ${attempt} attempts`);
        throw error;
      }
      
      if (strategy.action === 'abort') {
        console.error(`🛑 AI Coordinator: Non-recoverable error, aborting`);
        throw error;
      }
      
      // Smart backoff with jitter
      const jitter = Math.random() * 1000;
      const delay = strategy.delayMs + (attempt * 1000) + jitter;
      
      console.log(`🔄 AI Coordinator: Will retry in ${Math.round(delay)}ms (${strategy.category} error)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return invokeEdgeFunctionWithRetry(params, attempt + 1);
    }
  }, [maxRetries, classifyErrorAndGetStrategy]);

  // Intelligent sync initiation with progress reconciliation
  const startIntelligentSync = useCallback(async (syncParams: Record<string, unknown> = {}) => {
    if (isActive) {
      console.log('🤖 AI Coordinator: Sync already active, skipping');
      return;
    }

    setIsActive(true);
    setCurrentAttempt(0);

    try {
      console.log('🤖 AI Coordinator: Starting intelligent sync with AI-powered error handling');
      
      // Check current sync status for intelligent resumption
      const { data: currentStatus } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'cars-sync-main')
        .single();

      let enhancedParams = {
        smartSync: true,
        aiCoordinated: true,
        source: 'ai-coordinator',
        ...syncParams
      };

      // Intelligent resume detection
      if (currentStatus?.status === 'paused' || currentStatus?.status === 'failed') {
        console.log(`🧠 AI Coordinator: Detected resumable sync at page ${currentStatus.current_page}`);
        enhancedParams = {
          ...enhancedParams,
          resume: true,
          fromPage: currentStatus.current_page,
          reconcileProgress: true,
          resumeFromFailure: currentStatus.status === 'failed'
        };
      }

      const result = await invokeEdgeFunctionWithRetry(enhancedParams);
      
      toast({
        title: "🤖 AI Sync Coordinator Active",
        description: "Intelligent sync management enabled with bulletproof error handling",
      });

      console.log('✅ AI Coordinator: Sync initiated successfully', result);

    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Unknown error occurred';
        
      console.error('💥 AI Coordinator: Failed to start sync:', error);
      
      toast({
        title: "AI Coordinator Failed",
        description: `Failed to start intelligent sync: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsActive(false);
    }
  }, [isActive, invokeEdgeFunctionWithRetry, toast]);

  // Monitor sync status and auto-heal when needed
  useEffect(() => {
    if (!enabled) return;

    const monitorAndHeal = async () => {
      try {
        const { data: syncStatus } = await supabase
          .from('sync_status')
          .select('*')
          .eq('id', 'cars-sync-main')
          .single();

        if (!syncStatus) return;

        const now = Date.now();
        const lastActivity = new Date(syncStatus.last_activity_at || syncStatus.started_at).getTime();
        const timeSinceActivity = now - lastActivity;
        
        // Auto-heal stuck syncs (inactive for more than 5 minutes)
        if (syncStatus.status === 'running' && timeSinceActivity > 5 * 60 * 1000) {
          console.log('🚨 AI Coordinator: Detected stuck sync, initiating auto-heal...');
          
          await startIntelligentSync({
            resume: true,
            fromPage: syncStatus.current_page,
            reconcileProgress: true,
            autoHeal: true
          });
        }
        
        // Auto-resume failed syncs (after 2 minutes)
        if (syncStatus.status === 'failed' && timeSinceActivity > 2 * 60 * 1000) {
          console.log('🔄 AI Coordinator: Auto-resuming failed sync...');
          
          await startIntelligentSync({
            resume: true,
            fromPage: syncStatus.current_page,
            reconcileProgress: true,
            autoResume: true
          });
        }

      } catch (error) {
        console.error('❌ AI Coordinator: Monitor error:', error);
      }
    };

    // Monitor every 30 seconds
    const interval = setInterval(monitorAndHeal, 30000);
    
    // Also run immediately
    monitorAndHeal();
    
    console.log('🤖 AI Sync Coordinator: Intelligent monitoring started');

    return () => {
      clearInterval(interval);
      console.log('🛑 AI Sync Coordinator: Stopped');
    };
  }, [enabled, startIntelligentSync]);

  // Expose intelligent sync function globally for other components
  useEffect(() => {
    if (enabled) {
      (window as unknown as { aiSyncCoordinator: Record<string, unknown> }).aiSyncCoordinator = {
        startIntelligentSync,
        invokeEdgeFunctionWithRetry,
        classifyErrorAndGetStrategy
      };
    }

    return () => {
      const windowObj = window as unknown as { aiSyncCoordinator?: Record<string, unknown> };
      if (windowObj.aiSyncCoordinator) {
        delete windowObj.aiSyncCoordinator;
      }
    };
  }, [enabled, startIntelligentSync, invokeEdgeFunctionWithRetry, classifyErrorAndGetStrategy]);

  return null; // This component doesn't render anything
};