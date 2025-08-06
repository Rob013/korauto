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

interface Generation {
  cars_qty?: number;
  from_year?: number;
  id: number;
  manufacturer_id?: number;
  model_id?: number;
  name: string;
  to_year?: number;
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

interface EncarStyleFilterProps {
  filters: {
    manufacturer_id?: string;
    model_id?: string;
    generation_id?: string;
    grade_iaai?: string;
    color?: string;
    fuel_type?: string;
    transmission?: string;
    body_type?: string;
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
  isHomepage?: boolean;
  compact?: boolean;
  onSearchCars?: () => void;
  onCloseFilter?: () => void;
}

const EncarStyleFilter = memo<EncarStyleFilterProps>(({
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
  onFetchGrades,
  isHomepage = false,
  compact = false,
  onSearchCars,
  onCloseFilter
}) => {
  const [grades, setGrades] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);

  // Track if strict filtering mode is enabled
  const isStrictMode = useMemo(() => {
    return !!(filters.manufacturer_id || filters.model_id || filters.generation_id || 
              filters.color || filters.fuel_type || filters.transmission || 
              filters.from_year || filters.to_year || filters.buy_now_price_from || 
              filters.buy_now_price_to || filters.odometer_from_km || filters.odometer_to_km ||
              filters.seats_count || filters.max_accidents || filters.grade_iaai || filters.search);
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
        generation_id: undefined,
        grade_iaai: undefined
      });
    } else if (key === 'model_id') {
      onModelChange?.(actualValue || '');
      onFiltersChange({
        ...filters,
        [key]: actualValue,
        generation_id: undefined,
        grade_iaai: undefined
      });
    } else {
      const updatedFilters = { ...filters, [key]: actualValue };
      
      if (key === 'generation_id') {
        updatedFilters.grade_iaai = undefined;
      }
      
      onFiltersChange(updatedFilters);
    }
    
