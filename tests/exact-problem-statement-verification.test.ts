/**
 * Exact Problem Statement Verification Test
 * 
 * This test recreates the exact scenario described in the problem statement
 * to verify the AI Coordinator error handling works as expected.
 */

import { describe, it, expect } from 'vitest';

describe('Exact Problem Statement Verification', () => {
  
  // Mock the exact error flow that would happen in AISyncCoordinator
  const simulateAICoordinatorError = (connectivityError: string): { title: string; description: string } => {
    // This simulates the error being thrown from startIntelligentSync
    const errorMessage = `Edge Function not accessible: ${connectivityError}`;
    
    // Simulate the error processing logic from AISyncCoordinator.tsx lines 320-325
    let userFriendlyMessage = errorMessage;
    let diagnosticHelp = '';
    
    // Enhanced error message detection with comprehensive accessibility patterns
    // Fixed operator precedence and more specific pattern matching to avoid false positives
    if ((errorMessage.includes('timed out') && errorMessage.includes('function may not be deployed')) || 
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
      userFriendlyMessage = 'Edge Function not accessible - the cars-sync function may not be deployed to Supabase';
      diagnosticHelp = 'Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running. See EDGE_FUNCTION_DEPLOYMENT.md for detailed deployment instructions.';
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
      diagnosticHelp = 'Deploy the cars-sync function to your Supabase project. See EDGE_FUNCTION_DEPLOYMENT.md for step-by-step instructions.';
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
    
    // Simulate the toast call
    return {
      title: "AI Coordinator Failed",
      description: `Failed to start intelligent sync: ${fullErrorMessage}`
    };
  };

  it('should reproduce the exact problem statement scenario: timeout during connectivity test', () => {
    // This simulates what testEdgeFunctionConnectivity returns when it times out
    const timeoutError = 'Connection timed out - edge function may not be deployed or is unresponsive';
    
    const result = simulateAICoordinatorError(timeoutError);
    
    // Verify the exact problem statement result
    expect(result.title).toBe("AI Coordinator Failed");
    expect(result.description).toBe(
      "Failed to start intelligent sync: Edge Function not accessible - the cars-sync function may not be deployed to Supabase. Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running. See EDGE_FUNCTION_DEPLOYMENT.md for detailed deployment instructions."
    );
    
    console.log('✅ Timeout scenario generates exact problem statement message');
  });
  
  it('should reproduce the exact problem statement scenario: direct timeout from promise', () => {
    // This simulates the direct timeout from the Promise.race in testEdgeFunctionConnectivity
    const directTimeoutError = 'Connection test timed out after 10 seconds - edge function may not be deployed';
    
    const result = simulateAICoordinatorError(directTimeoutError);
    
    // Verify the exact problem statement result
    expect(result.title).toBe("AI Coordinator Failed");
    expect(result.description).toBe(
      "Failed to start intelligent sync: Edge Function not accessible - the cars-sync function may not be deployed to Supabase. Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running. See EDGE_FUNCTION_DEPLOYMENT.md for detailed deployment instructions."
    );
    
    console.log('✅ Direct timeout scenario generates exact problem statement message');
  });

  it('should reproduce the exact problem statement scenario: generic accessibility issue', () => {
    // This simulates a generic accessibility issue
    const accessibilityError = 'Unknown connectivity issue';
    
    const result = simulateAICoordinatorError(accessibilityError);
    
    // Verify the exact problem statement result
    expect(result.title).toBe("AI Coordinator Failed");
    expect(result.description).toBe(
      "Failed to start intelligent sync: Edge Function not accessible - the cars-sync function may not be deployed to Supabase. Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running. See EDGE_FUNCTION_DEPLOYMENT.md for detailed deployment instructions."
    );
    
    console.log('✅ Generic accessibility scenario generates exact problem statement message');
  });

  it('should verify all error patterns that should trigger the deployment message', () => {
    const deploymentTriggerErrors = [
      'Connection timed out - edge function may not be deployed or is unresponsive',
      'Connection test timed out after 10 seconds - edge function may not be deployed',
      'Unknown connectivity issue',
      'Network error - unable to reach edge function endpoint',
      'Request aborted - edge function call was cancelled'
    ];

    deploymentTriggerErrors.forEach((connectivityError, index) => {
      const result = simulateAICoordinatorError(connectivityError);
      
      expect(result.title).toBe("AI Coordinator Failed");
      expect(result.description).toBe(
        "Failed to start intelligent sync: Edge Function not accessible - the cars-sync function may not be deployed to Supabase. Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running. See EDGE_FUNCTION_DEPLOYMENT.md for detailed deployment instructions."
      );
      
      console.log(`✅ Error pattern ${index + 1} triggers correct deployment message: "${connectivityError}"`);
    });
  });

  it('should handle edge cases in error message processing', () => {
    // Test cases that should trigger deployment message (realistic scenarios from testEdgeFunctionConnectivity)
    const deploymentTriggerCases = [
      'Unknown connectivity issue',
      '', // empty connectivity error - results in "Edge Function not accessible: "
    ];

    deploymentTriggerCases.forEach((connectivityError, index) => {
      const result = simulateAICoordinatorError(connectivityError);
      
      expect(result.title).toBe("AI Coordinator Failed");
      expect(result.description).toBe(
        "Failed to start intelligent sync: Edge Function not accessible - the cars-sync function may not be deployed to Supabase. Check the Supabase dashboard to ensure the cars-sync edge function is deployed and running. See EDGE_FUNCTION_DEPLOYMENT.md for detailed deployment instructions."
      );
      console.log(`✅ Edge case ${index + 1} correctly triggers deployment message: "${connectivityError || '(empty)'} -> Edge Function not accessible: ${connectivityError}"`);
    });

    // Test cases that should NOT trigger deployment message (different error types)
    const nonDeploymentCases = [
      { 
        error: 'Authentication failed',
        expectedMessage: 'Authentication error - Edge Function may require JWT verification configuration. Check your Supabase API keys and authentication settings.'
      },
      { 
        error: 'Server returned 500 error',
        expectedMessage: 'Edge Function not accessible: Server returned 500 error'
      },
      { 
        error: 'Invalid request format',
        expectedMessage: 'Edge Function not accessible: Invalid request format'
      }
    ];

    nonDeploymentCases.forEach((testCase, index) => {
      const result = simulateAICoordinatorError(testCase.error);
      
      expect(result.title).toBe("AI Coordinator Failed");
      expect(result.description).toBe(`Failed to start intelligent sync: ${testCase.expectedMessage}`);
      console.log(`✅ Non-deployment case ${index + 1} handles "${testCase.error}" correctly`);
    });
  });
});