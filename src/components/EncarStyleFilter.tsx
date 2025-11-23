import React, { useState, memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
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
  Gauge,
  Users
} from "lucide-react";
import { COLOR_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS, BODY_TYPE_OPTIONS } from '@/constants/carOptions';
// import { useGrades } from "@/hooks/useFiltersData"; // Removed usage
import {
  APIFilters,
  sortManufacturers,
  generateYearRange,
  generateYearPresets,
  isStrictFilterMode
} from '@/utils/catalog-filter';
import { sortBrandsWithPriority } from '@/utils/brandOrdering';
import { formatModelName } from '@/utils/modelNameFormatter';
import { safeToLowerCase } from "@/utils/safeStringOps";

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
  engineVariants?: Array<{ value: string; label: string; count: number }>;
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
  onFetchGenerations?: (modelId?: string) => Promise<{ id: number; name: string; cars_qty?: number }[]>;
  onFetchTrimLevels?: (manufacturerId?: string, modelId?: string) => Promise<{ value: string; label: string; count?: number }[]>;
  onFetchEngines?: (manufacturerId?: string, modelId?: string, generationId?: string) => Promise<{ value: string; label: string; count?: number }[]>;
  isHomepage?: boolean;
  compact?: boolean;
  onSearchCars?: () => void;
  onCloseFilter?: () => void;
  className?: string;
}

