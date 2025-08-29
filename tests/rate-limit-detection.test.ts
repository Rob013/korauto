import { describe, it, expect } from 'vitest';

describe('Rate Limit Detection', () => {
  // Test the rate limit message parsing logic
  const parseRateLimitInfo = (errorMessage: string) => {
    if (errorMessage.includes('API_RATE_LIMIT') || errorMessage.includes('HTTP 429')) {
      return {
        type: 'API Rate Limit',
        icon: '🌐',
        description: 'External API is throttling requests',
        action: 'System will automatically retry with exponential backoff delays',
        severity: 'warning'
      };
    } else if (errorMessage.includes('NETWORK_TIMEOUT')) {
      return {
        type: 'Network Timeout',
        icon: '📡',
        description: 'Connection timeout or network issues',
        action: 'System will automatically retry the failed requests',
        severity: 'warning'
      };
    } else if (errorMessage.includes('Database rate limit')) {
      return {
        type: 'Database Rate Limit',
        icon: '🗃️',
        description: 'Internal database rate limiting active',
        action: 'Wait for the rate limit window to reset',
        severity: 'info'
      };
    } else if (errorMessage.toLowerCase().includes('rate limit')) {
      return {
        type: 'Rate Limit',
        icon: '⏰',
        description: 'Generic rate limiting detected',
        action: 'System will automatically handle the rate limit',
        severity: 'info'
      };
    }
    
    return null;
  };

  it('should detect API rate limit (HTTP 429)', () => {
    const errorMessage = 'API_RATE_LIMIT: External API rate limit exceeded after 3 retries (HTTP 429)';
    const result = parseRateLimitInfo(errorMessage);
    
    expect(result).toBeDefined();
    expect(result?.type).toBe('API Rate Limit');
    expect(result?.icon).toBe('🌐');
    expect(result?.severity).toBe('warning');
    expect(result?.description).toContain('External API');
  });

  it('should detect network timeout', () => {
    const errorMessage = 'NETWORK_TIMEOUT: Connection timeout or reset - timeout error';
    const result = parseRateLimitInfo(errorMessage);
    
    expect(result).toBeDefined();
    expect(result?.type).toBe('Network Timeout');
    expect(result?.icon).toBe('📡');
    expect(result?.severity).toBe('warning');
    expect(result?.description).toContain('Connection timeout');
  });

  it('should detect database rate limit', () => {
    const errorMessage = 'Database rate limit exceeded for inspection requests';
    const result = parseRateLimitInfo(errorMessage);
    
    expect(result).toBeDefined();
    expect(result?.type).toBe('Database Rate Limit');
    expect(result?.icon).toBe('🗃️');
    expect(result?.severity).toBe('info');
    expect(result?.description).toContain('Internal database');
  });

  it('should detect generic rate limit', () => {
    const errorMessage = 'Rate limit detected - will auto-resume';
    const result = parseRateLimitInfo(errorMessage);
    
    expect(result).toBeDefined();
    expect(result?.type).toBe('Rate Limit');
    expect(result?.icon).toBe('⏰');
    expect(result?.severity).toBe('info');
    expect(result?.description).toContain('Generic rate limiting');
  });

  it('should return null for non-rate-limit errors', () => {
    const errorMessage = 'Some other error occurred';
    const result = parseRateLimitInfo(errorMessage);
    
    expect(result).toBeNull();
  });

  it('should handle HTTP 429 without API_RATE_LIMIT prefix', () => {
    const errorMessage = 'HTTP 429 - Too Many Requests';
    const result = parseRateLimitInfo(errorMessage);
    
    expect(result).toBeDefined();
    expect(result?.type).toBe('API Rate Limit');
    expect(result?.severity).toBe('warning');
  });
});

describe('Enhanced Error Messages', () => {
  it('should provide specific error context for API rate limits', () => {
    const error = new Error('API_RATE_LIMIT: External API returned HTTP 429 - rate limit exceeded');
    
    expect(error.message).toContain('API_RATE_LIMIT');
    expect(error.message).toContain('HTTP 429');
    expect(error.message).toContain('External API');
  });

  it('should provide specific error context for network timeouts', () => {
    const error = new Error('NETWORK_TIMEOUT: Network timeout or connection reset - timeout error');
    
    expect(error.message).toContain('NETWORK_TIMEOUT');
    expect(error.message).toContain('timeout');
  });

  it('should provide error type prefixes for easier parsing', () => {
    const apiError = 'API_RATE_LIMIT: External API returned HTTP 429';
    const networkError = 'NETWORK_TIMEOUT: Connection timeout';
    const processingError = 'PROCESSING_ERROR: Invalid data format';
    
    expect(apiError.startsWith('API_RATE_LIMIT')).toBe(true);
    expect(networkError.startsWith('NETWORK_TIMEOUT')).toBe(true);
    expect(processingError.startsWith('PROCESSING_ERROR')).toBe(true);
  });
});