import React, { useState, memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter, X, Loader2, Search } from "lucide-react";
import { COLOR_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS } from '@/hooks/useAuctionAPI';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";



// Debounce utility function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface Manufacturer {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?:number;
  image?:string;
  
}

interface Model {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?:number;
}

interface Generation {
  cars_qty?:number;
  from_year?:number;
  id:number;
  manufacturer_id?:number;
  model_id?:number;
  name:string;
  to_year?:number;
}

interface FilterCounts {
  manufacturers: { [key: string]: number };
  models: { [key: string]: number };
  generations: { [key: string]: number };
  colors: { [key: string]: number };
  fuelTypes: { [key: string]: number };
  transmissions: { [key: string]: number };
  years: { [key: string]: number };
}

interface FilterFormProps {
  filters: {
    manufacturer_id?: string;
    model_id?: string;
    generation_id?: string;
    grade_iaai?: string;
    color?: string;
    fuel_type?: string;
    transmission?: string;
    odometer_from_km?: string;
    odometer_to_km?: string;
    from_year?: string;
    to_year?: string;
    buy_now_price_from?: string;
    buy_now_price_to?: string;
    seats_count?: string;
    search?: string;
    max_accidents?: string;
  };
  manufacturers: Manufacturer[];
  models?: Model[];
  generations?: Generation[];
  filterCounts?: FilterCounts;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  onManufacturerChange?: (manufacturerId: string) => void;
  onModelChange?: (modelId: string) => void;
  onGenerationChange?: (generationId: string) => void;
  showAdvanced?: boolean;
  onToggleAdvanced?: () => void;
  loadingCounts?: boolean;
  onFetchGrades?: (manufacturerId?: string, modelId?: string, generationId?: string) => Promise<{ value: string; label: string; count?: number }[]>;
}

