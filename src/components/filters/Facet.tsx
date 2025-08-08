import React, { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SearchFacet } from '@/lib/search/types';
import { cn } from '@/lib/utils';

interface FacetProps {
  title: string;
  facets: SearchFacet[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  maxVisible?: number;
  showCounts?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Facet({
  title,
  facets,
  selectedValues,
  onSelectionChange,
  maxVisible = 10,
  showCounts = true,
  disabled = false,
  className
}: FacetProps) {
  // Sort facets: selected first, then by count descending, then alphabetically
  const sortedFacets = useMemo(() => {
    return [...facets].sort((a, b) => {
      const aSelected = selectedValues.includes(a.value);
      const bSelected = selectedValues.includes(b.value);
      
      // Selected items first
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      // Then by count (descending)
      if (a.count !== b.count) return b.count - a.count;
      
      // Finally alphabetically
      return a.value.localeCompare(b.value);
    });
  }, [facets, selectedValues]);

  // Split visible and hidden facets
  const visibleFacets = sortedFacets.slice(0, maxVisible);
  const hiddenFacets = sortedFacets.slice(maxVisible);
  const [showAll, setShowAll] = React.useState(false);

  const displayedFacets = showAll ? sortedFacets : visibleFacets;

  const handleValueChange = (value: string, checked: boolean) => {
    if (disabled) return;
    
    let newValues: string[];
    if (checked) {
      newValues = [...selectedValues, value];
    } else {
      newValues = selectedValues.filter(v => v !== value);
    }
    
    onSelectionChange(newValues);
  };

  const selectedCount = selectedValues.length;

  if (facets.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          {title}
          {selectedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedCount}
            </Badge>
          )}
        </h4>
        {selectedCount > 0 && (
          <button
            onClick={() => onSelectionChange([])}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            disabled={disabled}
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {displayedFacets.map((facet) => {
          const isSelected = selectedValues.includes(facet.value);
          const isDisabled = disabled || (!isSelected && facet.count === 0);

          return (
            <div 
              key={facet.value}
              className={cn(
                "flex items-center justify-between space-x-2 py-1",
                isDisabled && "opacity-50"
              )}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <Checkbox
                  id={`facet-${title}-${facet.value}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => 
                    handleValueChange(facet.value, checked === true)
                  }
                  disabled={isDisabled}
                  className="flex-shrink-0"
                />
                <Label
                  htmlFor={`facet-${title}-${facet.value}`}
                  className={cn(
                    "text-sm cursor-pointer truncate flex-1",
                    isDisabled && "cursor-not-allowed",
                    isSelected && "font-medium"
                  )}
                  title={facet.value}
                >
                  {facet.value}
                </Label>
              </div>
              
              {showCounts && (
                <span className={cn(
                  "text-xs text-muted-foreground flex-shrink-0",
                  isSelected && "text-foreground font-medium"
                )}>
                  {facet.count.toLocaleString()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {hiddenFacets.length > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors w-full text-left"
          disabled={disabled}
        >
          {showAll 
            ? `Show less` 
            : `Show ${hiddenFacets.length} more...`
          }
        </button>
      )}
    </div>
  );
}

/**
 * Dependent facet that shows options based on parent selection
 */
export function DependentFacet({
  title,
  facets,
  selectedValues,
  onSelectionChange,
  parentSelected,
  emptyMessage = "Select parent category first",
  ...props
}: FacetProps & { 
  parentSelected: boolean;
  emptyMessage?: string;
}) {
  if (!parentSelected) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground italic">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <Facet
      title={title}
      facets={facets}
      selectedValues={selectedValues}
      onSelectionChange={onSelectionChange}
      {...props}
    />
  );
}

/**
 * Compact facet for mobile/sidebar use
 */
export function CompactFacet({
  title,
  facets,
  selectedValues,
  onSelectionChange,
  maxVisible = 5,
  ...props
}: FacetProps) {
  return (
    <Facet
      title={title}
      facets={facets}
      selectedValues={selectedValues}
      onSelectionChange={onSelectionChange}
      maxVisible={maxVisible}
      className="text-sm"
      {...props}
    />
  );
}