import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCarFilterStore } from '@/store/carFilterStore';

describe('useCarFilterStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCarFilterStore.getState().clearFilters();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    expect(result.current.filters).toEqual({});
    expect(result.current.sort).toEqual({ field: 'created_at', direction: 'desc' });
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.showAdvancedFilters).toBe(false);
  });

  it('should set single filter correctly', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    act(() => {
      result.current.setFilter('make', 'BMW');
    });
    
    expect(result.current.filters.make).toBe('BMW');
    expect(result.current.page).toBe(1); // Should reset page
  });

  it('should remove filter when value is empty', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    act(() => {
      result.current.setFilter('make', 'BMW');
    });
    
    expect(result.current.filters.make).toBe('BMW');
    
    act(() => {
      result.current.setFilter('make', '');
    });
    
    expect(result.current.filters.make).toBeUndefined();
  });

  it('should update multiple filters at once', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    act(() => {
      result.current.updateFilters({
        make: 'BMW',
        model: 'X3',
        year: { min: 2020, max: 2024 }
      });
    });
    
    expect(result.current.filters.make).toBe('BMW');
    expect(result.current.filters.model).toBe('X3');
    expect(result.current.filters.year).toEqual({ min: 2020, max: 2024 });
    expect(result.current.page).toBe(1);
  });

  it('should clear all filters', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    act(() => {
      result.current.updateFilters({
        make: 'BMW',
        model: 'X3',
        year: { min: 2020, max: 2024 }
      });
    });
    
    expect(Object.keys(result.current.filters)).toHaveLength(3);
    
    act(() => {
      result.current.clearFilters();
    });
    
    expect(result.current.filters).toEqual({});
    expect(result.current.page).toBe(1);
  });

  it('should clear specific filter', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    act(() => {
      result.current.updateFilters({
        make: 'BMW',
        model: 'X3',
      });
    });
    
    act(() => {
      result.current.clearFilter('make');
    });
    
    expect(result.current.filters.make).toBeUndefined();
    expect(result.current.filters.model).toBe('X3');
  });

  it('should set sort correctly', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    act(() => {
      result.current.setSort({ field: 'price', direction: 'asc' });
    });
    
    expect(result.current.sort).toEqual({ field: 'price', direction: 'asc' });
  });

  it('should handle pagination correctly', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    act(() => {
      result.current.setPage(3);
    });
    
    expect(result.current.page).toBe(3);
    
    act(() => {
      result.current.setPageSize(50);
    });
    
    expect(result.current.pageSize).toBe(50);
    expect(result.current.page).toBe(1); // Should reset page when page size changes
  });

  it('should count active filters correctly', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    expect(result.current.getActiveFilterCount()).toBe(0);
    expect(result.current.hasActiveFilters()).toBe(false);
    
    act(() => {
      result.current.updateFilters({
        make: 'BMW',
        year: { min: 2020 },
        query: 'test',
      });
    });
    
    expect(result.current.getActiveFilterCount()).toBe(3);
    expect(result.current.hasActiveFilters()).toBe(true);
  });

  it('should get clean filters for query', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    act(() => {
      result.current.updateFilters({
        make: 'BMW',
        model: '',  // Empty string should be filtered out
        year: { min: 2020, max: 2024 },
        query: '   ',  // Whitespace should be filtered out
        price: { min: undefined, max: 50000 },  // Only max should remain
      });
    });
    
    const cleanFilters = result.current.getFiltersForQuery();
    
    expect(cleanFilters.make).toBe('BMW');
    expect(cleanFilters.model).toBeUndefined();
    expect(cleanFilters.query).toBeUndefined();
    expect(cleanFilters.year).toEqual({ min: 2020, max: 2024 });
    expect(cleanFilters.price).toEqual({ max: 50000 });
  });

  it('should handle range filters correctly', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    act(() => {
      result.current.setFilter('year', { min: 2020 });
    });
    
    expect(result.current.filters.year).toEqual({ min: 2020 });
    
    act(() => {
      result.current.setFilter('year', { min: 2020, max: 2024 });
    });
    
    expect(result.current.filters.year).toEqual({ min: 2020, max: 2024 });
    
    // Empty range should remove the filter
    act(() => {
      result.current.setFilter('year', {});
    });
    
    expect(result.current.filters.year).toBeUndefined();
  });

  it('should update available options', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    const mockMakes = [
      { value: 'bmw', label: 'BMW', count: 100 },
      { value: 'audi', label: 'Audi', count: 80 },
    ];
    
    act(() => {
      result.current.setAvailableOptions({ makes: mockMakes });
    });
    
    expect(result.current.availableOptions.makes).toEqual(mockMakes);
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    expect(result.current.isLoading).toBe(false);
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.isLoading).toBe(true);
  });

  it('should handle advanced filters toggle', () => {
    const { result } = renderHook(() => useCarFilterStore());
    
    expect(result.current.showAdvancedFilters).toBe(false);
    
    act(() => {
      result.current.setShowAdvancedFilters(true);
    });
    
    expect(result.current.showAdvancedFilters).toBe(true);
  });
});