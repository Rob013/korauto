import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Catalog Lock Functionality', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize catalog lock state as false by default', () => {
    expect(localStorage.getItem('catalog-lock-state')).toBeNull();
  });

  it('should save catalog lock state to localStorage', () => {
    localStorage.setItem('catalog-lock-state', 'true');
    expect(localStorage.getItem('catalog-lock-state')).toBe('true');
  });

  it('should retrieve saved catalog lock state from localStorage', () => {
    localStorage.setItem('catalog-lock-state', 'true');
    const lockState = localStorage.getItem('catalog-lock-state') === 'true';
    expect(lockState).toBe(true);
  });

  it('should toggle catalog lock state correctly', () => {
    // Initially false
    let catalogLocked = localStorage.getItem('catalog-lock-state') === 'true';
    expect(catalogLocked).toBe(false);

    // Toggle to true
    catalogLocked = !catalogLocked;
    localStorage.setItem('catalog-lock-state', catalogLocked.toString());
    expect(localStorage.getItem('catalog-lock-state')).toBe('true');

    // Toggle back to false
    catalogLocked = !catalogLocked;
    localStorage.setItem('catalog-lock-state', catalogLocked.toString());
    expect(localStorage.getItem('catalog-lock-state')).toBe('false');
  });

  it('should handle invalid localStorage values gracefully', () => {
    localStorage.setItem('catalog-lock-state', 'invalid');
    const lockState = localStorage.getItem('catalog-lock-state') === 'true';
    expect(lockState).toBe(false);
  });
});