import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertTriangle,
  Award,
  Shield,
  Gauge
} from "lucide-react";
import { 
  COLOR_OPTIONS, 
  FUEL_TYPE_OPTIONS, 
  TRANSMISSION_OPTIONS, 
  BODY_TYPE_OPTIONS, 
  DRIVE_TYPE_OPTIONS,
  ENGINE_DISPLACEMENT_OPTIONS,
  SEATS_COUNT_OPTIONS,
  ACCIDENT_HISTORY_OPTIONS,
  REGISTRATION_TYPE_OPTIONS,
  CERTIFICATION_OPTIONS,
  PRICE_RANGE_PRESETS,
  MILEAGE_RANGE_PRESETS,
  YEAR_RANGE_PRESETS
} from '@/constants/carOptions';
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
  bodyTypes: { [key: string]: number };
  driveTypes: { [key: string]: number };
  seatsCount: { [key: string]: number };
  accidentHistory: { [key: string]: number };
  registrationType: { [key: string]: number };
  certification: { [key: string]: number };
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
  fetchFilterCounts?: (filters: APIFilters, manufacturers: Manufacturer[]) => Promise<FilterCounts>;
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
  fetchFilterCounts,
  isHomepage = false,
  compact = false,
  onSearchCars,
  onCloseFilter
}) => {
  const [grades, setGrades] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [trimLevels, setTrimLevels] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['brands-models']);

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

  // Update filters when new filter counts are available
  useEffect(() => {
    if (filterCounts && manufacturers.length > 0 && fetchFilterCounts) {
      // Fetch updated filter counts when manufacturers change
      fetchFilterCounts({}, manufacturers).catch(error => {
        console.warn('Failed to update filter counts:', error);
      });
    }
  }, [filterCounts, manufacturers.length, fetchFilterCounts]);

  // Load filter counts on component mount and when base filters change
  useEffect(() => {
    if (manufacturers.length > 0 && fetchFilterCounts) {
      fetchFilterCounts(filters, manufacturers).catch(error => {
        console.warn('Failed to load initial filter counts:', error);
      });
    }
  }, [manufacturers.length, filters.manufacturer_id, fetchFilterCounts]);

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
                onClick={() => {
                  console.log("EncarStyleFilter close button clicked");
                  onCloseFilter();
                  // Force close the filter panel if parent handlers don't work
                  setTimeout(() => {
                    const filterPanel = document.querySelector('[data-filter-panel]');
                    if (filterPanel) {
                      (filterPanel as HTMLElement).style.transform = 'translateX(-100%)';
                    }
                  }, 100);
                }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 h-6 px-1.5"
                title="Mbyll filtrat"
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
                  label: `${manufacturer.name} ${manufacturer.cars_qty ? `(${manufacturer.cars_qty})` : ''}`.trim()
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
                  {filters.model_id && filters.model_id !== 'all' ? (
                    <MultiSelect
                      value={Array.isArray(filters.grade_iaai) ? filters.grade_iaai : filters.grade_iaai ? [filters.grade_iaai] : []}
                      onValueChange={(selectedGrades) => {
                        // Convert back to the expected format - using comma-separated string for API compatibility
                        const gradeValue = selectedGrades.length > 0 ? selectedGrades.join(',') : undefined;
                        updateFilter('grade_iaai', gradeValue);
                      }}
                      disabled={!filters.manufacturer_id}
                      placeholder={filters.manufacturer_id ? "Zgjidhni gradat" : "Zgjidhni markën së pari"}
                      className="filter-control h-8 text-xs"
                      options={grades.map((grade) => ({
                        value: grade.value,
                        label: grade.label,
                        count: grade.count
                      }))}
                      maxDisplayed={2}
                    />
                  ) : (
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
                  )}
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
                       ...Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => {
                         const count = filterCounts?.fuelTypes?.[name] || 0;
                         return {
                           value: id.toString(),
                           label: `${name.charAt(0).toUpperCase() + name.slice(1)}${count > 0 ? ` (${count})` : ''}`
                         };
                       })
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
                       ...Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => {
                         const count = filterCounts?.transmissions?.[name] || 0;
                         return {
                           value: id.toString(),
                           label: `${name.charAt(0).toUpperCase() + name.slice(1)}${count > 0 ? ` (${count})` : ''}`
                         };
                       })
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
                placeholder={isLoading ? "" : "Zgjidhni markën"}
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

  // Catalog style - Encar.com automotive pattern with organized sections
  return (
    <Card className="glass-panel border-0 rounded-xl overflow-hidden">
      {/* Enhanced Header with Gradient Design */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Filtrat e Kërkimit</h3>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onClearFilters} 
            disabled={isLoading}
            className="text-xs bg-white/20 hover:bg-white/30 text-white border-white/20"
          >
            {isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
            Pastro të gjitha
          </Button>
        </div>
        
        {/* Quick Filter Presets */}
        <div className="mt-4 space-y-3">
          <div className="text-sm font-medium opacity-90">Filtra të Shpejtë</div>
          
          {/* Price Range Presets */}
          <div>
            <div className="text-xs opacity-75 mb-2">Gamë Çmimesh (EUR)</div>
            <div className="flex flex-wrap gap-1">
              {PRICE_RANGE_PRESETS.slice(0, 4).map((preset) => (
                <Button
                  key={preset.label}
                  variant="secondary"
                  size="sm"
                  className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/20"
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      buy_now_price_from: preset.min.toString(),
                      buy_now_price_to: preset.max === 999999 ? '' : preset.max.toString()
                    });
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Year Range Presets */}
          <div>
            <div className="text-xs opacity-75 mb-2">Vitet e Fundit</div>
            <div className="flex flex-wrap gap-1">
              {[
                { label: '2022+', from: 2022, to: currentYear },
                { label: '2020+', from: 2020, to: currentYear },
                { label: '2018+', from: 2018, to: currentYear },
                { label: '2015+', from: 2015, to: currentYear }
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="secondary"
                  size="sm"
                  className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/20"
                  onClick={() => handleYearRangePreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Mileage Range Presets */}
          <div>
            <div className="text-xs opacity-75 mb-2">Kilometrazhi (km)</div>
            <div className="flex flex-wrap gap-1">
              {MILEAGE_RANGE_PRESETS.slice(0, 4).map((preset) => (
                <Button
                  key={preset.label}
                  variant="secondary"
                  size="sm"
                  className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/20"
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      odometer_from_km: preset.min.toString(),
                      odometer_to_km: preset.max === 999999 ? '' : preset.max.toString()
                    });
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">

        {/* 1. Brandi & Modeli Section */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection('brands-models')}
            className="w-full justify-between p-3 h-auto bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50"
          >
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Brandi & Modeli</span>
            </div>
            {expandedSections.includes('brands-models') ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />}
          </Button>

          {expandedSections.includes('brands-models') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-sm rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Car className="h-3 w-3 text-blue-600" />
                  Marka
                </Label>
                <AdaptiveSelect 
                  value={filters.manufacturer_id || 'all'} 
                  onValueChange={(value) => updateFilter('manufacturer_id', value)}
                  placeholder="Zgjidhni markën"
                  options={[
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
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-3 w-3 text-blue-600" />
                  Modeli
                </Label>
                <AdaptiveSelect 
                  value={filters.model_id || 'all'} 
                  onValueChange={(value) => updateFilter('model_id', value)}
                  disabled={!filters.manufacturer_id}
                  placeholder={filters.manufacturer_id ? "Zgjidhni modelin" : "Zgjidhni markën së pari"}
                  options={[
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

        {/* 2. Pamja & Stili Section (Appearance & Style) */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection('appearance-style')}
            className="w-full justify-between p-3 h-auto bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50"
          >
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-900 dark:text-purple-100">Pamja & Stili</span>
            </div>
            {expandedSections.includes('appearance-style') ? <ChevronUp className="h-4 w-4 text-purple-600" /> : <ChevronDown className="h-4 w-4 text-purple-600" />}
          </Button>

          {expandedSections.includes('appearance-style') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-purple-50/50 dark:bg-purple-950/20 backdrop-blur-sm rounded-lg border border-purple-200/50 dark:border-purple-800/30">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-3 w-3 text-purple-600" />
                  Ngjyra
                </Label>
                <AdaptiveSelect 
                  value={filters.color || 'all'} 
                  onValueChange={(value) => updateFilter('color', value)}
                  placeholder="Çdo ngjyrë"
                  options={[
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
                  <Car className="h-3 w-3 text-purple-600" />
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
          )}
        </div>

        {/* 3. Motori & Performanca Section (Engine & Performance) */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection('engine-performance')}
            className="w-full justify-between p-3 h-auto bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-950/50"
          >
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="font-medium text-orange-900 dark:text-orange-100">Motori & Performanca</span>
            </div>
            {expandedSections.includes('engine-performance') ? <ChevronUp className="h-4 w-4 text-orange-600" /> : <ChevronDown className="h-4 w-4 text-orange-600" />}
          </Button>

          {expandedSections.includes('engine-performance') && (
            <div className="space-y-4 p-4 bg-orange-50/50 dark:bg-orange-950/20 backdrop-blur-sm rounded-lg border border-orange-200/50 dark:border-orange-800/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Fuel className="h-3 w-3 text-orange-600" />
                    Karburanti
                  </Label>
                  <AdaptiveSelect 
                    value={filters.fuel_type || 'all'} 
                    onValueChange={(value) => updateFilter('fuel_type', value)}
                    placeholder="Çdo tip"
                    options={[
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
                    <Settings className="h-3 w-3 text-orange-600" />
                    Transmisioni
                  </Label>
                  <AdaptiveSelect 
                    value={filters.transmission || 'all'} 
                    onValueChange={(value) => updateFilter('transmission', value)}
                    placeholder="Çdo tip"
                    options={[
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
                    <Cog className="h-3 w-3 text-orange-600" />
                    Sistemi i Transmetimit
                  </Label>
                  <AdaptiveSelect 
                    value={filters.drive_type || 'all'} 
                    onValueChange={(value) => updateFilter('drive_type', value)}
                    placeholder="Çdo tip"
                    options={[
                      { value: 'all', label: 'Çdo tip' },
                      ...Object.entries(DRIVE_TYPE_OPTIONS).map(([name, id]) => ({
                        value: id.toString(),
                        label: name.toUpperCase()
                      }))
                    ]}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Gauge className="h-3 w-3 text-orange-600" />
                  Vëllimi i Motorrit (L)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Nga"
                    value={filters.engine_displacement_from || ''}
                    onChange={(e) => updateFilter('engine_displacement_from', e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Deri"
                    value={filters.engine_displacement_to || ''}
                    onChange={(e) => updateFilter('engine_displacement_to', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Karakteristikat & Komfori Section (Features & Comfort) */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection('features-comfort')}
            className="w-full justify-between p-3 h-auto bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-900 dark:text-green-100">Karakteristikat & Komfori</span>
            </div>
            {expandedSections.includes('features-comfort') ? <ChevronUp className="h-4 w-4 text-green-600" /> : <ChevronDown className="h-4 w-4 text-green-600" />}
          </Button>

          {expandedSections.includes('features-comfort') && (
            <div className="p-4 bg-green-50/50 dark:bg-green-950/20 backdrop-blur-sm rounded-lg border border-green-200/50 dark:border-green-800/30">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-3 w-3 text-green-600" />
                  Numri i Vendeve
                </Label>
                <AdaptiveSelect 
                  value={filters.seats_count || 'all'} 
                  onValueChange={(value) => updateFilter('seats_count', value)}
                  placeholder="Çdo numër"
                  options={[
                    { value: 'all', label: 'Çdo numër' },
                    ...Object.entries(SEATS_COUNT_OPTIONS).map(([name, id]) => ({
                      value: id.toString(),
                      label: `${name} vendet`
                    }))
                  ]}
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. Gjendja & Historia Section (Condition & History) */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection('condition-history')}
            className="w-full justify-between p-3 h-auto bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="font-medium text-red-900 dark:text-red-100">Gjendja & Historia</span>
            </div>
            {expandedSections.includes('condition-history') ? <ChevronUp className="h-4 w-4 text-red-600" /> : <ChevronDown className="h-4 w-4 text-red-600" />}
          </Button>

          {expandedSections.includes('condition-history') && (
            <div className="space-y-4 p-4 bg-red-50/50 dark:bg-red-950/20 backdrop-blur-sm rounded-lg border border-red-200/50 dark:border-red-800/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    Historia e Aksidenteve
                  </Label>
                  <AdaptiveSelect 
                    value={filters.max_accidents || 'all'} 
                    onValueChange={(value) => updateFilter('max_accidents', value)}
                    placeholder="Çdo histori"
                    options={[
                      { value: 'all', label: 'Çdo histori' },
                      ...Object.entries(ACCIDENT_HISTORY_OPTIONS).map(([name, id]) => ({
                        value: id.toString(),
                        label: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                      }))
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-3 w-3 text-red-600" />
                    Lloji i Regjistrimit
                  </Label>
                  <AdaptiveSelect 
                    value={filters.registration_type || 'all'} 
                    onValueChange={(value) => updateFilter('registration_type', value)}
                    placeholder="Çdo tip"
                    options={[
                      { value: 'all', label: 'Çdo tip' },
                      ...Object.entries(REGISTRATION_TYPE_OPTIONS).map(([name, id]) => ({
                        value: id.toString(),
                        label: name.charAt(0).toUpperCase() + name.slice(1)
                      }))
                    ]}
                  />
                </div>
              </div>
              
              {/* Certification Checkboxes */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-600" />
                  Certifikim dhe Garanci
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="is_certified"
                      checked={filters.is_certified === 'true'}
                      onCheckedChange={(checked) => updateFilter('is_certified', checked ? 'true' : 'false')}
                    />
                    <Label htmlFor="is_certified" className="text-xs">
                      I Certifikuar
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="has_warranty"
                      checked={filters.has_warranty === 'true'}
                      onCheckedChange={(checked) => updateFilter('has_warranty', checked ? 'true' : 'false')}
                    />
                    <Label htmlFor="has_warranty" className="text-xs">
                      Me Garanci
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="service_history"
                      checked={filters.service_history === 'true'}
                      onCheckedChange={(checked) => updateFilter('service_history', checked ? 'true' : 'false')}
                    />
                    <Label htmlFor="service_history" className="text-xs">
                      Historia e Shërbimit
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. Specifikime të Avancuara Section (Advanced Specifications) */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => toggleSection('advanced-specs')}
            className="w-full justify-between p-3 h-auto bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50"
          >
            <div className="flex items-center gap-2">
              <Cog className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-medium text-indigo-900 dark:text-indigo-100">Specifikime të Avancuara</span>
            </div>
            {expandedSections.includes('advanced-specs') ? <ChevronUp className="h-4 w-4 text-indigo-600" /> : <ChevronDown className="h-4 w-4 text-indigo-600" />}
          </Button>

          {expandedSections.includes('advanced-specs') && (
            <div className="space-y-4 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 backdrop-blur-sm rounded-lg border border-indigo-200/50 dark:border-indigo-800/30">
              {/* Grade/Engine and Trim Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Cog className="h-3 w-3 text-indigo-600" />
                    Grada/Motori
                  </Label>
                  <AdaptiveSelect 
                    value={filters.grade_iaai || 'all'} 
                    onValueChange={(value) => updateFilter('grade_iaai', value)}
                    disabled={!filters.manufacturer_id || isLoadingGrades}
                    placeholder={isLoadingGrades ? "Po ngarkon..." : "Zgjidhni gradën"}
                    options={[
                      ...(isStrictMode && filters.grade_iaai ? [] : [{ value: 'all', label: 'Të gjitha gradat' }]),
                      ...grades.map((grade) => ({
                        value: grade.value,
                        label: grade.label
                      }))
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Cog className="h-3 w-3 text-indigo-600" />
                    Niveli i Pajisjes
                  </Label>
                  <AdaptiveSelect 
                    value={filters.trim_level || 'all'} 
                    onValueChange={(value) => updateFilter('trim_level', value)}
                    disabled={!filters.manufacturer_id}
                    placeholder={filters.manufacturer_id ? "Të gjithë nivelet e pajisjes" : "Zgjidhni markën së pari"}
                    options={[
                      { value: 'all', label: 'Të gjithë nivelet e pajisjes' },
                      ...trimLevels.map((trim) => ({
                        value: trim.value,
                        label: `${trim.label}${trim.count ? ` (${trim.count})` : ''}`
                      }))
                    ]}
                  />
                </div>
              </div>

              {/* Year Range with Presets */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-indigo-600" />
                  Vitet
                  {(filters.from_year || filters.to_year) && (
                    <Badge variant="secondary" className="text-xs">
                      {filters.from_year || 'Çdo vit'} - {filters.to_year || 'sot'}
                    </Badge>
                  )}
                </Label>
                
                {/* Year Range Preset Buttons */}
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

                {/* Custom Year Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nga Viti</Label>
                    <AdaptiveSelect 
                      value={filters.from_year || 'all'} 
                      onValueChange={(value) => updateFilter('from_year', value)}
                      placeholder="Të gjithë vitet"
                      className="h-8 text-xs"
                      options={yearOptions}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Deri në Vitin</Label>
                    <AdaptiveSelect 
                      value={filters.to_year || 'all'} 
                      onValueChange={(value) => updateFilter('to_year', value)}
                      placeholder="Të gjithë vitet"
                      className="h-8 text-xs"
                      options={yearOptions}
                    />
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-indigo-600" />
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

              {/* Mileage with Presets */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-indigo-600" />
                  Kilometrazhi
                </Label>
                
                {/* Mileage Presets */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {MILEAGE_RANGE_PRESETS.slice(0, 4).map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        onFiltersChange({
                          ...filters,
                          odometer_from_km: preset.min.toString(),
                          odometer_to_km: preset.max === 999999 ? '' : preset.max.toString()
                        });
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                
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

              {/* Location Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-indigo-600" />
                  Vendndodhja
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Qyteti</Label>
                    <Input
                      placeholder="Shkruani qytetin"
                      value={filters.location_city || ''}
                      onChange={(e) => updateFilter('location_city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Distanca (km)</Label>
                    <AdaptiveSelect 
                      value={filters.location_distance || 'all'} 
                      onValueChange={(value) => updateFilter('location_distance', value)}
                      placeholder="Çdo distancë"
                      options={[
                        { value: 'all', label: 'Çdo distancë' },
                        { value: '10', label: 'Brenda 10 km' },
                        { value: '25', label: 'Brenda 25 km' },
                        { value: '50', label: 'Brenda 50 km' },
                        { value: '100', label: 'Brenda 100 km' },
                        { value: '200', label: 'Brenda 200 km' }
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

EncarStyleFilter.displayName = 'EncarStyleFilter';
export default EncarStyleFilter;