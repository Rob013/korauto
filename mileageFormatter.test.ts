import { describe, it, expect } from 'vitest';
import { formatMileage, formatMileageNumber } from './src/utils/mileageFormatter';

describe('mileageFormatter', () => {
  describe('formatMileage', () => {
    it('should format numbers correctly with km unit', () => {
      expect(formatMileage(100798)).toBe('100,798 km');
      expect(formatMileage(25000)).toBe('25,000 km');
      expect(formatMileage(1234567)).toBe('1,234,567 km');
      expect(formatMileage(0)).toBe('0 km');
      expect(formatMileage(999)).toBe('999 km');
    });

    it('should format string numbers correctly', () => {
      expect(formatMileage('100798')).toBe('100,798 km');
      expect(formatMileage('25000')).toBe('25,000 km');
    });

    it('should handle string numbers with existing commas', () => {
      expect(formatMileage('100,798')).toBe('100,798 km');
      expect(formatMileage('1,234,567')).toBe('1,234,567 km');
    });

    it('should handle null and undefined values', () => {
      expect(formatMileage(null)).toBeUndefined();
      expect(formatMileage(undefined)).toBeUndefined();
    });

    it('should handle invalid values', () => {
      expect(formatMileage(-1)).toBeUndefined();
      expect(formatMileage('invalid')).toBeUndefined();
      expect(formatMileage('')).toBeUndefined();
    });
  });

  describe('formatMileageNumber', () => {
    it('should format numbers correctly without unit', () => {
      expect(formatMileageNumber(100798)).toBe('100,798');
      expect(formatMileageNumber(25000)).toBe('25,000');
      expect(formatMileageNumber(1234567)).toBe('1,234,567');
      expect(formatMileageNumber(0)).toBe('0');
    });

    it('should format string numbers correctly', () => {
      expect(formatMileageNumber('100798')).toBe('100,798');
      expect(formatMileageNumber('25000')).toBe('25,000');
    });

    it('should handle null and undefined values', () => {
      expect(formatMileageNumber(null)).toBeUndefined();
      expect(formatMileageNumber(undefined)).toBeUndefined();
    });

    it('should handle invalid values', () => {
      expect(formatMileageNumber(-1)).toBeUndefined();
      expect(formatMileageNumber('invalid')).toBeUndefined();
    });
  });
});