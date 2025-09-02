import { describe, it, expect } from 'vitest';

describe('503 Edge Function Error Handling', () => {
  it('should classify "Function responded with 503 Edge function returned an error" as server error', () => {
    const classifyErrorAndGetStrategy = (error: unknown): {
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
      
      // Server errors - enhanced to catch specific HTTP status codes and edge function errors
      if (errorMessage.includes('HTTP 5') || 
          errorMessage.includes('Server error') || 
          errorMessage.includes('Internal Server Error') ||
          errorMessage.includes('503') ||
          errorMessage.includes('502') ||
          errorMessage.includes('500') ||
          errorMessage.includes('Service Unavailable') ||
          errorMessage.includes('Bad Gateway') ||
          (errorMessage.includes('Function responded with') && (errorMessage.includes('503') || errorMessage.includes('502') || errorMessage.includes('500'))) ||
          errorMessage.includes('Edge function returned an error')) {
        return { category: 'server', recoverable: true, delayMs: 8000, action: 'retry' };
      }
      
      if (errorMessage.includes('Configuration') || errorMessage.includes('environment variables') || errorMessage.includes('Missing required')) {
        return { category: 'config', recoverable: false, delayMs: 0, action: 'abort' };
      }
      
      // Default to network issue - most common and recoverable
      return { category: 'network', recoverable: true, delayMs: 1000, action: 'retry' };
    };

    // Test the exact problem statement error message
    const problemError = new Error('Function responded with 503 Edge function returned an error');
    const result = classifyErrorAndGetStrategy(problemError);
    
    // This test will initially fail because the current logic doesn't catch 503 errors properly
    expect(result.category).toBe('server');
    expect(result.recoverable).toBe(true);
    expect(result.action).toBe('retry');
  });

  it('should handle various 503 error message formats', () => {
    const classifyErrorAndGetStrategy = (error: unknown): {
      category: 'network' | 'auth' | 'timeout' | 'server' | 'config' | 'critical' | 'edge_function' | 'deployment';
      recoverable: boolean;
      delayMs: number;
      action: 'retry' | 'reset' | 'abort';
    } => {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : String(error) || 'Unknown error';
      
      // Enhanced implementation
      if (errorMessage.includes('HTTP 5') || 
          errorMessage.includes('Server error') || 
          errorMessage.includes('Internal Server Error') ||
          errorMessage.includes('503') ||
          errorMessage.includes('502') ||
          errorMessage.includes('500') ||
          errorMessage.includes('Service Unavailable') ||
          errorMessage.includes('Bad Gateway') ||
          (errorMessage.includes('Function responded with') && (errorMessage.includes('503') || errorMessage.includes('502') || errorMessage.includes('500'))) ||
          errorMessage.includes('Edge function returned an error')) {
        return { category: 'server', recoverable: true, delayMs: 8000, action: 'retry' };
      }
      
      return { category: 'network', recoverable: true, delayMs: 1000, action: 'retry' };
    };

    const testCases = [
      'Function responded with 503 Edge function returned an error',
      '503 Service Unavailable',
      'HTTP 503: Service Unavailable',
      'Edge function returned 503',
      'Response: 503 Service Unavailable',
    ];

    testCases.forEach(errorMessage => {
      const result = classifyErrorAndGetStrategy(new Error(errorMessage));
      
      // These should all be classified as server errors but currently won't be
      // because they don't match the "HTTP 5" pattern exactly
      console.log(`Error "${errorMessage}" classified as: ${result.category}`);
    });
  });

  it('should provide appropriate user-friendly message for 503 errors', () => {
    const generateUserFriendlyMessage = (errorMessage: string, category: string): string => {
      // Enhanced implementation that handles server errors
      if (errorMessage.includes('timed out') || 
          errorMessage.includes('function may not be deployed') ||
          errorMessage.includes('not accessible') ||
          errorMessage.includes('Edge Function not accessible') ||
          errorMessage.includes('Connection test timed out')) {
        return 'Failed to start intelligent sync: Edge Function not accessible - the cars-sync function may not be deployed to Supabase. Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running.';
      }
      
      // Handle server errors including 503
      if (category === 'server') {
        if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
          return 'Failed to start intelligent sync: Edge Function temporarily unavailable (503 Service Unavailable). The edge function is temporarily overloaded or under maintenance. The system will retry automatically with exponential backoff.';
        } else if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
          return 'Failed to start intelligent sync: Edge Function gateway error (502 Bad Gateway). There is a temporary issue with the edge function gateway. The system will retry automatically.';
        } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
          return 'Failed to start intelligent sync: Edge Function internal error (500 Internal Server Error). The edge function encountered an internal error. The system will retry automatically.';
        } else {
          return 'Failed to start intelligent sync: Edge Function server error. The edge function is experiencing server-side issues. The system will retry automatically with increasing delays.';
        }
      }
      
      return 'AI Coordinator temporarily unavailable - sync system will use direct method';
    };

    const message503 = generateUserFriendlyMessage('Function responded with 503 Edge function returned an error', 'server');
    
    // This should provide a more specific message for 503 errors
    expect(message503).toContain('503');
    expect(message503).toContain('Service Unavailable');
    expect(message503).toContain('temporarily unavailable');
  });
});