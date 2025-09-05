import { describe, it, expect } from 'vitest';
import { getStatusBadgeConfig } from '../src/utils/statusBadgeUtils';

describe('Status Badge Configuration', () => {
  it('should return SOLD badge for status 3', () => {
    const result = getStatusBadgeConfig({ status: 3 });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('SOLD');
    expect(result.className).toBe('bg-red-600 text-white');
  });

  it('should return SOLD badge for sale_status sold', () => {
    const result = getStatusBadgeConfig({ sale_status: 'sold' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('SOLD');
    expect(result.className).toBe('bg-red-600 text-white');
  });

  it('should prioritize status 3 over sale_status sold (both should show SOLD)', () => {
    const result = getStatusBadgeConfig({ status: 3, sale_status: 'sold' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('SOLD');
    expect(result.className).toBe('bg-red-600 text-white');
  });

  it('should return RESERVED badge for sale_status reserved', () => {
    const result = getStatusBadgeConfig({ sale_status: 'reserved' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('RESERVED');
    expect(result.className).toBe('bg-orange-500 text-white');
  });

  it('should return PENDING badge for status 2', () => {
    const result = getStatusBadgeConfig({ status: 2 });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('PENDING');
    expect(result.className).toBe('bg-yellow-500 text-black');
  });

  it('should return PENDING badge for sale_status pending', () => {
    const result = getStatusBadgeConfig({ sale_status: 'pending' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('PENDING');
    expect(result.className).toBe('bg-yellow-500 text-black');
  });

  it('should prioritize SOLD over RESERVED', () => {
    const result = getStatusBadgeConfig({ status: 3, sale_status: 'reserved' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('SOLD');
    expect(result.className).toBe('bg-red-600 text-white');
  });

  it('should prioritize RESERVED over PENDING', () => {
    const result = getStatusBadgeConfig({ status: 2, sale_status: 'reserved' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('RESERVED');
    expect(result.className).toBe('bg-orange-500 text-white');
  });

  it('should not show badge for available cars (status 1)', () => {
    const result = getStatusBadgeConfig({ status: 1 });
    
    expect(result.show).toBe(false);
    expect(result.text).toBe('');
    expect(result.className).toBe('');
  });

  it('should not show badge for active sale_status', () => {
    const result = getStatusBadgeConfig({ sale_status: 'active' });
    
    expect(result.show).toBe(false);
    expect(result.text).toBe('');
    expect(result.className).toBe('');
  });

  it('should not show badge when no status is provided', () => {
    const result = getStatusBadgeConfig({});
    
    expect(result.show).toBe(false);
    expect(result.text).toBe('');
    expect(result.className).toBe('');
  });

  it('should handle undefined values gracefully', () => {
    const result = getStatusBadgeConfig({ status: undefined, sale_status: undefined });
    
    expect(result.show).toBe(false);
    expect(result.text).toBe('');
    expect(result.className).toBe('');
  });

  it('should return SOLD badge for status 3 as string', () => {
    const result = getStatusBadgeConfig({ status: '3' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('SOLD');
    expect(result.className).toBe('bg-red-600 text-white');
  });

  it('should return PENDING badge for status 2 as string', () => {
    const result = getStatusBadgeConfig({ status: '2' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('PENDING');
    expect(result.className).toBe('bg-yellow-500 text-black');
  });

  it('should handle invalid string status gracefully', () => {
    const result = getStatusBadgeConfig({ status: 'invalid' });
    
    expect(result.show).toBe(false);
    expect(result.text).toBe('');
    expect(result.className).toBe('');
  });

  it('should prioritize numeric status over string sale_status', () => {
    const result = getStatusBadgeConfig({ status: 3, sale_status: 'pending' });
    
    expect(result.show).toBe(true);
    expect(result.text).toBe('SOLD');
    expect(result.className).toBe('bg-red-600 text-white');
  });

  it('should handle unknown status values gracefully', () => {
    const result = getStatusBadgeConfig({ status: 999, sale_status: 'unknown' });
    
    expect(result.show).toBe(false);
    expect(result.text).toBe('');
    expect(result.className).toBe('');
  });
});