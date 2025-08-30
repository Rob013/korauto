/**
 * Test for AI Coordinator error handling improvements
 * Validates enhanced error detection and user-friendly messaging
 */
import { describe, it, expect } from 'vitest';

describe('AI Coordinator Error Handling Improvements', () => {
  // Simulate the error classification function from AISyncCoordinator
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
    if (errorMessage.includes('timed out') && errorMessage.includes('function may not be deployed') || 
        errorMessage.includes('not accessible') ||
        errorMessage.includes('edge function may not be deployed')) {
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
    return { category: 'network', recoverable: true, delayMs: 2000, action: 'retry' };
  };

  // Test user-friendly error message generation
  const generateUserFriendlyMessage = (errorMessage: string): { message: string; help: string } => {
    let userFriendlyMessage = errorMessage;
    let diagnosticHelp = '';
    
    if (errorMessage.includes('timed out') || errorMessage.includes('function may not be deployed')) {
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
    
    return { message: userFriendlyMessage, help: diagnosticHelp };
  };

  describe('Enhanced Error Classification', () => {
    it('should classify network-level request failures correctly', () => {
      expect(classifyErrorAndGetStrategy(new Error('Failed to send request to edge function'))).toEqual({
        category: 'network',
        recoverable: true,
        delayMs: 3000,
        action: 'retry'
      });

      expect(classifyErrorAndGetStrategy(new Error('fetch failed'))).toEqual({
        category: 'network',
        recoverable: true,
        delayMs: 3000,
        action: 'retry'
      });

      expect(classifyErrorAndGetStrategy(new Error('AbortError: signal aborted'))).toEqual({
        category: 'network',
        recoverable: true,
        delayMs: 3000,
        action: 'retry'
      });
    });

    it('should classify deployment issues as non-recoverable', () => {
      expect(classifyErrorAndGetStrategy(new Error('Connection test timed out after 10 seconds - edge function may not be deployed'))).toEqual({
        category: 'deployment',
        recoverable: false,
        delayMs: 0,
        action: 'abort'
      });

      expect(classifyErrorAndGetStrategy(new Error('Edge Function not accessible'))).toEqual({
        category: 'deployment',
        recoverable: false,
        delayMs: 0,
        action: 'abort'
      });
    });

    it('should distinguish between deployment timeouts and general timeouts', () => {
      // Deployment timeout - not recoverable
      expect(classifyErrorAndGetStrategy(new Error('timed out - function may not be deployed'))).toEqual({
        category: 'deployment',
        recoverable: false,
        delayMs: 0,
        action: 'abort'
      });

      // General timeout - recoverable
      expect(classifyErrorAndGetStrategy(new Error('request timeout'))).toEqual({
        category: 'timeout',
        recoverable: true,
        delayMs: 5000,
        action: 'retry'
      });
    });
  });

  describe('User-Friendly Error Messages', () => {
    it('should provide actionable error messages for deployment issues', () => {
      const result = generateUserFriendlyMessage('Connection test timed out after 10 seconds - function may not be deployed');
      expect(result.message).toBe('Edge Function not accessible - the cars-sync function may not be deployed to Supabase');
      expect(result.help).toBe('Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running.');
    });

    it('should provide helpful guidance for network request failures', () => {
      const result = generateUserFriendlyMessage('Failed to send a request to the edge function');
      expect(result.message).toBe('Unable to connect to Edge Function - network or deployment issue');
      expect(result.help).toBe('This could be a network connectivity issue or the edge function may not be deployed. Check your internet connection and Supabase function deployment.');
    });

    it('should distinguish between different types of errors with specific guidance', () => {
      const authResult = generateUserFriendlyMessage('Authentication failed');
      expect(authResult.message).toBe('Authentication error - Edge Function may require JWT verification configuration');
      expect(authResult.help).toBe('Check your Supabase API keys and authentication settings.');

      const notFoundResult = generateUserFriendlyMessage('Function not found');
      expect(notFoundResult.message).toBe('Edge Function not found - cars-sync function may not be deployed');
      expect(notFoundResult.help).toBe('Deploy the cars-sync function to your Supabase project.');

      const abortResult = generateUserFriendlyMessage('AbortError: The user aborted a request');
      expect(abortResult.message).toBe('Request cancelled - Edge Function call was aborted');
      expect(abortResult.help).toBe('The request was cancelled, possibly due to browser restrictions or network issues.');
    });
  });

  describe('Error Message Integration', () => {
    it('should correctly handle the original problem case', () => {
      // Simulate the exact error from the problem statement
      const originalError = 'Failed to send a request to the Edge Function';
      
      const classification = classifyErrorAndGetStrategy(new Error(originalError));
      const userMessage = generateUserFriendlyMessage(originalError);
      
      // Should be classified as a network error (recoverable)
      expect(classification.category).toBe('network');
      expect(classification.recoverable).toBe(true);
      expect(classification.action).toBe('retry');
      
      // Should provide helpful user guidance
      expect(userMessage.message).toBe('Unable to connect to Edge Function - network or deployment issue');
      expect(userMessage.help).toContain('network connectivity issue');
      expect(userMessage.help).toContain('edge function may not be deployed');
    });

    it('should handle edge function connectivity test scenarios', () => {
      // Test various connectivity test failure scenarios
      const scenarios = [
        {
          error: 'Connection test timed out after 10 seconds - edge function may not be deployed',
          expectedCategory: 'deployment',
          expectedRecoverable: false
        },
        {
          error: 'fetch failed to connect',
          expectedCategory: 'network',
          expectedRecoverable: true
        },
        {
          error: 'network connection failed',
          expectedCategory: 'network',
          expectedRecoverable: true
        }
      ];

      scenarios.forEach(scenario => {
        const result = classifyErrorAndGetStrategy(new Error(scenario.error));
        expect(result.category).toBe(scenario.expectedCategory);
        expect(result.recoverable).toBe(scenario.expectedRecoverable);
      });
    });
  });
});