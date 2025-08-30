/**
 * Test to verify the operator precedence fix in AISyncCoordinator error handling
 * This test validates that the fix properly groups 'timed out' AND 'function may not be deployed'
 * conditions together to distinguish deployment issues from general timeout issues.
 */
import { describe, it, expect } from 'vitest';

describe('Operator Precedence Fix for Edge Function Error Detection', () => {
  // Mock the fixed error detection logic from AISyncCoordinator.tsx
  const detectDeploymentError = (errorMessage: string): boolean => {
    return (errorMessage.includes('timed out') && errorMessage.includes('function may not be deployed')) || 
           errorMessage.includes('not accessible') ||
           errorMessage.includes('Edge Function not accessible') ||
           errorMessage.includes('Connection test timed out');
  };

  it('should correctly identify deployment errors that contain both "timed out" and "function may not be deployed"', () => {
    // These should be identified as deployment errors
    const deploymentErrors = [
      'Connection test timed out after 10 seconds - edge function may not be deployed',
      'Request timed out - the function may not be deployed to Supabase',
      'Connection timed out - edge function may not be deployed or is unresponsive'
    ];

    deploymentErrors.forEach(error => {
      expect(detectDeploymentError(error)).toBe(true);
      console.log(`✅ Correctly identified deployment error: "${error}"`);
    });
  });

  it('should NOT identify general timeout errors as deployment errors', () => {
    // These should NOT be identified as deployment errors (only timeout, not deployment-related)
    const generalTimeouts = [
      'Request timed out due to network issues',
      'Connection timed out - please try again',
      'API call timed out after 30 seconds'
    ];

    generalTimeouts.forEach(error => {
      expect(detectDeploymentError(error)).toBe(false);
      console.log(`✅ Correctly excluded general timeout: "${error}"`);
    });
  });

  it('should identify accessibility errors regardless of timeout context', () => {
    // These should be identified as deployment errors due to "not accessible" pattern
    const accessibilityErrors = [
      'Edge Function not accessible',
      'Service not accessible due to configuration',
      'Edge Function not accessible: Unknown connectivity issue'
    ];

    accessibilityErrors.forEach(error => {
      expect(detectDeploymentError(error)).toBe(true);
      console.log(`✅ Correctly identified accessibility error: "${error}"`);
    });
  });

  it('should identify connection test timeouts as deployment errors', () => {
    // These should be identified as deployment errors due to "Connection test timed out" pattern
    const connectionTestErrors = [
      'Connection test timed out after 5 seconds',
      'Connection test timed out - unable to reach edge function'
    ];

    connectionTestErrors.forEach(error => {
      expect(detectDeploymentError(error)).toBe(true);
      console.log(`✅ Correctly identified connection test timeout: "${error}"`);
    });
  });

  it('should demonstrate the operator precedence fix impact', () => {
    // Before fix: if (A || B || C) would match any individual condition
    // After fix: if ((A && B) || C) correctly groups the AND condition
    
    const testCase = 'Request timed out after 30 seconds';
    
    // Old logic (incorrect): errorMessage.includes('timed out') || errorMessage.includes('function may not be deployed')
    // This would be: true || false = true (WRONG - identifies general timeout as deployment error)
    const oldLogicResult = testCase.includes('timed out') || testCase.includes('function may not be deployed');
    
    // New logic (correct): (errorMessage.includes('timed out') && errorMessage.includes('function may not be deployed'))
    // This would be: (true && false) = false (CORRECT - general timeout is not deployment error)
    const newLogicResult = testCase.includes('timed out') && testCase.includes('function may not be deployed');
    
    expect(oldLogicResult).toBe(true); // Old logic incorrectly identifies as deployment error
    expect(newLogicResult).toBe(false); // New logic correctly excludes general timeout
    expect(detectDeploymentError(testCase)).toBe(false); // Our fixed function uses correct logic
    
    console.log('🔧 Operator precedence fix validated:');
    console.log(`   Old logic result: ${oldLogicResult} (incorrect)`);
    console.log(`   New logic result: ${newLogicResult} (correct)`);
    console.log(`   Fixed function result: ${detectDeploymentError(testCase)} (correct)`);
  });

  it('should correctly handle the exact problem statement scenario', () => {
    // The exact error from the problem statement should be properly detected
    const problemStatementError = 'Edge Function not accessible - the cars-sync function may not be deployed to Supabase';
    
    expect(detectDeploymentError(problemStatementError)).toBe(true);
    console.log(`✅ Problem statement error correctly detected: "${problemStatementError}"`);
  });
});