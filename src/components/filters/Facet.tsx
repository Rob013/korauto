import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { FacetCounts } from '@/lib/search/types';

interface FacetProps {
  title: string;
  field: string;
  facetCounts: FacetCounts[string] | undefined;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  maxItems?: number;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Facet = ({
  title,
  field,
  facetCounts = {},
  selectedValues,
  onSelectionChange,
  maxItems = 10,
  searchable = true,
  disabled = false,
  className = '',
}: FacetProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Process and sort facet options
  const sortedOptions = useMemo(() => {
    const entries = Object.entries(facetCounts);
    
    // Filter by search term if provided
    const filtered = searchTerm
      ? entries.filter(([value]) => 
          value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : entries;
    
    // Sort by count (descending) then by name (ascending)
    return filtered.sort((a, b) => {
      const countDiff = b[1] - a[1];
      if (countDiff !== 0) return countDiff;
      return a[0].localeCompare(b[0]);
    });
  }, [facetCounts, searchTerm]);

  // Determine visible options
  const visibleOptions = showAll ? sortedOptions : sortedOptions.slice(0, maxItems);
  const hasMore = sortedOptions.length > maxItems;

  // Handle checkbox change
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

  // Clear all selections
  const handleClearAll = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  if (!isExpanded) {
    return (
      <div className={`border rounded-lg p-3 ${className}`}>
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto"
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            {selectedValues.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedValues.length}
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          className="flex items-center gap-2 p-0 h-auto font-medium"
          onClick={() => setIsExpanded(false)}
          disabled={disabled}
        >
          {title}
          {selectedValues.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedValues.length}
            </Badge>
          )}
          <ChevronUp className="h-4 w-4" />
        </Button>
        
        {selectedValues.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-xs h-6 px-2"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Search */}
      {searchable && sortedOptions.length > 5 && (
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-7 h-8 text-sm"
              disabled={disabled}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Options */}
      <ScrollArea className={`${visibleOptions.length > 8 ? 'h-48' : ''}`}>
        <div className="space-y-2">
          {visibleOptions.map(([value, count]) => {
            const isSelected = selectedValues.includes(value);
            const isDisabled = disabled || count === 0;
            
            return (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field}-${value}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => 
                    handleValueChange(value, checked as boolean)
                  }
                  disabled={isDisabled}
                  className="h-4 w-4"
                />
                <Label
                  htmlFor={`${field}-${value}`}
                  className={`flex-1 text-sm cursor-pointer ${
                    isDisabled ? 'text-muted-foreground' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2">{value}</span>
                    <span className={`text-xs ${
                      count === 0 ? 'text-muted-foreground' : 'text-muted-foreground'
                    }`}>
                      {count.toLocaleString()}
                    </span>
                  </div>
                </Label>
              </div>
            );
          })}
          
          {searchTerm && visibleOptions.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-2">
              No results found for "{searchTerm}"
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Show more/less */}
      {hasMore && !searchTerm && (
        <div className="mt-3 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            disabled={disabled}
            className="w-full text-xs"
          >
            {showAll ? 'Show less' : `Show ${sortedOptions.length - maxItems} more`}
          </Button>
        </div>
      )}
    </div>
  );
};