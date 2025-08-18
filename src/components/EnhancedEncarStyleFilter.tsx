import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdaptiveSelect } from '@/components/ui/adaptive-select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Car, Search, X, Filter, Calendar, Fuel, Palette, Settings } from 'lucide-react';
import { debounce } from '../utils/catalog-filter';
import { categorizeGrades, categorizeTrimLevels, deduplicateOptions, groupOptionsByCategory } from '../utils/gradeUtils';
import type { APIFilters, Manufacturer, Model } from '../types/models';

interface FilterCounts {
  manufacturers: { [key: string]: number };
  models: { [key: string]: number };
  colors: { [key: string]: number };
  fuelTypes: { [key: string]: number };
  transmissions: { [key: string]: number };
  years: { [key: string]: number };
}

interface EnhancedEncarStyleFilterProps {
  filters: APIFilters;
  manufacturers: Manufacturer[];
  models: Model[];
  filterCounts?: FilterCounts;
  onFiltersChange: (filters: APIFilters) => void;
  onClearFilters: () => void;
  onSearchClick?: () => void;
  onCloseFilter?: () => void;
  onFetchGrades?: (manufacturerId?: string, modelId?: string) => Promise<Array<{ value: string; label: string }>>;
  onFetchTrimLevels?: (manufacturerId?: string, modelId?: string) => Promise<Array<{ value: string; label: string }>>;
  showAdvanced?: boolean;
  isHomepage?: boolean;
  compact?: boolean;
}

