import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Car,
  Calendar,
  DollarSign,
  MapPin,
  Fuel,
  Settings,
  Palette,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  RotateCcw
} from 'lucide-react';

import { Facet, DependentFacet, CompactFacet } from '@/components/filters/Facet';
import { RangeFacet, CompactRangeFacet } from '@/components/filters/RangeFacet';
import { ActiveChips } from '@/components/filters/ActiveChips';
import { useUrlFilters, useActiveFilterCount } from '@/hooks/useUrlFilters';
import { useCarsSearch } from '@/hooks/useCarsSearch';
import { SearchFilters, SearchSort } from '@/lib/search/types';
import { cn } from '@/lib/utils';

interface ModernCatalogFiltersProps {
  compact?: boolean;
  className?: string;
  onClose?: () => void;
}

// Mock data for facets - in real implementation, this would come from the API
const mockFacets = {
  make: [
    { value: 'BMW', count: 234 },
    { value: 'Mercedes-Benz', count: 189 },
    { value: 'Audi', count: 156 },
    { value: 'Volkswagen', count: 145 },
    { value: 'Toyota', count: 98 },
    { value: 'Honda', count: 87 }
  ],
  model: [
    { value: '3 Series', count: 45 },
    { value: 'C-Class', count: 38 },
    { value: 'A4', count: 34 },
    { value: 'Golf', count: 29 }
  ],
  fuel: [
    { value: 'Petrol', count: 456 },
    { value: 'Diesel', count: 234 },
    { value: 'Hybrid', count: 89 },
    { value: 'Electric', count: 34 }
  ],
  transmission: [
    { value: 'Automatic', count: 567 },
    { value: 'Manual', count: 245 }
  ],
  body: [
    { value: 'Sedan', count: 345 },
    { value: 'SUV', count: 234 },
    { value: 'Hatchback', count: 156 },
    { value: 'Coupe', count: 89 },
    { value: 'Wagon', count: 67 }
  ],
  exterior_color: [
    { value: 'Black', count: 234 },
    { value: 'White', count: 189 },
    { value: 'Silver', count: 156 },
    { value: 'Blue', count: 98 },
    { value: 'Red', count: 67 }
  ]
};

