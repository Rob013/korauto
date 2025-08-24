import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterState {
  filterMake: string;
  filterYear: string;
  filterFuel: string;
  filterColor: string;
  filterTransmission: string;
  filterBodyType: string;
  filterCondition: string;
  priceRange: number[];
  mileageRange: number[];
  sortBy: string;
  searchTerm?: string;
  showFilters?: boolean; // Add showFilters to track filter panel state
}

interface PageState {
  url: string;
  scrollPosition: number;
  filterPanelState?: boolean;
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

  const setPreviousPage = (page: string, filters?: FilterState) => {
    setPreviousPageState(page);
    if (filters) {
      setFilterState(filters);
    }
  };

  const setCompletePageState = (newPageState: PageState) => {
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
        // Restore scroll position
        if (pageState.scrollPosition > 0) {
          setTimeout(() => {
            window.scrollTo({ top: pageState.scrollPosition, behavior: 'auto' });
          }, 100);
        }
        
        // Restore filter panel state if specified
        if (pageState.filterPanelState !== undefined) {
          sessionStorage.setItem('mobile-filter-panel-state', JSON.stringify(pageState.filterPanelState));
        }
        
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
            
            // Restore scroll position
            if (parsedState.scrollPosition > 0) {
              setTimeout(() => {
                window.scrollTo({ top: parsedState.scrollPosition, behavior: 'auto' });
              }, 100);
            }
            
            // Restore filter panel state if specified
            if (parsedState.filterPanelState !== undefined) {
              sessionStorage.setItem('mobile-filter-panel-state', JSON.stringify(parsedState.filterPanelState));
            }
            
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
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};