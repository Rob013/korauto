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
import { COLOR_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS } from '@/hooks/useAuctionAPI';

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
  enableManualSearch?: boolean; // New prop to enable manual search mode
  onManualSearch?: () => void; // New prop for manual search handler
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
  enableManualSearch = false,
  onManualSearch
}) => {
  const [grades, setGrades] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);
  
  // Local state for pending filters when manual search is enabled
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [hasChanges, setHasChanges] = useState(false);

  const updateFilter = useCallback((key: string, value: string) => {
    const actualValue = value === 'all' || value === 'any' ? undefined : value;
    
    if (enableManualSearch) {
      // In manual search mode, update pending filters without triggering search
      const updatedFilters = { ...pendingFilters };
      
      if (key === 'manufacturer_id') {
        onManufacturerChange?.(actualValue || '');
        updatedFilters[key] = actualValue;
        updatedFilters.model_id = undefined;
        updatedFilters.generation_id = undefined;
        updatedFilters.grade_iaai = undefined;
      } else if (key === 'model_id') {
        onModelChange?.(actualValue || '');
        updatedFilters[key] = actualValue;
        updatedFilters.generation_id = undefined;
        updatedFilters.grade_iaai = undefined;
      } else {
        updatedFilters[key] = actualValue;
        if (key === 'generation_id') {
          updatedFilters.grade_iaai = undefined;
        }
      }
      
      setPendingFilters(updatedFilters);
      setHasChanges(true);
    } else {
      // Original immediate search behavior
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
    }
  }, [filters, pendingFilters, enableManualSearch, onFiltersChange, onManufacturerChange, onModelChange]);

  // Manual search trigger function
  const handleManualSearch = useCallback(() => {
    if (enableManualSearch && hasChanges) {
      if (onManualSearch) {
        // Use parent's manual search handler if provided
        onManualSearch();
        setHasChanges(false);
      } else {
        // Fallback to original behavior
        setIsLoading(true);
        onFiltersChange(pendingFilters);
        setHasChanges(false);
        setTimeout(() => setIsLoading(false), 100);
      }
    } else if (onManualSearch && !enableManualSearch) {
      // If not in manual search mode but handler provided, use it directly
      onManualSearch();
    }
  }, [enableManualSearch, hasChanges, pendingFilters, onFiltersChange, onManualSearch]);

  // Reset pending filters when external filters change
  useEffect(() => {
    if (enableManualSearch) {
      setPendingFilters(filters);
      setHasChanges(false);
    }
  }, [filters, enableManualSearch]);

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
  const years = useMemo(() => Array.from({ length: 25 }, (_, i) => currentYear - i), [currentYear]);
  
  // Year range presets
  const yearRangePresets = useMemo(() => [
    { label: '2023+', from: 2023, to: currentYear },
    { label: '2020+', from: 2020, to: currentYear },
    { label: '2018+', from: 2018, to: currentYear },
    { label: '2015+', from: 2015, to: currentYear },
    { label: '2010+', from: 2010, to: currentYear },
    { label: '2005+', from: 2005, to: currentYear },
  ], [currentYear]);

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
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold">Search Cars</h3>
            {enableManualSearch && hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Changes pending
              </Badge>
            )}
          </div>
        </div>
        
        {/* Search Button - Moved inside filters */}
        {enableManualSearch && (
          <div className="mb-4">
            <Button 
              variant="default"
              size="lg" 
              onClick={handleManualSearch}
              disabled={!hasChanges || isLoading || !pendingFilters.manufacturer_id || !pendingFilters.model_id}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Cars
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Basic filters */}
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
                { value: 'all', label: 'All Brands' },
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
              placeholder="Select model"
              className="h-9 sm:h-10 text-sm"
              options={[
                { value: 'all', label: 'All Models' },
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
              placeholder="Select generation"
              className="h-9 sm:h-10 text-sm"
              options={[
                { value: 'all', label: 'All Generations' },
                ...generations.filter(gen => gen.cars_qty && gen.cars_qty > 0).map((generation) => ({
                  value: generation.id.toString(),
                  label: `${generation.name}${generation.from_year ? (() => {
                    const from = generation.from_year.toString();
                    const currentYear = new Date().getFullYear();
                    const to = (!generation.to_year || generation.to_year >= currentYear) ? 'now' : generation.to_year.toString();
                    return ` (${from}-${to})`;
                  })() : ''} • ${generation.cars_qty} cars`
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
                      { value: 'all', label: 'Any color' },
                      ...Object.entries(COLOR_OPTIONS).map(([value, label]) => ({
                        value,
                        label
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
                      { value: 'all', label: 'Any type' },
                      ...Object.entries(FUEL_TYPE_OPTIONS).map(([value, label]) => ({
                        value,
                        label
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
                      { value: 'all', label: 'Any type' },
                      ...Object.entries(TRANSMISSION_OPTIONS).map(([value, label]) => ({
                        value,
                        label
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
                  { value: 'all', label: 'Të gjitha Markat' },
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
                placeholder="Zgjidhni modelin"
                className="h-11"
                options={[
                  { value: 'all', label: 'Të gjithë Modelet' },
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
                placeholder="Gjeneratat"
                className="h-11"
                options={[
                  { value: 'all', label: 'Të gjitha Gjeneratat' },
                  ...generations.filter(gen => gen.cars_qty && gen.cars_qty > 0).map((generation) => ({
                    value: generation.id.toString(),
                    label: `${generation.name}${generation.from_year ? (() => {
                      const from = generation.from_year.toString();
                      const currentYear = new Date().getFullYear();
                      const to = (!generation.to_year || generation.to_year >= currentYear) ? 'sot' : generation.to_year.toString();
                      return ` (${from}-${to})`;
                    })() : ''} • ${generation.cars_qty} makina`
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
                  { value: 'all', label: 'Të gjitha Markat' },
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
                placeholder="Zgjidhni modelin"
                options={[
                  { value: 'all', label: 'Të gjithë Modelet' },
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
                  placeholder="Gjeneratat"
                  options={[
                    { value: 'all', label: 'Të gjitha Gjeneratat' },
                    ...generations.filter(gen => gen.cars_qty && gen.cars_qty > 0).map((generation) => ({
                      value: generation.id.toString(),
                      label: `${generation.name}${generation.from_year ? (() => {
                        const from = generation.from_year.toString();
                        const currentYear = new Date().getFullYear();
                        const to = (!generation.to_year || generation.to_year >= currentYear) ? 'sot' : generation.to_year.toString();
                        return ` (${from}-${to})`;
                      })() : ''} • ${generation.cars_qty} makina`
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
                    { value: 'all', label: 'All Variants' },
                    ...grades.map((grade) => ({
                      value: grade.value,
                      label: grade.label
                    }))
                  ]}
                />
              </div>
            </div>

            {/* Color, Fuel, Transmission */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    { value: 'all', label: 'Çdo ngjyrë' },
                    ...Object.entries(COLOR_OPTIONS).map(([value, label]) => ({
                      value,
                      label
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
                    { value: 'all', label: 'Çdo tip' },
                    ...Object.entries(FUEL_TYPE_OPTIONS).map(([value, label]) => ({
                      value,
                      label
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
                    { value: 'all', label: 'Çdo tip' },
                    ...Object.entries(TRANSMISSION_OPTIONS).map(([value, label]) => ({
                      value,
                      label
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