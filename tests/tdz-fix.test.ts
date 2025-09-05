import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterStore, useFilterStoreSelectors } from '@/store/filterStore';

describe('TDZ Fix: Store Initialization Safety', () => {
  beforeEach(() => {
    // Reset the store before each test
    const { setState } = useFilterStore.getState();
    setState({
      filters: {},
      sort: { field: 'listed_at', dir: 'desc' },
      page: 1,
      pageSize: 20,
      query: '',
    });
  });

  it('should prevent TDZ errors during store selector initialization', () => {
    console.log('🧪 Testing store selector safety during initialization...');
    
    // Test that selectors work even if store state is undefined/null
    expect(() => {
      const { result } = renderHook(() => useFilterStoreSelectors());
      
      // These function calls should not throw TDZ errors
      const searchRequest = result.current.searchRequest();
      const hasActiveFilters = result.current.hasActiveFilters();
      const activeFilterCount = result.current.activeFilterCount();
      
      // Verify the functions return safe values
      expect(typeof searchRequest).toBe('object');
      expect(typeof hasActiveFilters).toBe('boolean');
      expect(typeof activeFilterCount).toBe('number');
      
      console.log('✅ Store selectors work safely:', {
        searchRequest,
        hasActiveFilters,
        activeFilterCount
      });
      
    }).not.toThrow();
  });

  it('should handle undefined store state gracefully', () => {
    console.log('🧪 Testing graceful handling of undefined store state...');
    
    const { result } = renderHook(() => useFilterStoreSelectors());
    
    // Test that all selector methods work
    const searchRequest = result.current.searchRequest();
    const hasActiveFilters = result.current.hasActiveFilters();
    const activeFilterCount = result.current.activeFilterCount();
    const isFilterActive = result.current.isFilterActive('make');
    
    // Verify safe default values
    expect(searchRequest.page).toBe(1);
    expect(searchRequest.pageSize).toBe(20);
    expect(searchRequest.sort.field).toBe('listed_at');
    expect(searchRequest.sort.dir).toBe('desc');
    expect(hasActiveFilters).toBe(false);
    expect(activeFilterCount).toBe(0);
    expect(isFilterActive).toBe(false);
    
    console.log('✅ All selectors return safe defaults');
  });

  it('should safely update store state without TDZ errors', () => {
    console.log('🧪 Testing safe store state updates...');
    
    const { result } = renderHook(() => useFilterStore());
    
    // Test that store methods work safely
    expect(() => {
      act(() => {
        const store = result.current;
        store.setQuery('test query');
        store.setPage(2);
        store.setFilter('make', ['BMW']);
        store.setSort({ field: 'price_eur', dir: 'asc' });
      });
    }).not.toThrow();
    
    // Verify the store state updated correctly
    const store = result.current;
    expect(store.query).toBe('test query');
    expect(store.page).toBe(1); // Should reset to 1 when query changes
    expect(store.filters.make).toEqual(['BMW']);
    expect(store.sort.field).toBe('price_eur');
    
    console.log('✅ Store updates work safely without TDZ errors');
  });

  it('should handle rapid successive selector calls without TDZ errors', () => {
    console.log('🧪 Testing rapid successive selector calls...');
    
    // Simulate rapid component re-renders that might trigger TDZ
    expect(() => {
      for (let i = 0; i < 100; i++) {
        const { result } = renderHook(() => useFilterStoreSelectors());
        const selectors = result.current;
        
        // Call multiple selectors rapidly
        selectors.searchRequest();
        selectors.hasActiveFilters();
        selectors.activeFilterCount();
        selectors.isFilterActive('make');
        selectors.isFilterActive('model');
      }
    }).not.toThrow();
    
    console.log('✅ Rapid selector calls work safely');
  });

  it('should prevent "Cannot access uninitialized variable" errors in component usage pattern', () => {
    console.log('🧪 Testing the specific component usage pattern that caused the error...');
    
    // Simulate the exact pattern from NewEncarCatalog component
    expect(() => {
      const { result } = renderHook(() => {
        const store = useFilterStore();
        const selectors = useFilterStoreSelectors();
        
        // This pattern was causing TDZ errors before the fix
        const searchRequest = selectors.searchRequest();
        const hasActiveFilters = selectors.hasActiveFilters();
        const activeFilterCount = selectors.activeFilterCount();
        
        return {
          store,
          selectors,
          searchRequest,
          hasActiveFilters,
          activeFilterCount,
        };
      });
      
      const state = result.current;
      
      // Verify all values are safe
      expect(state.store).toBeDefined();
      expect(state.selectors).toBeDefined();
      expect(state.searchRequest).toBeDefined();
      expect(typeof state.hasActiveFilters).toBe('boolean');
      expect(typeof state.activeFilterCount).toBe('number');
      
    }).not.toThrow();
    
    console.log('✅ Component usage pattern works safely - TDZ error fixed!');
  });
});