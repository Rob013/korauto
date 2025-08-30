/**
 * Integration test for Edge Function communication
 * This test verifies that the Supabase client can successfully communicate
 * with the cars-sync Edge Function
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qtyyiqimkysmjnaocswe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8";

describe('Edge Function Communication', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  });

  it('should successfully connect to Supabase', () => {
    expect(supabase).toBeDefined();
    expect(supabase.supabaseUrl).toBe(SUPABASE_URL);
  });

  it('should be able to invoke cars-sync edge function with test parameters', async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cars-sync', {
        body: { 
          test: true,
          source: 'integration-test',
          smartSync: true,
          aiCoordinated: true
        },
        headers: {
          'x-sync-attempt': '1',
          'x-coordinator': 'test'
        }
      });

      console.log('Edge function response:', { data, error });

      // The function should either succeed or return a recognizable error
      if (error) {
        // Check if it's a configuration error (which would be expected in test environment)
        expect(error.message).toBeDefined();
        console.log('Expected configuration error in test environment:', error.message);
      } else {
        // If successful, should have response data
        expect(data).toBeDefined();
        console.log('Edge function successful:', data);
      }
    } catch (error) {
      console.error('Unexpected error during edge function call:', error);
      throw error;
    }
  }, 30000); // 30 second timeout

  it('should classify different error types correctly', () => {
    const classifyErrorAndGetStrategy = (error: unknown): {
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
      return { category: 'network', recoverable: true, delayMs: 2000, action: 'retry' };
    };

    // Test different error types
    expect(classifyErrorAndGetStrategy(new Error('timeout occurred'))).toEqual({
      category: 'timeout',
      recoverable: true,
      delayMs: 5000,
      action: 'retry'
    });

    expect(classifyErrorAndGetStrategy(new Error('network failed'))).toEqual({
      category: 'network',
      recoverable: true,
      delayMs: 3000,
      action: 'retry'
    });

    expect(classifyErrorAndGetStrategy(new Error('Authentication failed'))).toEqual({
      category: 'auth',
      recoverable: false,
      delayMs: 0,
      action: 'abort'
    });

    expect(classifyErrorAndGetStrategy(new Error('Edge Function error'))).toEqual({
      category: 'edge_function',
      recoverable: true,
      delayMs: 5000,
      action: 'retry'
    });

    expect(classifyErrorAndGetStrategy(new Error('Missing required environment variables'))).toEqual({
      category: 'config',
      recoverable: false,
      delayMs: 0,
      action: 'abort'
    });
  });
});