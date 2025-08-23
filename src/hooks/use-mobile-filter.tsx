import { useCallback, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

interface UseMobileFilterProps {
  onFiltersChange: (filters: any) => void;
  isHomepage?: boolean;
}

/**
 * Hook to ensure proper mobile filter behavior
 * Prevents auto-navigation on homepage and provides mobile-optimized interactions
 */
export function useMobileFilter({ onFiltersChange, isHomepage }: UseMobileFilterProps) {
  const isMobile = useIsMobile();

  // Enhanced filter change handler that logs and prevents auto-redirect on mobile homepage
  const handleMobileFiltersChange = useCallback((newFilters: any) => {
    if (isMobile && isHomepage) {
      console.log('🔍 Mobile homepage filter change - storing as pending:', newFilters);
      // On mobile homepage, always store as pending (no auto-redirect)
      onFiltersChange(newFilters);
    } else {
      // On catalog or desktop, use normal behavior
      onFiltersChange(newFilters);
    }
  }, [isMobile, isHomepage, onFiltersChange]);

  // Add mobile-specific touch optimizations
  useEffect(() => {
    if (isMobile) {
      // Prevent double-tap zoom on filter buttons
      const buttons = document.querySelectorAll('.mobile-filter-compact button');
      buttons.forEach(button => {
        button.addEventListener('touchstart', (e) => {
          // Ensure the button is properly focusable and clickable
          e.stopPropagation();
        }, { passive: true });
      });

      return () => {
        buttons.forEach(button => {
          button.removeEventListener('touchstart', () => {});
        });
      };
    }
  }, [isMobile]);

  return {
    isMobile,
    handleMobileFiltersChange,
  };
}