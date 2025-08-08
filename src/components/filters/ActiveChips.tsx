import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, RotateCcw } from 'lucide-react';
import { SearchFilters } from '@/lib/search/types';
import { cn } from '@/lib/utils';

interface ActiveChipsProps {
  filters: SearchFilters;
  query?: string;
  onRemoveFilter: (key: keyof SearchFilters, value?: string) => void;
  onClearAll: () => void;
  onRemoveQuery?: () => void;
  className?: string;
  compact?: boolean;
}

export function ActiveChips({
  filters,
  query,
  onRemoveFilter,
  onClearAll,
  onRemoveQuery,
  className,
  compact = false
}: ActiveChipsProps) {
  const chips: Array<{
    key: string;
    label: string;
    value?: string;
    onRemove: () => void;
  }> = [];

  // Add query chip
  if (query?.trim()) {
    chips.push({
      key: 'query',
      label: `Search: "${query}"`,
      onRemove: () => onRemoveQuery?.()
    });
  }

  // Helper to format range values
  const formatRange = (range: { min?: number; max?: number }, unit = '') => {
    const parts = [];
    if (range.min !== undefined) parts.push(`${range.min.toLocaleString()}${unit}+`);
    if (range.max !== undefined) parts.push(`≤${range.max.toLocaleString()}${unit}`);
    return parts.join(', ');
  };

  // Helper to format array values  
  const formatArray = (values: (string | number)[], maxShow = 2) => {
    if (values.length <= maxShow) {
      return values.join(', ');
    }
    return `${values.slice(0, maxShow).join(', ')} +${values.length - maxShow} more`;
  };

  // Process categorical filters (arrays)
  const categoricalFilters: (keyof SearchFilters)[] = [
    'country', 'make', 'model', 'trim', 'fuel', 'transmission', 'body', 'drive',
    'accident', 'use_type', 'exterior_color', 'interior_color', 'region', 'options'
  ];

  categoricalFilters.forEach(key => {
    const values = filters[key] as string[] | undefined;
    if (values && values.length > 0) {
      if (values.length === 1) {
        // Single value - individual chip
        chips.push({
          key,
          label: values[0],
          value: values[0],
          onRemove: () => onRemoveFilter(key, values[0])
        });
      } else {
        // Multiple values - combined chip with individual removal
        values.forEach(value => {
          chips.push({
            key: `${key}-${value}`,
            label: value,
            value,
            onRemove: () => onRemoveFilter(key, value)
          });
        });
      }
    }
  });

  // Process numeric array filters
  const numericArrayFilters: (keyof SearchFilters)[] = ['owners', 'seats'];
  
  numericArrayFilters.forEach(key => {
    const values = filters[key] as number[] | undefined;
    if (values && values.length > 0) {
      const label = `${key}: ${formatArray(values)}`;
      chips.push({
        key,
        label,
        onRemove: () => onRemoveFilter(key)
      });
    }
  });

  // Process range filters
  const rangeFilters: Array<{
    key: keyof SearchFilters;
    label: string;
    unit?: string;
    formatter?: (value: number) => string;
  }> = [
    { key: 'year', label: 'Year' },
    { key: 'price_eur', label: 'Price', unit: '€' },
    { key: 'mileage_km', label: 'Mileage', unit: 'km' },
    { key: 'engine_cc', label: 'Engine', unit: 'cc' }
  ];

  rangeFilters.forEach(({ key, label, unit, formatter }) => {
    const range = filters[key] as { min?: number; max?: number } | undefined;
    if (range && (range.min !== undefined || range.max !== undefined)) {
      const formattedRange = formatter 
        ? formatRange(range).replace(/\d+/g, match => formatter(parseInt(match)))
        : formatRange(range, unit);
      
      chips.push({
        key,
        label: `${label}: ${formattedRange}`,
        onRemove: () => onRemoveFilter(key)
      });
    }
  });

  const hasAnyFilters = chips.length > 0;

  if (!hasAnyFilters) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className={cn(
          "font-medium text-muted-foreground",
          compact ? "text-xs" : "text-sm"
        )}>
          Active Filters
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className={cn(
            "flex items-center gap-1 text-muted-foreground hover:text-destructive",
            compact ? "h-6 px-2 text-xs" : "h-7 px-3 text-sm"
          )}
        >
          <RotateCcw className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
          Reset all
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <Badge
            key={chip.key}
            variant="secondary"
            className={cn(
              "flex items-center gap-1 max-w-48",
              compact ? "text-xs px-2 py-0.5" : "text-sm px-2 py-1",
              "hover:bg-secondary/80 transition-colors"
            )}
          >
            <span className="truncate" title={chip.label}>
              {chip.label}
            </span>
            <button
              onClick={chip.onRemove}
              className={cn(
                "flex-shrink-0 hover:bg-destructive hover:text-destructive-foreground rounded-full transition-colors",
                compact ? "h-3 w-3" : "h-4 w-4"
              )}
              aria-label={`Remove ${chip.label} filter`}
            >
              <X className="h-full w-full" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Filter count summary */}
      {!compact && chips.length > 5 && (
        <p className="text-xs text-muted-foreground">
          {chips.length} filters applied
        </p>
      )}
    </div>
  );
}

/**
 * Compact version for mobile/sidebar use
 */
export function CompactActiveChips(props: Omit<ActiveChipsProps, 'compact'>) {
  return <ActiveChips {...props} compact />;
}

/**
 * Hook to count active filters
 */
export function useActiveFilterCount(filters: SearchFilters, query?: string): number {
  let count = 0;
  
  if (query?.trim()) count++;
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    
    if (Array.isArray(value)) {
      if (value.length > 0) count += value.length;
    } else if (typeof value === 'object' && 'min' in value && 'max' in value) {
      if (value.min !== undefined || value.max !== undefined) count++;
    } else if (value !== '') {
      count++;
    }
  });
  
  return count;
}

/**
 * Hook to check if any filters are active
 */
export function useHasActiveFilters(filters: SearchFilters, query?: string): boolean {
  return useActiveFilterCount(filters, query) > 0;
}