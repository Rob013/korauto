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
  const [previousPage, setPreviousPageState] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<FilterState | null>(null);

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