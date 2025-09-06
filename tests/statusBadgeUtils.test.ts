import { describe, it, expect } from 'vitest';
import { getStatusBadgeConfig } from '../src/utils/statusBadgeUtils';

describe('Status Badge Configuration', () => {
  it('should return SOLD badge for status 3', () => {
    const result = getStatusBadgeConfig({ status: 3 });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('SOLD');
    expect(result.className).toBe('bg-red-600 text-white border-red-700');
  });

  it('should return SOLD badge for sale_status sold', () => {
    const result = getStatusBadgeConfig({ sale_status: 'sold' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('SOLD');
    expect(result.className).toBe('bg-red-600 text-white border-red-700');
  });

  it('should prioritize status 3 over sale_status sold (both should show SOLD)', () => {
    const result = getStatusBadgeConfig({ status: 3, sale_status: 'sold' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('SOLD');
    expect(result.className).toBe('bg-red-600 text-white border-red-700');
  });

  it('should return RESERVED badge for sale_status reserved', () => {
    const result = getStatusBadgeConfig({ sale_status: 'reserved' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('RESERVED');
    expect(result.className).toBe('bg-orange-600 text-white border-orange-700');
  });

  it('should return PENDING badge for status 2', () => {
    const result = getStatusBadgeConfig({ status: 2 });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('PENDING');
    expect(result.className).toBe('bg-yellow-600 text-black border-yellow-700');
  });

  it('should return PENDING badge for sale_status pending', () => {
    const result = getStatusBadgeConfig({ sale_status: 'pending' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('PENDING');
    expect(result.className).toBe('bg-yellow-600 text-black border-yellow-700');
  });

  it('should prioritize SOLD over RESERVED', () => {
    const result = getStatusBadgeConfig({ status: 3, sale_status: 'reserved' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('SOLD');
    expect(result.className).toBe('bg-red-600 text-white border-red-700');
  });

  it('should prioritize RESERVED over PENDING', () => {
    const result = getStatusBadgeConfig({ status: 2, sale_status: 'reserved' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('RESERVED');
    expect(result.className).toBe('bg-orange-600 text-white border-orange-700');
  });

  it('should show AVAILABLE badge for available cars (status 1)', () => {
    const result = getStatusBadgeConfig({ status: 1 });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('AVAILABLE');
    expect(result.className).toBe('bg-white text-black border-gray-300');
  });

  it('should show AVAILABLE badge for active sale_status', () => {
    const result = getStatusBadgeConfig({ sale_status: 'active' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('AVAILABLE');
    expect(result.className).toBe('bg-white text-black border-gray-300');
  });

  it('should show AVAILABLE badge when no status is provided', () => {
    const result = getStatusBadgeConfig({});
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('AVAILABLE');
    expect(result.className).toBe('bg-white text-black border-gray-300');
  });

  it('should show AVAILABLE badge for undefined values', () => {
    const result = getStatusBadgeConfig({ status: undefined, sale_status: undefined });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('AVAILABLE');
    expect(result.className).toBe('bg-white text-black border-gray-300');
  });

  it('should return SOLD badge for status 3 as string', () => {
    const result = getStatusBadgeConfig({ status: '3' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('SOLD');
    expect(result.className).toBe('bg-red-600 text-white border-red-700');
  });

  it('should return PENDING badge for status 2 as string', () => {
    const result = getStatusBadgeConfig({ status: '2' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('PENDING');
    expect(result.className).toBe('bg-yellow-600 text-black border-yellow-700');
  });

  it('should show AVAILABLE badge for invalid string status', () => {
    const result = getStatusBadgeConfig({ status: 'invalid' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('AVAILABLE');
    expect(result.className).toBe('bg-white text-black border-gray-300');
  });

  it('should prioritize numeric status over string sale_status', () => {
    const result = getStatusBadgeConfig({ status: 3, sale_status: 'pending' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('SOLD');
    expect(result.className).toBe('bg-red-600 text-white border-red-700');
  });

  it('should show AVAILABLE badge for unknown status values', () => {
    const result = getStatusBadgeConfig({ status: 999, sale_status: 'unknown' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('AVAILABLE');
    expect(result.className).toBe('bg-white text-black border-gray-300');
  });
});