    setTimeout(() => setIsLoading(false), 50);
  }, [filters, onFiltersChange, onManufacturerChange, onModelChange]);

  // Handle year range preset selection
  const handleYearRangePreset = useCallback((preset: { label: string; from: number; to: number }) => {
    const updatedFilters = {
      ...filters,
      from_year: preset.from.toString(),
      to_year: preset.to.toString()
    };
    onFiltersChange(updatedFilters);
  }, [filters, onFiltersChange]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  // Fixed: Enhanced year range - show years from current year to 1996, corrected range calculation
  const years = useMemo(() => Array.from({ length: 30 }, (_, i) => Math.max(currentYear - i, 1996)), [currentYear]);
  
  // Enhanced year range presets with more options
  const yearRangePresets = useMemo(() => [
    { label: '2022+', from: 2022, to: currentYear },
    { label: '2020+', from: 2020, to: currentYear },
    { label: '2018+', from: 2018, to: currentYear },
    { label: '2015+', from: 2015, to: currentYear },
    { label: '2010+', from: 2010, to: currentYear },
    { label: '2005+', from: 2005, to: currentYear },
    { label: '2000+', from: 2000, to: currentYear },
  ], [currentYear]);

  // Year options for dropdowns - strict mode aware
  const yearOptions = useMemo(() => [
    // In strict mode, show "All years" only when no specific year is selected or not in strict mode
    ...(isStrictMode && (filters.from_year || filters.to_year) ? [] : [{ value: 'all', label: 'All years' }]),
    ...years.map(year => ({
      value: year.toString(),
      label: year.toString()
    }))
  ], [years, isStrictMode, filters.from_year, filters.to_year]);

  // Prioritized manufacturer sorting (German, Korean, Popular)
  const sortedManufacturers = useMemo(() => {
    return manufacturers
      .sort((a, b) => {
        const germanBrands = ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche', 'Opel'];
        const luxuryBrands = ['Land Rover', 'Volvo', 'Aston Martin', 'Bentley'];
        const koreanBrands = ['Hyundai', 'Kia', 'Genesis'];
        const popularBrands = ['Toyota', 'Honda', 'Nissan', 'Ford', 'Chevrolet', 'Mazda', 'Subaru', 'Lexus'];
        
        const aIsGerman = germanBrands.includes(a.name);
        const bIsGerman = germanBrands.includes(b.name);
        const aIsLuxury = luxuryBrands.includes(a.name);
        const bIsLuxury = luxuryBrands.includes(b.name);
        const aIsKorean = koreanBrands.includes(a.name);
        const bIsKorean = koreanBrands.includes(b.name);
        const aIsPopular = popularBrands.includes(a.name);
        const bIsPopular = popularBrands.includes(b.name);
        
        // Prioritize German brands first, then luxury brands, then Korean, then popular
        if (aIsGerman && !bIsGerman) return -1;
        if (!aIsGerman && bIsGerman) return 1;
        if (aIsLuxury && !bIsLuxury && !bIsGerman) return -1;
        if (!aIsLuxury && bIsLuxury && !aIsGerman) return 1;
        if (aIsKorean && !bIsKorean && !bIsGerman && !bIsLuxury) return -1;
        if (!aIsKorean && bIsKorean && !aIsGerman && !aIsLuxury) return 1;
        if (aIsPopular && !bIsPopular && !bIsGerman && !bIsKorean && !bIsLuxury) return -1;
        if (!aIsPopular && bIsPopular && !aIsGerman && !aIsKorean && !aIsLuxury) return 1;
        
        return a.name.localeCompare(b.name);
      })
      .filter((m) => m.cars_qty && m.cars_qty > 0);
  }, [manufacturers]);

  // Fetch grades when filters change
  useEffect(() => {
    if (filters.manufacturer_id && onFetchGrades) {
      setIsLoadingGrades(true);
      onFetchGrades(filters.manufacturer_id, filters.model_id, filters.generation_id)
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
  }, [filters.manufacturer_id, filters.model_id, filters.generation_id, onFetchGrades]);

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
      <div className="space-y-3 sm:space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between flex-shrink-0">
          <h3 className="text-base sm:text-lg font-semibold">Search Cars</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-destructive flex items-center gap-1 h-8 px-2"
            >
              <X className="h-3 w-3" />
              <span className="text-xs">Clear</span>
            </Button>
            {onCloseFilter && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCloseFilter}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 h-8 px-2"
              >
                <X className="h-3 w-3" />
                <span className="text-xs">Close</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Scrollable filter content */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Car className="h-3 w-3" />
              Brand
            </Label>
            <AdaptiveSelect 
              value={filters.manufacturer_id || 'all'} 
              onValueChange={(value) => updateFilter('manufacturer_id', value)}
              placeholder="Select brand"
              className="h-9 sm:h-10 text-sm"
              options={[
                // In strict mode, show "All Brands" only when no specific brand is selected
                ...(isStrictMode && filters.manufacturer_id ? [] : [{ value: 'all', label: 'All Brands' }]),
                ...sortedManufacturers.map((manufacturer) => ({
                  value: manufacturer.id.toString(),
                  label: (
                    <div className="flex items-center gap-2">
                      {manufacturer.image && (
                        <img src={manufacturer.image} alt={manufacturer.name} className="w-4 h-4 object-contain" />
                      )}
                      <span className="text-sm">{manufacturer.name} ({manufacturer.cars_qty})</span>
                    </div>
                  )
                }))
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Settings className="h-3 w-3" />
              Model
            </Label>
            <AdaptiveSelect 
              value={filters.model_id || 'all'} 
              onValueChange={(value) => updateFilter('model_id', value)}
              disabled={!filters.manufacturer_id}
              placeholder={filters.manufacturer_id ? "Select model" : "Select brand first"}
              className="h-9 sm:h-10 text-sm"
              options={[
                // In strict mode, show "All Models" only when no specific model is selected or not in strict mode
                ...(isStrictMode && filters.model_id ? [] : [{ value: 'all', label: 'All Models' }]),
                ...models.filter(model => model.cars_qty && model.cars_qty > 0).map((model) => ({
                  value: model.id.toString(),
                  label: `${model.name} (${model.cars_qty})`
                }))
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Generation
            </Label>
            <AdaptiveSelect 
              value={filters.generation_id || 'all'} 
              onValueChange={(value) => updateFilter('generation_id', value)}
              disabled={!filters.model_id}
              placeholder={filters.model_id ? "Generations" : "Select model first"}
              className="h-9 sm:h-10 text-sm"
              options={[
                // In strict mode, show "All Generations" only when no specific generation is selected or not in strict mode
                ...(isStrictMode && filters.generation_id ? [] : [{ value: 'all', label: 'All Generations' }]),
                ...generations.filter(gen => gen.cars_qty && gen.cars_qty > 0).map((generation) => ({
                  value: generation.id.toString(),
                  label: `${generation.name}${generation.from_year ? (() => {
                    const from = generation.from_year.toString();
                    const currentYear = new Date().getFullYear();
                    // Show 'present' if to_year is current year or later, or missing
                    const to = (!generation.to_year || generation.to_year >= currentYear) ? 'present' : generation.to_year.toString();
                    return ` (${from}-${to})`;
                  })() : ''}`
                }))
              ]}
            />
          </div>

          {/* Year presets - moved under Generation */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Year Range:</Label>
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
                  className="h-7 sm:h-8 px-2 text-xs"
                  onClick={() => handleYearRangePreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Enhanced Year Filter - From/To dropdowns */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Year Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <AdaptiveSelect 
                  value={filters.from_year || 'all'} 
                  onValueChange={(value) => updateFilter('from_year', value)}
                  placeholder="All years"
                  className="h-9 sm:h-10 text-sm"
                  options={yearOptions}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <AdaptiveSelect 
                  value={filters.to_year || 'all'} 
                  onValueChange={(value) => updateFilter('to_year', value)}
                  placeholder="All years"
                  className="h-9 sm:h-10 text-sm"
                  options={yearOptions}
                />
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-3 w-3" />
              Price (EUR)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="From"
                value={filters.buy_now_price_from || ''}
                onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                className="h-9 sm:h-10 text-sm"
              />
              <Input
                type="number"
                placeholder="To"
                value={filters.buy_now_price_to || ''}
                onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>

          {/* Additional Filters Toggle */}
          <Button
            variant="ghost"
            onClick={() => toggleSection('more')}
            className="w-full justify-between text-xs sm:text-sm h-8 sm:h-9"
          >
            More Filters
            {expandedSections.includes('more') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {expandedSections.includes('more') && (
            <div className="space-y-2.5 pt-2 border-t">
              {/* Color, Fuel, Transmission in compact layout */}
              <div className="space-y-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Palette className="h-3 w-3" />
                    Color
                  </Label>
                  <AdaptiveSelect 
                    value={filters.color || 'all'} 
                    onValueChange={(value) => updateFilter('color', value)}
                    placeholder="Any color"
                    className="h-9 sm:h-10 text-sm"
                    options={[
                      // In strict mode, show "Any color" only when no specific color is selected or not in strict mode
                      ...(isStrictMode && filters.color ? [] : [{ value: 'all', label: 'Any color' }]),
                      ...Object.entries(COLOR_OPTIONS).map(([name, id]) => ({
                        value: id.toString(),
                        label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                      }))
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Fuel className="h-3 w-3" />
                    Fuel
                  </Label>
                  <AdaptiveSelect 
                    value={filters.fuel_type || 'all'} 
                    onValueChange={(value) => updateFilter('fuel_type', value)}
                    placeholder="Any type"
                    className="h-9 sm:h-10 text-sm"
                    options={[
                      // In strict mode, show "Any type" only when no specific fuel type is selected or not in strict mode
                      ...(isStrictMode && filters.fuel_type ? [] : [{ value: 'all', label: 'Any type' }]),
                      ...Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => ({
                        value: id.toString(),
                        label: name.charAt(0).toUpperCase() + name.slice(1)
                      }))
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Settings className="h-3 w-3" />
                    Transmission
                  </Label>
                  <AdaptiveSelect 
                    value={filters.transmission || 'all'} 
                    onValueChange={(value) => updateFilter('transmission', value)}
                    placeholder="Any type"
                    className="h-9 sm:h-10 text-sm"
                    options={[
                      // In strict mode, show "Any type" only when no specific transmission is selected or not in strict mode
                      ...(isStrictMode && filters.transmission ? [] : [{ value: 'all', label: 'Any type' }]),
                      ...Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => ({
                        value: id.toString(),
                        label: name.charAt(0).toUpperCase() + name.slice(1)
                      }))
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Car className="h-3 w-3" />
                    Body Type
                  </Label>
                  <AdaptiveSelect 
                    value={filters.body_type || 'all'} 
                    onValueChange={(value) => updateFilter('body_type', value)}
                    placeholder="Any type"
                    className="h-9 sm:h-10 text-sm"
                    options={[
                      { value: 'all', label: 'Any type' },
                      ...Object.entries(BODY_TYPE_OPTIONS).map(([name, id]) => ({
                        value: id.toString(),
                        label: name.charAt(0).toUpperCase() + name.slice(1)
                      }))
                    ]}
                  />
                </div>

                {/* Mileage */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Mileage (km)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="From"
                      value={filters.odometer_from_km || ''}
                      onChange={(e) => updateFilter('odometer_from_km', e.target.value)}
                      className="h-9 sm:h-10 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      value={filters.odometer_to_km || ''}
                      onChange={(e) => updateFilter('odometer_to_km', e.target.value)}
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Button */}
          {onSearchCars && (
            <div className="pt-3 border-t flex-shrink-0">
              <Button 
                onClick={onSearchCars} 
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                size="sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Cars
              </Button>
            </div>
          )}
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
                placeholder="Zgjidhni markën"
                className="h-11"
                options={[
                  // In strict mode, show "Të gjitha Markat" only when no specific brand is selected or not in strict mode
                  ...(isStrictMode && filters.manufacturer_id ? [] : [{ value: 'all', label: 'Të gjitha Markat' }]),
                  ...sortedManufacturers.map((manufacturer) => ({
                    value: manufacturer.id.toString(),
                    label: (
                      <div className="flex items-center gap-2">
                        {manufacturer.image && (
                          <img src={manufacturer.image} alt={manufacturer.name} className="w-5 h-5 object-contain" />
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
                Gjenerata
                {(filters.from_year || filters.to_year) && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.from_year || 'Çdo vit'} - {filters.to_year || 'sot'}
                  </Badge>
                )}
              </Label>
              <AdaptiveSelect 
                value={filters.generation_id || 'all'} 
                onValueChange={(value) => updateFilter('generation_id', value)}
                disabled={!filters.model_id}
                placeholder={filters.model_id ? "Gjeneratat" : "Zgjidhni modelin së pari"}
                className="h-11"
                options={[
                  // In strict mode, show "Të gjitha Gjeneratat" only when no specific generation is selected or not in strict mode
                  ...(isStrictMode && filters.generation_id ? [] : [{ value: 'all', label: 'Të gjitha Gjeneratat' }]),
                  ...generations.filter(gen => gen.cars_qty && gen.cars_qty > 0).map((generation) => ({
                    value: generation.id.toString(),
                    label: `${generation.name}${generation.from_year ? (() => {
                      const from = generation.from_year.toString();
                      const currentYear = new Date().getFullYear();
                      const to = (!generation.to_year || generation.to_year >= currentYear) ? 'present' : generation.to_year.toString();
                      return ` (${from}-${to})`;
                    })() : ''}`
                  }))
                ]}
              />
              
              {/* Year Range Preset Buttons for Homepage */}
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground mb-2 block">Vitet:</Label>
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
                        {manufacturer.image && (
                          <img src={manufacturer.image} alt={manufacturer.name} className="w-4 h-4 object-contain" />
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

            {/* Generation and Variants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Gjenerata
                  {(filters.from_year || filters.to_year) && (
                    <Badge variant="secondary" className="text-xs">
                      {filters.from_year || 'Çdo vit'} - {filters.to_year || 'sot'}
                    </Badge>
                  )}
                </Label>
                <AdaptiveSelect 
                  value={filters.generation_id || 'all'} 
                  onValueChange={(value) => updateFilter('generation_id', value)}
                  disabled={!filters.model_id}
                  placeholder={filters.model_id ? "Gjeneratat" : "Zgjidhni modelin së pari"}
                  options={[
                    // In strict mode, show "Të gjitha Gjeneratat" only when no specific generation is selected or not in strict mode
                    ...(isStrictMode && filters.generation_id ? [] : [{ value: 'all', label: 'Të gjitha Gjeneratat' }]),
                    ...generations.filter(gen => gen.cars_qty && gen.cars_qty > 0).map((generation) => ({
                      value: generation.id.toString(),
                      label: `${generation.name}${generation.from_year ? (() => {
                        const from = generation.from_year.toString();
                        const currentYear = new Date().getFullYear();
                        // Show 'present' if to_year is current year or later, or missing
                        const to = (!generation.to_year || generation.to_year >= currentYear) ? 'present' : generation.to_year.toString();
                        return ` (${from}-${to})`;
                      })() : ''}`
                    }))
                  ]}
                />
                
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
                  Variants
                </Label>
                <AdaptiveSelect 
                  value={filters.grade_iaai || 'all'} 
                  onValueChange={(value) => updateFilter('grade_iaai', value)}
                  disabled={!filters.generation_id || isLoadingGrades}
                  placeholder={isLoadingGrades ? "Loading..." : "Select variant"}
                  options={[
                    // In strict mode, show "All Variants" only when no specific variant is selected or not in strict mode
                    ...(isStrictMode && filters.grade_iaai ? [] : [{ value: 'all', label: 'All Variants' }]),
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