const EnhancedEncarStyleFilter: React.FC<EnhancedEncarStyleFilterProps> = ({
  filters,
  manufacturers,
  models,
  filterCounts,
  onFiltersChange,
  onClearFilters,
  onSearchClick,
  onCloseFilter,
  onFetchGrades,
  onFetchTrimLevels,
  showAdvanced = false,
  isHomepage = false,
  compact = false
}) => {
  const [grades, setGrades] = useState<Array<{ value: string; label: string; category?: string }>>([]);
  const [trimLevels, setTrimLevels] = useState<Array<{ value: string; label: string; category?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);

  // Memoized filtered manufacturers with better sorting and deduplication
  const sortedManufacturers = useMemo(() => {
    return manufacturers
      .filter((m, index, arr) => 
        // Remove duplicates by id
        arr.findIndex(item => item.id === m.id) === index &&
        m.name && 
        m.name.trim().length > 0 &&
        (m.cars_qty && m.cars_qty > 0)
      )
      .sort((a, b) => {
        // Sort by car count descending, then alphabetically
        if ((b.cars_qty || 0) !== (a.cars_qty || 0)) {
          return (b.cars_qty || 0) - (a.cars_qty || 0);
        }
        return a.name.localeCompare(b.name);
      });
  }, [manufacturers]);

  // Memoized filtered models with deduplication
  const filteredModels = useMemo(() => {
    if (!filters.manufacturer_id) return [];
    
    return models
      .filter((m, index, arr) => 
        // Remove duplicates by id and filter by manufacturer
        arr.findIndex(item => item.id === m.id) === index &&
        m.manufacturer_id.toString() === filters.manufacturer_id &&
        m.name && 
        m.name.trim().length > 0
      )
      .sort((a, b) => {
        // Sort by car count descending, then alphabetically
        if ((b.cars_qty || 0) !== (a.cars_qty || 0)) {
          return (b.cars_qty || 0) - (a.cars_qty || 0);
        }
        return a.name.localeCompare(b.name);
      });
  }, [models, filters.manufacturer_id]);

  // Categorized and deduplicated grades
  const categorizedGrades = useMemo(() => {
    const deduped = deduplicateOptions(grades);
    const categorized = categorizeGrades(deduped);
    return groupOptionsByCategory(categorized);
  }, [grades]);

  // Categorized and deduplicated trim levels
  const categorizedTrimLevels = useMemo(() => {
    const deduped = deduplicateOptions(trimLevels);
    const categorized = categorizeTrimLevels(deduped);
    return groupOptionsByCategory(categorized);
  }, [trimLevels]);

  const isStrictMode = !!(filters.manufacturer_id || filters.model_id || filters.color || filters.fuel_type);

  const updateFilter = useCallback(debounce((key: keyof APIFilters, value: string) => {
    const newFilters = { ...filters };
    
    if (value === 'all' || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    // Reset dependent filters when parent changes
    if (key === 'manufacturer_id') {
      delete newFilters.model_id;
      delete newFilters.grade_iaai;
      delete newFilters.trim_level;
      setGrades([]);
      setTrimLevels([]);
    } else if (key === 'model_id') {
      delete newFilters.grade_iaai;
      delete newFilters.trim_level;
    }

    onFiltersChange(newFilters);
  }, 150), [filters, onFiltersChange]);

  const handleSearchClick = useCallback(() => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      // Fallback navigation to catalog
      window.location.href = '/catalog';
    }
  }, [onSearchClick]);

  const handleYearRangePreset = useCallback((preset: { from: number; to: number }) => {
    const newFilters = { 
      ...filters, 
      from_year: preset.from.toString(), 
      to_year: preset.to.toString() 
    };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Fetch grades when manufacturer/model changes
  useEffect(() => {
    if (filters.manufacturer_id && onFetchGrades) {
      setIsLoadingGrades(true);
      const timeoutId = setTimeout(() => {
        onFetchGrades(filters.manufacturer_id, filters.model_id)
          .then(gradesData => {
            if (Array.isArray(gradesData)) {
              setGrades(gradesData.filter(g => g.value && g.label));
            }
            setIsLoadingGrades(false);
          })
          .catch((err) => {
            console.error('Grade fetch error:', err);
            setGrades([]);
            setIsLoadingGrades(false);
          });
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setGrades([]);
      setIsLoadingGrades(false);
    }
  }, [filters.manufacturer_id, filters.model_id, onFetchGrades]);

  // Fetch trim levels when manufacturer/model changes
  useEffect(() => {
    if (filters.manufacturer_id && onFetchTrimLevels) {
      const timeoutId = setTimeout(() => {
        onFetchTrimLevels(filters.manufacturer_id, filters.model_id)
          .then(trimLevelsData => {
            if (Array.isArray(trimLevelsData)) {
              setTrimLevels(trimLevelsData.filter(t => t.value && t.label));
            }
          })
          .catch((err) => {
            console.error('Trim level fetch error:', err);
            setTrimLevels([]);
          });
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setTrimLevels([]);
    }
  }, [filters.manufacturer_id, filters.model_id, onFetchTrimLevels]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Render categorized dropdown options
  const renderCategorizedOptions = (
    groupedOptions: Array<{ category: string; options: any[] }>,
    allOption: { value: string; label: string }
  ) => {
    const options = [];
    
    // Add "All" option if not in strict mode
    if (!isStrictMode) {
      options.push(allOption);
    }

    // Add categorized options
    groupedOptions.forEach(group => {
      if (group.options.length > 0) {
        // Add category separator
        options.push({
          value: `category-${group.category}`,
          label: `--- ${group.category} ---`,
          disabled: true
        });
        
        // Add options in this category
        group.options.forEach(option => {
          options.push({
            value: option.value,
            label: option.label
          });
        });
      }
    });

    return options;
  };

  if (compact) {
    return (
      <div className="space-y-3 h-full flex flex-col">
        <div className="flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm font-semibold">Search Cars</h3>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-destructive flex items-center gap-1 h-6 px-1.5"
            >
              <X className="h-3 w-3" />
              <span className="text-xs">Clear</span>
            </Button>
            {onCloseFilter && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCloseFilter}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 h-6 px-1.5"
              >
                <X className="h-3 w-3" />
                <span className="text-xs">Close</span>
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pb-2">
          {/* Brand Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Car className="h-3 w-3" />
              Brand
            </Label>
            <AdaptiveSelect 
              value={filters.manufacturer_id || 'all'} 
              onValueChange={(value) => updateFilter('manufacturer_id', value)}
              placeholder="Select brand"
              className="h-8 text-xs"
              options={[
                ...(isStrictMode && filters.manufacturer_id ? [] : [{ value: 'all', label: 'All Brands' }]),
                ...sortedManufacturers.map((manufacturer) => ({
                  value: manufacturer.id.toString(),
                  label: `${manufacturer.name} (${manufacturer.cars_qty})`
                }))
              ]}
            />
          </div>

          {/* Model Filter */}
          {filters.manufacturer_id && (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Model</Label>
              <AdaptiveSelect 
                value={filters.model_id || 'all'} 
                onValueChange={(value) => updateFilter('model_id', value)}
                placeholder="Select model"
                className="h-8 text-xs"
                options={[
                  ...(isStrictMode && filters.model_id ? [] : [{ value: 'all', label: 'All Models' }]),
                  ...filteredModels.map((model) => ({
                    value: model.id.toString(),
                    label: `${model.name} ${model.cars_qty ? `(${model.cars_qty})` : ''}`
                  }))
                ]}
              />
            </div>
          )}

          {/* Enhanced Grade Filter */}
          {categorizedGrades.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Settings className="h-3 w-3" />
                Grade
              </Label>
              <AdaptiveSelect 
                value={filters.grade_iaai || 'all'} 
                onValueChange={(value) => updateFilter('grade_iaai', value)}
                placeholder={isLoadingGrades ? "Loading..." : "Select grade"}
                className="h-8 text-xs"
                disabled={isLoadingGrades}
                options={renderCategorizedOptions(categorizedGrades, { value: 'all', label: 'All Grades' })}
              />
            </div>
          )}

          {/* Enhanced Trim Level Filter */}
          {categorizedTrimLevels.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Trim Level</Label>
              <AdaptiveSelect 
                value={filters.trim_level || 'all'} 
                onValueChange={(value) => updateFilter('trim_level', value)}
                placeholder="Select trim"
                className="h-8 text-xs"
                options={renderCategorizedOptions(categorizedTrimLevels, { value: 'all', label: 'All Trims' })}
              />
            </div>
          )}

          {/* Search Button */}
          <Button 
            onClick={handleSearchClick}
            className="w-full h-8 text-xs"
            disabled={isLoading}
          >
            <Search className="h-3 w-3 mr-1" />
            Search Cars
          </Button>
        </div>
      </div>
    );
  }

  // Return full filter interface for non-compact mode
  return (
    <div className="space-y-4">
      {/* Rest of the component remains similar but with enhanced grade/trim dropdowns */}
      <Collapsible defaultOpen={true} className="border rounded-md">
        <CollapsibleTrigger className="group flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <Label className="text-sm font-semibold">Basic Filters</Label>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 peer-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
          {/* Brand Filter */}
          <div className="space-y-2">
            <Label htmlFor="manufacturer" className="text-sm font-medium">
              <Car className="mr-2 inline-block h-4 w-4" />
              Brand
            </Label>
            <AdaptiveSelect
              value={filters.manufacturer_id || 'all'}
              onValueChange={(value) => updateFilter('manufacturer_id', value)}
              placeholder="Select brand"
              options={[
                ...(isStrictMode && filters.manufacturer_id ? [] : [{ value: 'all', label: 'All Brands' }]),
                ...sortedManufacturers.map((manufacturer) => ({
                  value: manufacturer.id.toString(),
                  label: `${manufacturer.name} (${manufacturer.cars_qty})`,
                })),
              ]}
            />
          </div>

          {/* Model Filter */}
          {filters.manufacturer_id && (
            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm font-medium">
                Model
              </Label>
              <AdaptiveSelect
                value={filters.model_id || 'all'}
                onValueChange={(value) => updateFilter('model_id', value)}
                placeholder="Select model"
                options={[
                  ...(isStrictMode && filters.model_id ? [] : [{ value: 'all', label: 'All Models' }]),
                  ...filteredModels.map((model) => ({
                    value: model.id.toString(),
                    label: `${model.name} ${model.cars_qty ? `(${model.cars_qty})` : ''}`,
                  })),
                ]}
              />
            </div>
          )}

          {/* Year Range Filter */}
          <div className="space-y-2">
            <Label htmlFor="year" className="text-sm font-medium">
              <Calendar className="mr-2 inline-block h-4 w-4" />
              Year
            </Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                id="from_year"
                placeholder="From"
                value={filters.from_year || ''}
                onChange={(e) => updateFilter('from_year', e.target.value)}
                className="w-24"
              />
              <Input
                type="number"
                id="to_year"
                placeholder="To"
                value={filters.to_year || ''}
                onChange={(e) => updateFilter('to_year', e.target.value)}
                className="w-24"
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleYearRangePreset({ from: new Date().getFullYear() - 5, to: new Date().getFullYear() })}>Last 5 Years</Button>
              <Button variant="outline" size="sm" onClick={() => handleYearRangePreset({ from: new Date().getFullYear() - 10, to: new Date().getFullYear() })}>Last 10 Years</Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Enhanced Grade Filter */}
      {categorizedGrades.length > 0 && (
        <Collapsible className="border rounded-md">
          <CollapsibleTrigger className="group flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <Label className="text-sm font-semibold">Grade</Label>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 peer-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4">
            <div className="space-y-2">
              <Label htmlFor="grade" className="text-sm font-medium">
                Grade
              </Label>
              <AdaptiveSelect
                value={filters.grade_iaai || 'all'}
                onValueChange={(value) => updateFilter('grade_iaai', value)}
                placeholder={isLoadingGrades ? "Loading..." : "Select grade"}
                disabled={isLoadingGrades}
                options={renderCategorizedOptions(categorizedGrades, { value: 'all', label: 'All Grades' })}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Enhanced Trim Level Filter */}
      {categorizedTrimLevels.length > 0 && (
        <Collapsible className="border rounded-md">
          <CollapsibleTrigger className="group flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <Label className="text-sm font-semibold">Trim Level</Label>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 peer-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4">
            <div className="space-y-2">
              <Label htmlFor="trim" className="text-sm font-medium">
                Trim Level
              </Label>
              <AdaptiveSelect
                value={filters.trim_level || 'all'}
                onValueChange={(value) => updateFilter('trim_level', value)}
                placeholder="Select trim"
                options={renderCategorizedOptions(categorizedTrimLevels, { value: 'all', label: 'All Trims' })}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Collapsible className="border rounded-md">
        <CollapsibleTrigger className="group flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <Label className="text-sm font-semibold">More Filters</Label>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300 peer-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
          {/* Color Filter */}
          <div className="space-y-2">
            <Label htmlFor="color" className="text-sm font-medium">
              <Palette className="mr-2 inline-block h-4 w-4" />
              Color
            </Label>
            <Input
              type="text"
              id="color"
              placeholder="Enter color"
              value={filters.color || ''}
              onChange={(e) => updateFilter('color', e.target.value)}
            />
          </div>

          {/* Fuel Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="fuel_type" className="text-sm font-medium">
              <Fuel className="mr-2 inline-block h-4 w-4" />
              Fuel Type
            </Label>
            <Input
              type="text"
              id="fuel_type"
              placeholder="Enter fuel type"
              value={filters.fuel_type || ''}
              onChange={(e) => updateFilter('fuel_type', e.target.value)}
            />
          </div>

          {/* Transmission Filter */}
          <div className="space-y-2">
            <Label htmlFor="transmission" className="text-sm font-medium">
              <Settings className="mr-2 inline-block h-4 w-4" />
              Transmission
            </Label>
            <Input
              type="text"
              id="transmission"
              placeholder="Enter transmission"
              value={filters.transmission || ''}
              onChange={(e) => updateFilter('transmission', e.target.value)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button onClick={handleSearchClick} className="w-full">
        <Search className="mr-2 h-4 w-4" />
        Search Cars
      </Button>
    </div>
  );
};

export default EnhancedEncarStyleFilter;
