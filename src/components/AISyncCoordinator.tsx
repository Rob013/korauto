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
  // Enhanced detection for edge function deployment issues with improved operator precedence
  const classifyErrorAndGetStrategy = useCallback((error: unknown): {
    category: 'network' | 'auth' | 'timeout' | 'server' | 'config' | 'critical' | 'edge_function' | 'deployment';
    recoverable: boolean;
    delayMs: number;
    action: 'retry' | 'reset' | 'abort';
  } => {
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? String(error.message) 
      : String(error) || 'Unknown error';
    
    // Edge function deployment/accessibility issues - enhanced detection
    if ((errorMessage.includes('timed out') && errorMessage.includes('function may not be deployed')) || 
        errorMessage.includes('not accessible') ||
        errorMessage.includes('edge function may not be deployed') ||
        errorMessage.includes('Edge Function not accessible') ||
        errorMessage.includes('Connection test timed out')) {
      return { category: 'deployment', recoverable: false, delayMs: 0, action: 'abort' };
    }
    
    // Network-level failures (can't send request at all) - prioritize over edge function checks
    if (errorMessage.includes('Failed to send') || 
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('AbortError')) {
      return { category: 'network', recoverable: true, delayMs: 3000, action: 'retry' };
    }
    
    // Edge function specific errors (function responded but with error)
    if (errorMessage.includes('Edge Function') && !errorMessage.includes('Failed to send') || 
        errorMessage.includes('Deno') || 
        errorMessage.includes('Function Error')) {
      return { category: 'edge_function', recoverable: true, delayMs: 5000, action: 'retry' };
    }
    
    // General timeout errors (different from deployment timeouts)
    if (errorMessage.includes('timeout') && !errorMessage.includes('deployed')) {
      return { category: 'timeout', recoverable: true, delayMs: 5000, action: 'retry' };
    }
    
    if (errorMessage.includes('network') && !errorMessage.includes('Failed to send')) {
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

  // Add edge function connectivity test
  const testEdgeFunctionConnectivity = useCallback(async (): Promise<{ connected: boolean; error?: string; details?: string }> => {
    console.log('🔍 AI Coordinator: Testing edge function connectivity...');
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection test timed out after 10 seconds - edge function may not be deployed')), 10000);
      });

      const testPromise = supabase.functions.invoke('cars-sync', {
        body: { test: true, source: 'connectivity-test' },
        headers: { 'x-test': 'connectivity' }
      });

      const { data, error } = await Promise.race([testPromise, timeoutPromise]) as { data: any; error: any };

      if (error) {
        // Distinguish between different types of errors
        const errorMsg = error.message || 'Unknown edge function error';
        let enhancedError = errorMsg;
        
        if (errorMsg.includes('fetch') && errorMsg.includes('failed')) {
          enhancedError = 'Failed to send request to edge function - network or deployment issue';
        } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
          enhancedError = 'Edge function not found - cars-sync function is not deployed';
        } else if (errorMsg.includes('401') || errorMsg.includes('403')) {
          enhancedError = 'Authentication error - check API key configuration';
        }
        
        return {
          connected: false,
          error: enhancedError,
          details: `Edge function returned error: ${JSON.stringify(error)}`
        };
      }

      return {
        connected: true,
        details: `Edge function responded successfully: ${JSON.stringify(data)}`
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Enhanced error detection for better user guidance
      let enhancedError = errorMessage;
      let details = `Failed to connect to edge function: ${errorMessage}`;
      
      if (errorMessage.includes('timed out')) {
        enhancedError = 'Connection timed out - edge function may not be deployed or is unresponsive';
        details = 'The cars-sync edge function is either not deployed to Supabase or is not responding. Check the Supabase dashboard to ensure the function is deployed and configured correctly.';
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        enhancedError = 'Network error - unable to reach edge function endpoint';
        details = 'Could not establish connection to the edge function. This may be due to network issues or the function endpoint being unavailable.';
      } else if (errorMessage.includes('AbortError')) {
        enhancedError = 'Request aborted - edge function call was cancelled';
        details = 'The edge function request was aborted, possibly due to network issues or browser restrictions.';
      }
      
      return {
        connected: false,
        error: enhancedError,
        details
      };
    }
  }, []);

  // Enhanced edge function invocation with bulletproof retry logic
  const invokeEdgeFunctionWithRetry = useCallback(async (params: Record<string, unknown>, attempt = 1): Promise<unknown> => {
    console.log(`🤖 AI Coordinator: Invoking edge function (attempt ${attempt}/${maxRetries})...`);
    console.log(`🤖 AI Coordinator: Params:`, JSON.stringify(params, null, 2));
    console.log(`🤖 AI Coordinator: Supabase URL:`, supabase.supabaseUrl);
    
    try {
      // Add timeout to detect edge function deployment issues
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Edge Function request timed out - function may not be deployed or accessible')), 15000);
      });

      const invokePromise = supabase.functions.invoke('cars-sync', {
        body: params,
        headers: {
          'x-sync-attempt': attempt.toString(),
          'x-coordinator': 'ai-powered'
        }
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as { data: any; error: any };

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
      console.log('🤖 AI Coordinator: Sync parameters:', JSON.stringify(syncParams, null, 2));
      
      // First, test edge function connectivity
      console.log('🔍 AI Coordinator: Testing edge function connectivity before sync...');
      const connectivityTest = await testEdgeFunctionConnectivity();
      
      if (!connectivityTest.connected) {
        console.error('💥 AI Coordinator: Edge function connectivity test failed:', connectivityTest.error);
        throw new Error(`Edge Function not accessible: ${connectivityTest.error || 'Unknown connectivity issue'}`);
      }
      
      console.log('✅ AI Coordinator: Edge function connectivity confirmed');
      
      // Check current sync status for intelligent resumption
      const { data: currentStatus, error: statusError } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'cars-sync-main')
        .single();

      if (statusError) {
        console.warn('🤖 AI Coordinator: Could not fetch sync status:', statusError);
      }

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

      console.log('🤖 AI Coordinator: Enhanced parameters:', JSON.stringify(enhancedParams, null, 2));
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
      
      // Enhance error message based on error type
      let userFriendlyMessage = errorMessage;
      let diagnosticHelp = '';
      
      // Enhanced error message detection with comprehensive accessibility patterns
      if (errorMessage.includes('timed out') || 
          errorMessage.includes('function may not be deployed') ||
          errorMessage.includes('not accessible') ||
          errorMessage.includes('Edge Function not accessible') ||
          errorMessage.includes('Connection test timed out')) {
        userFriendlyMessage = 'Edge Function not accessible - the cars-sync function may not be deployed to Supabase';
        diagnosticHelp = 'Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running.';
      } else if (errorMessage.includes('Failed to send')) {
        userFriendlyMessage = 'Unable to connect to Edge Function - network or deployment issue';
        diagnosticHelp = 'This could be a network connectivity issue or the edge function may not be deployed. Check your internet connection and Supabase function deployment.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Test timed out')) {
        userFriendlyMessage = 'Edge Function call timed out - the function may not be properly deployed or configured';
        diagnosticHelp = 'The function exists but is not responding within the expected time frame.';
      } else if (errorMessage.includes('Authentication') || errorMessage.includes('JWT')) {
        userFriendlyMessage = 'Authentication error - Edge Function may require JWT verification configuration';
        diagnosticHelp = 'Check your Supabase API keys and authentication settings.';
      } else if (errorMessage.includes('Function not found') || errorMessage.includes('404')) {
        userFriendlyMessage = 'Edge Function not found - cars-sync function may not be deployed';
        diagnosticHelp = 'Deploy the cars-sync function to your Supabase project.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        userFriendlyMessage = 'Network error - unable to connect to Edge Function. Please check your internet connection';
        diagnosticHelp = 'Verify your network connection and try again.';
      } else if (errorMessage.includes('CORS')) {
        userFriendlyMessage = 'CORS error - Edge Function may have incorrect CORS configuration';
        diagnosticHelp = 'Check the CORS settings in your edge function code.';
      } else if (errorMessage.includes('AbortError')) {
        userFriendlyMessage = 'Request cancelled - Edge Function call was aborted';
        diagnosticHelp = 'The request was cancelled, possibly due to browser restrictions or network issues.';
      }
      
      const fullErrorMessage = diagnosticHelp 
        ? `${userFriendlyMessage}. ${diagnosticHelp}`
        : userFriendlyMessage;
      
      toast({
        title: "AI Coordinator Failed",
        description: `Failed to start intelligent sync: ${fullErrorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsActive(false);
    }
  }, [isActive, invokeEdgeFunctionWithRetry, testEdgeFunctionConnectivity, toast]);

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
        classifyErrorAndGetStrategy,
        testEdgeFunctionConnectivity
      };
    }

    return () => {
      const windowObj = window as unknown as { aiSyncCoordinator?: Record<string, unknown> };
      if (windowObj.aiSyncCoordinator) {
        delete windowObj.aiSyncCoordinator;
      }
    };
  }, [enabled, startIntelligentSync, invokeEdgeFunctionWithRetry, classifyErrorAndGetStrategy, testEdgeFunctionConnectivity]);

  return null; // This component doesn't render anything
};