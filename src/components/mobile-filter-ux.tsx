import React, { useState, useEffect, useCallback } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileFilterSheet } from './mobile-filter-sheet';

interface MobileFilterUXProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  onSearchCars?: () => void;
  hasSelectedCategories?: boolean;
  selectedFiltersCount?: number;
  children: React.ReactNode;
}

export const MobileFilterUX: React.FC<MobileFilterUXProps> = ({
  showFilters,
  onToggleFilters,
  onClearFilters,
  onSearchCars,
  hasSelectedCategories = false,
  selectedFiltersCount = 0,
  children
}) => {
  const isMobile = useIsMobile();
  const [hasExplicitlyClosed, setHasExplicitlyClosed] = useState(false);

  // Save filter panel state to sessionStorage on mobile when it changes
  useEffect(() => {
    if (isMobile) {
      // Only save when user explicitly opens the panel, but always start closed on navigation
      // This ensures filter panel stays closed after "Kthehu te Makinat" or page navigation
      sessionStorage.setItem('mobile-filter-panel-state', JSON.stringify(false));
      sessionStorage.setItem('mobile-filter-explicit-close', JSON.stringify(hasExplicitlyClosed));
    }
  }, [showFilters, hasExplicitlyClosed, isMobile]);

  // Clear filter panel state when actually navigating away from catalog
  useEffect(() => {
    const clearStateOnNavigation = () => {
      // Only clear if we're navigating to a different page (not opening new tabs)
      if (!window.location.pathname.includes('/catalog')) {
        sessionStorage.removeItem('mobile-filter-panel-state');
        sessionStorage.removeItem('mobile-filter-explicit-close');
      }
    };

    const clearStateOnUnload = () => {
      // Don't clear on beforeunload as it might interfere with new tab opening
      // The state will be useful for back navigation
    };

    window.addEventListener('beforeunload', clearStateOnUnload);
    
    return () => {
      window.removeEventListener('beforeunload', clearStateOnUnload);
      // Clear state when navigating away from catalog page
      clearStateOnNavigation();
    };
  }, []);

  const handleToggleFilters = useCallback((e: React.MouseEvent) => {
    // Prevent event bubbling and ensure click is processed
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Filter toggle clicked, current showFilters:", showFilters, "isMobile:", isMobile);
    
    const newShowState = !showFilters;
    
    // Update explicit close tracking
    if (newShowState) {
      setHasExplicitlyClosed(false);
      console.log("Opening filters, reset explicit close flag");
    } else {
      setHasExplicitlyClosed(true);
      console.log("Closing filters, set explicit close flag");
    }
    
    // Call the parent toggle handler
    onToggleFilters();
    
    // On mobile, add additional DOM manipulation as backup
    if (isMobile) {
      setTimeout(() => {
        const filterPanel = document.querySelector('[data-filter-panel]') as HTMLElement;
        if (filterPanel) {
          if (newShowState) {
            filterPanel.style.transform = 'translateX(0)';
            filterPanel.style.visibility = 'visible';
            console.log("Mobile: Forced filter panel to show");
          } else {
            filterPanel.style.transform = 'translateX(-100%)';
            filterPanel.style.visibility = 'hidden';
            console.log("Mobile: Forced filter panel to hide");
          }
        }
      }, 50); // Small delay to ensure state update has propagated
    }
  }, [showFilters, isMobile, onToggleFilters]);

  const handleCloseFilter = useCallback(() => {
    console.log("Close filter called, isMobile:", isMobile);
    
    // Update explicit close tracking
    setHasExplicitlyClosed(true);
    
    // Force close the filter panel regardless of mobile detection
    onToggleFilters();
    
    // Additional CSS force close as backup
    setTimeout(() => {
      const filterPanel = document.querySelector('[data-filter-panel]');
      if (filterPanel) {
        (filterPanel as HTMLElement).style.transform = 'translateX(-100%)';
        (filterPanel as HTMLElement).style.visibility = 'hidden';
      }
    }, 100);
  }, [isMobile, onToggleFilters]);

  const handleSearchCars = useCallback(() => {
    console.log("Search button clicked, isMobile:", isMobile);
    
    // Apply search/filters
    onSearchCars?.();
    
    // Force close filter panel on mobile (and desktop for consistency)
    setHasExplicitlyClosed(true);
    onToggleFilters();
    
    // Additional CSS force close as backup
    setTimeout(() => {
      const filterPanel = document.querySelector('[data-filter-panel]');
      if (filterPanel) {
        (filterPanel as HTMLElement).style.transform = 'translateX(-100%)';
        (filterPanel as HTMLElement).style.visibility = 'hidden';
      }
    }, 100);
  }, [isMobile, onSearchCars, onToggleFilters]);

  // Return the filter toggle button and mobile sheet if on mobile
  return (
    <>
      {/* Filter Toggle Button */}
      <Button
        variant="default"
        size="lg"
        onClick={handleToggleFilters}
        className="flex items-center gap-2 h-12 px-4 sm:px-6 lg:px-8 font-semibold text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 transition-transform"
      >
        {showFilters ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        <span className="hidden xs:inline">{showFilters ? 'Fshih Filtrat' : 'Shfaq Filtrat'}</span>
        <span className="xs:hidden">Filtrat</span>
        {hasSelectedCategories && !showFilters && (
          <span className="ml-1 text-xs bg-primary-foreground/20 px-2 py-1 rounded-full animate-bounce">
            {selectedFiltersCount}
          </span>
        )}
      </Button>

      {/* Mobile Filter Sheet */}
      {isMobile && (
        <MobileFilterSheet
          isOpen={showFilters}
          onClose={handleCloseFilter}
          onClearFilters={onClearFilters}
          hasSelectedFilters={hasSelectedCategories}
          selectedFiltersCount={selectedFiltersCount}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, {
                onSearchCars: handleSearchCars,
                onCloseFilter: handleCloseFilter,
              });
            }
            return child;
          })}
        </MobileFilterSheet>
      )}
    </>
  );
};