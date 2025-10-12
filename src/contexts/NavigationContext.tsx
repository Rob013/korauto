import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SearchReq } from '@/lib/search/types';
import { useFilterStore } from '@/store/filterStore';

interface FilterState {
  filters: SearchReq['filters'];
  sort: SearchReq['sort'];
  page: number;
  pageSize: number;
  query: string;
  showFilters?: boolean; // Add showFilters to track filter panel state
}

interface PageState {
  url: string;
  scrollPosition: number;
  filterPanelState?: boolean;
  filterState?: FilterState; // Add complete filter state
  timestamp: number;
}

interface NavigationContextType {
  previousPage: string | null;
  filterState: FilterState | null;
  pageState: PageState | null;
  setPreviousPage: (page: string, filters?: FilterState) => void;
  setCompletePageState: (pageState: PageState) => void;
  clearPreviousPage: () => void;
  goBack: () => void;
  restorePageState: () => boolean;
  getCurrentFilterState?: () => FilterState | null; // Add method to get current filter state
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [previousPage, setPreviousPageState] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<FilterState | null>(null);
  const [pageState, setPageState] = useState<PageState | null>(null);
  
  // Get access to filter store for state capture and restoration
  const filterStore = useFilterStore();

  const setPreviousPage = (page: string, filters?: FilterState) => {
    setPreviousPageState(page);
    if (filters) {
      setFilterState(filters);
    }
  };

  const getCurrentFilterState = (): FilterState | null => {
    return {
      filters: filterStore.filters,
      sort: filterStore.sort,
      page: filterStore.page,
      pageSize: filterStore.pageSize,
      query: filterStore.query,
    };
  };

  const setCompletePageState = (newPageState: PageState) => {
    // If filterState is not provided, capture current filter state
    if (!newPageState.filterState) {
      newPageState.filterState = getCurrentFilterState();
    }
    
    setPageState(newPageState);
    setPreviousPageState(newPageState.url);
    
    // Also save to sessionStorage for persistence across page reloads
    sessionStorage.setItem('korauto-complete-page-state', JSON.stringify(newPageState));
  };

  const clearPreviousPage = () => {
    setPreviousPageState(null);
    setFilterState(null);
    setPageState(null);
    sessionStorage.removeItem('korauto-complete-page-state');
  };

  const restorePageState = (): boolean => {
    if (pageState) {
      // Check if the saved state is recent (within 30 minutes)
      const isRecent = Date.now() - pageState.timestamp < 1800000;
      if (isRecent) {
        // Restore filter state if available
        if (pageState.filterState) {
          filterStore.setState(pageState.filterState);
          console.log('🔄 Restored filter state:', pageState.filterState);
        }
        
        // Restore scroll position with optimized timing for smoother experience
        if (pageState.scrollPosition > 0) {
          // Use requestAnimationFrame for smoother scroll restoration
          requestAnimationFrame(() => {
            setTimeout(() => {
              window.scrollTo({ top: pageState.scrollPosition, behavior: 'auto' });
            }, 50);
          });
        }
        
        // Always keep filter panel closed when restoring state
        // This ensures filter panel stays hidden after "Kthehu te Makinat" navigation
        sessionStorage.setItem('mobile-filter-panel-state', JSON.stringify(false));
        
        return true;
      }
    } else {
      // Try to restore from sessionStorage
      const savedState = sessionStorage.getItem('korauto-complete-page-state');
      if (savedState) {
        try {
          const parsedState: PageState = JSON.parse(savedState);
          const isRecent = Date.now() - parsedState.timestamp < 1800000;
          if (isRecent) {
            setPageState(parsedState);
            setPreviousPageState(parsedState.url);
            
            // Restore filter state if available
            if (parsedState.filterState) {
              filterStore.setState(parsedState.filterState);
              console.log('🔄 Restored filter state from sessionStorage:', parsedState.filterState);
            }
            
            // Restore scroll position with optimized timing for smoother experience
            if (parsedState.scrollPosition > 0) {
              // Use requestAnimationFrame for smoother scroll restoration
              requestAnimationFrame(() => {
                setTimeout(() => {
                  window.scrollTo({ top: parsedState.scrollPosition, behavior: 'auto' });
                }, 50);
              });
            }
            
            // Always keep filter panel closed when restoring state from sessionStorage
            // This ensures filter panel stays hidden after "Kthehu te Makinat" navigation
            sessionStorage.setItem('mobile-filter-panel-state', JSON.stringify(false));
            
            return true;
          }
        } catch (error) {
          console.warn('Failed to restore page state from sessionStorage:', error);
        }
      }
    }
    return false;
  };

  const goBack = () => {
    if (pageState && pageState.url) {
      // Navigate to the saved URL and let the target page handle state restoration
      window.location.href = pageState.url;
    } else if (previousPage) {
      // Fallback to simple navigation
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = previousPage;
      }
    } else {
      // Fallback to homepage
      window.location.href = '/';
    }
  };

  const value = {
    previousPage,
    filterState,
    pageState,
    setPreviousPage,
    setCompletePageState,
    clearPreviousPage,
    goBack,
    restorePageState,
    getCurrentFilterState,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};