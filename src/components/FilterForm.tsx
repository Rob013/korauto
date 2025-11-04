import React, { useState, memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter, X, Loader2, Search } from "lucide-react";
import { AISearchBar } from "./AISearchBar";
import { COLOR_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS, BODY_TYPE_OPTIONS } from '@/constants/carOptions';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGrades } from "@/hooks/useFiltersData";
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
  engineVariants?: Array<{ value: string; label: string; count: number }>;
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
  engineVariants = [],
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
  const [trimLevels, setTrimLevels] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  
  // Use the grades hook for fetching grades
  const { data: gradesData, isLoading: isLoadingGrades } = useGrades(filters.model_id);
  
  // Map grades data to the format expected by the select
  const grades = useMemo(() => {
    if (!gradesData || !Array.isArray(gradesData)) return [];
    return gradesData.map((grade: any) => ({
      value: grade.id,
      label: grade.name,
      count: grade.car_count
    }));
  }, [gradesData]);


  const updateFilter = useCallback((key: string, value: string) => {
    // Handle special "all" values by converting them to undefined
    const actualValue = value === 'all' || value === 'any' ? undefined : value;
    
    // Handle cascading filters - instant response, no loading state
    if (key === 'manufacturer_id') {
      // Reset model, grade, and engine when manufacturer changes
      onFiltersChange({ ...filters, manufacturer_id: actualValue, model_id: undefined, grade_iaai: undefined, engine_spec: undefined });
      onManufacturerChange?.(actualValue || '');
    } else if (key === 'model_id') {
      // Reset grade and engine when model changes
      onFiltersChange({ ...filters, model_id: actualValue, grade_iaai: undefined, engine_spec: undefined });
      onModelChange?.(actualValue || '');
    } else {
      // For other filters, use the standard filter change handler
      const updatedFilters = { ...filters, [key]: actualValue };
      onFiltersChange(updatedFilters);
    }
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

  // Grades are now fetched automatically via useGrades hook

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

  const handleAISearch = useCallback((aiFilters: any) => {
    console.log('🔍 AI Search filters received:', aiFilters);
    const updatedFilters = { ...filters };
    
    // Map manufacturer name to ID with better matching
    if (aiFilters.manufacturer_name) {
      const manufacturer = manufacturers.find(m => 
        m.name.toLowerCase() === aiFilters.manufacturer_name.toLowerCase() ||
        m.name.toLowerCase().includes(aiFilters.manufacturer_name.toLowerCase()) ||
        aiFilters.manufacturer_name.toLowerCase().includes(m.name.toLowerCase())
      );
      if (manufacturer) {
        console.log('✅ Found manufacturer:', manufacturer.name, 'ID:', manufacturer.id);
        updatedFilters.manufacturer_id = manufacturer.id.toString();
      } else {
        console.warn('⚠️ Manufacturer not found:', aiFilters.manufacturer_name);
      }
    }
    
    // Map model name to ID (only if manufacturer is set) with fuzzy matching
    if (aiFilters.model_name && updatedFilters.manufacturer_id) {
      const model = models.find(m => {
        const modelNameLower = m.name.toLowerCase();
        const searchNameLower = aiFilters.model_name.toLowerCase();
        
        // Exact match
        if (modelNameLower === searchNameLower) return true;
        
        // Contains match (e.g., "A4" matches "A4 Allroad")
        if (modelNameLower.includes(searchNameLower)) return true;
        
        // Reverse contains (e.g., "5 Series" matches "5")
        if (searchNameLower.includes(modelNameLower)) return true;
        
        // Remove common separators for matching (e.g., "C-Class" matches "C Class")
        const normalizedModel = modelNameLower.replace(/[-\s]/g, '');
        const normalizedSearch = searchNameLower.replace(/[-\s]/g, '');
        if (normalizedModel === normalizedSearch) return true;
        
        return false;
      });
      
      if (model) {
        console.log('✅ Found model:', model.name, 'ID:', model.id);
        updatedFilters.model_id = model.id.toString();
      } else {
        console.warn('⚠️ Model not found:', aiFilters.model_name, 'Available models:', models.map(m => m.name));
      }
    }
    
    // Apply other filters
    if (aiFilters.yearMin) updatedFilters.from_year = aiFilters.yearMin.toString();
    if (aiFilters.yearMax) updatedFilters.to_year = aiFilters.yearMax.toString();
    if (aiFilters.priceMin) updatedFilters.buy_now_price_from = aiFilters.priceMin.toString();
    if (aiFilters.priceMax) updatedFilters.buy_now_price_to = aiFilters.priceMax.toString();
    if (aiFilters.fuel) updatedFilters.fuel_type = aiFilters.fuel;
    if (aiFilters.transmission) updatedFilters.transmission = aiFilters.transmission;
    if (aiFilters.mileageMax) updatedFilters.odometer_to_km = aiFilters.mileageMax.toString();
    if (aiFilters.color) updatedFilters.color = aiFilters.color;
    
    // Add search term for trim levels and specific variants
    if (aiFilters.search) {
      updatedFilters.search = aiFilters.search;
    }
    
    console.log('🎯 Final applied filters:', updatedFilters);
    onFiltersChange(updatedFilters);
  }, [filters, manufacturers, models, onFiltersChange]);

  return (
    <Card className="glass-card p-4 sm:p-6 space-y-4 animate-slide-in-up">
      <AISearchBar onSearch={handleAISearch} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold">Kërkim i mençur</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearFilters} 
          disabled={isLoading}
          className="btn-press-effect text-xs sm:text-sm px-3 py-2 h-8 sm:h-9 text-muted-foreground hover:text-destructive self-start sm:self-auto"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <X className="h-4 w-4 mr-1.5" />
              Pastro
            </>
          )}
        </Button>
      </div>





      {/* Basic Filters - iOS-inspired layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="manufacturer" className="text-xs sm:text-sm font-medium">Marka</Label>
          <AdaptiveSelect 
            value={filters.manufacturer_id || 'all'} 
            onValueChange={handleBrandChange} 
            disabled={isLoading}
            placeholder={isLoading ? "Po ngarkon..." : "Të gjitha Markat"}
            className="h-10 sm:h-11 text-sm transition-all duration-300"
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

        <div className="space-y-2">
          <Label htmlFor="model" className="text-xs sm:text-sm font-medium">Modeli</Label>
          <AdaptiveSelect 
            value={filters.model_id || 'all'} 
            onValueChange={(value) => updateFilter('model_id', value)}
            disabled={!filters.manufacturer_id || isLoading}
            placeholder={isLoading ? "Po ngarkon..." : (filters.manufacturer_id ? "Të gjithë Modelet" : "Zgjidhni markën së pari")}
            className="h-10 sm:h-11 text-sm transition-all duration-300"
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

        <div className="space-y-2">
          <Label htmlFor="year_presets" className="text-xs sm:text-sm font-medium flex items-center gap-1">
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
                className="h-8 px-3 text-xs sm:text-sm btn-press-effect"
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
                className="h-8 px-2 text-xs sm:text-sm text-muted-foreground btn-press-effect"
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

        <div className="space-y-2">
          <Label htmlFor="from_year" className="text-xs sm:text-sm font-medium">Nga Viti</Label>
          <AdaptiveSelect 
            value={filters.from_year || 'any'} 
            onValueChange={(value) => updateFilter('from_year', value)}
            placeholder="Të gjithë vitet"
            className="h-10 sm:h-11 text-sm transition-all duration-300"
            options={[
              { value: 'any', label: 'Të gjithë vitet' },
              ...years.map((year) => ({
                value: year.toString(),
                label: year.toString()
              }))
            ]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="to_year" className="text-xs sm:text-sm font-medium">Deri në Vit</Label>
          <AdaptiveSelect 
            value={filters.to_year || 'any'} 
            onValueChange={(value) => updateFilter('to_year', value)}
            placeholder="Të gjithë vitet"
            className="h-10 sm:h-11 text-sm transition-all duration-300"
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
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleAdvanced} 
          className="w-full sm:w-auto text-sm h-10 btn-press-effect hover-lift-gentle"
        >
          {showAdvanced ? 'Fshih' : 'Shfaq'} Filtrat e Avancuara
        </Button>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4 animate-slide-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-1">
              <Label htmlFor="generation" className="text-xs font-medium">Gjenerata</Label>
              <AdaptiveSelect 
                value={filters.grade_iaai || 'all'} 
                onValueChange={(value) => updateFilter('grade_iaai', value)}
                disabled={!filters.model_id || isLoading || isLoadingGrades}
                placeholder={!filters.manufacturer_id ? "Zgjidhni markën së pari" : !filters.model_id ? "Zgjidhni modelin së pari" : isLoadingGrades ? "Po ngarkon..." : "Të gjitha Gjeneratat"}
                className="h-8 text-xs sm:text-sm"
                options={[
                  { value: 'all', label: 'Të gjitha Gjeneratat' },
                  ...(grades.length === 0 && isLoadingGrades ? 
                    [{ value: 'loading', label: 'Po ngarkon...', disabled: true }] :
                    grades.length === 0 && filters.model_id ? 
                    [{ value: 'no-grades', label: 'Nuk u gjetën gjenerata', disabled: true }] :
                    grades.map((grade) => ({
                      value: grade.value,
                      label: `${grade.label}${grade.count ? ` (${grade.count})` : ''}`,
                      disabled: grade.value.startsWith('separator-')
                    }))
                  )
                ]}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="engine" className="text-xs font-medium">Motori</Label>
              <AdaptiveSelect 
                value={(filters as any).engine_spec || 'all'} 
                onValueChange={(value) => updateFilter('engine_spec', value)}
                disabled={!filters.model_id || isLoading}
                placeholder={!filters.manufacturer_id ? "Zgjidhni markën" : !filters.model_id ? "Zgjidhni modelin" : "Të gjithë Motorët"}
                className="h-8 text-xs sm:text-sm"
                options={[
                  { value: 'all', label: 'Të gjithë Motorët' },
                  ...(engineVariants && engineVariants.length > 0 ? 
                    engineVariants.map((engine) => ({
                      value: engine.value,
                      label: engine.label
                    })) : 
                    [{ value: 'no-engines', label: 'Zgjidhni modelin për motorët', disabled: true }]
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
    </Card>
  );
});

FilterForm.displayName = 'FilterForm';

export default FilterForm;