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
}

interface NavigationContextType {
  previousPage: string | null;
  filterState: FilterState | null;
  setPreviousPage: (page: string, filters?: FilterState) => void;
  clearPreviousPage: () => void;
  goBack: () => void;
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
  // Initialize from localStorage if available
  const [previousPage, setPreviousPageState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('korauto_previous_page') || null;
    }
    return null;
  });
  
  const [filterState, setFilterState] = useState<FilterState | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('korauto_filter_state');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const setPreviousPage = (page: string, filters?: FilterState) => {
    console.log('📌 Saving previous page to cache:', page);
    setPreviousPageState(page);
    localStorage.setItem('korauto_previous_page', page);
    
    if (filters) {
      console.log('📌 Saving filter state to cache:', filters);
      setFilterState(filters);
      localStorage.setItem('korauto_filter_state', JSON.stringify(filters));
    }
  };

  const clearPreviousPage = () => {
    console.log('🗑️ Clearing cached navigation data');
    setPreviousPageState(null);
    setFilterState(null);
    localStorage.removeItem('korauto_previous_page');
    localStorage.removeItem('korauto_filter_state');
  };

  const goBack = () => {
    const cachedPage = localStorage.getItem('korauto_previous_page');
    const currentPage = window.location.pathname + window.location.search;
    
    console.log('🔙 Going back - cached page:', cachedPage);
    console.log('🔙 Current page:', currentPage);
    
    if (cachedPage && cachedPage !== currentPage) {
      console.log('🔙 Using cached previous page');
      window.location.href = cachedPage;
    } else if (window.history.length > 1) {
      console.log('🔙 Using browser back');
      window.history.back();
    } else {
      console.log('🔙 Fallback to homepage');
      window.location.href = '/';
    }
  };

  const value = {
    previousPage,
    filterState,
    setPreviousPage,
    clearPreviousPage,
    goBack,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};