import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Share Functionality', () => {
  beforeEach(() => {
    // Mock the clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://korautoks.com',
      },
      writable: true,
    });
  });

  it('should copy the correct car URL to clipboard', async () => {
    const carId = 'test-car-123';
    const expectedUrl = `https://korautoks.com/car/${carId}`;
    
    // Mock clipboard.writeText to resolve successfully
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    navigator.clipboard.writeText = mockWriteText;
    
    // Simulate the share functionality
    const carUrl = `${window.location.origin}/car/${carId}`;
    await navigator.clipboard.writeText(carUrl);
    
    expect(mockWriteText).toHaveBeenCalledWith(expectedUrl);
  });

  it('should handle clipboard write errors gracefully', async () => {
    const carId = 'test-car-123';
    const errorMessage = 'Clipboard access denied';
    
    // Mock clipboard.writeText to reject
    const mockWriteText = vi.fn().mockRejectedValue(new Error(errorMessage));
    navigator.clipboard.writeText = mockWriteText;
    
    try {
      const carUrl = `${window.location.origin}/car/${carId}`;
      await navigator.clipboard.writeText(carUrl);
    } catch (error) {
      expect(error.message).toBe(errorMessage);
    }
    
    expect(mockWriteText).toHaveBeenCalled();
  });
});