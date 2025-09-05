import React from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onClearFilters: () => void;
  children: React.ReactNode;
  hasSelectedFilters?: boolean;
  selectedFiltersCount?: number;
  title?: string;
}

export const MobileFilterSheet: React.FC<MobileFilterSheetProps> = ({
  isOpen,
  onClose,
  onClearFilters,
  children,
  hasSelectedFilters = false,
  selectedFiltersCount = 0,
  title = 'Filtrat e Kërkimit'
}) => {
  // Don't render anything if closed
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sheet Content */}
      <div 
        data-filter-panel
        className={cn(
          'fixed z-40 glass-card transition-transform duration-300 ease-in-out',
          // Mobile: Full screen with proper safe area and responsive handling
          'top-0 left-0 right-0 bottom-0 w-full h-dvh overflow-hidden',
          'lg:shadow-none lg:hidden translate-x-0',
          // Ensure proper mobile sizing and scrolling with safe areas
          'flex flex-col bg-background/98 backdrop-blur-md',
          // Better touch handling and accessibility - allow scrolling
          'touch-auto'
        )}
      >
        {/* Header - Mobile optimized with better touch targets */}
        <div className="mobile-filter-compact filter-header bg-primary text-primary-foreground flex-shrink-0 border-b border-primary-foreground/20 safe-area-inset-top">
          <div className="flex items-center justify-between p-4 min-h-[60px]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Filter className="h-5 w-5 text-primary-foreground flex-shrink-0" />
              <h3 className="text-base sm:text-lg text-primary-foreground font-semibold truncate">
                {title}
              </h3>
              {hasSelectedFilters && (
                <Badge variant="secondary" className="ml-2 bg-primary-foreground/20 text-primary-foreground text-sm px-2 py-1 flex-shrink-0">
                  {selectedFiltersCount} aktiv
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearFilters}
                className="h-10 px-3 hover:bg-primary-foreground/20 text-primary-foreground text-sm min-w-[80px] touch-target"
              >
                <span className="text-sm">Pastro</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-10 w-10 p-0 hover:bg-primary-foreground/20 text-primary-foreground touch-target"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content - Optimized scrolling for mobile with better spacing and touch areas */}
        <div className="flex-1 overflow-y-auto mobile-filter-content p-3 sm:p-4 safe-area-inset-bottom">
          <div className="space-y-3 sm:space-y-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};