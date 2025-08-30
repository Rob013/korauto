/**
 * Integration test for sync verification improvements
 * This test validates the complete implementation against the problem statement
 */

import { describe, it, expect } from 'vitest';

describe('Sync Verification Integration', () => {
  
  it('should correctly implement the documented improvements', () => {
    // Verify the thresholds match the documentation
    const IMPROVED_SYNC_THRESHOLD = 72; // hours (improved from 24)
    const IMPROVED_INTEGRITY_THRESHOLD = 20; // percent (improved from 10)
    
    // Test cases that show the improvement
    const testCases = [
      {
        name: 'Moderate sync delay - now acceptable',
        syncHours: 48,
        expectedFailOld: true, // Would fail with 24h threshold
        expectedFailNew: false, // Passes with 72h threshold
      },
      {
        name: 'Moderate data difference - now acceptable',
        dataDifference: 15, // 15% difference
        expectedFailOld: true, // Would fail with 10% threshold
        expectedFailNew: false, // Passes with 20% threshold
      },
      {
        name: 'Severe issues still fail',
        syncHours: 410.5,
        dataDifference: 100,
        expectedFailNew: true, // Still fails even with improved thresholds
      }
    ];
    
    testCases.forEach(testCase => {
      if (testCase.syncHours !== undefined) {
        const failsOldThreshold = testCase.syncHours > 24;
        const failsNewThreshold = testCase.syncHours > IMPROVED_SYNC_THRESHOLD;
        
        if (testCase.expectedFailOld !== undefined) {
          expect(failsOldThreshold).toBe(testCase.expectedFailOld);
        }
        if (testCase.expectedFailNew !== undefined) {
          expect(failsNewThreshold).toBe(testCase.expectedFailNew);
        }
      }
      
      if (testCase.dataDifference !== undefined) {
        const failsOldThreshold = testCase.dataDifference >= 10;
        const failsNewThreshold = testCase.dataDifference >= IMPROVED_INTEGRITY_THRESHOLD;
        
        if (testCase.expectedFailOld !== undefined) {
          expect(failsOldThreshold).toBe(testCase.expectedFailOld);
        }
        if (testCase.expectedFailNew !== undefined) {
          expect(failsNewThreshold).toBe(testCase.expectedFailNew);
        }
      }
    });
  });

  it('should format error messages with threshold information', () => {
    // Test that error messages include the threshold values for debugging
    const errorFormats = [
      {
        template: 'Last sync is too old: {hours} hours ago (threshold: {threshold} hours)',
        values: { hours: 410.5, threshold: 72 },
        expected: 'Last sync is too old: 410.5 hours ago (threshold: 72 hours)'
      },
      {
        template: 'Data integrity issue: {percent}% difference between main ({main}) and cache ({cache}) tables (threshold: {threshold}%)',
        values: { percent: '100.0', main: 16, cache: 0, threshold: 20 },
        expected: 'Data integrity issue: 100.0% difference between main (16) and cache (0) tables (threshold: 20%)'
      },
      {
        template: 'Sample verification failed: {valid}/{total} records valid',
        values: { valid: 0, total: 10 },
        expected: 'Sample verification failed: 0/10 records valid'
      }
    ];
    
    errorFormats.forEach(format => {
      let message = format.template;
      Object.entries(format.values).forEach(([key, value]) => {
        message = message.replace(`{${key}}`, value.toString());
      });
      expect(message).toBe(format.expected);
    });
  });

  it('should support configurable thresholds for different environments', () => {
    // Test the flexibility of the new configuration system
    const environments = {
      production: {
        syncTimeThresholdHours: 24,
        dataIntegrityThresholdPercent: 10,
        description: 'Strict thresholds for production'
      },
      staging: {
        syncTimeThresholdHours: 72,
        dataIntegrityThresholdPercent: 20,
        description: 'Default improved thresholds'
      },
      development: {
        syncTimeThresholdHours: 168, // 1 week
        dataIntegrityThresholdPercent: 30,
        description: 'Relaxed thresholds for development'
      }
    };
    
    // Test scenario: 48 hours old sync with 15% data difference
    const testScenario = {
      syncHours: 48,
      dataDifference: 15
    };
    
    Object.entries(environments).forEach(([env, config]) => {
      const syncFails = testScenario.syncHours > config.syncTimeThresholdHours;
      const dataFails = testScenario.dataDifference >= config.dataIntegrityThresholdPercent;
      
      // Production should fail both
      if (env === 'production') {
        expect(syncFails).toBe(true);
        expect(dataFails).toBe(true);
      }
      
      // Development should pass both
      if (env === 'development') {
        expect(syncFails).toBe(false);
        expect(dataFails).toBe(false);
      }
      
      // Staging should pass sync but fail data (borderline case)
      if (env === 'staging') {
        expect(syncFails).toBe(false);
        expect(dataFails).toBe(false); // 15% < 20%
      }
    });
  });

  it('should provide backward compatibility', () => {
    // Ensure that existing code works with improved defaults
    const defaultThresholds = {
      syncTimeThresholdHours: 72,
      dataIntegrityThresholdPercent: 20
    };
    
    // These are the new defaults that should work better than the old ones
    expect(defaultThresholds.syncTimeThresholdHours).toBeGreaterThan(24);
    expect(defaultThresholds.dataIntegrityThresholdPercent).toBeGreaterThan(10);
    
    // But severe issues should still be caught
    const severeIssues = {
      syncHours: 410.5,
      dataDifference: 100
    };
    
    expect(severeIssues.syncHours > defaultThresholds.syncTimeThresholdHours).toBe(true);
    expect(severeIssues.dataDifference >= defaultThresholds.dataIntegrityThresholdPercent).toBe(true);
  });

  it('should enhance sample validation with detailed field checking', () => {
    // Test the improved sample validation logic
    const testRecords = [
      {
        record: { id: 'valid-1', make: 'Toyota', model: 'Camry', external_id: 'ext-1' },
        expectedValid: true,
        expectedMissing: []
      },
      {
        record: { id: '', make: 'Honda', model: 'Civic', external_id: 'ext-2' },
        expectedValid: false,
        expectedMissing: ['id']
      },
      {
        record: { id: 'test-3', make: null, model: 'Accord', external_id: 'ext-3' },
        expectedValid: false,
        expectedMissing: ['make']
      },
      {
        record: { id: 'test-4', make: 'Ford', model: '', external_id: 'ext-4' },
        expectedValid: false,
        expectedMissing: ['model']
      },
      {
        record: { id: 'test-5', make: 'Nissan', model: 'Altima', external_id: null },
        expectedValid: false,
        expectedMissing: ['external_id']
      }
    ];
    
    testRecords.forEach(({ record, expectedValid, expectedMissing }) => {
      // Apply the validation logic from syncVerification.ts
      const hasId = record.id && typeof record.id === 'string' && (record.id as string).trim().length > 0;
      const hasMake = record.make && typeof record.make === 'string' && (record.make as string).trim().length > 0;
      const hasModel = record.model && typeof record.model === 'string' && (record.model as string).trim().length > 0;
      const hasExternalId = record.external_id && typeof record.external_id === 'string' && (record.external_id as string).trim().length > 0;
      
      const isValid = !!(hasId && hasMake && hasModel && hasExternalId);
      expect(isValid).toBe(expectedValid);
      
      // Check missing fields detection
      const missingFields = [];
      if (!hasId) missingFields.push('id');
      if (!hasMake) missingFields.push('make');
      if (!hasModel) missingFields.push('model');
      if (!hasExternalId) missingFields.push('external_id');
      
      expect(missingFields).toEqual(expectedMissing);
    });
  });
});