import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Cog
} from "lucide-react";
import { COLOR_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS, BODY_TYPE_OPTIONS } from '@/hooks/useAuctionAPI';
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

interface EncarStyleFilterProps {
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

const EncarStyleFilter = memo<EncarStyleFilterProps>(({
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
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);

  // Track if strict filtering mode is enabled - using utility
  const isStrictMode = useMemo(() => isStrictFilterMode(filters), [filters]);

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
    
    // Faster response for year filters - reduced timeout for better responsiveness
    const timeout = (key === 'from_year' || key === 'to_year') ? 25 : 100;
    setTimeout(() => setIsLoading(false), timeout);
  }, [filters, onFiltersChange, onManufacturerChange, onModelChange]);

  // Enhanced search handler for consistent catalog navigation
  const handleSearchClick = useCallback(() => {
    if (onSearchCars) {
      onSearchCars();
    } else if (isHomepage) {
      // Fallback: if no search handler provided but we're on homepage, redirect to catalog
      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          searchParams.set(key, value);
        }
      });
      window.location.href = `/catalog?${searchParams.toString()}`;
    }
  }, [onSearchCars, isHomepage, filters]);

  // Handle year range preset selection - immediate application for better UX
  const handleYearRangePreset = useCallback((preset: { label: string; from: number; to: number }) => {
    const updatedFilters = {
      ...filters,
      from_year: preset.from.toString(),
      to_year: preset.to.toString()
    };
    
    // Apply year range presets immediately without debouncing for instant response
    onFiltersChange(updatedFilters);
  }, [filters, onFiltersChange]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  // Enhanced year range using utility  
  const years = useMemo(() => generateYearRange(currentYear), [currentYear]);
  
  // Enhanced year range presets using utility
  const yearRangePresets = useMemo(() => generateYearPresets(currentYear), [currentYear]);

  // Year options for dropdowns - strict mode aware
  const yearOptions = useMemo(() => [
    // In strict mode, show "All years" only when no specific year is selected or not in strict mode
    ...(isStrictMode && (filters.from_year || filters.to_year) ? [] : [{ value: 'all', label: 'Të gjithë vitet' }]),
    ...years.map(year => ({
      value: year.toString(),
      label: year.toString()
    }))
  ], [years, isStrictMode, filters.from_year, filters.to_year]);

  // Prioritized manufacturer sorting using utility
  const sortedManufacturers = useMemo(() => sortManufacturers(manufacturers), [manufacturers]);

  // Fetch grades when filters change - with debouncing to prevent excessive calls
  useEffect(() => {
    if (filters.manufacturer_id && onFetchGrades) {
      // Debounce to prevent rapid consecutive calls when switching brands
      const timeoutId = setTimeout(() => {
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
      }, 300); // 300ms debounce delay

      return () => clearTimeout(timeoutId);
    } else {
      setGrades([]);
      setIsLoadingGrades(false);
    }
  }, [filters.manufacturer_id, filters.model_id, onFetchGrades]);

  // Fetch trim levels when filters change - with debouncing to prevent excessive calls
  useEffect(() => {
    if (filters.manufacturer_id && onFetchTrimLevels) {
      // Debounce to prevent rapid consecutive calls when switching brands
      const timeoutId = setTimeout(() => {
        onFetchTrimLevels(filters.manufacturer_id, filters.model_id)
          .then(trimLevelsData => {
            if (Array.isArray(trimLevelsData)) {
              setTrimLevels(trimLevelsData);
            }
          })
          .catch((err) => {
            console.error('Trim level fetch error:', err);
            setTrimLevels([]);
          });
      }, 300); // 300ms debounce delay

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

  // Compact mode for sidebar
  if (compact) {
    return (
      <div className="space-y-2 h-full flex flex-col">
        <div className="flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm font-semibold">Kërko Makinat</h3>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-destructive flex items-center gap-1 h-6 px-1.5"
            >
              <X className="h-3 w-3" />
              <span className="text-xs">Pastro</span>
            </Button>
            {onCloseFilter && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCloseFilter}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 h-6 px-1.5"
              >
                <X className="h-3 w-3" />
                <span className="text-xs">Mbyll</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Scrollable filter content */}
        <div className="flex-1 overflow-y-auto space-y-2 pb-2">
          <div className="space-y-2">
          <div className="space-y-1 filter-section">
            <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
              <Car className="h-2.5 w-2.5" />
              Marka
            </Label>
            <AdaptiveSelect 
              value={filters.manufacturer_id || 'all'} 
              onValueChange={(value) => updateFilter('manufacturer_id', value)}
              placeholder="Zgjidhni markën"
              className="filter-control h-8 text-xs"
              options={[
                // In strict mode, show "All Brands" only when no specific brand is selected
                ...(isStrictMode && filters.manufacturer_id ? [] : [{ value: 'all', label: 'Të gjitha markat' }]),
                ...sortedManufacturers.map((manufacturer) => ({
                  value: manufacturer.id.toString(),
                  label: (
                    <div className="flex items-center gap-1.5">
                      {(manufacturer as any).image && (
                        <img src={(manufacturer as any).image} alt={manufacturer.name} className="w-3 h-3 object-contain" />
                      )}
                      <span className="text-xs">{manufacturer.name} ({manufacturer.cars_qty})</span>
                    </div>
                  )
                }))
              ]}
            />
          </div>

          <div className="space-y-1 filter-section">
            <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
              <Settings className="h-2.5 w-2.5" />
              Modeli
            </Label>
            <AdaptiveSelect 
              value={filters.model_id || 'all'} 
              onValueChange={(value) => updateFilter('model_id', value)}
              disabled={!filters.manufacturer_id}
              placeholder={filters.manufacturer_id ? "Zgjidhni modelin" : "Zgjidhni markën së pari"}
              className="filter-control h-8 text-xs"
              options={[
                // In strict mode, show "All Models" only when no specific model is selected or not in strict mode
                ...(isStrictMode && filters.model_id ? [] : [{ value: 'all', label: 'Të gjithë modelet' }]),
                ...models.filter(model => model.cars_qty && model.cars_qty > 0).map((model) => ({
                  value: model.id.toString(),
                  label: `${model.name} (${model.cars_qty})`
                }))
              ]}
            />
          </div>

          {/* Year presets - Fast year selections under model */}
          <div className="space-y-1 filter-section">
            <Label className="filter-label text-xs text-muted-foreground flex items-center gap-1">
              Gamë vjetëshe: 
              <span className="text-xs text-primary bg-primary/10 px-1 rounded" title="Optimized for instant results">⚡</span>
            </Label>
            <div className="year-buttons flex flex-wrap gap-1">
              {yearRangePresets.slice(0, 4).map((preset) => (
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
                  onClick={() => handleYearRangePreset(preset)}
                  title={`⚡ Instant filter: From ${preset.from} to present (${preset.to})`} // Added optimization indicator
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Enhanced Year Filter - From/To dropdowns */}
          <div className="space-y-1 filter-section">
            <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
              <Calendar className="h-2.5 w-2.5" />
              Gamë Vjetëshe
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nga</Label>
                <AdaptiveSelect 
                  value={filters.from_year || 'all'} 
                  onValueChange={(value) => updateFilter('from_year', value)}
                  placeholder="Të gjithë vitet"
                  className="filter-control h-8 text-xs"
                  options={yearOptions}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Deri</Label>
                <AdaptiveSelect 
                  value={filters.to_year || 'all'} 
                  onValueChange={(value) => updateFilter('to_year', value)}
                  placeholder="Të gjithë vitet"
                  className="filter-control h-8 text-xs"
                  options={yearOptions}
                />
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-1 filter-section">
            <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
              <DollarSign className="h-2.5 w-2.5" />
              Çmimi (EUR)
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              <Input
                type="number"
                placeholder="Nga"
                value={filters.buy_now_price_from || ''}
                onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                className="filter-control h-8 text-xs"
              />
              <Input
                type="number"
                placeholder="Deri"
                value={filters.buy_now_price_to || ''}
                onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                className="filter-control h-8 text-xs"
              />
            </div>
          </div>

          {/* Additional Filters Toggle */}
          <Button
            variant="ghost"
            onClick={() => toggleSection('more')}
            className="w-full justify-between text-xs h-7"
          >
            Më Shumë Filtra
            {expandedSections.includes('more') ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          {expandedSections.includes('more') && (
            <div className="space-y-2 pt-2 border-t">
              {/* Grade/Engine and Trim Level first */}
              <div className="space-y-2">
                <div className="space-y-1 filter-section">
                  <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                    <Cog className="h-2.5 w-2.5" />
                    Grada/Motori
                  </Label>
                  <AdaptiveSelect 
                    value={filters.grade_iaai || 'all'} 
                    onValueChange={(value) => updateFilter('grade_iaai', value)}
                    disabled={!filters.manufacturer_id}
                    placeholder={filters.manufacturer_id ? "Të gjitha gradat" : "Zgjidhni markën së pari"}
                    className="filter-control h-8 text-xs"
                    options={[
                      { value: 'all', label: 'Të gjitha gradat' },
                      ...grades.map((grade) => ({
                        value: grade.value,
                        label: `${grade.label}${grade.count ? ` (${grade.count})` : ''}`
                      }))
                    ]}
                  />
                </div>

                <div className="space-y-1 filter-section">
                  <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                    <Cog className="h-2.5 w-2.5" />
                    Niveli i Pajisjes
                  </Label>
                  <AdaptiveSelect 
                    value={filters.trim_level || 'all'} 
                    onValueChange={(value) => updateFilter('trim_level', value)}
                    disabled={!filters.manufacturer_id}
                    placeholder={filters.manufacturer_id ? "Të gjithë nivelet e pajisjes" : "Zgjidhni markën së pari"}
                    className="filter-control h-8 text-xs"
                    options={[
                      { value: 'all', label: 'Të gjithë nivelet e pajisjes' },
                      ...trimLevels.map((trim) => ({
                        value: trim.value,
                        label: `${trim.label}${trim.count ? ` (${trim.count})` : ''}`
                      }))
                    ]}
                  />
                </div>

                 <div className="space-y-1 filter-section">
                   <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                     <Palette className="h-2.5 w-2.5" />
                     Ngjyra
                   </Label>
                   <AdaptiveSelect 
                     value={filters.color || 'all'} 
                     onValueChange={(value) => updateFilter('color', value)}
                     placeholder="Çdo ngjyrë"
                     className="filter-control h-8 text-xs"
                     options={[
                       // In strict mode, show "Any color" only when no specific color is selected or not in strict mode
                       ...(isStrictMode && filters.color ? [] : [{ value: 'all', label: 'Çdo ngjyrë' }]),
                       ...Object.entries(COLOR_OPTIONS).map(([name, id]) => ({
                         value: id.toString(),
                         label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                       }))
                     ]}
                   />
                 </div>

                 <div className="space-y-1 filter-section">
                   <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                     <Fuel className="h-2.5 w-2.5" />
                     Karburanti
                   </Label>
                   <AdaptiveSelect 
                     value={filters.fuel_type || 'all'} 
                     onValueChange={(value) => updateFilter('fuel_type', value)}
                     placeholder="Çdo tip"
                     className="filter-control h-8 text-xs"
                     options={[
                       // In strict mode, show "Any type" only when no specific fuel type is selected or not in strict mode
                       ...(isStrictMode && filters.fuel_type ? [] : [{ value: 'all', label: 'Çdo tip' }]),
                       ...Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => ({
                         value: id.toString(),
                         label: name.charAt(0).toUpperCase() + name.slice(1)
                       }))
                     ]}
                   />
                 </div>

                 <div className="space-y-1 filter-section">
                   <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                     <Settings className="h-2.5 w-2.5" />
                     Transmisioni
                   </Label>
                   <AdaptiveSelect 
                     value={filters.transmission || 'all'} 
                     onValueChange={(value) => updateFilter('transmission', value)}
                     placeholder="Çdo tip"
                     className="filter-control h-8 text-xs"
                     options={[
                       // In strict mode, show "Any type" only when no specific transmission is selected or not in strict mode
                       ...(isStrictMode && filters.transmission ? [] : [{ value: 'all', label: 'Çdo tip' }]),
                       ...Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => ({
                         value: id.toString(),
                         label: name.charAt(0).toUpperCase() + name.slice(1)
                       }))
                     ]}
                   />
                 </div>

                 <div className="space-y-1 filter-section">
                   <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                     <Car className="h-2.5 w-2.5" />
                     Lloji i Trupit
                   </Label>
                   <AdaptiveSelect 
                     value={filters.body_type || 'all'} 
                     onValueChange={(value) => updateFilter('body_type', value)}
                     placeholder="Çdo tip"
                     className="filter-control h-8 text-xs"
                     options={[
                       { value: 'all', label: 'Çdo tip' },
                       ...Object.entries(BODY_TYPE_OPTIONS).map(([name, id]) => ({
                         value: id.toString(),
                         label: name.charAt(0).toUpperCase() + name.slice(1)
                       }))
                     ]}
                   />
                 </div>

                 {/* Mileage */}
                 <div className="space-y-1 filter-section">
                   <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                     <MapPin className="h-2.5 w-2.5" />
                     Kilometrazhi (km)
                   </Label>
                   <div className="grid grid-cols-2 gap-1.5">
                     <Input
                       type="number"
                       placeholder="Nga"
                       value={filters.odometer_from_km || ''}
                       onChange={(e) => updateFilter('odometer_from_km', e.target.value)}
                       className="filter-control h-8 text-xs"
                     />
                     <Input
                       type="number"
                       placeholder="Deri"
                       value={filters.odometer_to_km || ''}
                       onChange={(e) => updateFilter('odometer_to_km', e.target.value)}
                       className="filter-control h-8 text-xs"
                     />
                   </div>
                 </div>
              </div>
            </div>
          )}

          {/* Search Button */}
          <div className="pt-2 border-t flex-shrink-0">
            <Button 
              onClick={handleSearchClick} 
              className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs"
              size="sm"
            >
              <Search className="h-3 w-3 mr-1.5" />
              Kërko Makinat
            </Button>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Homepage style - compact single row
  if (isHomepage) {
    return (
      <Card className="p-4 bg-gradient-to-r from-card via-card/95 to-card border-border/50 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Kërko Makinën</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Main filters in single row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Car className="h-3 w-3" />
                Marka
              </Label>
              <AdaptiveSelect 
                value={filters.manufacturer_id || 'all'} 
                onValueChange={(value) => updateFilter('manufacturer_id', value)}
                placeholder={isLoading ? "Loading..." : "Zgjidhni markën"}
                className="h-11"
                disabled={isLoading}
                options={[
                  // In strict mode, show "Të gjitha Markat" only when no specific brand is selected or not in strict mode
                  ...(isStrictMode && filters.manufacturer_id ? [] : [{ value: 'all', label: 'Të gjitha Markat' }]),
                  ...sortedManufacturers.map((manufacturer) => ({
                    value: manufacturer.id.toString(),
                    label: (
                      <div className="flex items-center gap-2">
                        {(manufacturer as any).image && (
                          <img src={(manufacturer as any).image} alt={manufacturer.name} className="w-5 h-5 object-contain" />
                        )}
                        <span>{manufacturer.name} ({manufacturer.cars_qty})</span>
                      </div>
                    )
                  }))
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-3 w-3" />
                Modeli
              </Label>
              <AdaptiveSelect 
                value={filters.model_id || 'all'} 
                onValueChange={(value) => updateFilter('model_id', value)}
                disabled={!filters.manufacturer_id}
                placeholder={filters.manufacturer_id ? "Zgjidhni modelin" : "Zgjidhni markën së pari"}
                className="h-11"
                options={[
                  // In strict mode, show "Të gjithë Modelet" only when no specific model is selected or not in strict mode
                  ...(isStrictMode && filters.model_id ? [] : [{ value: 'all', label: 'Të gjithë Modelet' }]),
                  ...models.filter(model => model.cars_qty && model.cars_qty > 0).map((model) => ({
                    value: model.id.toString(),
                    label: `${model.name} (${model.cars_qty})`
                  }))
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Vitet
                {(filters.from_year || filters.to_year) && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.from_year || 'Çdo vit'} - {filters.to_year || 'sot'}
                  </Badge>
                )}
              </Label>
              
              {/* Year Range Dropdowns - moved to top */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nga viti</Label>
                  <AdaptiveSelect 
                    value={filters.from_year || 'all'} 
                    onValueChange={(value) => updateFilter('from_year', value)}
                    placeholder="Çdo vit"
                    className="h-9 text-sm"
                    options={yearOptions}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Deri në vitin</Label>
                  <AdaptiveSelect 
                    value={filters.to_year || 'all'} 
                    onValueChange={(value) => updateFilter('to_year', value)}
                    placeholder="Çdo vit"
                    className="h-9 text-sm"
                    options={yearOptions}
                  />
                </div>
              </div>

              {/* Year Range Preset Buttons for Homepage - moved below dropdowns */}
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground mb-2 block">Zgjidhni vitet:</Label>
                <div className="flex flex-wrap gap-1">
                  {yearRangePresets.slice(0, 4).map((preset) => (
                    <Button
                      key={preset.label}
                      variant={
                        filters.from_year === preset.from.toString() && 
                        filters.to_year === preset.to.toString() 
                          ? "default" 
                          : "outline"
                      }
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => handleYearRangePreset(preset)}
                      title={`⚡ Instant filter: From ${preset.from} to present (${preset.to})`} // Added optimization indicator
                    >
                      {preset.label}
                    </Button>
                  ))}
                  {(filters.from_year || filters.to_year) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs text-muted-foreground"
                      onClick={() => onFiltersChange({
                        ...filters,
                        from_year: undefined,
                        to_year: undefined
                      })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>


          </div>

          <div className="mt-4 flex justify-center">
            <Button 
              onClick={handleSearchClick} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-3 h-12 text-base"
              size="lg"
            >
              <Search className="h-5 w-5 mr-2" />
              Kërko Makinat
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Catalog style - expanded with sections
  return (
    <Card className="p-4 space-y-4 bg-card border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Filtrat e Kërkimit</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClearFilters} 
          disabled={isLoading}
          className="text-xs"
        >
          {isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
          Pastro të gjitha
        </Button>
      </div>

      {/* Basic Filters Section */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          onClick={() => toggleSection('basic')}
          className="w-full justify-between p-2 h-auto"
        >
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            <span className="font-medium">Filtrat Bazë</span>
          </div>
          {expandedSections.includes('basic') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {expandedSections.includes('basic') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Marka</Label>
              <AdaptiveSelect 
                value={filters.manufacturer_id || 'all'} 
                onValueChange={(value) => updateFilter('manufacturer_id', value)}
                placeholder="Zgjidhni markën"
                options={[
                  // In strict mode, show "Të gjitha Markat" only when no specific brand is selected or not in strict mode
                  ...(isStrictMode && filters.manufacturer_id ? [] : [{ value: 'all', label: 'Të gjitha Markat' }]),
                  ...sortedManufacturers.map((manufacturer) => ({
                    value: manufacturer.id.toString(),
                    label: (
                      <div className="flex items-center gap-2">
                        {(manufacturer as any).image && (
                          <img src={(manufacturer as any).image} alt={manufacturer.name} className="w-4 h-4 object-contain" />
                        )}
                        <span>{manufacturer.name} ({manufacturer.cars_qty})</span>
                      </div>
                    )
                  }))
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Modeli</Label>
              <AdaptiveSelect 
                value={filters.model_id || 'all'} 
                onValueChange={(value) => updateFilter('model_id', value)}
                disabled={!filters.manufacturer_id}
                placeholder={filters.manufacturer_id ? "Zgjidhni modelin" : "Zgjidhni markën së pari"}
                options={[
                  // In strict mode, show "Të gjithë Modelet" only when no specific model is selected or not in strict mode
                  ...(isStrictMode && filters.model_id ? [] : [{ value: 'all', label: 'Të gjithë Modelet' }]),
                  ...models.filter(model => model.cars_qty && model.cars_qty > 0).map((model) => ({
                    value: model.id.toString(),
                    label: `${model.name} (${model.cars_qty})`
                  }))
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters Section */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          onClick={() => toggleSection('advanced')}
          className="w-full justify-between p-2 h-auto"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <span className="font-medium">Filtrat e Avancuar</span>
          </div>
          {expandedSections.includes('advanced') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {expandedSections.includes('advanced') && (
          <div className="space-y-4 p-3 bg-muted/30 rounded-lg">
            {/* Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-3 w-3" />
                  Çmimi (EUR)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Nga"
                    value={filters.buy_now_price_from || ''}
                    onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Deri"
                    value={filters.buy_now_price_to || ''}
                    onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Year Selection and Variants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Vitet
                  {(filters.from_year || filters.to_year) && (
                    <Badge variant="secondary" className="text-xs">
                      {filters.from_year || 'Çdo vit'} - {filters.to_year || 'sot'}
                    </Badge>
                  )}
                </Label>
                
                {/* Year Range Preset Buttons - Compact layout */}
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground mb-2 block">Vitet:</Label>
                  <div className="flex flex-wrap gap-1">
                    {yearRangePresets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant={
                          filters.from_year === preset.from.toString() && 
                          filters.to_year === preset.to.toString() 
                            ? "default" 
                            : "outline"
                        }
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleYearRangePreset(preset)}
                        title={`⚡ Instant filter: From ${preset.from} to present (${preset.to})`} // Added optimization indicator
                      >
                        {preset.label}
                      </Button>
                    ))}
                    {(filters.from_year || filters.to_year) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground"
                        onClick={() => onFiltersChange({
                          ...filters,
                          from_year: undefined,
                          to_year: undefined
                        })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Enhanced Year Filter - From/To dropdowns for advanced section */}
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground mb-2 block">Custom Year Range:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">From Year</Label>
                      <AdaptiveSelect 
                        value={filters.from_year || 'all'} 
                        onValueChange={(value) => updateFilter('from_year', value)}
                        placeholder="All years"
                        className="h-8 text-xs"
                        options={yearOptions}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">To Year</Label>
                      <AdaptiveSelect 
                        value={filters.to_year || 'all'} 
                        onValueChange={(value) => updateFilter('to_year', value)}
                        placeholder="All years"
                        className="h-8 text-xs"
                        options={yearOptions}
                      />
                    </div>
                  </div>
                </div>
              </div>

                 <div className="space-y-2">
                   <Label className="text-sm font-medium flex items-center gap-2">
                     <Cog className="h-3 w-3" />
                     Grada/Motori
                   </Label>
                   <AdaptiveSelect 
                     value={filters.grade_iaai || 'all'} 
                     onValueChange={(value) => updateFilter('grade_iaai', value)}
                     disabled={!filters.manufacturer_id || isLoadingGrades}
                     placeholder={isLoadingGrades ? "Po ngarkon..." : "Zgjidhni gradën"}
                     options={[
                       // In strict mode, show "All Grades" only when no specific grade is selected or not in strict mode
                       ...(isStrictMode && filters.grade_iaai ? [] : [{ value: 'all', label: 'Të gjitha gradat' }]),
                       ...grades.map((grade) => ({
                         value: grade.value,
                         label: grade.label
                       }))
                     ]}
                   />
                 </div>
            </div>

            {/* Color, Fuel, Transmission, Body Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-3 w-3" />
                  Ngjyra
                </Label>
                <AdaptiveSelect 
                  value={filters.color || 'all'} 
                  onValueChange={(value) => updateFilter('color', value)}
                  placeholder="Çdo ngjyrë"
                  options={[
                    // In strict mode, show "Çdo ngjyrë" only when no specific color is selected or not in strict mode
                    ...(isStrictMode && filters.color ? [] : [{ value: 'all', label: 'Çdo ngjyrë' }]),
                    ...Object.entries(COLOR_OPTIONS).map(([name, id]) => ({
                      value: id.toString(),
                      label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                    }))
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Fuel className="h-3 w-3" />
                  Karburanti
                </Label>
                <AdaptiveSelect 
                  value={filters.fuel_type || 'all'} 
                  onValueChange={(value) => updateFilter('fuel_type', value)}
                  placeholder="Çdo tip"
                  options={[
                    // In strict mode, show "Çdo tip" only when no specific fuel type is selected or not in strict mode
                    ...(isStrictMode && filters.fuel_type ? [] : [{ value: 'all', label: 'Çdo tip' }]),
                    ...Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => ({
                      value: id.toString(),
                      label: name.charAt(0).toUpperCase() + name.slice(1)
                    }))
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  Transmisioni
                </Label>
                <AdaptiveSelect 
                  value={filters.transmission || 'all'} 
                  onValueChange={(value) => updateFilter('transmission', value)}
                  placeholder="Çdo tip"
                  options={[
                    // In strict mode, show "Çdo tip" only when no specific transmission is selected or not in strict mode
                    ...(isStrictMode && filters.transmission ? [] : [{ value: 'all', label: 'Çdo tip' }]),
                    ...Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => ({
                      value: id.toString(),
                      label: name.charAt(0).toUpperCase() + name.slice(1)
                    }))
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Car className="h-3 w-3" />
                  Lloji i Trupit
                </Label>
                <AdaptiveSelect 
                  value={filters.body_type || 'all'} 
                  onValueChange={(value) => updateFilter('body_type', value)}
                  placeholder="Çdo tip"
                  options={[
                    { value: 'all', label: 'Çdo tip' },
                    ...Object.entries(BODY_TYPE_OPTIONS).map(([name, id]) => ({
                      value: id.toString(),
                      label: name.charAt(0).toUpperCase() + name.slice(1)
                    }))
                  ]}
                />
              </div>
            </div>

            {/* Mileage */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                Kilometrazhi
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Nga (km)"
                  value={filters.odometer_from_km || ''}
                  onChange={(e) => updateFilter('odometer_from_km', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Deri (km)"
                  value={filters.odometer_to_km || ''}
                  onChange={(e) => updateFilter('odometer_to_km', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});

EncarStyleFilter.displayName = 'EncarStyleFilter';
export default EncarStyleFilter;