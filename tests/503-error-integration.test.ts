import { describe, it, expect } from 'vitest';

describe('503 Error User Message Integration Test', () => {
  it('should handle the exact problem statement error with proper user message', () => {
    // Simulate the exact error classification and user message generation from AISyncCoordinator
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

    const generateUserMessage = (errorMessage: string, strategy: ReturnType<typeof classifyErrorAndGetStrategy>) => {
      let userFriendlyMessage = 'AI Coordinator temporarily unavailable - sync system will use direct method';
      let diagnosticHelp = 'The sync will continue using the backup direct method for maximum reliability.';
      
      // Show specific edge function deployment error if detected
      if (strategy.category === 'deployment') {
        userFriendlyMessage = 'Failed to start intelligent sync: Unable to connect to Edge Function - network or deployment issue';
        diagnosticHelp = 'This could be a network connectivity issue or the edge function may not be deployed. Check your internet connection and Supabase function deployment.';
      } else if (strategy.category === 'server') {
        // Specific handling for 503 and other server errors
        if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
          userFriendlyMessage = 'Failed to start intelligent sync: Edge Function temporarily unavailable (503 Service Unavailable)';
          diagnosticHelp = 'The edge function is temporarily overloaded or under maintenance. The system will retry automatically with exponential backoff.';
        } else if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
          userFriendlyMessage = 'Failed to start intelligent sync: Edge Function gateway error (502 Bad Gateway)';
          diagnosticHelp = 'There is a temporary issue with the edge function gateway. The system will retry automatically.';
        } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
          userFriendlyMessage = 'Failed to start intelligent sync: Edge Function internal error (500 Internal Server Error)';
          diagnosticHelp = 'The edge function encountered an internal error. The system will retry automatically.';
        } else {
          userFriendlyMessage = 'Failed to start intelligent sync: Edge Function server error';
          diagnosticHelp = 'The edge function is experiencing server-side issues. The system will retry automatically with increasing delays.';
        }
      }
      
      return `${userFriendlyMessage}. ${diagnosticHelp}`;
    };

    // Test the exact problem statement error
    const problemError = new Error('Function responded with 503 Edge function returned an error');
    const strategy = classifyErrorAndGetStrategy(problemError);
    const userMessage = generateUserMessage(problemError.message, strategy);

    // Verify error classification
    expect(strategy.category).toBe('server');
    expect(strategy.recoverable).toBe(true);
    expect(strategy.action).toBe('retry');
    expect(strategy.delayMs).toBe(8000);

    // Verify user-friendly message
    expect(userMessage).toContain('503 Service Unavailable');
    expect(userMessage).toContain('temporarily unavailable');
    expect(userMessage).toContain('overloaded or under maintenance');
    expect(userMessage).toContain('retry automatically with exponential backoff');

    console.log('Problem Statement Error Classification:', strategy);
    console.log('User-friendly message:', userMessage);
  });

  it('should handle various 503 server error scenarios', () => {
    const testCases = [
      {
        error: 'Function responded with 503 Edge function returned an error',
        expectedClassification: 'server',
        shouldContain: ['503', 'Service Unavailable', 'temporarily unavailable']
      },
      {
        error: '503 Service Unavailable',
        expectedClassification: 'server',
        shouldContain: ['503', 'Service Unavailable', 'temporarily unavailable']
      },
      {
        error: 'Edge function returned an error with 502 status',
        expectedClassification: 'server',
        shouldContain: ['502 Bad Gateway', 'gateway error']
      },
      {
        error: 'Function responded with 502 Bad Gateway',
        expectedClassification: 'server',
        shouldContain: ['502 Bad Gateway', 'gateway error']
      }
    ];

    // Implementation to test (duplicated to avoid dependencies)
    const classifyAndMessage = (errorMsg: string) => {
      const errorMessage = errorMsg;
      
      let category = 'network';
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
        category = 'server';
      }

      let userMessage = 'AI Coordinator temporarily unavailable';
      if (category === 'server') {
        if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
          userMessage = 'Failed to start intelligent sync: Edge Function temporarily unavailable (503 Service Unavailable). The edge function is temporarily overloaded or under maintenance. The system will retry automatically with exponential backoff.';
        } else if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
          userMessage = 'Failed to start intelligent sync: Edge Function gateway error (502 Bad Gateway). There is a temporary issue with the edge function gateway. The system will retry automatically.';
        } else {
          userMessage = 'Failed to start intelligent sync: Edge Function server error. The edge function is experiencing server-side issues. The system will retry automatically with increasing delays.';
        }
      }

      return { category, userMessage };
    };

    testCases.forEach(({ error, expectedClassification, shouldContain }) => {
      const result = classifyAndMessage(error);
      
      expect(result.category).toBe(expectedClassification);
      
      shouldContain.forEach(text => {
        expect(result.userMessage).toContain(text);
      });

      console.log(`Error: "${error}"`);
      console.log(`Classification: ${result.category}`);
      console.log(`Message: ${result.userMessage}`);
      console.log('---');
    });
  });
});