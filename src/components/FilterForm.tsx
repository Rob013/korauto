import React, { useState, memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter, X, Loader2, Search } from "lucide-react";
import { COLOR_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS } from '@/hooks/useAuctionAPI';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CategoryFilter, { CAR_BRAND_CATEGORIES } from "@/components/CategoryFilter";
import AdaptiveSelect from "@/components/ui/adaptive-select";


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
    category?: string;
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
    
    // Handle category filter specially
    if (key === 'category') {
      const categoryBrand = CAR_BRAND_CATEGORIES.find(cat => cat.value === value);
      const manufacturerId = categoryBrand?.id || undefined;
      
      // When category changes, update manufacturer and reset dependent filters
      onManufacturerChange?.(manufacturerId || '');
      onFiltersChange({
        ...filters,
        category: actualValue,
        manufacturer_id: manufacturerId,
        model_id: undefined,
        generation_id: undefined,
        grade_iaai: undefined
      });
    } else if (key === 'manufacturer_id') {
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
  const years = useMemo(() => Array.from({ length: 25 }, (_, i) => currentYear - i), [currentYear]);

  // Memoize sorted manufacturers to prevent unnecessary re-renders
  const sortedManufacturers = useMemo(() => {
    return manufacturers
      .sort((a, b) => {
        // German cars priority
        const germanBrands = ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche', 'Opel'];
        // Korean cars priority  
        const koreanBrands = ['Hyundai', 'Kia', 'Genesis'];
        // Other popular cars
        const popularBrands = ['Toyota', 'Honda', 'Nissan', 'Ford', 'Chevrolet', 'Mazda', 'Subaru', 'Lexus'];
        
        const aIsGerman = germanBrands.includes(a.name);
        const bIsGerman = germanBrands.includes(b.name);
        const aIsKorean = koreanBrands.includes(a.name);
        const bIsKorean = koreanBrands.includes(b.name);
        const aIsPopular = popularBrands.includes(a.name);
        const bIsPopular = popularBrands.includes(b.name);
        
        // German brands first
        if (aIsGerman && !bIsGerman) return -1;
        if (!aIsGerman && bIsGerman) return 1;
        
        // Korean brands second
        if (aIsKorean && !bIsKorean && !bIsGerman) return -1;
        if (!aIsKorean && bIsKorean && !aIsGerman) return 1;
        
        // Popular brands third
        if (aIsPopular && !bIsPopular && !bIsGerman && !bIsKorean) return -1;
        if (!aIsPopular && bIsPopular && !aIsGerman && !aIsKorean) return 1;
        
        // Alphabetical within same category
        return a.name.localeCompare(b.name);
      })
      .filter((m) => m.cars_qty && m.cars_qty > 0);
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
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClearFilters} 
          disabled={isLoading}
          className="text-xs px-2 py-1 h-7"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <X className="h-3 w-3 mr-1" />
          )}
          Pastro
        </Button>
      </div>





      {/* Basic Filters - Category + 4 other filters in responsive grid */}
      <div className="category-filter-container space-y-2">
        {/* Category Filter - Full width on mobile, takes first position on larger screens */}
        <div className="category-filter-grid grid gap-1 sm:gap-2">
          <CategoryFilter
            value={filters.category || 'all'}
            onValueChange={(value) => updateFilter('category', value)}
            disabled={isLoading}
            label="Kategoria"
            className="sm:col-span-1"
          />
          
          {/* Traditional filters continue */}
          <AdaptiveSelect
            value={filters.manufacturer_id || 'all'}
            onValueChange={handleBrandChange}
            disabled={isLoading}
            loading={isLoading}
            label="Marka"
            placeholder="Markat"
            id="manufacturer"
            loadingMessage="Duke ngarkuar..."
            emptyMessage="Nuk u gjetën marka"
            options={[
              { value: 'all', label: 'Të gjitha Markat' },
              ...sortedManufacturers.map(manufacturer => ({
                value: manufacturer.id.toString(),
                label: manufacturer.name,
                count: manufacturer.cars_qty || 0
              }))
            ]}
            className="sm:col-span-1"
          />

          <AdaptiveSelect
            value={filters.model_id || 'all'}
            onValueChange={(value) => updateFilter('model_id', value)}
            disabled={!filters.manufacturer_id || isLoading}
            loading={modelLoading}
            label="Modeli"
            placeholder={filters.manufacturer_id ? "Modelet" : "Marka së pari"}
            id="model"
            loadingMessage="Duke ngarkuar..."
            emptyMessage={filters.manufacturer_id ? "Nuk u gjetën modele" : "Zgjidh markën së pari"}
            options={[
              { value: 'all', label: 'Të gjithë Modelet' },
              ...(models && models.length > 0 ? 
                models
                  .filter((model) => model.cars_qty && model.cars_qty > 0)
                  .map((model) => ({
                    value: model.id.toString(),
                    label: model.name,
                    count: model.cars_qty || 0
                  })) : []
              )
            ]}
            className="sm:col-span-1"
          />

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
            label="Gjeneratat"
            placeholder={filters.model_id ? "Gjeneratat" : "Zgjidh modelin së pari"}
            id="generation"
            emptyMessage={filters.model_id ? "Duke ngarkuar gjeneratat..." : "Zgjidh modelin së pari"}
            options={[
              { 
                value: 'all', 
                label: filters.model_id ? "Të gjitha Gjeneratat" : "Të gjitha Gjeneratat (të gjitha modelet)" 
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
                  
                  return {
                    value: generation.id.toString(),
                    label: `${generation.name}${yearRange}`,
                    count: displayCount > 0 ? displayCount : undefined
                  };
                }) : []
              )
            ]}
            className="sm:col-span-1"
          />

          <AdaptiveSelect
            value={filters.grade_iaai || 'all'}
            onValueChange={(value) => updateFilter('grade_iaai', value)}
            disabled={!filters.manufacturer_id || isLoading}
            loading={isLoadingGrades}
            label="Grada/Motorr"
            placeholder={filters.manufacturer_id ? "Gradat" : "Marka së pari"}
            id="grade"
            loadingMessage="Duke ngarkuar gradat..."
            emptyMessage="Nuk u gjetën grada"
            options={[
              { value: 'all', label: 'Të gjitha Gradat' },
              ...grades.map((grade) => ({
                value: grade.value,
                label: grade.label,
                count: grade.count
              }))
            ]}
            className="sm:col-span-1"
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
          <div className="space-y-3">{/* Changed advanced filters to vertical too */}
            <AdaptiveSelect
              value={filters.color || 'all'}
              onValueChange={(value) => updateFilter('color', value)}
              label="Ngjyra"
              placeholder="Të gjitha Ngjyrat"
              id="color"
              options={[
                { value: 'all', label: 'Të gjitha Ngjyrat' },
                ...Object.entries(COLOR_OPTIONS).map(([name, id]) => ({
                  value: id.toString(),
                  label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                }))
              ]}
            />

            <AdaptiveSelect
              value={filters.fuel_type || 'all'}
              onValueChange={(value) => updateFilter('fuel_type', value)}
              label="Lloji i Karburantit"
              placeholder="Të gjithë Llojet"
              id="fuel_type"
              options={[
                { value: 'all', label: 'Të gjithë Llojet' },
                ...Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => ({
                  value: id.toString(),
                  label: name.charAt(0).toUpperCase() + name.slice(1)
                }))
              ]}
            />

            <AdaptiveSelect
              value={filters.transmission || 'all'}
              onValueChange={(value) => updateFilter('transmission', value)}
              label="Transmisioni"
              placeholder="Të gjithë"
              id="transmission"
              options={[
                { value: 'all', label: 'Të gjithë' },
                ...Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => ({
                  value: id.toString(),
                  label: name.charAt(0).toUpperCase() + name.slice(1)
                }))
              ]}
            />
          </div>

          <div className="space-y-3">{/* Continue vertical layout for remaining filters */}
            <AdaptiveSelect
              value={filters.from_year || 'any'}
              onValueChange={(value) => updateFilter('from_year', value)}
              label="Nga Viti"
              placeholder="Çdo vit"
              id="from_year"
              options={[
                { value: 'any', label: 'Çdo vit' },
                ...years.map((year) => ({
                  value: year.toString(),
                  label: year.toString()
                }))
              ]}
            />

            <AdaptiveSelect
              value={filters.to_year || 'any'}
              onValueChange={(value) => updateFilter('to_year', value)}
              label="Deri në Vitin"
              placeholder="Çdo vit"
              id="to_year"
              options={[
                { value: 'any', label: 'Çdo vit' },
                ...years.map((year) => ({
                  value: year.toString(),
                  label: year.toString()
                }))
              ]}
            />

            <AdaptiveSelect
              value={filters.seats_count || 'all'}
              onValueChange={(value) => updateFilter('seats_count', value)}
              label="Numri i Vendeve"
              placeholder="Të gjitha"
              id="seats"
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

            <AdaptiveSelect
              value={filters.max_accidents || 'all'}
              onValueChange={(value) => updateFilter('max_accidents', value)}
              label="Aksidente (Maksimale)"
              placeholder="Të gjitha"
              id="max_accidents"
              options={[
                { value: 'all', label: 'Të gjitha' },
                { value: '0', label: 'Pa aksidente' },
                { value: '1', label: 'Maksimale 1 aksident' },
                { value: '2', label: 'Maksimale 2 aksidente' }
              ]}
            />
          </div>

          <div className="space-y-4">{/* Make price and mileage vertical too */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Intervali i Çmimit (Blerje direkte)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Minimum"
                  type="number"
                  className="h-8 text-sm"
                  value={filters.buy_now_price_from || ''}
                  onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                />
                <Input
                  placeholder="Maksimum"
                  type="number"
                  className="h-8 text-sm"
                  value={filters.buy_now_price_to || ''}
                  onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Intervali i Kilometrazhit (km)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Minimum"
                  type="number"
                  className="h-8 text-sm"
                  value={filters.odometer_from_km || ''}
                  onChange={(e) => updateFilter('odometer_from_km', e.target.value)}
                />
                <Input
                  placeholder="Maksimum"
                  type="number"
                  className="h-8 text-sm"
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