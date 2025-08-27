/**
 * Enhanced UI feedback component for catalog sorting status
 * Shows detailed information about ranking status across pages
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Target, TrendingUp, Loader2 } from 'lucide-react';

interface SortingStatusProps {
  isGlobalSorting: boolean;
  isLoading: boolean;
  isBackendSorting: boolean;
  backendLoading: boolean;
  totalCars: number;
  currentPage: number;
  totalPages: number;
  sortOption: string;
  carsOnCurrentPage: number;
  yearFilterProgress?: 'instant' | 'loading' | null;
}

export const SortingStatusIndicator: React.FC<SortingStatusProps> = ({
  isGlobalSorting,
  isLoading,
  isBackendSorting,
  backendLoading,
  totalCars,
  currentPage,
  totalPages,
  sortOption,
  carsOnCurrentPage,
  yearFilterProgress
}) => {
  // Priority order for status display
  if (backendLoading) {
    return (
      <div className="flex items-center gap-2 text-primary text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>🚀 Sorting {totalCars} cars globally via backend...</span>
      </div>
    );
  }

  if (isBackendSorting && totalCars > 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-xs">
        <Target className="h-3 w-3" />
        <span>✅ {totalCars} cars sorted globally • Page {currentPage} of {totalPages}</span>
        <Badge variant="outline" className="ml-1 text-xs py-0 px-1.5 bg-green-50 border-green-200 text-green-700">
          Backend Ranked
        </Badge>
      </div>
    );
  }

  if (isLoading && isGlobalSorting) {
    return (
      <div className="flex items-center gap-2 text-primary text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>🔄 Ranking {totalCars} cars across {totalPages} pages...</span>
      </div>
    );
  }

  if (isGlobalSorting && totalCars > 0) {
    return (
      <div className="flex items-center gap-2 text-blue-600 text-xs">
        <TrendingUp className="h-3 w-3" />
        <span>📊 {totalCars} cars ranked globally • Page {currentPage} of {totalPages}</span>
        <Badge variant="outline" className="ml-1 text-xs py-0 px-1.5 bg-blue-50 border-blue-200 text-blue-700">
          Global Ranked
        </Badge>
      </div>
    );
  }

  if (yearFilterProgress === 'loading') {
    return (
      <div className="flex items-center gap-2 text-primary text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>🔄 Loading complete results...</span>
      </div>
    );
  }

  if (yearFilterProgress === 'instant') {
    return (
      <div className="flex items-center gap-2 text-green-600 text-xs">
        <span>⚡ Instant results</span>
      </div>
    );
  }

  // Default status - local page sorting
  if (totalCars > 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <ArrowUpDown className="h-3 w-3" />
        <span>📄 {carsOnCurrentPage} cars on page {currentPage} of {totalPages}</span>
        <Badge variant="outline" className="ml-1 text-xs py-0 px-1.5 bg-gray-50 border-gray-200 text-gray-600">
          Page Sorted
        </Badge>
      </div>
    );
  }

  return null;
};

/**
 * Compact sorting status for mobile views
 */
export const CompactSortingStatus: React.FC<SortingStatusProps> = ({
  isGlobalSorting,
  isLoading,
  isBackendSorting,
  backendLoading,
  totalCars,
  currentPage,
  totalPages
}) => {
  if (backendLoading) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Loader2 className="h-2 w-2 mr-1 animate-spin" />
        Sorting...
      </Badge>
    );
  }

  if (isBackendSorting && totalCars > 0) {
    return (
      <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
        <Target className="h-2 w-2 mr-1" />
        Global ({currentPage}/{totalPages})
      </Badge>
    );
  }

  if (isLoading && isGlobalSorting) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Loader2 className="h-2 w-2 mr-1 animate-spin" />
        Ranking...
      </Badge>
    );
  }

  if (isGlobalSorting && totalCars > 0) {
    return (
      <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
        <TrendingUp className="h-2 w-2 mr-1" />
        Ranked ({currentPage}/{totalPages})
      </Badge>
    );
  }

  if (totalCars > 0) {
    return (
      <Badge variant="outline" className="text-xs">
        <ArrowUpDown className="h-2 w-2 mr-1" />
        Page ({currentPage}/{totalPages})
      </Badge>
    );
  }

  return null;
};

/**
 * Ranking quality indicator - shows how well the ranking is working
 */
export const RankingQualityIndicator: React.FC<{
  isGlobalSorting: boolean;
  totalCars: number;
  threshold?: number;
}> = ({ 
  isGlobalSorting, 
  totalCars, 
  threshold = 30 
}) => {
  if (totalCars <= threshold) {
    return (
      <div className="text-xs text-muted-foreground">
        Small dataset • Local sorting
      </div>
    );
  }

  if (isGlobalSorting) {
    return (
      <div className="text-xs text-green-600">
        ✨ Optimal ranking across all {totalCars} cars
      </div>
    );
  }

  return (
    <div className="text-xs text-amber-600">
      ⚠️ Large dataset • Consider global sorting
    </div>
  );
};