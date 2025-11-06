import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdaptiveSelect } from '@/components/ui/adaptive-select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Car, 
  Calendar, 
  DollarSign, 
  Settings, 
  Fuel, 
  Palette, 
  MapPin,
  Filter
} from 'lucide-react';
import { FilterState } from '@/hooks/useFiltersFromUrl';
import { validateFilters } from '@/utils/buildQueryParams';
import { cn } from '@/lib/utils';
import { sortBrandsWithPriority } from '@/utils/brandOrdering';

interface FiltersData {
  brands: Array<{ id: string; name: string; count?: number; image?: string }>;
  models: Array<{ id: string; name: string; brandId: string; count?: number }>;
  fuelTypes: Array<{ id: string; name: string; count?: number }>;
  transmissions: Array<{ id: string; name: string; count?: number }>;
  bodyTypes: Array<{ id: string; name: string; count?: number }>;
  colors: Array<{ id: string; name: string; count?: number }>;
  locations: Array<{ id: string; name: string; count?: number }>;
  yearRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  mileageRange: { min: number; max: number };
}

interface FiltersPanelProps {
  filters: FilterState;
  data: FiltersData;
  isLoading?: boolean;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  className?: string;
  compact?: boolean;
}

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  filters,
  data,
  isLoading,
  onFiltersChange,
  onClearFilters,
  className,
  compact = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [yearRange, setYearRange] = useState([filters.yearMin || data.yearRange.min, filters.yearMax || data.yearRange.max]);
  const [priceRange, setPriceRange] = useState([filters.priceMin || data.priceRange.min, filters.priceMax || data.priceRange.max]);
  const [mileageRange, setMileageRange] = useState([filters.mileageMin || data.mileageRange.min, filters.mileageMax || data.mileageRange.max]);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);

  // Debounce search term with 250ms delay as specified
  const debouncedSearchTerm = useDebounce(searchTerm, 250);

  // Update search filter when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm !== filters.search) {
      onFiltersChange({ search: debouncedSearchTerm || undefined });
    }
  }, [debouncedSearchTerm, filters.search, onFiltersChange]);

  // Debounce range updates with 250ms delay
  const debouncedYearRange = useDebounce(yearRange, 250);
  const debouncedPriceRange = useDebounce(priceRange, 250);
  const debouncedMileageRange = useDebounce(mileageRange, 250);

  useEffect(() => {
    if (debouncedYearRange[0] !== filters.yearMin || debouncedYearRange[1] !== filters.yearMax) {
      onFiltersChange({
        yearMin: debouncedYearRange[0] !== data.yearRange.min ? debouncedYearRange[0] : undefined,
        yearMax: debouncedYearRange[1] !== data.yearRange.max ? debouncedYearRange[1] : undefined,
      });
    }
  }, [debouncedYearRange, filters.yearMin, filters.yearMax, data.yearRange, onFiltersChange]);

  useEffect(() => {
    if (debouncedPriceRange[0] !== filters.priceMin || debouncedPriceRange[1] !== filters.priceMax) {
      onFiltersChange({
        priceMin: debouncedPriceRange[0] !== data.priceRange.min ? debouncedPriceRange[0] : undefined,
        priceMax: debouncedPriceRange[1] !== data.priceRange.max ? debouncedPriceRange[1] : undefined,
      });
    }
  }, [debouncedPriceRange, filters.priceMin, filters.priceMax, data.priceRange, onFiltersChange]);

  useEffect(() => {
    if (debouncedMileageRange[0] !== filters.mileageMin || debouncedMileageRange[1] !== filters.mileageMax) {
      onFiltersChange({
        mileageMin: debouncedMileageRange[0] !== data.mileageRange.min ? debouncedMileageRange[0] : undefined,
        mileageMax: debouncedMileageRange[1] !== data.mileageRange.max ? debouncedMileageRange[1] : undefined,
      });
    }
  }, [debouncedMileageRange, filters.mileageMin, filters.mileageMax, data.mileageRange, onFiltersChange]);

  // Get available models based on selected brand
  const availableModels = useMemo(() => {
    if (!filters.brand) return [];
    return data.models.filter(model => model.brandId === filters.brand);
  }, [data.models, filters.brand]);

  // Validate filters
  const validationErrors = useMemo(() => validateFilters(filters), [filters]);
  const { sorted: orderedBrands, priorityCount: priorityBrandCount } = useMemo(
    () => sortBrandsWithPriority(data.brands || []),
    [data.brands]
  );
  const brandOptions = useMemo(() => {
    const options = orderedBrands.map((brand) => ({
      value: brand.id,
      label: (
        <span className="flex items-center gap-2">
          {brand.image && (
            <img
              src={brand.image}
              alt={brand.name}
              className="h-4 w-4 rounded bg-white object-contain p-0.5 ring-1 ring-border dark:bg-white"
            />
          )}
          <span>
            {brand.name}
            {brand.count ? ` (${brand.count})` : ''}
          </span>
        </span>
      ),
      icon: brand.image
    }));

    if (priorityBrandCount > 0 && priorityBrandCount < options.length) {
      return [
        ...options.slice(0, priorityBrandCount),
        { value: 'separator-priority-brands', label: 'Të tjerët', disabled: true },
        ...options.slice(priorityBrandCount)
      ];
    }

    return options;
  }, [orderedBrands, priorityBrandCount]);
  const isValid = validationErrors.length === 0;

  // Count active filters for badge
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => 
      value !== undefined && 
      value !== null && 
      value !== '' && 
      key !== 'page' && 
      key !== 'pageSize' && 
      key !== 'sort'
    ).length;
  }, [filters]);

  // Get selected filters as chips
  const selectedFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; value: any }> = [];
    
    if (filters.brand) {
      const brand = data.brands.find(b => b.id === filters.brand);
      chips.push({ key: 'brand', label: 'Marka', value: brand?.name || filters.brand });
    }
    
    if (filters.model) {
      const model = availableModels.find(m => m.id === filters.model);
      chips.push({ key: 'model', label: 'Modeli', value: model?.name || filters.model });
    }
    
    if (filters.fuel) {
      const fuel = data.fuelTypes.find(f => f.id === filters.fuel);
      chips.push({ key: 'fuel', label: 'Karburanti', value: fuel?.name || filters.fuel });
    }
    
    if (filters.transmission) {
      const transmission = data.transmissions.find(t => t.id === filters.transmission);
      chips.push({ key: 'transmission', label: 'Transmisioni', value: transmission?.name || filters.transmission });
    }
    
    if (filters.yearMin || filters.yearMax) {
      const min = filters.yearMin || data.yearRange.min;
      const max = filters.yearMax || data.yearRange.max;
      chips.push({ key: 'year', label: 'Viti', value: min === max ? min.toString() : `${min}-${max}` });
    }
    
    if (filters.priceMin || filters.priceMax) {
      const min = filters.priceMin || data.priceRange.min;
      const max = filters.priceMax || data.priceRange.max;
      chips.push({ key: 'price', label: 'Çmimi', value: `€${min.toLocaleString()}-€${max.toLocaleString()}` });
    }
    
    return chips;
  }, [filters, data, availableModels]);

  const handleBrandChange = (brandId: string) => {
    // When brand changes, reset model as specified in requirements
    onFiltersChange({ brand: brandId, model: undefined });
  };

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  }, []);

  const removeFilter = (key: string) => {
    switch (key) {
      case 'brand':
        onFiltersChange({ brand: undefined, model: undefined }); // Reset model when removing brand
        break;
      case 'model':
        onFiltersChange({ model: undefined });
        break;
      case 'fuel':
        onFiltersChange({ fuel: undefined });
        break;
      case 'transmission':
        onFiltersChange({ transmission: undefined });
        break;
      case 'year':
        onFiltersChange({ yearMin: undefined, yearMax: undefined });
        setYearRange([data.yearRange.min, data.yearRange.max]);
        break;
      case 'price':
        onFiltersChange({ priceMin: undefined, priceMax: undefined });
        setPriceRange([data.priceRange.min, data.priceRange.max]);
        break;
    }
  };

  return (
    <div 
      className={cn(
        'space-y-4 rounded-xl p-4 backdrop-blur-sm border border-border/50 shadow-lg',
        className
      )}
      style={{
        background: 'var(--gradient-filter)',
        boxShadow: 'var(--shadow-filter)',
      }}
    >
      {/* Header with active filters count */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 leading-tight">
          <Filter className="h-5 w-5 text-primary transition-transform hover:scale-110" />
          <h3 className="text-lg font-semibold">Filtrat e Kërkimit</h3>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="animate-scale-in">{activeFiltersCount}</Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
          >
            <X className="h-3 w-3 mr-1" />
            Pastro të gjitha
          </Button>
        </div>
      </div>

      {/* Selected filters chips */}
      {selectedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {selectedFilters.map((chip) => (
            <Badge 
              key={chip.key} 
              variant="default" 
              className="flex items-center gap-1 animate-scale-in bg-primary/10 hover:bg-primary/20 border border-primary/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
            >
              <span className="text-xs font-medium">{chip.label}: {chip.value}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-0 hover:bg-transparent transition-transform hover:scale-110"
                onClick={() => removeFilter(chip.key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search" className="flex items-center gap-2 font-medium">
          <Search className="h-4 w-4" />
          Kërko
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors" />
          <Input
            id="search"
            type="text"
            placeholder="Kërko makinat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/60 backdrop-blur-sm border-border/50 focus:border-primary transition-all duration-200"
          />
        </div>
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
          <div 
            className="space-y-4 p-3 bg-muted/30 rounded-lg"
            style={{
              animation: 'fadeIn 0.2s ease-out',
              willChange: 'contents'
            }}
          >
            {/* Brand */}
            <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Marka
          </Label>
          <AdaptiveSelect
            key={`brand-${filters.brand || 'empty'}`}
            value={filters.brand || ''}
            onValueChange={handleBrandChange}
            placeholder="Zgjidhni markën"
            className="filter-select bg-background"
            options={brandOptions}
            forceNative
          />
        </div>

        {/* Model (dependent on brand) */}
        <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Modeli
              </Label>
              <AdaptiveSelect
                key={`model-${filters.brand || 'no-brand'}-${filters.model || 'empty'}`}
                value={filters.model || ''}
                onValueChange={(value) => onFiltersChange({ model: value })}
                disabled={!filters.brand || availableModels.length === 0}
                placeholder={!filters.brand ? "Zgjidhni markën së pari" : "Zgjidhni modelin"}
                className="filter-select bg-background"
            options={(availableModels.length === 0
              ? [{ value: '', label: 'Nuk ka modele të disponueshme', disabled: true }]
              : availableModels.map((model) => ({
                value: model.id,
                label: `${model.name}${model.count ? ` (${model.count})` : ''}`
              }))
            )}
            forceNative
          />
        </div>

            {/* Year Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Vitet
              </Label>
              <div className="px-2">
                <Slider
                  value={yearRange}
                  onValueChange={setYearRange}
                  min={data.yearRange.min}
                  max={data.yearRange.max}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>{yearRange[0]}</span>
                  <span>{yearRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Çmimi (€)
              </Label>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={data.priceRange.min}
                  max={data.priceRange.max}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>€{priceRange[0].toLocaleString()}</span>
                  <span>€{priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters Section */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          onClick={() => toggleSection('advanced')}
          className="w-full justify-between p-2 h-auto hover:bg-muted/50 backdrop-blur-sm border border-border/30 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary transition-transform hover:scale-110" />
            <span className="font-medium">Filtrat e Avancuar</span>
          </div>
          {expandedSections.includes('advanced') ? 
            <ChevronUp className="h-4 w-4 transition-transform duration-200" /> : 
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          }
        </Button>

        {expandedSections.includes('advanced') && (
          <div 
            className="space-y-4 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 max-h-[60vh] overflow-y-auto"
            style={{
              animation: 'fadeIn 0.2s ease-out',
              willChange: 'contents',
              scrollBehavior: 'smooth'
            }}
          >
            {/* Fuel Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-medium">
                <Fuel className="h-4 w-4" />
                Lloji i Karburantit
              </Label>
              <AdaptiveSelect
                key={`fuel-${filters.fuel || 'empty'}`}
                value={filters.fuel || ''}
                onValueChange={(value) => onFiltersChange({ fuel: value })}
                placeholder="Zgjidhni karburantin"
                className="filter-select bg-background"
                options={data.fuelTypes.map((fuel) => ({
                  value: fuel.id,
                  label: `${fuel.name}${fuel.count ? ` (${fuel.count})` : ''}`
                }))}
                forceNative
              />
            </div>

            {/* Transmission */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Transmisioni
              </Label>
              <AdaptiveSelect
                key={`transmission-${filters.transmission || 'empty'}`}
                value={filters.transmission || ''}
                onValueChange={(value) => onFiltersChange({ transmission: value })}
                placeholder="Zgjidhni transmisionin"
                className="filter-select bg-background"
                options={data.transmissions.map((transmission) => ({
                  value: transmission.id,
                  label: `${transmission.name}${transmission.count ? ` (${transmission.count})` : ''}`
                }))}
                forceNative
              />
            </div>

            {/* Mileage Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Kilometrazhi (km)
              </Label>
              <div className="px-2">
                <Slider
                  value={mileageRange}
                  onValueChange={setMileageRange}
                  min={data.mileageRange.min}
                  max={data.mileageRange.max}
                  step={10000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>{mileageRange[0].toLocaleString()} km</span>
                  <span>{mileageRange[1].toLocaleString()} km</span>
                </div>
              </div>
            </div>

            {/* Body Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Lloji i Trupit
              </Label>
              <AdaptiveSelect
                key={`bodyType-${filters.bodyType || 'empty'}`}
                value={filters.bodyType || ''}
                onValueChange={(value) => onFiltersChange({ bodyType: value })}
                placeholder="Zgjidhni llojin e trupit"
                className="filter-select bg-background"
                options={data.bodyTypes.map((bodyType) => ({
                  value: bodyType.id,
                  label: `${bodyType.name}${bodyType.count ? ` (${bodyType.count})` : ''}`
                }))}
                forceNative
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Ngjyra
              </Label>
              <AdaptiveSelect
                key={`color-${filters.color || 'empty'}`}
                value={filters.color || ''}
                onValueChange={(value) => onFiltersChange({ color: value })}
                placeholder="Zgjidhni ngjyrën"
                className="filter-select bg-background"
                options={data.colors.map((color) => ({
                  value: color.id,
                  label: `${color.name}${color.count ? ` (${color.count})` : ''}`
                }))}
                forceNative
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Vendndodhja
              </Label>
              <AdaptiveSelect
                key={`location-${filters.location || 'empty'}`}
                value={filters.location || ''}
                onValueChange={(value) => onFiltersChange({ location: value })}
                placeholder="Zgjidhni vendndodhjen"
                className="filter-select bg-background"
                options={data.locations.map((location) => ({
                  value: location.id,
                  label: `${location.name}${location.count ? ` (${location.count})` : ''}`
                }))}
                forceNative
              />
            </div>
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-md bg-destructive/10 p-3 backdrop-blur-sm border border-destructive/20 animate-scale-in">
          <h4 className="text-sm font-medium text-destructive">Ju lutemi korrigoni gabimet e mëposhtme:</h4>
          <ul className="mt-1 text-sm text-destructive">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center text-sm text-muted-foreground transition-opacity animate-pulse">
          Duke përditësuar filtrat...
        </div>
      )}
    </div>
  );
};

export default FiltersPanel;