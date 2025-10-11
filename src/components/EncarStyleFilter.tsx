import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Cog,
  Gauge,
  Users
} from "lucide-react";
import { COLOR_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS, BODY_TYPE_OPTIONS } from '@/constants/carOptions';
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
  const [expandedSections, setExpandedSections] = useState<string[]>(compact ? ['basic'] : ['basic', 'advanced']);

  // Track if strict filtering mode is enabled - using utility
  const isStrictMode = useMemo(() => isStrictFilterMode(filters), [filters]);

  const updateFilter = useCallback((key: string, value: string) => {
    const actualValue = value === 'all' || value === 'any' ? undefined : value;
    
    setIsLoading(true);
    
    if (key === 'manufacturer_id') {
      onManufacturerChange?.(actualValue || '');
    } else if (key === 'model_id') {
      onModelChange?.(actualValue || '');
    } else {
      const updatedFilters = { ...filters, [key]: actualValue };
      onFiltersChange(updatedFilters);
    }
    
    const timeout = (key === 'from_year' || key === 'to_year') ? 25 : 100;
    setTimeout(() => setIsLoading(false), timeout);
  }, [filters, onFiltersChange, onManufacturerChange, onModelChange]);

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
      window.location.href = `/catalog?${searchParams.toString()}`;
    }
  }, [onSearchCars, isHomepage, filters]);

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

  const sortedManufacturers = useMemo(() => {
    const excludedBrands = ['mitsubishi', 'alfa romeo', 'alfa-romeo', 'acura', 'mazda', 'dongfeng', 'lotus'];
    const sorted = sortManufacturers(manufacturers);
    return sorted.filter(manufacturer => 
      !excludedBrands.includes(manufacturer.name.toLowerCase())
    );
  }, [manufacturers]);

  useEffect(() => {
    if (filters.manufacturer_id && onFetchGrades) {
      const timeoutId = setTimeout(() => {
        setIsLoadingGrades(true);
        onFetchGrades(filters.manufacturer_id, filters.model_id)
          .then(gradesData => {
            if (Array.isArray(gradesData)) {
              setGrades(gradesData);
            }
          })
          .finally(() => {
            setIsLoadingGrades(false);
          });
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setGrades([]);
    }
  }, [filters.manufacturer_id, filters.model_id, onFetchGrades]);

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
      <Card className="glass-panel border-0 rounded-xl p-6 sm:p-8 space-y-4 w-full max-w-md mx-auto shadow-lg">
        <div className="space-y-2">
          <div className="space-y-1 filter-section">
            <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
              <Car className="h-2.5 w-2.5" />
              Marka
            </Label>
            <Select value={filters.manufacturer_id || 'all'} onValueChange={(value) => updateFilter('manufacturer_id', value)}>
              <SelectTrigger className="filter-control h-8 text-xs">
                <SelectValue placeholder="Zgjidhni markën" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px] bg-background">
                {!(isStrictMode && filters.manufacturer_id) && (
                  <SelectItem value="all">Të gjitha markat</SelectItem>
                )}
                {sortedManufacturers.map((manufacturer: Manufacturer) => {
                  const logoUrl = manufacturer.image || `https://auctionsapi.com/images/brands/${manufacturer.name}.svg`;
                  return (
                    <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                      <div className="flex items-center gap-3 py-1.5">
                        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg p-2 flex-shrink-0 border border-border/30 shadow-sm">
                          <img 
                            src={logoUrl} 
                            alt={`${manufacturer.name} logo`} 
                            className="w-full h-full object-contain" 
                            style={{ filter: 'contrast(1.1) brightness(1.05)' }}
                            loading="eager"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const wrapper = target.parentElement;
                              if (wrapper) {
                                wrapper.className = 'w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-md flex items-center justify-center flex-shrink-0';
                                wrapper.innerHTML = `<span class="text-sm font-bold text-primary">${manufacturer.name.charAt(0)}</span>`;
                              }
                            }}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{manufacturer.name}</span>
                          <span className="text-xs text-muted-foreground">{manufacturer.cars_qty || manufacturer.car_count || 0} cars</span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 filter-section">
            <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
              <Settings className="h-2.5 w-2.5" />
              Modeli
            </Label>
            <Select value={filters.model_id || 'all'} onValueChange={(value) => updateFilter('model_id', value)} disabled={!filters.manufacturer_id}>
              <SelectTrigger className="filter-control h-8 text-xs">
                <SelectValue placeholder={filters.manufacturer_id ? "Zgjidhni modelin" : "Zgjidhni markën së pari"} />
              </SelectTrigger>
              <SelectContent>
                {!(isStrictMode && filters.model_id) && (
                  <SelectItem value="all">Të gjithë modelet</SelectItem>
                )}
                {models.filter(model => model.cars_qty && model.cars_qty > 0).map((model) => (
                  <SelectItem key={model.id} value={model.id.toString()}>
                    {model.name} ({model.cars_qty})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  variant={
                    filters.from_year === preset.from.toString() && 
                    filters.to_year === preset.to.toString() 
                      ? "default" 
                      : "outline"
                  }
                  size="sm"
                  className="h-6 px-2 text-xs"
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
                <Select value={filters.from_year || 'all'} onValueChange={(value) => updateFilter('from_year', value)}>
                  <SelectTrigger className="filter-control h-8 text-xs">
                    <SelectValue placeholder="Të gjithë vitet" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Deri</Label>
                <Select value={filters.to_year || 'all'} onValueChange={(value) => updateFilter('to_year', value)}>
                  <SelectTrigger className="filter-control h-8 text-xs">
                    <SelectValue placeholder="Të gjithë vitet" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                value={(filters as any).mileage_from || ''}
                onChange={(e) => updateFilter('mileage_from', e.target.value)}
                className="filter-control h-8 text-xs"
              />
              <Input
                type="number"
                placeholder="Deri"
                value={(filters as any).mileage_to || ''}
                onChange={(e) => updateFilter('mileage_to', e.target.value)}
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
                <div className="space-y-1 filter-section">
                  <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                    <Cog className="h-2.5 w-2.5" />
                    Grada/Motori
                  </Label>
                  <Select value={filters.grade_iaai || 'all'} onValueChange={(value) => updateFilter('grade_iaai', value)} disabled={!filters.manufacturer_id || isLoadingGrades}>
                    <SelectTrigger className="filter-control h-8 text-xs">
                      <SelectValue placeholder={isLoadingGrades ? "Po ngarkon..." : "Zgjidhni gradën"} />
                    </SelectTrigger>
                    <SelectContent>
                      {!(isStrictMode && filters.grade_iaai) && (
                        <SelectItem value="all">Të gjitha gradat</SelectItem>
                      )}
                      {grades.map((grade) => (
                        <SelectItem key={grade.value} value={grade.value}>{grade.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 filter-section">
                  <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                    <Settings className="h-2.5 w-2.5" />
                    Niveli i Trim
                  </Label>
                  <Select value={filters.trim_level || 'all'} onValueChange={(value) => updateFilter('trim_level', value)} disabled={!filters.model_id}>
                    <SelectTrigger className="filter-control h-8 text-xs">
                      <SelectValue placeholder="Zgjidhni trim level" />
                    </SelectTrigger>
                    <SelectContent>
                      {!(isStrictMode && filters.trim_level) && (
                        <SelectItem value="all">Të gjithë nivelet</SelectItem>
                      )}
                      {trimLevels.map((trim) => (
                        <SelectItem key={trim.value} value={trim.value}>{trim.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 filter-section">
                   <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                     <Palette className="h-2.5 w-2.5" />
                     Ngjyra
                   </Label>
                   <Select value={filters.color || 'all'} onValueChange={(value) => updateFilter('color', value)}>
                     <SelectTrigger className="filter-control h-8 text-xs">
                       <SelectValue placeholder="Çdo ngjyrë" />
                     </SelectTrigger>
                     <SelectContent>
                       {!(isStrictMode && filters.color) && (
                         <SelectItem value="all">Çdo ngjyrë</SelectItem>
                       )}
                       {Object.entries(COLOR_OPTIONS).map(([name, id]) => (
                         <SelectItem key={id} value={id.toString()}>
                           {name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>

                 <div className="space-y-1 filter-section">
                   <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                     <Fuel className="h-2.5 w-2.5" />
                     Lloji i karburantit
                   </Label>
                   <Select value={filters.fuel_type || 'all'} onValueChange={(value) => updateFilter('fuel_type', value)}>
                     <SelectTrigger className="filter-control h-8 text-xs">
                       <SelectValue placeholder="Çdo lloj" />
                     </SelectTrigger>
                     <SelectContent>
                       {!(isStrictMode && filters.fuel_type) && (
                         <SelectItem value="all">Çdo lloj</SelectItem>
                       )}
                       {Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => (
                         <SelectItem key={id} value={id.toString()}>
                           {name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>

                 <div className="space-y-1 filter-section">
                   <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                     <Settings className="h-2.5 w-2.5" />
                     Transmisioni
                   </Label>
                   <Select value={filters.transmission || 'all'} onValueChange={(value) => updateFilter('transmission', value)}>
                     <SelectTrigger className="filter-control h-8 text-xs">
                       <SelectValue placeholder="Çdo transmision" />
                     </SelectTrigger>
                     <SelectContent>
                       {!(isStrictMode && filters.transmission) && (
                         <SelectItem value="all">Çdo transmision</SelectItem>
                       )}
                       {Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => (
                         <SelectItem key={id} value={id.toString()}>
                           {name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>

                  <div className="space-y-1 filter-section">
                    <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                      <Car className="h-2.5 w-2.5" />
                      Lloji i trupit
                    </Label>
                    <Select value={filters.body_type || 'all'} onValueChange={(value) => updateFilter('body_type', value)}>
                      <SelectTrigger className="filter-control h-8 text-xs">
                        <SelectValue placeholder="Çdo lloj" />
                      </SelectTrigger>
                      <SelectContent>
                        {!(isStrictMode && filters.body_type) && (
                          <SelectItem value="all">Çdo lloj</SelectItem>
                        )}
                        {Object.entries(BODY_TYPE_OPTIONS).map(([name, id]) => (
                          <SelectItem key={id} value={id.toString()}>
                            {name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 filter-section">
                    <Label className="filter-label text-xs font-medium flex items-center gap-1.5">
                      <Users className="h-2.5 w-2.5" />
                      Numri i ulëseve
                    </Label>
                    <Select value={filters.seats_count || 'all'} onValueChange={(value) => updateFilter('seats_count', value)}>
                      <SelectTrigger className="filter-control h-8 text-xs">
                        <SelectValue placeholder="Çdo numër" />
                      </SelectTrigger>
                      <SelectContent>
                        {!(isStrictMode && filters.seats_count) && (
                          <SelectItem value="all">Çdo numër</SelectItem>
                        )}
                        {[2, 4, 5, 6, 7, 8].map((seats) => (
                          <SelectItem key={seats} value={seats.toString()}>{seats} ulëse</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t">
          <Button
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
    <Card className="glass-panel p-4 space-y-4 border-0 rounded-xl">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-lg border border-white/10 dark:border-white/5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Marka</Label>
              <Select value={filters.manufacturer_id || 'all'} onValueChange={(value) => updateFilter('manufacturer_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidhni markën" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px] bg-background">
                  {!(isStrictMode && filters.manufacturer_id) && (
                    <SelectItem value="all">Të gjitha Markat</SelectItem>
                  )}
                  {sortedManufacturers.map((manufacturer: Manufacturer) => {
                    const logoUrl = manufacturer.image || `https://auctionsapi.com/images/brands/${manufacturer.name}.svg`;
                    return (
                      <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                        <div className="flex items-center gap-3 py-1.5">
                          <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg p-2 flex-shrink-0 border border-border/30 shadow-sm">
                            <img 
                              src={logoUrl} 
                              alt={`${manufacturer.name} logo`} 
                              className="w-full h-full object-contain" 
                              style={{ filter: 'contrast(1.1) brightness(1.05)' }}
                              loading="eager"
                              onError={(e) => {
                                const target = e.currentTarget;
                                const wrapper = target.parentElement;
                                if (wrapper) {
                                  wrapper.className = 'w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-md flex items-center justify-center flex-shrink-0';
                                  wrapper.innerHTML = `<span class="text-sm font-bold text-primary">${manufacturer.name.charAt(0)}</span>`;
                                }
                              }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{manufacturer.name}</span>
                            <span className="text-xs text-muted-foreground">{manufacturer.cars_qty || manufacturer.car_count || 0} cars</span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Modeli</Label>
              <Select value={filters.model_id || 'all'} onValueChange={(value) => updateFilter('model_id', value)} disabled={!filters.manufacturer_id}>
                <SelectTrigger>
                  <SelectValue placeholder={filters.manufacturer_id ? "Zgjidhni modelin" : "Zgjidhni markën së pari"} />
                </SelectTrigger>
                <SelectContent>
                  {!(isStrictMode && filters.model_id) && (
                    <SelectItem value="all">Të gjithë Modelet</SelectItem>
                  )}
                  {models.filter(model => model.cars_qty && model.cars_qty > 0).map((model) => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      {model.name} ({model.cars_qty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="space-y-4 p-3 bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-lg border border-white/10 dark:border-white/5">
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

                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground mb-2 block">Custom Year Range:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">From Year</Label>
                      <Select value={filters.from_year || 'all'} onValueChange={(value) => updateFilter('from_year', value)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All years" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">To Year</Label>
                      <Select value={filters.to_year || 'all'} onValueChange={(value) => updateFilter('to_year', value)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All years" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

               <div className="space-y-2">
                 <Label className="text-sm font-medium flex items-center gap-2">
                   <Cog className="h-3 w-3" />
                   Grada/Motori
                 </Label>
                 <Select value={filters.grade_iaai || 'all'} onValueChange={(value) => updateFilter('grade_iaai', value)} disabled={!filters.manufacturer_id || isLoadingGrades}>
                   <SelectTrigger>
                     <SelectValue placeholder={isLoadingGrades ? "Po ngarkon..." : "Zgjidhni gradën"} />
                   </SelectTrigger>
                   <SelectContent>
                     {!(isStrictMode && filters.grade_iaai) && (
                       <SelectItem value="all">Të gjitha gradat</SelectItem>
                     )}
                     {grades.map((grade) => (
                       <SelectItem key={grade.value} value={grade.value}>{grade.label}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
            </div>

            {/* Color, Fuel, Transmission, Body Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-3 w-3" />
                  Ngjyra
                </Label>
                <Select value={filters.color || 'all'} onValueChange={(value) => updateFilter('color', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Çdo ngjyrë" />
                  </SelectTrigger>
                  <SelectContent>
                    {!(isStrictMode && filters.color) && (
                      <SelectItem value="all">Çdo ngjyrë</SelectItem>
                    )}
                    {Object.entries(COLOR_OPTIONS).map(([name, id]) => (
                      <SelectItem key={id} value={id.toString()}>
                        {name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Fuel className="h-3 w-3" />
                  Karburanti
                </Label>
                <Select value={filters.fuel_type || 'all'} onValueChange={(value) => updateFilter('fuel_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Çdo lloj" />
                  </SelectTrigger>
                  <SelectContent>
                    {!(isStrictMode && filters.fuel_type) && (
                      <SelectItem value="all">Çdo lloj</SelectItem>
                    )}
                    {Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => (
                      <SelectItem key={id} value={id.toString()}>
                        {name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  Transmisioni
                </Label>
                <Select value={filters.transmission || 'all'} onValueChange={(value) => updateFilter('transmission', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Çdo transmision" />
                  </SelectTrigger>
                  <SelectContent>
                    {!(isStrictMode && filters.transmission) && (
                      <SelectItem value="all">Çdo transmision</SelectItem>
                    )}
                    {Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => (
                      <SelectItem key={id} value={id.toString()}>
                        {name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Car className="h-3 w-3" />
                  Lloji i trupit
                </Label>
                <Select value={filters.body_type || 'all'} onValueChange={(value) => updateFilter('body_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Çdo lloj" />
                  </SelectTrigger>
                  <SelectContent>
                    {!(isStrictMode && filters.body_type) && (
                      <SelectItem value="all">Çdo lloj</SelectItem>
                    )}
                    {Object.entries(BODY_TYPE_OPTIONS).map(([name, id]) => (
                      <SelectItem key={id} value={id.toString()}>
                        {name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
