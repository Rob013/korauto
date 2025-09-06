import React, { createContext, useContext, ReactNode } from 'react';
import { useStatusRefresh } from '@/hooks/useStatusRefresh';

interface StatusRefreshContextType {
  refreshCarStatuses: () => Promise<void>;
  archiveOldSoldCars: () => Promise<void>;
}

const StatusRefreshContext = createContext<StatusRefreshContextType | undefined>(undefined);

interface StatusRefreshProviderProps {
  children: ReactNode;
  intervalHours?: number;
  enabled?: boolean;
}

/**
 * Provider component that manages automatic status refresh for car data
 * Refreshes car status every 6 hours and removes sold cars after 24 hours
 */
export const StatusRefreshProvider: React.FC<StatusRefreshProviderProps> = ({
  children,
  intervalHours = 6,
  enabled = true
}) => {
  const { refreshCarStatuses, archiveOldSoldCars } = useStatusRefresh({
    intervalHours,
    enabled
  });

  const value = {
    refreshCarStatuses,
    archiveOldSoldCars
  };

  return (
    <StatusRefreshContext.Provider value={value}>
      {children}
    </StatusRefreshContext.Provider>
  );
};

export const useStatusRefreshContext = () => {
  const context = useContext(StatusRefreshContext);
  if (context === undefined) {
    throw new Error('useStatusRefreshContext must be used within a StatusRefreshProvider');
  }
  return context;
};