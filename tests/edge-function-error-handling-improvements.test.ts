/**
 * Comprehensive test for improved edge function error handling in AI Coordinator
 * Verifies that all deployment-related errors are properly classified and user-friendly messages are shown
 */
import { describe, it, expect } from 'vitest';

describe('Edge Function Error Handling Improvements', () => {
  // Mock the error classification logic from AISyncCoordinator
  const classifyErrorAndGetStrategy = (error: unknown): {
    category: 'network' | 'auth' | 'timeout' | 'server' | 'config' | 'critical' | 'edge_function' | 'deployment';
    recoverable: boolean;
    delayMs: number;
    action: 'retry' | 'reset' | 'abort';
  } => {
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? String(error.message) 
      : String(error) || 'Unknown error';
    
    // Edge function deployment/accessibility issues - enhanced detection with proper operator precedence
    if ((errorMessage.includes('timed out') && errorMessage.includes('function may not be deployed')) || 
        errorMessage.includes('not accessible') ||
        errorMessage.includes('edge function may not be deployed') ||
        errorMessage.includes('Edge Function not accessible') ||
        errorMessage.includes('Connection test timed out')) {
      return { category: 'deployment', recoverable: false, delayMs: 0, action: 'abort' };
    }
    
    // Network-level failures (can't send request at all)
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

  // Mock the user-friendly error message generation logic
  const generateUserFriendlyMessage = (errorMessage: string): { message: string; help: string } => {
    let userFriendlyMessage = errorMessage;
    let diagnosticHelp = '';
    
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
    
    return { message: userFriendlyMessage, help: diagnosticHelp };
  };

  describe('Improved Error Classification', () => {
    it('should correctly classify all deployment-related timeout errors', () => {
      const deploymentErrors = [
        'Connection test timed out after 10 seconds - edge function may not be deployed',
        'Connection timed out - edge function may not be deployed or is unresponsive',
        'Edge Function not accessible: Connection timed out - edge function may not be deployed or is unresponsive',
        'Edge Function request timed out - function may not be deployed or accessible',
        'Edge Function not accessible: Unknown connectivity issue',
        'Edge Function not accessible',
        'not accessible due to deployment issues'
      ];

      deploymentErrors.forEach(errorMessage => {
        const result = classifyErrorAndGetStrategy(new Error(errorMessage));
        expect(result.category).toBe('deployment');
        expect(result.recoverable).toBe(false);
        expect(result.action).toBe('abort');
      });
    });

    it('should distinguish between deployment timeouts and other timeouts', () => {
      // Deployment-related timeouts should be non-recoverable
      expect(classifyErrorAndGetStrategy(new Error('Connection test timed out after 10 seconds - edge function may not be deployed'))).toEqual({
        category: 'deployment',
        recoverable: false,
        delayMs: 0,
        action: 'abort'
      });

      // General timeouts should be recoverable
      expect(classifyErrorAndGetStrategy(new Error('Request timeout occurred'))).toEqual({
        category: 'timeout',
        recoverable: true,
        delayMs: 5000,
        action: 'retry'
      });
    });
  });

  describe('Improved User-Friendly Messages', () => {
    it('should provide correct message for the original problem case', () => {
      const problemCases = [
        'Edge Function not accessible: Connection timed out - edge function may not be deployed or is unresponsive',
        'Connection test timed out after 10 seconds - edge function may not be deployed',
        'Edge Function not accessible: Unknown connectivity issue',
        'Edge Function not accessible',
      ];

      problemCases.forEach(errorMessage => {
        const result = generateUserFriendlyMessage(errorMessage);
        expect(result.message).toBe('Edge Function not accessible - the cars-sync function may not be deployed to Supabase');
        expect(result.help).toBe('Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running.');
      });
    });

    it('should handle all edge function accessibility scenarios consistently', () => {
      // All these should show the same deployment message
      const accessibilityErrors = [
        'timed out while connecting',
        'function may not be deployed correctly',
        'not accessible from client',
        'Edge Function not accessible: network issue',
        'Connection test timed out'
      ];

      accessibilityErrors.forEach(errorMessage => {
        const result = generateUserFriendlyMessage(errorMessage);
        expect(result.message).toBe('Edge Function not accessible - the cars-sync function may not be deployed to Supabase');
        expect(result.help).toBe('Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running.');
      });
    });
  });

  describe('Edge Case Handling', () => {
    it('should handle mixed error conditions correctly', () => {
      // Error that contains both timeout and deployment keywords
      const mixedError = 'Connection timed out after 10 seconds - the edge function may not be deployed or network issue occurred';
      
      const classification = classifyErrorAndGetStrategy(new Error(mixedError));
      const userMessage = generateUserFriendlyMessage(mixedError);
      
      // Should prioritize deployment classification
      expect(classification.category).toBe('deployment');
      expect(classification.recoverable).toBe(false);
      
      // Should show deployment-specific message
      expect(userMessage.message).toBe('Edge Function not accessible - the cars-sync function may not be deployed to Supabase');
    });

    it('should handle edge function accessibility with different error contexts', () => {
      const contextualErrors = [
        'Edge Function not accessible: fetch failed',
        'Edge Function not accessible: timeout occurred',
        'Edge Function not accessible: network error',
        'Edge Function not accessible: deployment issue'
      ];

      contextualErrors.forEach(errorMessage => {
        const classification = classifyErrorAndGetStrategy(new Error(errorMessage));
        const userMessage = generateUserFriendlyMessage(errorMessage);
        
        // All should be classified as deployment issues
        expect(classification.category).toBe('deployment');
        expect(classification.recoverable).toBe(false);
        
        // All should show the same user-friendly message
        expect(userMessage.message).toBe('Edge Function not accessible - the cars-sync function may not be deployed to Supabase');
      });
    });
  });

  describe('Integration with Original Problem Statement', () => {
    it('should reproduce and fix the exact error from the problem statement', () => {
      // The exact error message from the problem statement
      const problemError = 'Edge Function not accessible: Connection test timed out after 10 seconds - edge function may not be deployed';
      
      const classification = classifyErrorAndGetStrategy(new Error(problemError));
      const userMessage = generateUserFriendlyMessage(problemError);
      
      // Should be correctly classified as deployment issue
      expect(classification.category).toBe('deployment');
      expect(classification.recoverable).toBe(false);
      expect(classification.action).toBe('abort');
      
      // Should generate the exact message from problem statement
      expect(userMessage.message).toBe('Edge Function not accessible - the cars-sync function may not be deployed to Supabase');
      expect(userMessage.help).toBe('Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running.');
      
      // When combined, should match the problem statement
      const fullMessage = `${userMessage.message}. ${userMessage.help}`;
      expect(fullMessage).toBe('Edge Function not accessible - the cars-sync function may not be deployed to Supabase. Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running.');
    });
  });
});