const FilterForm = memo<FilterFormProps>(({
  filters,
  manufacturers,
  models = [],
  generations = [],
  filterCounts,
  loadingCounts = false,
  onFiltersChange,
  onClearFilters,
  onManufacturerChange,
  onModelChange,
  onGenerationChange,
  showAdvanced = false,
  onToggleAdvanced,
  onFetchGrades
}) => {
  const [grades, setGrades] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [gradeLoading, setGradeLoading] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const latestGradeRequest = useRef(0);


  const updateFilter = useCallback((key: string, value: string) => {
    // Handle special "all" values by converting them to undefined
    const actualValue = value === 'all' || value === 'any' ? undefined : value;
    
    // Set loading state for better UX
    setIsLoading(true);
    
    // Handle cascading filters
    if (key === 'manufacturer_id') {
      onManufacturerChange?.(actualValue || '');
      onFiltersChange({
        ...filters,
        [key]: actualValue,
        model_id: undefined,
        generation_id: undefined,
        grade_iaai: undefined // Clear grade when manufacturer changes
      });
    } else if (key === 'model_id') {
      onModelChange?.(actualValue || '');
      onFiltersChange({
        ...filters,
        [key]: actualValue,
        generation_id: undefined,
        grade_iaai: undefined // Clear grade when model changes
      });
    } else {
      // For other filters, preserve existing values but update the changed one
      const updatedFilters = { ...filters, [key]: actualValue };
      
      // If generation changes, clear grade filter
      if (key === 'generation_id') {
        updatedFilters.grade_iaai = undefined;
      }
      
      onFiltersChange(updatedFilters);
    }
    
    // Clear loading state after a short delay
    setTimeout(() => setIsLoading(false), 50);
  }, [filters, onFiltersChange, onManufacturerChange, onModelChange]);

  const handleBrandChange = async (value: string) => {
    setModelLoading(true);
    setModelError(null);
    updateFilter('manufacturer_id', value);
    // Clear models immediately
    if (onModelChange) onModelChange('');
    // Set a timeout for error
    const timeout = setTimeout(() => {
      setModelError('Model loading timed out. Please try again.');
      setModelLoading(false);
    }, 5000);
    try {
      await onManufacturerChange?.(value);
      clearTimeout(timeout);
      setModelLoading(false);
    } catch (e) {
      setModelError('Failed to load models.');
      setModelLoading(false);
      clearTimeout(timeout);
    }
  };


  const currentYear = useMemo(() => new Date().getFullYear(), []);
  // Issue #2: Enhanced year range - 30 years (2025-1995) to 1996
  const years = useMemo(() => Array.from({ length: 30 }, (_, i) => Math.max(currentYear + 1 - i, 1996)), [currentYear]);

  // Memoized sorted manufacturers with enhanced API data validation and categorization
  const sortedManufacturers = useMemo(() => {
    const validManufacturers = manufacturers
      .filter((m) => {
        // Ensure manufacturer has valid data from API
        return m.id && 
               m.name && 
               typeof m.name === 'string' && 
               m.name.trim().length > 0 &&
               (m.cars_qty && m.cars_qty > 0);
      });

    // Define categories with their brand priorities
    const categories = {
      german: {
        name: 'German Brands',
        brands: ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche', 'Opel'],
        priority: 1
      },
      korean: {
        name: 'Korean Brands', 
        brands: ['Hyundai', 'Kia', 'Genesis'],
        priority: 2
      },
      japanese: {
        name: 'Japanese Brands',
        brands: ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Lexus', 'Infiniti', 'Acura', 'Mitsubishi'],
        priority: 3
      },
      american: {
        name: 'American Brands',
        brands: ['Ford', 'Chevrolet', 'Cadillac', 'GMC', 'Tesla', 'Chrysler', 'Jeep', 'Dodge'],
        priority: 4
      },
      luxury: {
        name: 'Luxury/European Brands',
        brands: ['Land Rover', 'Jaguar', 'Volvo', 'Ferrari', 'Lamborghini', 'Maserati', 'Bentley', 'Rolls-Royce', 'Aston Martin', 'McLaren', 'Mini'],
        priority: 5
      },
      french: {
        name: 'French Brands',
        brands: ['Peugeot', 'Renault', 'Citroën'],
        priority: 6
      },
      italian: {
        name: 'Italian Brands', 
        brands: ['Fiat', 'Alfa Romeo'],
        priority: 7
      },
      other: {
        name: 'Other Brands',
        brands: ['Skoda', 'Seat'],
        priority: 8
      }
    };

    // Sort manufacturers by category and count
    return validManufacturers.sort((a, b) => {
      const aName = a.name.trim();
      const bName = b.name.trim();
      
      // Find category for each manufacturer
      let aCategoryPriority = 999;
      let bCategoryPriority = 999;
      
      Object.values(categories).forEach(category => {
        if (category.brands.includes(aName)) {
          aCategoryPriority = category.priority;
        }
        if (category.brands.includes(bName)) {
          bCategoryPriority = category.priority;
        }
      });
      
      // Sort by category priority first
      if (aCategoryPriority !== bCategoryPriority) {
        return aCategoryPriority - bCategoryPriority;
      }
      
      // Within same category, sort by car count (descending)
      const aCount = a.cars_qty || 0;
      const bCount = b.cars_qty || 0;
      if (aCount !== bCount) {
        return bCount - aCount;
      }
      
      // Finally, alphabetical
      return aName.localeCompare(bName);
    });
  }, [manufacturers]);

  const getFallbackGrades = (manufacturerId: string) => {
    const fallbacks = {
      '9': ['320d', '320i', '325d', '330d', '330i', '335d', '335i', 'M3', 'M5', 'X3', 'X5'], // BMW
      '16': ['220d', '250', '300', '350', '400', '450', '500', 'AMG'], // Mercedes-Benz
      '1': ['30 TDI', '35 TDI', '40 TDI', '45 TDI', '50 TDI', '55 TFSI', '30 TFSI', '35 TFSI', '40 TFSI', '45 TFSI', '30', '35', '40', '45', '50', '55', 'RS', 'S'], // Audi
      '147': ['1.4 TSI', '1.6 TDI', '1.8 TSI', '2.0 TDI', '2.0 TSI', 'GTI', 'R'], // Volkswagen
      '2': ['Civic', 'Accord', 'CR-V', 'HR-V'], // Honda
      '3': ['Corolla', 'Camry', 'RAV4', 'Highlander'], // Toyota
      '4': ['Altima', 'Maxima', 'Rogue', 'Murano'], // Nissan
      '5': ['Focus', 'Fiesta', 'Mondeo', 'Kuga'], // Ford
      '6': ['Cruze', 'Malibu', 'Equinox', 'Tahoe'], // Chevrolet
    };
    return (fallbacks[manufacturerId] || []).map(grade => ({ value: grade, label: grade }));
  };

  // Fetch grades when manufacturer, model, or generation changes
  useEffect(() => {
    let cancelled = false;
    if (filters.manufacturer_id && onFetchGrades) {
      // Set fallback immediately for instant response
      const fallback = getFallbackGrades(filters.manufacturer_id);
      setGrades(fallback);
      setIsLoadingGrades(true);
      
      const requestId = Date.now();
      latestGradeRequest.current = requestId;
      
      onFetchGrades(filters.manufacturer_id, filters.model_id, filters.generation_id)
        .then(gradesData => {
          // Only update if this is the latest request and we have better data
          if (!cancelled && latestGradeRequest.current === requestId && Array.isArray(gradesData)) {
            // If we got real data with more variety than fallback, use it
            if (gradesData.length > fallback.length || 
                (gradesData.length > 0 && gradesData.some(g => g.count && g.count > 0))) {
              setGrades(gradesData);
            }
            // If gradesData is empty or worse than fallback, keep fallback
          }
          setIsLoadingGrades(false);
        })
        .catch((err) => {
          console.error('Grade fetch error:', err);
          setIsLoadingGrades(false);
          // Keep fallback on error
        });
    } else {
      setGrades([]);
      setIsLoadingGrades(false);
    }
    return () => { cancelled = true; };
  }, [filters.manufacturer_id, filters.model_id, filters.generation_id, onFetchGrades]);


  useEffect(() => {
    console.log(`[FilterForm] Rendering model dropdown. Models available: ${models.length}, disabled: ${!filters.manufacturer_id || isLoading}`);
  }, [models, filters.manufacturer_id, isLoading]);

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-sm sm:text-base font-semibold">Kërkim i mençur</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters} 
            disabled={isLoading}
            className="text-xs px-2 py-1 h-6 ml-2 text-muted-foreground hover:text-destructive"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>





      {/* Basic Filters - Optimized mobile layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="manufacturer" className="text-xs font-medium truncate">Brand</Label>
          <AdaptiveSelect 
            value={filters.manufacturer_id || 'all'} 
            onValueChange={handleBrandChange} 
            disabled={isLoading}
            placeholder={isLoading ? "Loading..." : "All Brands"}
            className="h-8 text-xs"
            options={[
              { value: 'all', label: 'All Brands' },
              ...sortedManufacturers.map((manufacturer) => ({
                value: manufacturer.id.toString(),
                label: (
                  <div className="flex items-center gap-2">
                    <span className="truncate">{manufacturer.name} ({manufacturer.cars_qty})</span>
                  </div>
                )
              }))
            ]}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="model" className="text-xs font-medium truncate">Model</Label>
          <AdaptiveSelect 
            value={filters.model_id || 'all'} 
            onValueChange={(value) => updateFilter('model_id', value)}
            disabled={!filters.manufacturer_id || isLoading}
            placeholder={isLoading ? "Loading..." : (filters.manufacturer_id ? "All Models" : "Select Brand First")}
            className="h-8 text-xs"
            options={[
              { value: 'all', label: 'All Models' },
              ...(models && models.length > 0 ? 
                models
                  .filter((model) => model.cars_qty && model.cars_qty > 0)
                  .map((model) => ({
                    value: model.id.toString(),
                    label: `${model.name} (${model.cars_qty})`
                  }))
                : []
              )
            ]}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="generation" className="text-xs font-medium truncate">Generation</Label>
          <AdaptiveSelect
            value={filters.generation_id || 'all'} 
            onValueChange={(value) => {
              console.log(`🎯 ULTRA PRECISE: Generation select changed to ${value}`);
              if (onGenerationChange) {
                onGenerationChange(value);
              } else {
                updateFilter('generation_id', value);
              }
            }}
            disabled={!filters.manufacturer_id || !filters.model_id}
            placeholder={filters.model_id ? "All Generations" : "Select Model First"}
            className="h-8 text-xs"
            options={[
              { 
                value: 'all', 
                label: filters.model_id ? "All Generations" : "All Generations (all models)"
              },
              ...(generations && generations.length > 0 ? 
                generations.map((generation) => {
                  const displayCount = generation.cars_qty || 0;
                  let yearRange = '';
                  if (generation.from_year) {
                    const from = generation.from_year.toString().slice(-2);
                    const currentYear = new Date().getFullYear();
                    const toYearRaw = generation.to_year || currentYear;
                    const to = (generation.to_year && generation.to_year !== currentYear) ? toYearRaw.toString().slice(-2) : 'present';
                    yearRange = ` (${from}-${to})`;
                  }
                  const countText = displayCount > 0 ? ` (${displayCount})` : '';
                  
                  return {
                    value: generation.id.toString(),
                    label: `${generation.name}${yearRange}${countText}`
                  };
                })
                : []
              )
            ]}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="grade" className="text-xs font-medium truncate">Grade/Engine</Label>
          <AdaptiveSelect 
            value={filters.grade_iaai || 'all'} 
            onValueChange={(value) => updateFilter('grade_iaai', value)}
            disabled={!filters.manufacturer_id || isLoading}
            placeholder={filters.manufacturer_id ? "All Grades" : "Select Brand First"}
            className="h-8 text-xs"
            options={[
              { value: 'all', label: 'All Grades' },
              ...(grades.length === 0 && isLoadingGrades ? 
                [{ value: 'loading', label: 'Loading grades...', disabled: true }] :
                grades.length === 0 && filters.manufacturer_id ? 
                [{ value: 'no-grades', label: 'No grades found', disabled: true }] :
                grades.map((grade) => ({
                  value: grade.value,
                  label: `${grade.label}${grade.count ? ` (${grade.count})` : ''}`
                }))
              )
            ]}
          />
        </div>
      </div>

      {/* Toggle Advanced Filters */}
      {onToggleAdvanced && (
        <Button variant="ghost" size="sm" onClick={onToggleAdvanced} className="w-full sm:w-auto text-xs h-7">
          {showAdvanced ? 'Fshih' : 'Shfaq'} Filtrat e Avancuara
        </Button>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <div className="space-y-1">
              <Label htmlFor="color" className="text-xs font-medium">Ngjyra</Label>
              <AdaptiveSelect 
                value={filters.color || 'all'} 
                onValueChange={(value) => updateFilter('color', value)}
                placeholder="Të gjitha Ngjyrat"
                className="h-8 text-xs sm:text-sm"
                options={[
                  { value: 'all', label: 'Të gjitha Ngjyrat' },
                  ...Object.entries(COLOR_OPTIONS).map(([name, id]) => ({
                    value: id.toString(),
                    label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                  }))
                ]}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="fuel_type" className="text-xs font-medium">Lloji i Karburantit</Label>
              <AdaptiveSelect 
                value={filters.fuel_type || 'all'} 
                onValueChange={(value) => updateFilter('fuel_type', value)}
                placeholder="Të gjithë Llojet"
                className="h-8 text-xs sm:text-sm"
                options={[
                  { value: 'all', label: 'Të gjithë Llojet' },
                  ...Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => ({
                    value: id.toString(),
                    label: name.charAt(0).toUpperCase() + name.slice(1)
                  }))
                ]}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="transmission" className="text-xs font-medium">Transmisioni</Label>
              <AdaptiveSelect 
                value={filters.transmission || 'all'} 
                onValueChange={(value) => updateFilter('transmission', value)}
                placeholder="Të gjithë"
                className="h-8 text-xs sm:text-sm"
                options={[
                  { value: 'all', label: 'Të gjithë' },
                  ...Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => ({
                    value: id.toString(),
                    label: name.charAt(0).toUpperCase() + name.slice(1)
                  }))
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <div className="space-y-1">
              <Label htmlFor="from_year" className="text-xs font-medium">From Year</Label>
              <AdaptiveSelect 
                value={filters.from_year || 'any'} 
                onValueChange={(value) => updateFilter('from_year', value)}
                placeholder="All years"
                className="h-8 text-xs sm:text-sm"
                options={[
                  { value: 'any', label: 'All years' },
                  ...years.map((year) => ({
                    value: year.toString(),
                    label: year.toString()
                  }))
                ]}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="to_year" className="text-xs font-medium">To Year</Label>
              <AdaptiveSelect 
                value={filters.to_year || 'any'} 
                onValueChange={(value) => updateFilter('to_year', value)}
                placeholder="All years"
                className="h-8 text-xs sm:text-sm"
                options={[
                  { value: 'any', label: 'All years' },
                  ...years.map((year) => ({
                    value: year.toString(),
                    label: year.toString()
                  }))
                ]}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="seats" className="text-xs font-medium">Numri i Vendeve</Label>
              <AdaptiveSelect 
                value={filters.seats_count || 'all'} 
                onValueChange={(value) => updateFilter('seats_count', value)}
                placeholder="Të gjitha"
                className="h-8 text-xs sm:text-sm"
                options={[
                  { value: 'all', label: 'Të gjitha' },
                  { value: '2', label: '2 Vende' },
                  { value: '4', label: '4 Vende' },
                  { value: '5', label: '5 Vende' },
                  { value: '7', label: '7 Vende' },
                  { value: '8', label: '8 Vende' },
                  { value: '9', label: '9+ Vende' }
                ]}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="max_accidents" className="text-xs font-medium">Aksidente (Maksimale)</Label>
              <AdaptiveSelect 
                value={filters.max_accidents || 'all'} 
                onValueChange={(value) => updateFilter('max_accidents', value)}
                placeholder="Të gjitha"
                className="h-8 text-xs sm:text-sm"
                options={[
                  { value: 'all', label: 'Të gjitha' },
                  { value: '0', label: 'Pa aksidente' },
                  { value: '1', label: 'Maksimale 1 aksident' },
                  { value: '2', label: 'Maksimale 2 aksidente' }
                ]}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Intervali i Çmimit (Blerje direkte)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Minimum"
                  type="number"
                  className="h-8 text-xs sm:text-sm"
                  value={filters.buy_now_price_from || ''}
                  onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                />
                <Input
                  placeholder="Maksimum"
                  type="number"
                  className="h-8 text-xs sm:text-sm"
                  value={filters.buy_now_price_to || ''}
                  onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Intervali i Kilometrazhit (km)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Minimum"
                  type="number"
                  className="h-8 text-xs sm:text-sm"
                  value={filters.odometer_from_km || ''}
                  onChange={(e) => updateFilter('odometer_from_km', e.target.value)}
                />
                <Input
                  placeholder="Maksimum"
                  type="number"
                  className="h-8 text-xs sm:text-sm"
                  value={filters.odometer_to_km || ''}
                  onChange={(e) => updateFilter('odometer_to_km', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

FilterForm.displayName = 'FilterForm';

export default FilterForm;