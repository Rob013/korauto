import React, { useState, memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter, X, Loader2, Search } from "lucide-react";
import { COLOR_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS, BODY_TYPE_OPTIONS } from '@/constants/carOptions';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  APIFilters,
  sortManufacturers,
  generateYearRange,
  generateYearPresets,
  getFallbackGrades,
  debounce as catalogDebounce
} from '@/utils/catalog-filter';

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

interface FilterCounts {
  manufacturers: { [key: string]: number };
  models: { [key: string]: number };
  colors: { [key: string]: number };
  fuelTypes: { [key: string]: number };
  transmissions: { [key: string]: number };
  years: { [key: string]: number };
}

interface FilterFormProps {
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
}

const FilterForm = memo<FilterFormProps>(({
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
  onFetchTrimLevels
}) => {
  const [grades, setGrades] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [trimLevels, setTrimLevels] = useState<{ value: string; label: string; count?: number }[]>([]);
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
    
    // Handle cascading filters - avoid duplicate API calls
    if (key === 'manufacturer_id') {
      // Only call the specialized handler, not onFiltersChange to avoid duplicate calls
      onManufacturerChange?.(actualValue || '');
    } else if (key === 'model_id') {
      // Only call the specialized handler, not onFiltersChange to avoid duplicate calls
      onModelChange?.(actualValue || '');
    } else {
      // For other filters, use the standard filter change handler
      const updatedFilters = { ...filters, [key]: actualValue };
      onFiltersChange(updatedFilters);
    }
    
    // Clear loading state after a shorter delay for year filters
    const delay = (key === 'from_year' || key === 'to_year') ? 25 : 50;
    setTimeout(() => setIsLoading(false), delay);
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
  // Enhanced year range using utility
  const years = useMemo(() => generateYearRange(currentYear), [currentYear]);

  // Memoized sorted manufacturers using utility
  const sortedManufacturers = useMemo(() => sortManufacturers(manufacturers), [manufacturers]);

  // Using utility for fallback grades
  const getFallbackGradesForManufacturer = useCallback((manufacturerId: string) => {
    return getFallbackGrades(manufacturerId);
  }, []);

  // Debounced fetch grades when manufacturer AND model changes - require both
  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;
    
    // Debounce to avoid excessive API calls - require BOTH manufacturer AND model
    timeoutId = setTimeout(() => {
      if (filters.manufacturer_id && filters.model_id && onFetchGrades && !cancelled) {
        setIsLoadingGrades(true);
        
        const requestId = Date.now();
        latestGradeRequest.current = requestId;
        
        onFetchGrades(filters.manufacturer_id, filters.model_id)
          .then(gradesData => {
            // Only update if this is the latest request
            if (!cancelled && latestGradeRequest.current === requestId && Array.isArray(gradesData)) {
              setGrades(gradesData);
            }
            setIsLoadingGrades(false);
          })
          .catch((err) => {
            console.error('Grade fetch error:', err);
            setIsLoadingGrades(false);
            setGrades([]);
          });
      } else {
        setGrades([]);
        setIsLoadingGrades(false);
      }
    }, 300); // 300ms debounce
    
    return () => { 
      cancelled = true; 
      clearTimeout(timeoutId);
    };
  }, [filters.manufacturer_id, filters.model_id, onFetchGrades]);

  // Debounced fetch trim levels when manufacturer or model changes
  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;
    
    // Debounce to avoid excessive API calls
    timeoutId = setTimeout(() => {
      if (filters.manufacturer_id && onFetchTrimLevels && !cancelled) {
        onFetchTrimLevels(filters.manufacturer_id, filters.model_id)
          .then(trimLevelsData => {
            if (!cancelled && Array.isArray(trimLevelsData)) {
              setTrimLevels(trimLevelsData);
            }
          })
          .catch((err) => {
            console.error('Trim level fetch error:', err);
            setTrimLevels([]);
          });
      } else {
        setTrimLevels([]);
      }
    }, 300); // 300ms debounce
    
    return () => { 
      cancelled = true; 
      clearTimeout(timeoutId);
    };
  }, [filters.manufacturer_id, filters.model_id, onFetchTrimLevels]);


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
              <>
                <X className="h-3 w-3 mr-1" />
                Pastro
              </>
            )}
          </Button>
        </div>
      </div>





      {/* Basic Filters - Optimized mobile layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="manufacturer" className="text-xs font-medium truncate">Marka</Label>
          <AdaptiveSelect 
            value={filters.manufacturer_id || 'all'} 
            onValueChange={handleBrandChange} 
            disabled={isLoading}
            placeholder={isLoading ? "Po ngarkon..." : "Të gjitha Markat"}
            className="h-8 text-xs"
            options={[
              { value: 'all', label: 'Të gjitha Markat' },
              ...sortedManufacturers.map((manufacturer) => ({
                value: manufacturer.id.toString(),
                label: (
                  <div className="flex items-center gap-2">
                    {(manufacturer as any).image && (
                      <img src={(manufacturer as any).image} alt={manufacturer.name} className="w-4 h-4 object-contain rounded bg-white dark:bg-muted p-0.5 ring-1 ring-border" />
                    )}
                    <span className="truncate">{manufacturer.name} ({manufacturer.cars_qty})</span>
                  </div>
                )
              }))
            ]}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="model" className="text-xs font-medium truncate">Modeli</Label>
          <AdaptiveSelect 
            value={filters.model_id || 'all'} 
            onValueChange={(value) => updateFilter('model_id', value)}
            disabled={!filters.manufacturer_id || isLoading}
            placeholder={isLoading ? "Po ngarkon..." : (filters.manufacturer_id ? "Të gjithë Modelet" : "Zgjidhni markën së pari")}
            className="h-8 text-xs"
            options={[
              { value: 'all', label: 'Të gjithë Modelet' },
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
          <Label htmlFor="year_presets" className="text-xs font-medium truncate flex items-center gap-1">
            Zgjedhja e Shpejtë e Vitit 
            <span className="text-xs text-primary bg-primary/10 px-1 rounded" title="Optimized for instant results">⚡</span>
          </Label>
          <div className="flex flex-wrap gap-1">
            {generateYearPresets(currentYear).slice(0, 5).map((preset) => (
              <Button
                key={preset.label}
                variant={
                  filters.from_year === preset.from.toString() && 
                  filters.to_year === preset.to.toString() 
                    ? "default" 
                    : "outline"
                }
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  // Apply year range presets immediately for instant response
                  const updatedFilters = {
                    ...filters,
                    from_year: preset.from.toString(),
                    to_year: preset.to.toString()
                  };
                  onFiltersChange(updatedFilters);
                }}
              >
                {preset.label}
              </Button>
            ))}
            {(filters.from_year || filters.to_year) && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={() => {
                  const updatedFilters = {
                    ...filters,
                    from_year: undefined,
                    to_year: undefined
                  };
                  onFiltersChange(updatedFilters);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="from_year" className="text-xs font-medium truncate">Nga Viti</Label>
          <AdaptiveSelect 
            value={filters.from_year || 'any'} 
            onValueChange={(value) => updateFilter('from_year', value)}
            placeholder="Të gjithë vitet"
            className="h-8 text-xs"
            options={[
              { value: 'any', label: 'Të gjithë vitet' },
              ...years.map((year) => ({
                value: year.toString(),
                label: year.toString()
              }))
            ]}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="to_year" className="text-xs font-medium truncate">Deri në Vit</Label>
          <AdaptiveSelect 
            value={filters.to_year || 'any'} 
            onValueChange={(value) => updateFilter('to_year', value)}
            placeholder="Të gjithë vitet"
            className="h-8 text-xs"
            options={[
              { value: 'any', label: 'Të gjithë vitet' },
              ...years.map((year) => ({
                value: year.toString(),
                label: year.toString()
              }))
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="space-y-1">
              <Label htmlFor="grade" className="text-xs font-medium">Grada/Motori</Label>
              <AdaptiveSelect 
                value={filters.grade_iaai || 'all'} 
                onValueChange={(value) => updateFilter('grade_iaai', value)}
                disabled={!filters.model_id || isLoading}
                placeholder={!filters.manufacturer_id ? "Zgjidhni markën së pari" : !filters.model_id ? "Zgjidhni modelin së pari" : "Të gjitha Gradat"}
                className="h-8 text-xs sm:text-sm"
                options={[
                  { value: 'all', label: 'Të gjitha Gradat' },
                  ...(grades.length === 0 && isLoadingGrades ? 
                    [{ value: 'loading', label: 'Po ngarkon gradat...', disabled: true }] :
                    grades.length === 0 && filters.model_id ? 
                    [{ value: 'no-grades', label: 'Nuk u gjetën grada', disabled: true }] :
                    grades.map((grade) => ({
                      value: grade.value,
                      label: `${grade.label}${grade.count ? ` (${grade.count})` : ''}`,
                      disabled: grade.value.startsWith('separator-') // Disable separator items
                    }))
                  )
                ]}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="trim_level" className="text-xs font-medium">Niveli i Pajisjes</Label>
              <AdaptiveSelect 
                value={filters.trim_level || 'all'} 
                onValueChange={(value) => updateFilter('trim_level', value)}
                disabled={!filters.model_id || isLoading}
                placeholder={!filters.manufacturer_id ? "Zgjidhni markën së pari" : !filters.model_id ? "Zgjidhni modelin së pari" : "Të gjithë Nivelet e Pajisjes"}
                className="h-8 text-xs sm:text-sm"
                options={[
                  { value: 'all', label: 'Të gjithë Nivelet e Pajisjes' },
                  ...(trimLevels.length === 0 && filters.model_id ? 
                    [{ value: 'no-trims', label: 'Nuk u gjetën nivele pajisje', disabled: true }] :
                    trimLevels.map((trim) => ({
                      value: trim.value,
                      label: `${trim.label}${trim.count ? ` (${trim.count})` : ''}`
                    }))
                  )
                ]}
              />
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
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

            <div className="space-y-1">
              <Label htmlFor="body_type" className="text-xs font-medium">Lloji i Trupit</Label>
              <AdaptiveSelect 
                value={filters.body_type || 'all'} 
                onValueChange={(value) => updateFilter('body_type', value)}
                placeholder="Të gjithë Llojet"
                className="h-8 text-xs sm:text-sm"
                options={[
                  { value: 'all', label: 'Të gjithë Llojet' },
                  ...Object.entries(BODY_TYPE_OPTIONS).map(([name, id]) => ({
                    value: id.toString(),
                    label: name.charAt(0).toUpperCase() + name.slice(1)
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