import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Filter, 
  X, 
  Loader2, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Car,
  Calendar,
  Palette,
  Fuel,
  Settings,
  MapPin,
  DollarSign,
  Cog,
  Star,
  Zap,
  RotateCcw,
  SlidersHorizontal
} from "lucide-react";
import { COLOR_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS } from '@/hooks/useAuctionAPI';
import {
  APIFilters,
  sortManufacturers,
  generateYearRange,
  generateYearPresets,
  isStrictFilterMode
} from '@/utils/catalog-filter';

interface Manufacturer {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
  image?: string;
}

interface Model {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
}

interface FilterCounts {
  manufacturers: { [key: string]: number };
  models: { [key: string]: number };
  colors: { [key: string]: number };
  fuelTypes: { [key: string]: number };
  transmissions: { [key: string]: number };
  years: { [key: string]: number };
}

interface ModernEncarFilterProps {
  filters: APIFilters;
  manufacturers: Manufacturer[];
  models?: Model[];
  filterCounts?: FilterCounts;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  onManufacturerChange?: (manufacturerId: string) => void;
  onModelChange?: (modelId: string) => void;
  showAdvanced?: boolean;
  onToggleAdvanced?: () => void;
  loadingCounts?: boolean;
  onFetchGrades?: (manufacturerId?: string, modelId?: string) => Promise<{ value: string; label: string; count?: number }[]>;
  onFetchTrimLevels?: (manufacturerId?: string, modelId?: string) => Promise<{ value: string; label: string; count?: number }[]>;
  isHomepage?: boolean;
  compact?: boolean;
  onSearchCars?: () => void;
  onCloseFilter?: () => void;
}

