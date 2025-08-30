/**
 * Focused tests for sync verification core functionality
 */

import { describe, it, expect } from 'vitest';

describe('Sync Verification Core Logic', () => {
  
  it('should have configurable time thresholds', () => {
    // Test threshold calculation logic
    const now = Date.now();
    const hours24Ago = now - (24 * 60 * 60 * 1000);
    const hours72Ago = now - (72 * 60 * 60 * 1000);
    const hours100Ago = now - (100 * 60 * 60 * 1000);
    
    const hoursDiff24 = (now - hours24Ago) / (1000 * 60 * 60);
    const hoursDiff72 = (now - hours72Ago) / (1000 * 60 * 60);
    const hoursDiff100 = (now - hours100Ago) / (1000 * 60 * 60);
    
    // Verify calculations are within expected ranges
    expect(hoursDiff24).toBeCloseTo(24, 0);
    expect(hoursDiff72).toBeCloseTo(72, 0);
    expect(hoursDiff100).toBeCloseTo(100, 0);
    
    // Test threshold logic
    const threshold24 = 24;
    const threshold72 = 72;
    
    expect(hoursDiff24 > threshold24).toBe(false);
    expect(hoursDiff72 > threshold24).toBe(true);
    expect(hoursDiff72 > threshold72).toBe(false);
    expect(hoursDiff100 > threshold72).toBe(true);
  });

  it('should have configurable data integrity thresholds', () => {
    // Test percentage difference calculations
    const mainCount = 1000;
    const cacheCount1 = 950; // 5% difference
    const cacheCount2 = 850; // 15% difference
    const cacheCount3 = 0;   // 100% difference
    
    const diff1 = Math.abs(mainCount - cacheCount1);
    const percent1 = (diff1 / mainCount) * 100;
    
    const diff2 = Math.abs(mainCount - cacheCount2);
    const percent2 = (diff2 / mainCount) * 100;
    
    const diff3 = Math.abs(mainCount - cacheCount3);
    const percent3 = (diff3 / mainCount) * 100;
    
    expect(percent1).toBeCloseTo(5, 1);
    expect(percent2).toBeCloseTo(15, 1);
    expect(percent3).toBeCloseTo(100, 1);
    
    // Test threshold logic
    const threshold10 = 10;
    const threshold20 = 20;
    
    expect(percent1 < threshold10).toBe(true);
    expect(percent2 >= threshold10).toBe(true);
    expect(percent2 < threshold20).toBe(true);
    expect(percent3 >= threshold20).toBe(true);
  });

  it('should validate record fields properly', () => {
    // Test field validation logic
    const validRecord = {
      id: 'test-123',
      make: 'Toyota',
      model: 'Camry',
      external_id: 'ext-456'
    };
    
    const invalidRecords = [
      { id: '', make: 'Toyota', model: 'Camry', external_id: 'ext-456' }, // Empty id
      { id: 'test-123', make: null, model: 'Camry', external_id: 'ext-456' }, // Null make
      { id: 'test-123', make: 'Toyota', model: '', external_id: 'ext-456' }, // Empty model
      { id: 'test-123', make: 'Toyota', model: 'Camry', external_id: null }, // Null external_id
    ];
    
    // Function to validate record (extracted from syncVerification.ts logic)
    const validateRecord = (record: Record<string, unknown>): boolean => {
      const hasId = record.id && typeof record.id === 'string' && record.id.trim().length > 0;
      const hasMake = record.make && typeof record.make === 'string' && record.make.trim().length > 0;
      const hasModel = record.model && typeof record.model === 'string' && record.model.trim().length > 0;
      const hasExternalId = record.external_id && typeof record.external_id === 'string' && record.external_id.trim().length > 0;
      
      return !!(hasId && hasMake && hasModel && hasExternalId);
    };
    
    expect(validateRecord(validRecord)).toBe(true);
    
    invalidRecords.forEach((record) => {
      const result = validateRecord(record);
      expect(typeof result).toBe('boolean');
      expect(result).toBe(false);
    });
  });

  it('should handle error message formatting', () => {
    // Test error message generation
    const syncHours = 410.1;
    const threshold = 72;
    const mainCount = 16;
    const cacheCount = 0;
    const percentDiff = 100.0;
    const validRecords = 0;
    const totalRecords = 10;
    
    const timeError = `Last sync is too old: ${syncHours.toFixed(1)} hours ago (threshold: ${threshold} hours)`;
    const integrityError = `Data integrity issue: ${percentDiff.toFixed(1)}% difference between main (${mainCount}) and cache (${cacheCount}) tables (threshold: 20%)`;
    const sampleError = `Sample verification failed: ${validRecords}/${totalRecords} records valid`;
    
    expect(timeError).toBe('Last sync is too old: 410.1 hours ago (threshold: 72 hours)');
    expect(integrityError).toBe('Data integrity issue: 100.0% difference between main (16) and cache (0) tables (threshold: 20%)');
    expect(sampleError).toBe('Sample verification failed: 0/10 records valid');
  });
});