export function ModernCatalogFilters({ compact = false, className, onClose }: ModernCatalogFiltersProps) {
  const [query, setQuery] = useState('');
  const [openSections, setOpenSections] = useState<string[]>(['basic']);
  
  const {
    filters,
    sort,
    page,
    pageSize,
    setFilter,
    setFilters,
    clearFilters,
    setSort,
    setQuery: setUrlQuery,
    isLoading
  } = useUrlFilters();

  const activeFilterCount = useActiveFilterCount(filters, query);

  // Search request for getting facets
  const searchRequest = useMemo(() => ({
    q: query,
    filters,
    sort,
    page,
    pageSize
  }), [query, filters, sort, page, pageSize]);

  // Get search results for facet counts
  const { facets } = useCarsSearch(searchRequest);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleQuerySubmit = () => {
    setUrlQuery(query);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilter(key, value);
  };

  const handleRemoveFilter = (key: keyof SearchFilters, value?: string) => {
    if (value && Array.isArray(filters[key])) {
      // Remove specific value from array
      const currentValues = filters[key] as string[];
      const newValues = currentValues.filter(v => v !== value);
      setFilter(key, newValues.length > 0 ? newValues : undefined);
    } else {
      // Remove entire filter
      setFilter(key, undefined);
    }
  };

  if (compact) {
    return (
      <div className={cn("space-y-4 h-full flex flex-col", className)}>
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Filters</h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="space-y-2 flex-shrink-0">
          <div className="flex gap-1">
            <Input
              placeholder="Search cars..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuerySubmit()}
              className="text-sm h-8"
            />
            <Button
              size="sm"
              onClick={handleQuerySubmit}
              className="h-8 px-3"
            >
              <Search className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex-shrink-0">
            <ActiveChips
              filters={filters}
              query={query}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={clearFilters}
              onRemoveQuery={() => setQuery('')}
              compact
            />
          </div>
        )}

        {/* Scrollable Filters */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Make */}
          <CompactFacet
            title="Make"
            facets={facets?.make || mockFacets.make}
            selectedValues={filters.make || []}
            onSelectionChange={(values) => handleFilterChange('make', values)}
          />

          {/* Model - dependent on make */}
          <DependentFacet
            title="Model"
            facets={facets?.model || mockFacets.model}
            selectedValues={filters.model || []}
            onSelectionChange={(values) => handleFilterChange('model', values)}
            parentSelected={!!filters.make?.length}
            emptyMessage="Select a make first"
          />

          {/* Year Range */}
          <CompactRangeFacet
            title="Year"
            value={filters.year || {}}
            onChange={(value) => handleFilterChange('year', value)}
            min={1990}
            max={2024}
          />

          {/* Price Range */}
          <CompactRangeFacet
            title="Price (€)"
            value={filters.price_eur || {}}
            onChange={(value) => handleFilterChange('price_eur', value)}
            min={1000}
            max={200000}
            formatValue={(value) => `€${(value / 1000).toFixed(0)}k`}
          />

          {/* Fuel */}
          <CompactFacet
            title="Fuel"
            facets={facets?.fuel || mockFacets.fuel}
            selectedValues={filters.fuel || []}
            onSelectionChange={(values) => handleFilterChange('fuel', values)}
            maxVisible={4}
          />

          {/* Transmission */}
          <CompactFacet
            title="Transmission"
            facets={facets?.transmission || mockFacets.transmission}
            selectedValues={filters.transmission || []}
            onSelectionChange={(values) => handleFilterChange('transmission', values)}
            maxVisible={3}
          />
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Search & Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Search by make, model, or any keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuerySubmit()}
            />
            <Button onClick={handleQuerySubmit}>
              Search
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <>
            <Separator />
            <ActiveChips
              filters={filters}
              query={query}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={clearFilters}
              onRemoveQuery={() => setQuery('')}
            />
          </>
        )}

        <Separator />

        {/* Basic Filters */}
        <Collapsible
          open={openSections.includes('basic')}
          onOpenChange={() => toggleSection('basic')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                <span className="font-medium">Vehicle Basics</span>
              </div>
              {openSections.includes('basic') ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Make */}
              <Facet
                title="Make"
                facets={facets?.make || mockFacets.make}
                selectedValues={filters.make || []}
                onSelectionChange={(values) => handleFilterChange('make', values)}
              />

              {/* Model - dependent on make */}
              <DependentFacet
                title="Model"
                facets={facets?.model || mockFacets.model}
                selectedValues={filters.model || []}
                onSelectionChange={(values) => handleFilterChange('model', values)}
                parentSelected={!!filters.make?.length}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Range Filters */}
        <Collapsible
          open={openSections.includes('ranges')}
          onOpenChange={() => toggleSection('ranges')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Year, Price & Mileage</span>
              </div>
              {openSections.includes('ranges') ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Year */}
              <RangeFacet
                title="Year"
                value={filters.year || {}}
                onChange={(value) => handleFilterChange('year', value)}
                min={1990}
                max={2024}
              />

              {/* Price */}
              <RangeFacet
                title="Price (EUR)"
                value={filters.price_eur || {}}
                onChange={(value) => handleFilterChange('price_eur', value)}
                min={1000}
                max={200000}
                step={500}
                formatValue={(value) => `€${value.toLocaleString()}`}
              />

              {/* Mileage */}
              <RangeFacet
                title="Mileage (km)"
                value={filters.mileage_km || {}}
                onChange={(value) => handleFilterChange('mileage_km', value)}
                min={0}
                max={500000}
                step={5000}
                formatValue={(value) => `${(value / 1000).toFixed(0)}k km`}
              />

              {/* Engine */}
              <RangeFacet
                title="Engine (cc)"
                value={filters.engine_cc || {}}
                onChange={(value) => handleFilterChange('engine_cc', value)}
                min={800}
                max={8000}
                step={100}
                formatValue={(value) => `${value}cc`}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Specifications */}
        <Collapsible
          open={openSections.includes('specs')}
          onOpenChange={() => toggleSection('specs')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <span className="font-medium">Specifications</span>
              </div>
              {openSections.includes('specs') ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Fuel */}
              <Facet
                title="Fuel Type"
                facets={facets?.fuel || mockFacets.fuel}
                selectedValues={filters.fuel || []}
                onSelectionChange={(values) => handleFilterChange('fuel', values)}
              />

              {/* Transmission */}
              <Facet
                title="Transmission"
                facets={facets?.transmission || mockFacets.transmission}
                selectedValues={filters.transmission || []}
                onSelectionChange={(values) => handleFilterChange('transmission', values)}
              />

              {/* Body Type */}
              <Facet
                title="Body Type"
                facets={facets?.body || mockFacets.body}
                selectedValues={filters.body || []}
                onSelectionChange={(values) => handleFilterChange('body', values)}
              />

              {/* Exterior Color */}
              <Facet
                title="Exterior Color"
                facets={facets?.exterior_color || mockFacets.exterior_color}
                selectedValues={filters.exterior_color || []}
                onSelectionChange={(values) => handleFilterChange('exterior_color', values)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}