const ModernEncarFilter = memo<ModernEncarFilterProps>(({
  filters,
  manufacturers,
  models = [],
  filterCounts,
  loadingCounts = false,
  onFiltersChange,
  onClearFilters,
  onManufacturerChange,
  onModelChange,
  showAdvanced = false,
  onToggleAdvanced,
  onFetchGrades,
  onFetchTrimLevels,
  isHomepage = false,
  compact = false,
  onSearchCars,
  onCloseFilter
}) => {
  const [grades, setGrades] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [trimLevels, setTrimLevels] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  // Track if strict filtering mode is enabled
  const isStrictMode = useMemo(() => isStrictFilterMode(filters), [filters]);

  // Convert option objects to arrays for the select components
  const colorOptions = useMemo(() => 
    Object.entries(COLOR_OPTIONS).map(([key, value]) => ({
      value: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')
    }))
  , []);

  const fuelTypeOptions = useMemo(() => 
    Object.entries(FUEL_TYPE_OPTIONS).map(([key, value]) => ({
      value: key,
      label: key.charAt(0).toUpperCase() + key.slice(1)
    }))
  , []);

  const transmissionOptions = useMemo(() => 
    Object.entries(TRANSMISSION_OPTIONS).map(([key, value]) => ({
      value: key,
      label: key.charAt(0).toUpperCase() + key.slice(1)
    }))
  , []);

  // Track active filters for chip display
  useEffect(() => {
    const active = [];
    if (filters.manufacturer_id) active.push('brand');
    if (filters.model_id) active.push('model');
    if (filters.from_year || filters.to_year) active.push('year');
    if (filters.buy_now_price_from || filters.buy_now_price_to) active.push('price');
    if (filters.color) active.push('color');
    if (filters.fuel_type) active.push('fuel');
    if (filters.transmission) active.push('transmission');
    if (filters.grade_iaai) active.push('grade');
    if (filters.search) active.push('search');
    setActiveFilters(active);
  }, [filters]);

  const updateFilter = useCallback((key: string, value: string) => {
    const actualValue = value === 'all' || value === 'any' ? undefined : value;
    
    setIsLoading(true);
    
    if (key === 'manufacturer_id') {
      onManufacturerChange?.(actualValue || '');
      onFiltersChange({
        ...filters,
        [key]: actualValue,
        model_id: undefined,
        grade_iaai: undefined
      });
    } else if (key === 'model_id') {
      onModelChange?.(actualValue || '');
      onFiltersChange({
        ...filters,
        [key]: actualValue,
        grade_iaai: undefined
      });
    } else {
      const updatedFilters = { ...filters, [key]: actualValue };
      onFiltersChange(updatedFilters);
    }
    
    setTimeout(() => setIsLoading(false), 50);
  }, [filters, onFiltersChange, onManufacturerChange, onModelChange]);

  // Enhanced search handler
  const handleSearchClick = useCallback(() => {
    if (searchTerm !== filters.search) {
      updateFilter('search', searchTerm);
    }
    if (onSearchCars) {
      onSearchCars();
    } else if (isHomepage) {
      const searchParams = new URLSearchParams();
      Object.entries({ ...filters, search: searchTerm }).forEach(([key, value]) => {
        if (value && value !== '') {
          searchParams.set(key, value);
        }
      });
      window.location.href = `/catalog?${searchParams.toString()}`;
    }
  }, [onSearchCars, isHomepage, filters, searchTerm]);

  // Handle year range preset selection
  const handleYearRangePreset = useCallback((preset: { label: string; from: number; to: number }) => {
    const updatedFilters = {
      ...filters,
      from_year: preset.from.toString(),
      to_year: preset.to.toString()
    };
    onFiltersChange(updatedFilters);
  }, [filters, onFiltersChange]);

  // Remove specific filter
  const removeFilter = useCallback((filterType: string) => {
    const updatedFilters = { ...filters };
    switch (filterType) {
      case 'brand':
        delete updatedFilters.manufacturer_id;
        delete updatedFilters.model_id;
        delete updatedFilters.grade_iaai;
        break;
      case 'model':
        delete updatedFilters.model_id;
        delete updatedFilters.grade_iaai;
        break;
      case 'year':
        delete updatedFilters.from_year;
        delete updatedFilters.to_year;
        break;
      case 'price':
        delete updatedFilters.buy_now_price_from;
        delete updatedFilters.buy_now_price_to;
        break;
      case 'color':
        delete updatedFilters.color;
        break;
      case 'fuel':
        delete updatedFilters.fuel_type;
        break;
      case 'transmission':
        delete updatedFilters.transmission;
        break;
      case 'grade':
        delete updatedFilters.grade_iaai;
        break;
      case 'search':
        delete updatedFilters.search;
        setSearchTerm('');
        break;
    }
    onFiltersChange(updatedFilters);
  }, [filters, onFiltersChange]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const years = useMemo(() => generateYearRange(currentYear), [currentYear]);
  const yearRangePresets = useMemo(() => generateYearPresets(currentYear), [currentYear]);

  // Year options for dropdowns
  const yearOptions = useMemo(() => [
    ...(isStrictMode && (filters.from_year || filters.to_year) ? [] : [{ value: 'all', label: 'Any year' }]),
    ...years.map(year => ({
      value: year.toString(),
      label: year.toString()
    }))
  ], [years, isStrictMode, filters.from_year, filters.to_year]);

  // Sorted manufacturers
  const sortedManufacturers = useMemo(() => sortManufacturers(manufacturers), [manufacturers]);

  // Fetch grades when filters change
  useEffect(() => {
    if (filters.manufacturer_id && onFetchGrades) {
      setIsLoadingGrades(true);
      onFetchGrades(filters.manufacturer_id, filters.model_id)
        .then(gradesData => {
          if (Array.isArray(gradesData)) {
            setGrades(gradesData);
          }
          setIsLoadingGrades(false);
        })
        .catch((err) => {
          console.error('Grade fetch error:', err);
          setIsLoadingGrades(false);
        });
    } else {
      setGrades([]);
      setIsLoadingGrades(false);
    }
  }, [filters.manufacturer_id, filters.model_id, onFetchGrades]);

  // Popular filter presets inspired by Encar.com
  const popularPresets = [
    { label: 'Recent Models (2020+)', filters: { from_year: '2020' } },
    { label: 'Budget Friendly', filters: { buy_now_price_to: '15000' } },
    { label: 'Low Mileage', filters: { odometer_to_km: '50000' } },
    { label: 'Premium Cars', filters: { buy_now_price_from: '25000' } },
  ];

  const handlePresetClick = useCallback((preset: { label: string; filters: any }) => {
    onFiltersChange({ ...filters, ...preset.filters });
  }, [filters, onFiltersChange]);

  // Filter summary text
  const getFilterSummary = () => {
    const activeCount = activeFilters.length;
    if (activeCount === 0) return 'All vehicles';
    if (activeCount === 1) return `${activeCount} filter applied`;
    return `${activeCount} filters applied`;
  };

  // Mobile compact view
  if (compact) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/10">
        {/* Header with close button - improved spacing */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-b bg-card/80 backdrop-blur-sm safe-area-inset">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-base sm:text-lg">Search Filters</h3>
            </div>
            {onCloseFilter && (
              <Button variant="ghost" size="sm" onClick={onCloseFilter} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Filter summary - improved layout */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {getFilterSummary()}
            </Badge>
            {activeFilters.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-7 px-2 text-xs">
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable content - improved spacing */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 safe-area-inset">
          
          {/* Quick Search - improved styling */}
          <Card className="p-3 sm:p-4 border-primary/20 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-primary" />
              <Label className="font-medium text-sm">Quick Search</Label>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search cars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
                className="flex-1 h-10"
              />
              <Button onClick={handleSearchClick} size="sm" className="px-3 h-10">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Active Filter Chips - improved layout */}
          {activeFilters.length > 0 && (
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-primary" />
                <Label className="font-medium text-sm">Active Filters</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map(filterType => {
                  let label = filterType;
                  let value = '';
                  
                  switch (filterType) {
                    case 'brand':
                      const brand = sortedManufacturers.find(m => m.id.toString() === filters.manufacturer_id);
                      label = 'Brand';
                      value = brand?.name || '';
                      break;
                    case 'model':
                      const model = models.find(m => m.id.toString() === filters.model_id);
                      label = 'Model';
                      value = model?.name || '';
                      break;
                    case 'year':
                      label = 'Year';
                      if (filters.from_year && filters.to_year) {
                        value = `${filters.from_year}-${filters.to_year}`;
                      } else if (filters.from_year) {
                        value = `${filters.from_year}+`;
                      } else if (filters.to_year) {
                        value = `Up to ${filters.to_year}`;
                      }
                      break;
                    case 'price':
                      label = 'Price';
                      if (filters.buy_now_price_from && filters.buy_now_price_to) {
                        value = `€${filters.buy_now_price_from}-${filters.buy_now_price_to}`;
                      } else if (filters.buy_now_price_from) {
                        value = `€${filters.buy_now_price_from}+`;
                      } else if (filters.buy_now_price_to) {
                        value = `Up to €${filters.buy_now_price_to}`;
                      }
                      break;
                    case 'search':
                      label = 'Search';
                      value = filters.search || '';
                      break;
                    default:
                      value = filters[filterType as keyof APIFilters] || '';
                  }

                  return (
                    <Badge 
                      key={filterType} 
                      variant="secondary" 
                      className="flex items-center gap-1 pr-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <span className="text-xs">{label}: {value}</span>
                      <button
                        onClick={() => removeFilter(filterType)}
                        className="ml-1 hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${label} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Popular Presets - improved styling */}
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-primary" />
              <Label className="font-medium text-sm">Popular Searches</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {popularPresets.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className="justify-start text-xs h-9 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <Zap className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{preset.label}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Main Filters - improved spacing and validation feedback */}
          <Card className="p-3 sm:p-4 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Car className="h-4 w-4 text-primary" />
              <Label className="font-medium text-sm">Vehicle Details</Label>
            </div>

            {/* Brand - enhanced validation */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                Brand
                <span className="text-xs text-muted-foreground">(Required)</span>
              </Label>
              <AdaptiveSelect 
                value={filters.manufacturer_id || 'all'} 
                onValueChange={(value) => updateFilter('manufacturer_id', value)}
                placeholder="Select brand"
                className={`w-full ${!filters.manufacturer_id && isStrictMode ? 'border-orange-200 bg-orange-50' : ''}`}
                options={[
                  ...(isStrictMode && filters.manufacturer_id ? [] : [{ value: 'all', label: 'All Brands' }]),
                  ...sortedManufacturers.map((manufacturer) => ({
                    value: manufacturer.id.toString(),
                    label: `${manufacturer.name} (${manufacturer.cars_qty})`
                  }))
                ]}
              />
              {!filters.manufacturer_id && isStrictMode && (
                <p className="text-xs text-orange-600">Please select a brand to see available models</p>
              )}
            </div>

            {/* Model - enhanced validation */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                Model
                {filters.manufacturer_id && (
                  <span className="text-xs text-muted-foreground">(Optional)</span>
                )}
              </Label>
              <AdaptiveSelect 
                value={filters.model_id || 'all'} 
                onValueChange={(value) => updateFilter('model_id', value)}
                disabled={!filters.manufacturer_id}
                placeholder={filters.manufacturer_id ? "Select model" : "Select brand first"}
                className={`w-full ${!filters.manufacturer_id ? 'opacity-50' : ''}`}
                options={[
                  { value: 'all', label: 'All Models' },
                  ...models.map((model) => ({
                    value: model.id.toString(),
                    label: `${model.name} (${model.cars_qty || 0})`
                  }))
                ]}
              />
              {!filters.manufacturer_id && (
                <p className="text-xs text-muted-foreground">Select a brand first to see available models</p>
              )}
              {filters.manufacturer_id && models.length === 0 && (
                <p className="text-xs text-muted-foreground">Loading models...</p>
              )}
            </div>

            {/* Year Range Presets - improved layout */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Year Range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {yearRangePresets.slice(0, 4).map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleYearRangePreset(preset)}
                    className="text-xs h-8 border-primary/20 hover:border-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Year Range - improved spacing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">From Year</Label>
                <AdaptiveSelect
                  value={filters.from_year || 'all'}
                  onValueChange={(value) => updateFilter('from_year', value)}
                  placeholder="Any"
                  className="w-full text-sm h-10"
                  options={yearOptions}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">To Year</Label>
                <AdaptiveSelect
                  value={filters.to_year || 'all'}
                  onValueChange={(value) => updateFilter('to_year', value)}
                  placeholder="Any"
                  className="w-full text-sm h-10"
                  options={yearOptions}
                />
              </div>
            </div>

            {/* Price Range - improved layout */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Price Range (EUR)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Min Price</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.buy_now_price_from || ''}
                    onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                    className="text-sm h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Max Price</Label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.buy_now_price_to || ''}
                    onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                    className="text-sm h-10"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Advanced Filters - improved styling */}
          {showAdvanced && (
            <Card className="p-3 sm:p-4 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-primary" />
                <Label className="font-medium text-sm">Advanced Options</Label>
              </div>

              {/* Color - improved layout */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Palette className="h-3 w-3" />
                  Color
                </Label>
                <AdaptiveSelect
                  value={filters.color || 'all'}
                  onValueChange={(value) => updateFilter('color', value)}
                  placeholder="Any color"
                  className="w-full h-10"
                  options={[
                    { value: 'all', label: 'Any Color' },
                    ...colorOptions
                  ]}
                />
              </div>

              {/* Fuel Type - improved layout */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Fuel className="h-3 w-3" />
                  Fuel Type
                </Label>
                <AdaptiveSelect
                  value={filters.fuel_type || 'all'}
                  onValueChange={(value) => updateFilter('fuel_type', value)}
                  placeholder="Any fuel"
                  className="w-full h-10"
                  options={[
                    { value: 'all', label: 'Any Fuel' },
                    ...fuelTypeOptions
                  ]}
                />
              </div>

              {/* Transmission - improved layout */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Cog className="h-3 w-3" />
                  Transmission
                </Label>
                <AdaptiveSelect
                  value={filters.transmission || 'all'}
                  onValueChange={(value) => updateFilter('transmission', value)}
                  placeholder="Any transmission"
                  className="w-full h-10"
                  options={[
                    { value: 'all', label: 'Any Transmission' },
                    ...transmissionOptions
                  ]}
                />
              </div>
            </Card>
          )}

          {/* Advanced Toggle - improved styling */}
          <Button
            variant="outline"
            onClick={onToggleAdvanced}
            className="w-full border-primary/20 hover:border-primary/40 transition-colors h-10"
          >
            <Settings className="h-4 w-4 mr-2" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
            {showAdvanced ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
        </div>

        {/* Footer Actions - improved layout */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-t bg-card/80 backdrop-blur-sm safe-area-inset">
          <Button 
            onClick={handleSearchClick} 
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium h-12 text-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search Vehicles
          </Button>
        </div>
      </div>
    );
  }

  // Desktop view would go here (not shown for brevity)
  return (
    <div className="p-4">
      <p>Desktop view not implemented yet</p>
    </div>
  );
});

ModernEncarFilter.displayName = 'ModernEncarFilter';

export default ModernEncarFilter;