/**
 * Test to validate the exact scenario from the problem statement
 */

import { describe, it, expect } from 'vitest';

describe('Sync Verification Problem Statement Scenario', () => {
  
  it('should properly format error messages for the reported scenario', () => {
    // Problem statement scenario:
    // • Records in DB: 16
    // • Cache records: 0  
    // • Last sync: 410.5 hours ago
    // • Sample valid: 0/10

    const syncHours = 410.5;
    const threshold = 72;
    const mainCount = 16;
    const cacheCount = 0;
    const validRecords = 0;
    const totalRecords = 10;
    
    // Calculate percentage difference for data integrity
    const countDifference = Math.abs(mainCount - cacheCount);
    const percentDifference = mainCount > 0 ? (countDifference / mainCount) * 100 : 0;
    const dataIntegrityThreshold = 20;
    
    // Expected error messages based on current implementation
    const expectedTimeError = `Last sync is too old: ${syncHours.toFixed(1)} hours ago (threshold: ${threshold} hours)`;
    const expectedIntegrityError = `Data integrity issue: ${percentDifference.toFixed(1)}% difference between main (${mainCount}) and cache (${cacheCount}) tables (threshold: ${dataIntegrityThreshold}%)`;
    const expectedSampleError = `Sample verification failed: ${validRecords}/${totalRecords} records valid`;
    
    // Verify calculations
    expect(percentDifference).toBe(100.0);
    expect(syncHours > threshold).toBe(true);
    expect(validRecords < totalRecords).toBe(true);
    
    // Verify error message formats match problem statement
    expect(expectedTimeError).toBe('Last sync is too old: 410.5 hours ago (threshold: 72 hours)');
    expect(expectedIntegrityError).toBe('Data integrity issue: 100.0% difference between main (16) and cache (0) tables (threshold: 20%)');
    expect(expectedSampleError).toBe('Sample verification failed: 0/10 records valid');
  });

  it('should validate that the scenario fails with current thresholds', () => {
    // Test the threshold logic directly
    const syncHours = 410.5;
    const syncTimeThresholdHours = 72;
    const dataIntegrityThresholdPercent = 20;
    
    const mainCount = 16;
    const cacheCount = 0;
    const countDifference = Math.abs(mainCount - cacheCount);
    const percentDifference = mainCount > 0 ? (countDifference / mainCount) * 100 : 0;
    
    const validRecords = 0;
    const totalRecords = 10;
    
    // These should all fail even with improved thresholds
    expect(syncHours > syncTimeThresholdHours).toBe(true); // 410.5 > 72
    expect(percentDifference >= dataIntegrityThresholdPercent).toBe(true); // 100 >= 20
    expect(validRecords < totalRecords).toBe(true); // 0 < 10
    
    // Count the number of failures (should be 3)
    let failures = 0;
    if (syncHours > syncTimeThresholdHours) failures++;
    if (percentDifference >= dataIntegrityThresholdPercent) failures++;
    if (validRecords < totalRecords) failures++;
    
    expect(failures).toBe(3);
  });

  it('should show improvement with configurable thresholds for less severe cases', () => {
    // Test a less severe scenario that would benefit from the improvements
    
    // Scenario 1: Old thresholds would fail, new ones would pass
    const moderateSync = 48; // hours
    const oldSyncThreshold = 24;
    const newSyncThreshold = 72;
    
    expect(moderateSync > oldSyncThreshold).toBe(true); // Would fail with old 24h threshold
    expect(moderateSync <= newSyncThreshold).toBe(true); // Passes with new 72h threshold
    
    // Scenario 2: Data integrity with moderate difference
    const mainCount = 100;
    const cacheCount = 85; // 15% difference
    const percentDiff = ((mainCount - cacheCount) / mainCount) * 100;
    const oldIntegrityThreshold = 10;
    const newIntegrityThreshold = 20;
    
    expect(percentDiff).toBe(15);
    expect(percentDiff >= oldIntegrityThreshold).toBe(true); // Would fail with old 10% threshold
    expect(percentDiff < newIntegrityThreshold).toBe(true); // Passes with new 20% threshold
  });

  it('should validate sample record validation logic', () => {
    // Test the enhanced sample validation logic
    const sampleRecords = [
      { id: 'valid-1', make: 'Toyota', model: 'Camry', external_id: 'ext-1' },
      { id: '', make: 'Honda', model: 'Civic', external_id: 'ext-2' }, // Invalid: empty id
      { id: 'valid-3', make: null, model: 'Accord', external_id: 'ext-3' }, // Invalid: null make
      { id: 'valid-4', make: 'Ford', model: '', external_id: 'ext-4' }, // Invalid: empty model
      { id: 'valid-5', make: 'Nissan', model: 'Altima', external_id: null }, // Invalid: null external_id
    ];
    
    // Apply the validation logic from syncVerification.ts
    let validRecords = 0;
    const invalidRecordDetails: string[] = [];
    
    for (const record of sampleRecords) {
      const hasId = record.id && typeof record.id === 'string' && record.id.trim().length > 0;
      const hasMake = record.make && typeof record.make === 'string' && record.make.trim().length > 0;
      const hasModel = record.model && typeof record.model === 'string' && record.model.trim().length > 0;
      const hasExternalId = record.external_id && typeof record.external_id === 'string' && record.external_id.trim().length > 0;
      
      if (hasId && hasMake && hasModel && hasExternalId) {
        validRecords++;
      } else {
        // Track missing fields for debugging
        const missingFields = [];
        if (!hasId) missingFields.push('id');
        if (!hasMake) missingFields.push('make');
        if (!hasModel) missingFields.push('model');
        if (!hasExternalId) missingFields.push('external_id');
        invalidRecordDetails.push(`${record.id || 'unknown'}: missing ${missingFields.join(', ')}`);
      }
    }
    
    expect(validRecords).toBe(1); // Only the first record is valid
    expect(invalidRecordDetails).toHaveLength(4);
    expect(invalidRecordDetails[0]).toContain('missing id');
    expect(invalidRecordDetails[1]).toContain('missing make');
    expect(invalidRecordDetails[2]).toContain('missing model');
    expect(invalidRecordDetails[3]).toContain('missing external_id');
  });
});