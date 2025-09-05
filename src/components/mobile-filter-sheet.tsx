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
          // Mobile: Full screen with proper safe area
          'top-0 left-0 right-0 bottom-0 w-full h-screen overflow-hidden',
          'lg:shadow-none lg:hidden translate-x-0',
          // Ensure proper mobile sizing and scrolling
          'flex flex-col'
        )}
      >
        {/* Header - Mobile optimized */}
        <div className="mobile-filter-compact filter-header bg-primary text-primary-foreground flex-shrink-0 border-b border-primary-foreground/20">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Filter className="h-4 w-4 text-primary-foreground flex-shrink-0" />
              <h3 className="text-sm sm:text-base text-primary-foreground font-semibold truncate">
                {title}
              </h3>
              {hasSelectedFilters && (
                <Badge variant="secondary" className="ml-2 bg-primary-foreground/20 text-primary-foreground text-xs px-1.5 py-0 flex-shrink-0">
                  {selectedFiltersCount} aktiv
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearFilters}
                className="h-7 px-2 hover:bg-primary-foreground/20 text-primary-foreground text-xs"
              >
                <span className="text-xs">Clear</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 px-2 hover:bg-primary-foreground/20 text-primary-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content - Optimized scrolling for mobile */}
        <div className="flex-1 overflow-y-auto mobile-filter-content mobile-filter-compact p-3 sm:p-4">
          {children}
        </div>
      </div>
    </>
  );
};