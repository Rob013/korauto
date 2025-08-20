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
  showFilters?: boolean;
}

interface PageState {
  path: string;
  filters: any;
  sortBy: string;
  currentPage: number;
  scrollPosition: number;
  timestamp: number;
}

interface NavigationContextType {
  previousPage: string | null;
  filterState: FilterState | null;
  pageStates: Map<string, PageState>;
  setPreviousPage: (page: string, filters?: FilterState) => void;
  clearPreviousPage: () => void;
  goBack: () => void;
  savePageState: (path: string, state: Omit<PageState, 'timestamp'>) => void;
  getPageState: (path: string) => PageState | null;
  clearPageState: (path: string) => void;
  clearAllPageStates: () => void;
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
  const [pageStates, setPageStates] = useState<Map<string, PageState>>(new Map());

  // Load page states from sessionStorage on mount
  React.useEffect(() => {
    try {
      const savedStates = sessionStorage.getItem('korauto-page-states');
      if (savedStates) {
        const parsedStates = new Map(JSON.parse(savedStates));
        setPageStates(parsedStates);
      }
    } catch (error) {
      console.error('Error loading page states:', error);
    }
  }, []);

  // Save page states to sessionStorage whenever they change
  React.useEffect(() => {
    try {
      const statesArray = Array.from(pageStates.entries());
      sessionStorage.setItem('korauto-page-states', JSON.stringify(statesArray));
    } catch (error) {
      console.error('Error saving page states:', error);
    }
  }, [pageStates]);

  const setPreviousPage = (page: string, filters?: FilterState) => {
    setPreviousPageState(page);
    if (filters) {
      setFilterState(filters);
    }
  };

  const clearPreviousPage = () => {
    setPreviousPageState(null);
    setFilterState(null);
  };

  const savePageState = (path: string, state: Omit<PageState, 'timestamp'>) => {
    const pageState: PageState = {
      ...state,
      timestamp: Date.now()
    };
    
    setPageStates(prev => {
      const newStates = new Map(prev);
      newStates.set(path, pageState);
      return newStates;
    });
  };

  const getPageState = (path: string): PageState | null => {
    const state = pageStates.get(path);
    if (!state) return null;
    
    // Check if state is still valid (within 30 minutes)
    const isExpired = Date.now() - state.timestamp > 30 * 60 * 1000;
    if (isExpired) {
      clearPageState(path);
      return null;
    }
    
    return state;
  };

  const clearPageState = (path: string) => {
    setPageStates(prev => {
      const newStates = new Map(prev);
      newStates.delete(path);
      return newStates;
    });
  };

  const clearAllPageStates = () => {
    setPageStates(new Map());
    sessionStorage.removeItem('korauto-page-states');
  };

  const goBack = () => {
    if (previousPage) {
      // Use history.back() if available, otherwise navigate to saved page
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
    pageStates,
    setPreviousPage,
    clearPreviousPage,
    goBack,
    savePageState,
    getPageState,
    clearPageState,
    clearAllPageStates,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};