const EncarStyleFilter = memo<EncarStyleFilterProps>(({
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
  onGenerationChange,
  showAdvanced = false,
  onToggleAdvanced,
  onFetchGrades,
  onFetchGenerations,
  onFetchTrimLevels,
  onFetchEngines,
  isHomepage = false,
  compact = false,
  onSearchCars,
  onCloseFilter,
  className
}) => {
  const navigate = useNavigate();
  const [trimLevels, setTrimLevels] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [engineOptions, setEngineOptions] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadingTimerRef = useRef<number | null>(null);

  const [generations, setGenerations] = useState<{ id: number; name: string; cars_qty?: number }[]>([]);
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(false);

  const [grades, setGrades] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);

  // Fetch generations when model changes
  useEffect(() => {
    if (filters.model_id && onFetchGenerations) {
      setIsLoadingGenerations(true);
      const timeoutId = setTimeout(() => {
        onFetchGenerations(filters.model_id)
          .then(generationData => {
            if (Array.isArray(generationData)) {
              setGenerations(generationData);
            }
          })
          .finally(() => setIsLoadingGenerations(false));
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setGenerations([]);
      setIsLoadingGenerations(false);
    }
  }, [filters.model_id, onFetchGenerations]);

  // Fetch grades (variants) when model or generation changes
  useEffect(() => {
    if (filters.manufacturer_id && filters.model_id && onFetchGrades) {
      setIsLoadingGrades(true);
      const timeoutId = setTimeout(() => {
        onFetchGrades(filters.manufacturer_id, filters.model_id, filters.generation_id)
          .then(gradeData => {
            if (Array.isArray(gradeData)) {
              setGrades(gradeData);
            }
          })
          .finally(() => setIsLoadingGrades(false));
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setGrades([]);
      setIsLoadingGrades(false);
    }
  }, [filters.manufacturer_id, filters.model_id, filters.generation_id, onFetchGrades]);

  // Show loading only if the update actually takes longer than a threshold to avoid flicker.
  const startLoadingWithDelay = useCallback((delayMs: number = 180) => {
    if (loadingTimerRef.current) {
      window.clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    loadingTimerRef.current = window.setTimeout(() => {
      setIsLoading(true);
    }, delayMs);
  }, []);

  const stopLoading = useCallback(() => {
    if (loadingTimerRef.current) {
      window.clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const [expandedSections, setExpandedSections] = useState<string[]>(compact ? ['basic'] : ['basic', 'advanced']);

  // Track if strict filtering mode is enabled - using utility
  const isStrictMode = useMemo(() => isStrictFilterMode(filters), [filters]);

  const updateFilter = useCallback((key: string, value: string) => {
    const actualValue = value === 'all' || value === 'any' ? undefined : value;

    // Instant response - no loading delays
    if (key === 'manufacturer_id') {
      // Reset model, generation, grade, and engine when manufacturer changes
      onFiltersChange({ ...filters, manufacturer_id: actualValue, model_id: undefined, generation_id: undefined, grade_iaai: undefined, engine_spec: undefined });
      onManufacturerChange?.(actualValue || '');
    } else if (key === 'model_id') {
      // Reset generation, grade and engine when model changes
      onFiltersChange({ ...filters, model_id: actualValue, generation_id: undefined, grade_iaai: undefined, engine_spec: undefined });
      onModelChange?.(actualValue || '');
    } else if (key === 'generation_id') {
      // Reset grade when generation changes
      onFiltersChange({ ...filters, generation_id: actualValue, grade_iaai: undefined });
      onGenerationChange?.(actualValue || '');
    } else {
      const updatedFilters = { ...filters, [key]: actualValue };
      onFiltersChange(updatedFilters);
    }
  }, [filters, onFiltersChange, onManufacturerChange, onModelChange, onGenerationChange]);

  const handleSearchClick = useCallback(() => {
    if (onSearchCars) {
      onSearchCars();
    } else if (isHomepage) {
      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          searchParams.set(key, value);
        }
      });
      navigate(`/catalog?${searchParams.toString()}`);
    }
  }, [onSearchCars, isHomepage, filters, navigate]);

  const handleYearRangePreset = useCallback((preset: { label: string; from: number; to: number }) => {
    const updatedFilters = {
      ...filters,
      from_year: preset.from.toString(),
      to_year: preset.to.toString()
    };
    onFiltersChange(updatedFilters);
  }, [filters, onFiltersChange]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const years = useMemo(() => generateYearRange(currentYear), [currentYear]);
  const yearRangePresets = useMemo(() => generateYearPresets(currentYear), [currentYear]);

  const yearOptions = useMemo(() => [
    ...(isStrictMode && (filters.from_year || filters.to_year) ? [] : [{ value: 'all', label: 'Të gjithë vitet' }]),
    ...years.map(year => ({
      value: year.toString(),
      label: year.toString()
    }))
  ], [years, isStrictMode, filters.from_year, filters.to_year]);

  const { sorted: prioritizedManufacturers, priorityCount: prioritizedManufacturerCount } = useMemo(() => {
    const excludedBrands = ['mitsubishi', 'alfa romeo', 'alfa-romeo', 'acura', 'mazda', 'dongfeng', 'lotus'];
    const baseList = sortManufacturers(manufacturers).filter(manufacturer =>
      !excludedBrands.includes(safeToLowerCase(manufacturer.name))
    );
    return sortBrandsWithPriority(baseList);
  }, [manufacturers]);

  const manufacturerOptions = useMemo(() => {
    const options = prioritizedManufacturers
      .filter((manufacturer: Manufacturer) => {
        const count = manufacturer.cars_qty || manufacturer.car_count || 0;
        // Show if count > 0 OR if count data hasn't loaded yet (undefined)
        const shouldShow = count > 0 || (manufacturer.cars_qty === undefined && manufacturer.car_count === undefined);
        return shouldShow;
      })
      .map((manufacturer: Manufacturer) => {
        const logoUrl = manufacturer.image || `https://auctionsapi.com/images/brands/${manufacturer.name}.svg`;
        const count = manufacturer.cars_qty || manufacturer.car_count || 0;

        return {
          value: manufacturer.id.toString(),
          label: `${manufacturer.name}${count > 0 ? ` (${count})` : ''}`,
          icon: logoUrl
        };
      });

    if (prioritizedManufacturerCount > 0 && prioritizedManufacturerCount < options.length) {
      return [
        ...options.slice(0, prioritizedManufacturerCount),
        { value: 'separator-priority-brands', label: 'Të tjerët', disabled: true },
        ...options.slice(prioritizedManufacturerCount)
      ];
    }

    return options;
  }, [prioritizedManufacturers, prioritizedManufacturerCount]);

  const manufacturerSelectOptions = useMemo(() => {
    if (!(isStrictMode && filters.manufacturer_id)) {
      return [{ value: 'all', label: 'Të gjitha markat' }, ...manufacturerOptions];
    }
    return manufacturerOptions;
  }, [isStrictMode, filters.manufacturer_id, manufacturerOptions]);

  const modelSelectOptions = useMemo(() => {
    const modelsList = models || [];

    const scopedModels = filters.manufacturer_id
      ? modelsList.filter(model => {
        const manufacturerId = (model as any).manufacturer_id;
        return manufacturerId ? manufacturerId.toString() === filters.manufacturer_id : true;
      })
      : modelsList;

    const enabledModels = scopedModels.filter(model => (model.cars_qty || model.car_count || 0) > 0);

    const mappedModels = enabledModels.map(model => {
      const selectedManufacturer = manufacturers.find(m => m.id.toString() === filters.manufacturer_id);
      const formattedModelName = formatModelName(model.name, selectedManufacturer?.name);

      const carCount = model.cars_qty ?? model.car_count ?? 0;
      const countLabel = carCount > 0 ? ` (${carCount})` : '';

      return {
        value: model.id.toString(),
        label: `${formattedModelName}${countLabel}`
      };
    });

    if (!(isStrictMode && filters.model_id)) {
      return [{ value: 'all', label: 'Të gjithë modelet' }, ...mappedModels];
    }

    return mappedModels;
  }, [filters.manufacturer_id, filters.model_id, isStrictMode, manufacturers, models]);

  // Grades are now fetched automatically via useGrades hook

  useEffect(() => {
    if (filters.manufacturer_id && filters.model_id && onFetchTrimLevels) {
      const timeoutId = setTimeout(() => {
        onFetchTrimLevels(filters.manufacturer_id, filters.model_id)
          .then(trimData => {
            if (Array.isArray(trimData)) {
              setTrimLevels(trimData);
            }
          });
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setTrimLevels([]);
    }
  }, [filters.manufacturer_id, filters.model_id, onFetchTrimLevels]);

  // Fetch engines when model changes
  useEffect(() => {
    if (filters.manufacturer_id && filters.model_id && onFetchEngines) {
      const timeoutId = setTimeout(() => {
        onFetchEngines(filters.manufacturer_id, filters.model_id)
          .then(engineData => {
            if (Array.isArray(engineData)) {
              setEngineOptions(engineData);
            }
          });
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setEngineOptions([]);
    }
  }, [filters.manufacturer_id, filters.model_id, onFetchEngines]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Compact mode for sidebar
  if (compact) {
    console.log('EncarStyleFilter compact mode:', {
      manufacturersCount: manufacturers.length,
      modelsCount: models.length,
      hasFilters: !!filters,
      filterKeys: Object.keys(filters)
    });
    return (
      <Card className={cn("relative border-0 rounded-2xl p-4 sm:p-8 space-y-3 sm:space-y-5 w-full max-w-md mx-auto backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 shadow-2xl shadow-gray-200/50 dark:shadow-black/50 ring-1 ring-gray-200/50 dark:ring-white/10", className)}>
        <div className="space-y-4 text-foreground min-h-[400px] bg-white dark:bg-gray-900">
          <div className="space-y-1 filter-section bg-background/50 p-2 rounded-md border border-border/20">
            <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
              <Car className="h-2.5 w-2.5" />
              Marka
            </Label>
            <div className="h-4">
              {loadingCounts && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  <span className="animate-pulse">Updating...</span>
                </span>
              )}
            </div>
            <AdaptiveSelect
              value={filters.manufacturer_id || 'all'}
              onValueChange={(value) => updateFilter('manufacturer_id', value)}
              placeholder="Zgjidhni markën"
              className="filter-control h-8 text-xs"
              options={manufacturerSelectOptions}
              forceNative
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
              options={modelSelectOptions}
              forceNative
            />
          </div>

          {/* Year presets */}
          <div className="space-y-1 filter-section">
            <Label className="filter-label text-xs text-muted-foreground flex items-center gap-1">
              Gamë vjetëshe:
              <span className="text-xs text-primary bg-primary/10 px-1 rounded">⚡</span>
            </Label>
            <div className="year-buttons flex flex-wrap gap-1">
              {yearRangePresets.slice(0, 4).map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant={
                    filters.from_year === preset.from.toString() &&
                      filters.to_year === preset.to.toString()
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="h-6 px-1.5 text-[10px]"
                  onClick={() => handleYearRangePreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Year range dropdowns */}
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
                  className="filter-control h-8 text-xs"
                  placeholder="Të gjithë vitet"
                  options={yearOptions}
                  forceNative
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Deri</Label>
                <AdaptiveSelect
                  value={filters.to_year || 'all'}
                  onValueChange={(value) => updateFilter('to_year', value)}
                  className="filter-control h-8 text-xs"
                  placeholder="Të gjithë vitet"
                  options={yearOptions}
                  forceNative
                />
              </div>
            </div>
          </div>

          {/* Mileage */}
          <div className="space-y-1 filter-section">
            <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
              <Gauge className="h-2.5 w-2.5" />
              Kilometrazha (KM)
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              <Input
                type="number"
                placeholder="Nga"
                value={(filters as any).odometer_from_km || (filters as any).mileage_from || ''}
                onChange={(e) => updateFilter('odometer_from_km', e.target.value)}
                className="filter-control h-8 text-xs"
              />
              <Input
                type="number"
                placeholder="Deri"
                value={(filters as any).odometer_to_km || (filters as any).mileage_to || ''}
                onChange={(e) => updateFilter('odometer_to_km', e.target.value)}
                className="filter-control h-8 text-xs"
              />
            </div>
          </div>

          {/* Price */}
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

          <Button
            type="button"
            variant="ghost"
            onClick={() => toggleSection('more')}
            className="w-full justify-between text-xs h-7"
          >
            Më Shumë Filtra
            {expandedSections.includes('more') ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          {expandedSections.includes('more') && (
            <div className="space-y-2 pt-2 border-t">
              <div className="space-y-2">
                <div className="space-y-1 filter-section" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                    <Cog className="h-2.5 w-2.5" />
                    Gjenerata
                  </Label>
                  <AdaptiveSelect
                    value={filters.grade_iaai || 'all'}
                    onValueChange={(value) => updateFilter('grade_iaai', value)}
                    disabled={!filters.model_id || isLoadingGrades}
                    placeholder={!filters.manufacturer_id ? "Select brand first" : !filters.model_id ? "Select model first" : isLoadingGrades ? "Loading..." : "Select generation"}
                    className="filter-control h-8 text-xs"
                    options={[
                      ...(!(isStrictMode && filters.grade_iaai) ? [{ value: 'all', label: 'Të gjitha gjeneratat' }] : []),
                      ...grades.map((grade) => ({
                        value: grade.value,
                        label: `${grade.label}${grade.count ? ` (${grade.count})` : ''}`
                      }))
                    ]}
                    forceNative
                  />
                </div>

                <div className="space-y-1 filter-section" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                    <Settings className="h-2.5 w-2.5" />
                    Motori
                  </Label>
                  <AdaptiveSelect
                    value={(filters as any).engine_spec || 'all'}
                    onValueChange={(value) => updateFilter('engine_spec', value)}
                    disabled={!filters.model_id}
                    placeholder={!filters.manufacturer_id ? "Select brand first" : !filters.model_id ? "Select model first" : "Select engine"}
                    className="filter-control h-8 text-xs"
                    options={[
                      ...(!(isStrictMode && (filters as any).engine_spec) ? [{ value: 'all', label: 'Të gjithë motorët' }] : []),
                      ...(engineOptions && engineOptions.length > 0
                        ? engineOptions.map((engine) => ({ value: engine.value, label: engine.label }))
                        : filters.model_id
                          ? [{ value: 'no-engines', label: 'Nuk u gjetën motorë', disabled: true }]
                          : [{ value: 'loading', label: 'Zgjidhni modelin së pari', disabled: true }])
                    ]}
                    forceNative
                  />
                </div>

                <div className="space-y-1 filter-section" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                    <Settings className="h-2.5 w-2.5" />
                    Niveli i Trim
                  </Label>
                  <AdaptiveSelect
                    value={filters.trim_level || 'all'}
                    onValueChange={(value) => updateFilter('trim_level', value)}
                    disabled={!filters.model_id}
                    placeholder="Zgjidhni trim level"
                    className="filter-control h-8 text-xs"
                    options={[
                      ...(!(isStrictMode && filters.trim_level) ? [{ value: 'all', label: 'Të gjithë nivelet' }] : []),
                      ...trimLevels.map((trim) => ({ value: trim.value, label: trim.label }))
                    ]}
                    forceNative
                  />
                </div>

                <div className="space-y-1 filter-section" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
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
                      ...(!(isStrictMode && filters.color) ? [{ value: 'all', label: 'Çdo ngjyrë' }] : []),
                      ...Object.entries(COLOR_OPTIONS).map(([name, id]) => ({
                        value: id.toString(),
                        label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                      }))
                    ]}
                    forceNative
                  />
                </div>

                <div className="space-y-1 filter-section" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                    <Fuel className="h-2.5 w-2.5" />
                    Lloji i karburantit
                  </Label>
                  <AdaptiveSelect
                    value={filters.fuel_type || 'all'}
                    onValueChange={(value) => updateFilter('fuel_type', value)}
                    placeholder="Çdo lloj"
                    className="filter-control h-8 text-xs"
                    options={[
                      ...(!(isStrictMode && filters.fuel_type) ? [{ value: 'all', label: 'Çdo lloj' }] : []),
                      ...Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => ({
                        value: id.toString(),
                        label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                      }))
                    ]}
                    forceNative
                  />
                </div>

                <div className="space-y-1 filter-section" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                    <Settings className="h-2.5 w-2.5" />
                    Transmisioni
                  </Label>
                  <AdaptiveSelect
                    value={filters.transmission || 'all'}
                    onValueChange={(value) => updateFilter('transmission', value)}
                    placeholder="Çdo transmision"
                    className="filter-control h-8 text-xs"
                    options={[
                      ...(!(isStrictMode && filters.transmission) ? [{ value: 'all', label: 'Çdo transmision' }] : []),
                      ...Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => ({
                        value: id.toString(),
                        label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                      }))
                    ]}
                    forceNative
                  />
                </div>

                <div className="space-y-1 filter-section" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                    <Car className="h-2.5 w-2.5" />
                    Lloji i trupit
                  </Label>
                  <AdaptiveSelect
                    value={filters.body_type || 'all'}
                    onValueChange={(value) => updateFilter('body_type', value)}
                    placeholder="Çdo lloj"
                    className="filter-control h-8 text-xs"
                    options={[
                      ...(!(isStrictMode && filters.body_type) ? [{ value: 'all', label: 'Çdo lloj' }] : []),
                      ...Object.entries(BODY_TYPE_OPTIONS).map(([name, id]) => ({
                        value: id.toString(),
                        label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                      }))
                    ]}
                    forceNative
                  />
                </div>

                <div className="space-y-1 filter-section" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                    <Users className="h-2.5 w-2.5" />
                    Numri i ulëseve
                  </Label>
                  <AdaptiveSelect
                    value={filters.seats_count || 'all'}
                    onValueChange={(value) => updateFilter('seats_count', value)}
                    placeholder="Çdo numër"
                    className="filter-control h-8 text-xs"
                    options={[
                      ...(!(isStrictMode && filters.seats_count) ? [{ value: 'all', label: 'Çdo numër' }] : []),
                      ...[2, 4, 5, 6, 7, 8].map((seats) => ({
                        value: seats.toString(),
                        label: `${seats} ulëse`
                      }))
                    ]}
                    forceNative
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t">
          <Button
            type="button"
            onClick={() => {
              handleSearchClick();
              // Close filter panel on mobile
              if (onCloseFilter) {
                onCloseFilter();
              }
            }}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <Search className="h-5 w-5 mr-2" />
            {isHomepage ? 'Kërko Makinat' : 'Apliko Filtrat'}
          </Button>
        </div>
      </Card>
    );
  }

  // Catalog style - expanded with sections
  return (
    <Card className={cn("relative border-0 rounded-2xl p-5 space-y-5 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 shadow-xl shadow-gray-200/30 dark:shadow-black/30 ring-1 ring-gray-200/50 dark:ring-white/10", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Filtrat e Kërkimit</h3>
        </div>
        <Button
          type="button"
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
          type="button"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-800/60 dark:to-gray-800/30 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-white/10 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Marka</Label>
                <span
                  className={`inline-flex h-4 items-center gap-1.5 text-[10px] text-muted-foreground transition-opacity duration-200 ${loadingCounts ? 'opacity-100' : 'opacity-0 invisible'}`}
                >
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  <span className="font-medium">Updating...</span>
                </span>
              </div>
              <AdaptiveSelect
                value={filters.manufacturer_id || 'all'}
                onValueChange={(value) => updateFilter('manufacturer_id', value)}
                placeholder="Zgjidhni markën"
                className="filter-control"
                options={manufacturerSelectOptions}
                forceNative
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Modeli</Label>
              <AdaptiveSelect
                value={filters.model_id || 'all'}
                onValueChange={(value) => updateFilter('model_id', value)}
                disabled={!filters.manufacturer_id}
                placeholder={filters.manufacturer_id ? "Zgjidhni modelin" : "Zgjidhni markën së pari"}
                className="filter-control h-8 text-xs"
                options={modelSelectOptions}
                forceNative
              />
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters Section */}
      <div className="space-y-3">
        <Button
          type="button"
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
          <div className="space-y-4 p-4 bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-800/60 dark:to-gray-800/30 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-white/10 shadow-sm">
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

                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground mb-2 block">Vitet:</Label>
                  <div className="flex flex-wrap gap-1">
                    {yearRangePresets.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant={
                          filters.from_year === preset.from.toString() &&
                            filters.to_year === preset.to.toString()
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="h-6 px-1.5 text-[10px]"
                        onClick={() => handleYearRangePreset(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                    {(filters.from_year || filters.to_year) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-1.5 text-[10px] text-muted-foreground"
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

                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground mb-2 block">Custom Year Range:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">From Year</Label>
                      <AdaptiveSelect
                        value={filters.from_year || 'all'}
                        onValueChange={(value) => updateFilter('from_year', value)}
                        className="h-8 text-xs"
                        placeholder="All years"
                        options={yearOptions}
                        forceNative
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">To Year</Label>
                      <AdaptiveSelect
                        value={filters.to_year || 'all'}
                        onValueChange={(value) => updateFilter('to_year', value)}
                        className="h-8 text-xs"
                        placeholder="All years"
                        options={yearOptions}
                        forceNative
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  Motori
                </Label>
                <AdaptiveSelect
                  value={(filters as any).engine_spec || 'all'}
                  onValueChange={(value) => updateFilter('engine_spec', value)}
                  disabled={!filters.model_id}
                  placeholder={!filters.manufacturer_id ? "Select brand first" : !filters.model_id ? "Select model first" : "Select engine"}
                  options={[
                    ...(!(isStrictMode && (filters as any).engine_spec) ? [{ value: 'all', label: 'Të gjithë motorët' }] : []),
                    ...(engineOptions && engineOptions.length > 0
                      ? engineOptions.map((engine) => ({ value: engine.value, label: engine.label }))
                      : filters.model_id
                        ? [{ value: 'no-engines', label: 'Nuk u gjetën motorë', disabled: true }]
                        : [{ value: 'loading', label: 'Zgjidhni modelin së pari', disabled: true }])
                  ]}
                  forceNative
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
                    ...(!(isStrictMode && filters.color) ? [{ value: 'all', label: 'Çdo ngjyrë' }] : []),
                    ...Object.entries(COLOR_OPTIONS).map(([name, id]) => ({
                      value: id.toString(),
                      label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                    }))
                  ]}
                  forceNative
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
                  placeholder="Çdo lloj"
                  options={[
                    ...(!(isStrictMode && filters.fuel_type) ? [{ value: 'all', label: 'Çdo lloj' }] : []),
                    ...Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => ({
                      value: id.toString(),
                      label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                    }))
                  ]}
                  forceNative
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
                  placeholder="Çdo transmision"
                  options={[
                    ...(!(isStrictMode && filters.transmission) ? [{ value: 'all', label: 'Çdo transmision' }] : []),
                    ...Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => ({
                      value: id.toString(),
                      label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                    }))
                  ]}
                  forceNative
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Car className="h-3 w-3" />
                  Lloji i trupit
                </Label>
                <AdaptiveSelect
                  value={filters.body_type || 'all'}
                  onValueChange={(value) => updateFilter('body_type', value)}
                  placeholder="Çdo lloj"
                  options={[
                    ...(!(isStrictMode && filters.body_type) ? [{ value: 'all', label: 'Çdo lloj' }] : []),
                    ...Object.entries(BODY_TYPE_OPTIONS).map(([name, id]) => ({
                      value: id.toString(),
                      label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                    }))
                  ]}
                  forceNative
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
