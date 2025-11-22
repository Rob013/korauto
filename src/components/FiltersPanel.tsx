import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdaptiveSelect } from '@/components/ui/adaptive-select';
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
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Debounce search term with 250ms delay as specified
  const debouncedSearchTerm = useDebounce(searchTerm, 250);

  // Update search filter when debounced term changes
  useEffect(() => {
    try {
      if (debouncedSearchTerm !== filters.search) {
        onFiltersChange({ search: debouncedSearchTerm || undefined });
      }
      setValidationError(null);
    } catch (error) {
      console.error('Error updating search filter:', error);
      setValidationError('Gabim në kërkim');
    }
  }, [debouncedSearchTerm, filters.search, onFiltersChange]);

  const currentYearRange = useMemo(() => {
    try {
      return [
        filters.yearMin ?? data?.yearRange?.min ?? 2000,
        filters.yearMax ?? data?.yearRange?.max ?? new Date().getFullYear()
      ];
    } catch (error) {
      console.error('Error calculating year range:', error);
      return [2000, new Date().getFullYear()];
    }
  }, [filters.yearMin, filters.yearMax, data?.yearRange]);

  const currentPriceRange = useMemo(() => {
    try {
      return [
        filters.priceMin ?? data?.priceRange?.min ?? 0,
        filters.priceMax ?? data?.priceRange?.max ?? 100000
      ];
    } catch (error) {
      console.error('Error calculating price range:', error);
      return [0, 100000];
    }
  }, [filters.priceMin, filters.priceMax, data?.priceRange]);

  const currentMileageRange = useMemo(() => {
    try {
      return [
        filters.mileageMin ?? data?.mileageRange?.min ?? 0,
        filters.mileageMax ?? data?.mileageRange?.max ?? 300000
      ];
    } catch (error) {
      console.error('Error calculating mileage range:', error);
      return [0, 300000];
    }
  }, [filters.mileageMin, filters.mileageMax, data?.mileageRange]);

  const yearOptions = useMemo(() => {
    try {
      const options: Array<{ value: string; label: string }> = [];
      const minYear = data?.yearRange?.min ?? 2000;
      const maxYear = data?.yearRange?.max ?? new Date().getFullYear();

      for (let year = minYear; year <= maxYear; year++) {
        options.push({ value: year.toString(), label: year.toString() });
      }
      return options;
    } catch (error) {
      console.error('Error generating year options:', error);
      return [];
    }
  }, [data?.yearRange]);

  const buildSteppedOptions = useCallback((min: number, max: number, step: number, formatter: (value: number) => string) => {
    const values: number[] = [];
    const safeStep = Math.max(step, 1);

    for (let value = min; value <= max; value += safeStep) {
      values.push(value);
      if (value + safeStep > max && value !== max) {
        values.push(max);
        break;
      }
    }

    if (!values.includes(max)) {
      values.push(max);
    }

    const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);
    return uniqueValues.map((value) => ({ value: value.toString(), label: formatter(value) }));
  }, []);

  const priceOptions = useMemo(() => buildSteppedOptions(
    data.priceRange.min,
    data.priceRange.max,
    1000,
    (value) => `€${value.toLocaleString()}`
  ), [buildSteppedOptions, data.priceRange.min, data.priceRange.max]);

  const mileageOptions = useMemo(() => buildSteppedOptions(
    data.mileageRange.min,
    data.mileageRange.max,
    10000,
    (value) => `${value.toLocaleString()} km`
  ), [buildSteppedOptions, data.mileageRange.min, data.mileageRange.max]);

  const descendingYearOptions = useMemo(() => [...yearOptions].reverse(), [yearOptions]);
  const descendingPriceOptions = useMemo(() => [...priceOptions].reverse(), [priceOptions]);
  const descendingMileageOptions = useMemo(() => [...mileageOptions].reverse(), [mileageOptions]);

  const handleYearMinChange = useCallback((value: string) => {
    const selectedMin = value === 'any' ? undefined : Number(value);
    const currentMax = filters.yearMax ?? data.yearRange.max;
    const adjustedMax = selectedMin !== undefined && selectedMin > currentMax ? selectedMin : currentMax;

    onFiltersChange({
      yearMin: selectedMin,
      yearMax: filters.yearMax !== undefined || adjustedMax !== data.yearRange.max ? adjustedMax : undefined
    });
  }, [filters.yearMax, data.yearRange.max, onFiltersChange]);

  const handleYearMaxChange = useCallback((value: string) => {
    const selectedMax = value === 'any' ? undefined : Number(value);
    const currentMin = filters.yearMin ?? data.yearRange.min;
    const adjustedMin = selectedMax !== undefined && selectedMax < currentMin ? selectedMax : currentMin;

    onFiltersChange({
      yearMin: filters.yearMin !== undefined || adjustedMin !== data.yearRange.min ? adjustedMin : undefined,
      yearMax: selectedMax,
    });
  }, [filters.yearMin, data.yearRange.min, onFiltersChange]);

  const handlePriceMinChange = useCallback((value: string) => {
    const selectedMin = value === 'any' ? undefined : Number(value);
    const currentMax = filters.priceMax ?? data.priceRange.max;
    const adjustedMax = selectedMin !== undefined && selectedMin > currentMax ? selectedMin : currentMax;

    onFiltersChange({
      priceMin: selectedMin,
      priceMax: filters.priceMax !== undefined || adjustedMax !== data.priceRange.max ? adjustedMax : undefined,
    });
  }, [filters.priceMax, data.priceRange.max, onFiltersChange]);

  const handlePriceMaxChange = useCallback((value: string) => {
    const selectedMax = value === 'any' ? undefined : Number(value);
    const currentMin = filters.priceMin ?? data.priceRange.min;
    const adjustedMin = selectedMax !== undefined && selectedMax < currentMin ? selectedMax : currentMin;

    onFiltersChange({
      priceMin: filters.priceMin !== undefined || adjustedMin !== data.priceRange.min ? adjustedMin : undefined,
      priceMax: selectedMax,
    });
  }, [filters.priceMin, data.priceRange.min, onFiltersChange]);

  const handleMileageMinChange = useCallback((value: string) => {
    const selectedMin = value === 'any' ? undefined : Number(value);
    const currentMax = filters.mileageMax ?? data.mileageRange.max;
    const adjustedMax = selectedMin !== undefined && selectedMin > currentMax ? selectedMin : currentMax;

    onFiltersChange({
      mileageMin: selectedMin,
      mileageMax: filters.mileageMax !== undefined || adjustedMax !== data.mileageRange.max ? adjustedMax : undefined,
    });
  }, [filters.mileageMax, data.mileageRange.max, onFiltersChange]);

  const handleMileageMaxChange = useCallback((value: string) => {
    const selectedMax = value === 'any' ? undefined : Number(value);
    const currentMin = filters.mileageMin ?? data.mileageRange.min;
    const adjustedMin = selectedMax !== undefined && selectedMax < currentMin ? selectedMax : currentMin;

    onFiltersChange({
      mileageMin: filters.mileageMin !== undefined || adjustedMin !== data.mileageRange.min ? adjustedMin : undefined,
      mileageMax: selectedMax,
    });
  }, [filters.mileageMin, data.mileageRange.min, onFiltersChange]);

  // Get available models based on selected brand
  const availableModels = useMemo(() => {
    if (!filters.brand) return [];
    return data.models.filter(model => model.brandId === filters.brand);
  }, [data.models, filters.brand]);

  // Validate filters
  const validationErrors = useMemo(() => {
    try {
      return validateFilters(filters);
    } catch (error) {
      console.error('Error validating filters:', error);
      return [];
    }
  }, [filters]);
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
        break;
      case 'price':
        onFiltersChange({ priceMin: undefined, priceMax: undefined });
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
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <AdaptiveSelect
                  value={filters.yearMin !== undefined ? filters.yearMin.toString() : 'any'}
                  onValueChange={handleYearMinChange}
                  className="filter-select bg-background"
                  options={[{ value: 'any', label: 'Pa minimum' }, ...yearOptions]}
                  forceNative
                />
                <AdaptiveSelect
                  value={filters.yearMax !== undefined ? filters.yearMax.toString() : 'any'}
                  onValueChange={handleYearMaxChange}
                  className="filter-select bg-background"
                  options={[{ value: 'any', label: 'Pa maksimum' }, ...descendingYearOptions]}
                  forceNative
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {filters.yearMin === undefined && filters.yearMax === undefined
                  ? 'Të gjitha vitet'
                  : `${currentYearRange[0]} - ${currentYearRange[1]}`}
              </p>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Çmimi (€)
              </Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <AdaptiveSelect
                  value={filters.priceMin !== undefined ? filters.priceMin.toString() : 'any'}
                  onValueChange={handlePriceMinChange}
                  className="filter-select bg-background"
                  options={[{ value: 'any', label: 'Pa minimum' }, ...priceOptions]}
                  forceNative
                />
                <AdaptiveSelect
                  value={filters.priceMax !== undefined ? filters.priceMax.toString() : 'any'}
                  onValueChange={handlePriceMaxChange}
                  className="filter-select bg-background"
                  options={[{ value: 'any', label: 'Pa maksimum' }, ...descendingPriceOptions]}
                  forceNative
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {filters.priceMin === undefined && filters.priceMax === undefined
                  ? 'Të gjitha çmimet'
                  : `€${currentPriceRange[0].toLocaleString()} - €${currentPriceRange[1].toLocaleString()}`}
              </p>
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
                options={data.fuelTypes
                  .filter(fuel => fuel.count === undefined || fuel.count > 0)
                  .map((fuel) => ({
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
                options={data.transmissions
                  .filter(transmission => transmission.count === undefined || transmission.count > 0)
                  .map((transmission) => ({
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
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <AdaptiveSelect
                  value={filters.mileageMin !== undefined ? filters.mileageMin.toString() : 'any'}
                  onValueChange={handleMileageMinChange}
                  className="filter-select bg-background"
                  options={[{ value: 'any', label: 'Pa minimum' }, ...mileageOptions]}
                  forceNative
                />
                <AdaptiveSelect
                  value={filters.mileageMax !== undefined ? filters.mileageMax.toString() : 'any'}
                  onValueChange={handleMileageMaxChange}
                  className="filter-select bg-background"
                  options={[{ value: 'any', label: 'Pa maksimum' }, ...descendingMileageOptions]}
                  forceNative
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {filters.mileageMin === undefined && filters.mileageMax === undefined
                  ? 'Të gjitha kilometrat'
                  : `${currentMileageRange[0].toLocaleString()} km - ${currentMileageRange[1].toLocaleString()} km`}
              </p>
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
                options={data.bodyTypes
                  .filter(bodyType => bodyType.count === undefined || bodyType.count > 0)
                  .map((bodyType) => ({
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
                options={data.colors
                  .filter(color => color.count === undefined || color.count > 0)
                  .map((color) => ({
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
                options={data.locations
                  .filter(location => location.count === undefined || location.count > 0)
                  .map((location) => ({
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
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground animate-pulse">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Duke përditësuar filtrat...
        </div>
      )}
    </div>
  );
};

export default FiltersPanel;