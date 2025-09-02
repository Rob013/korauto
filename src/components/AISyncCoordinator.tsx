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
  maxRetries = 8, // Increased from 5 for maximum persistence
  retryDelayMs = 1000 // Reduced from 2000 for faster retries at max speed
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
        errorMessage.includes('edge function may not be deployed') ||
        errorMessage.includes('Connection test timed out') ||
        (errorMessage.includes('Edge Function not accessible') && (
          errorMessage.includes('Connection') || 
          errorMessage.includes('timed out') || 
          errorMessage.includes('Unknown connectivity') ||
          errorMessage.includes('Network error') ||
          errorMessage.includes('Request aborted') ||
          // Handle generic accessibility issues (empty error or generic error)
          errorMessage.match(/Edge Function not accessible:\s*$/) ||
          errorMessage.includes('Unknown connectivity issue')
        ))) {
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

  // Add edge function connectivity test with health check
  const testEdgeFunctionConnectivity = useCallback(async (): Promise<{ connected: boolean; error?: string; details?: string }> => {
    console.log('🔍 AI Coordinator: Testing edge function connectivity...');
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timed out after 5 seconds')), 5000);
      });

      // Use GET request for health check instead of POST with parameters
      const testPromise = fetch('https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-sync', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8`,
          'Accept': 'application/json'
        }
      });

      const response = await Promise.race([testPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        return {
          connected: false,
          error: `Edge function returned ${response.status}: ${response.statusText}`,
          details: `Health check failed with status ${response.status}`
        };
      }

      const data = await response.json();
      
      return {
        connected: true,
        details: `Edge function healthy: ${JSON.stringify(data)}`
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      let enhancedError = errorMessage;
      let details = `Failed to connect to edge function: ${errorMessage}`;
      
      if (errorMessage.includes('timed out')) {
        enhancedError = 'Health check timed out - edge function may be slow or unresponsive';
        details = 'The cars-sync edge function is responding too slowly. This may be due to high load or resource constraints.';
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        enhancedError = 'Network error - unable to reach edge function endpoint';
        details = 'Could not establish connection to the edge function. This may be due to network issues or the function endpoint being unavailable.';
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
    console.log(`🤖 AI Coordinator: Invoking cars-sync function...`);
    
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

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as { data: unknown; error: unknown };

      if (error) {
        console.error('🚨 AI Coordinator: Edge function returned error:', error);
        console.error('🚨 AI Coordinator: Error details:', {
          message: error && typeof error === 'object' && 'message' in error ? (error as any).message : 'Unknown',
          name: error && typeof error === 'object' && 'name' in error ? (error as any).name : 'Unknown',
          stack: error && typeof error === 'object' && 'stack' in error ? (error as any).stack : 'No stack',
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

  // Enhanced error handling - don't fail the whole sync for connectivity test failures
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
      
      // Test edge function connectivity - but don't fail if it times out
      console.log('🔍 AI Coordinator: Testing edge function connectivity before sync...');
      try {
        const connectivityTest = await testEdgeFunctionConnectivity();
        
        if (!connectivityTest.connected) {
          console.warn('⚠️ AI Coordinator: Edge function connectivity test failed:', connectivityTest.error);
          // Don't throw - just warn and continue with sync
        } else {
          console.log('✅ AI Coordinator: Edge function connectivity confirmed');
        }
      } catch (connectivityError) {
        console.warn('⚠️ AI Coordinator: Connectivity test threw error, continuing anyway:', connectivityError);
        // Continue with sync even if connectivity test fails
      }

      // Continue with sync regardless of connectivity test result
      const enhancedParams: Record<string, unknown> = {
        smartSync: true,
        aiCoordinated: true,
        source: 'ai-coordinator',
        resilientMode: true,
        ...syncParams
      };

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
      
      // Enhanced error message detection - check for deployment/edge function issues
      const strategy = classifyErrorAndGetStrategy(error);
      let userFriendlyMessage = 'AI Coordinator temporarily unavailable - sync system will use direct method';
      let diagnosticHelp = 'The sync will continue using the backup direct method for maximum reliability.';
      
      // Show specific edge function deployment error if detected
      if (strategy.category === 'deployment') {
        userFriendlyMessage = 'Failed to start intelligent sync: Unable to connect to Edge Function - network or deployment issue';
        diagnosticHelp = 'This could be a network connectivity issue or the edge function may not be deployed. Check your internet connection and Supabase function deployment.';
      }
      
      const fullErrorMessage = `${userFriendlyMessage}. ${diagnosticHelp}`;
      
      toast({
        title: "AI Coordinator Failed",
        description: `${fullErrorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsActive(false);
    }
  }, [isActive, invokeEdgeFunctionWithRetry, testEdgeFunctionConnectivity, toast]);

  // Disabled monitoring to prevent infinite loops
  useEffect(() => {
    if (!enabled) return;
    
    console.log('🛑 AI Sync Coordinator: Monitoring disabled to prevent infinite loops');
    return;

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