import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Sparkles,
  Clock,
  Target
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

interface ModernFilterInterfaceProps {
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
  enableManualSearch?: boolean;
  onManualSearch?: () => void;
  isCompact?: boolean;
}

const ModernFilterInterface = memo<ModernFilterInterfaceProps>(({
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
  enableManualSearch = false,
  onManualSearch,
  isCompact = false
}) => {
  const [grades, setGrades] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['primary']);
  
  // Local state for pending filters when manual search is enabled
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [hasChanges, setHasChanges] = useState(false);

  const updateFilter = useCallback((key: string, value: string) => {
    const actualValue = value === 'all' || value === 'any' ? undefined : value;
    
    if (enableManualSearch) {
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
        onManualSearch();
        setHasChanges(false);
      } else {
        setIsLoading(true);
        onFiltersChange(pendingFilters);
        setHasChanges(false);
        setTimeout(() => setIsLoading(false), 100);
      }
    } else if (onManualSearch && !enableManualSearch) {
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
  
  // Enhanced year range presets
  const yearRangePresets = useMemo(() => [
    { label: '2024+', from: 2024, to: currentYear },
    { label: '2023+', from: 2023, to: currentYear },
    { label: '2020+', from: 2020, to: currentYear },
    { label: '2018+', from: 2018, to: currentYear },
    { label: '2015+', from: 2015, to: currentYear },
    { label: '2010+', from: 2010, to: currentYear }
  ], [currentYear]);

  // Smart manufacturer categorization and sorting
  const sortedManufacturers = useMemo(() => {
    const categories = {
      premium: {
        name: 'Premium German',
        brands: ['BMW', 'Mercedes-Benz', 'Audi', 'Porsche'],
        priority: 1,
        icon: '🇩🇪'
      },
      german: {
        name: 'German',
        brands: ['Volkswagen', 'Opel'],
        priority: 2,
        icon: '🇩🇪'
      },
      korean: {
        name: 'Korean', 
        brands: ['Hyundai', 'Kia', 'Genesis'],
        priority: 3,
        icon: '🇰🇷'
      },
      japanese: {
        name: 'Japanese',
        brands: ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Lexus', 'Infiniti', 'Acura', 'Mitsubishi'],
        priority: 4,
        icon: '🇯🇵'
      },
      american: {
        name: 'American',
        brands: ['Ford', 'Chevrolet', 'Cadillac', 'GMC', 'Tesla', 'Chrysler', 'Jeep', 'Dodge'],
        priority: 5,
        icon: '🇺🇸'
      },
      luxury: {
        name: 'Luxury',
        brands: ['Land Rover', 'Jaguar', 'Volvo', 'Ferrari', 'Lamborghini', 'Maserati', 'Bentley', 'Rolls-Royce', 'Aston Martin', 'McLaren', 'Mini'],
        priority: 6,
        icon: '💎'
      }
    };

    return manufacturers
      .filter(m => m.cars_qty && m.cars_qty > 0)
      .sort((a, b) => {
        // Find category priorities
        let aCategoryPriority = 999;
        let bCategoryPriority = 999;
        
        Object.values(categories).forEach(category => {
          if (category.brands.includes(a.name)) {
            aCategoryPriority = category.priority;
          }
          if (category.brands.includes(b.name)) {
            bCategoryPriority = category.priority;
          }
        });
        
        // Sort by category priority first
        if (aCategoryPriority !== bCategoryPriority) {
          return aCategoryPriority - bCategoryPriority;
        }
        
        // Within same category, sort by car count (descending)
        const aCount = a.cars_qty || 0;
        const bCount = b.cars_qty || 0;
        if (aCount !== bCount) {
          return bCount - aCount;
        }
        
        // Finally, alphabetical
        return a.name.localeCompare(b.name);
      });
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

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== '' && value !== null).length;
  };

  const canProceed = filters.manufacturer_id && filters.model_id;

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-background via-background/95 to-background/90 border border-border/50 rounded-xl backdrop-blur-sm shadow-lg">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-md">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Smart Car Search
            </h3>
            <p className="text-xs text-muted-foreground">Find your perfect vehicle with intelligent filtering</p>
          </div>
          {enableManualSearch && hasChanges && (
            <Badge variant="secondary" className="animate-pulse bg-orange-100 text-orange-800 border-orange-200">
              <Clock className="h-3 w-3 mr-1" />
              Changes pending
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {getActiveFiltersCount() > 0 && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {getActiveFiltersCount()} active
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Search Action Button */}
      {enableManualSearch && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <Button 
              variant="default"
              size="lg" 
              onClick={handleManualSearch}
              disabled={!hasChanges || isLoading || !canProceed}
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Searching...
                </>
              ) : !canProceed ? (
                <>
                  <Target className="h-5 w-5 mr-2" />
                  Select Brand & Model First
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Search {models.filter(m => m.cars_qty && m.cars_qty > 0).reduce((sum, m) => sum + (m.cars_qty || 0), 0)} Cars
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Primary Selection Card */}
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-card to-card/95 border-primary/10">
        <CardHeader 
          className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => toggleSection('primary')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Car className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Vehicle Selection</h4>
                <p className="text-xs text-muted-foreground">Choose brand, model, and generation</p>
              </div>
            </div>
            {expandedSections.includes('primary') ? 
              <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </CardHeader>

        {expandedSections.includes('primary') && (
          <CardContent className="pt-0 space-y-4">
            {/* Brand Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Brand
                {filters.manufacturer_id && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    Selected
                  </Badge>
                )}
              </Label>
              <AdaptiveSelect 
                value={filters.manufacturer_id || 'all'} 
                onValueChange={(value) => updateFilter('manufacturer_id', value)}
                placeholder="Select brand"
                className="h-12 text-sm border-2 hover:border-primary/50 focus:border-primary transition-colors"
                options={[
                  { value: 'all', label: 'All Brands' },
                  ...sortedManufacturers.map((manufacturer) => ({
                    value: manufacturer.id.toString(),
                    label: (
                      <div className="flex items-center gap-3 p-1">
                        {manufacturer.image && (
                          <img src={manufacturer.image} alt={manufacturer.name} className="w-6 h-6 object-contain" />
                        )}
                        <span className="font-medium">{manufacturer.name}</span>
                        <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary">
                          {manufacturer.cars_qty?.toLocaleString()}
                        </Badge>
                      </div>
                    )
                  }))
                ]}
              />
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Model
                {filters.model_id && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    Selected
                  </Badge>
                )}
              </Label>
              <AdaptiveSelect 
                value={filters.model_id || 'all'} 
                onValueChange={(value) => updateFilter('model_id', value)}
                disabled={!filters.manufacturer_id}
                placeholder={!filters.manufacturer_id ? "Select brand first" : "Select model"}
                className="h-12 text-sm border-2 hover:border-primary/50 focus:border-primary transition-colors disabled:opacity-50"
                options={[
                  { value: 'all', label: 'All Models' },
                  ...models.filter(model => model.cars_qty && model.cars_qty > 0).map((model) => ({
                    value: model.id.toString(),
                    label: (
                      <div className="flex items-center justify-between p-1">
                        <span className="font-medium">{model.name}</span>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                          {model.cars_qty?.toLocaleString()}
                        </Badge>
                      </div>
                    )
                  }))
                ]}
              />
            </div>

            {/* Generation Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Generation
                {filters.generation_id && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    Selected
                  </Badge>
                )}
              </Label>
              <AdaptiveSelect 
                value={filters.generation_id || 'all'} 
                onValueChange={(value) => updateFilter('generation_id', value)}
                disabled={!filters.model_id}
                placeholder={!filters.model_id ? "Select model first" : "Select generation"}
                className="h-12 text-sm border-2 hover:border-primary/50 focus:border-primary transition-colors disabled:opacity-50"
                options={[
                  { value: 'all', label: 'All Generations' },
                  ...generations.filter(gen => gen.cars_qty && gen.cars_qty > 0).map((generation) => ({
                    value: generation.id.toString(),
                    label: (
                      <div className="flex flex-col p-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{generation.name}</span>
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                            {generation.cars_qty?.toLocaleString()}
                          </Badge>
                        </div>
                        {generation.from_year && (
                          <span className="text-xs text-muted-foreground">
                            {(() => {
                              const from = generation.from_year.toString();
                              const currentYear = new Date().getFullYear();
                              const to = (!generation.to_year || generation.to_year >= currentYear) ? 'present' : generation.to_year.toString();
                              return `${from}-${to}`;
                            })()}
                          </span>
                        )}
                      </div>
                    )
                  }))
                ]}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Quick Year & Price Filters */}
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader 
          className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => toggleSection('quick')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Quick Filters</h4>
                <p className="text-xs text-muted-foreground">Year ranges and price limits</p>
              </div>
            </div>
            {(filters.from_year || filters.to_year || filters.buy_now_price_from || filters.buy_now_price_to) && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                Active
              </Badge>
            )}
            {expandedSections.includes('quick') ? 
              <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </CardHeader>

        {expandedSections.includes('quick') && (
          <CardContent className="pt-0 space-y-4">
            {/* Year Range Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Year Range Quick Select:</Label>
              <div className="grid grid-cols-2 gap-2">
                {yearRangePresets.slice(0, 6).map((preset) => (
                  <Button
                    key={preset.label}
                    variant={
                      filters.from_year === preset.from.toString() && 
                      filters.to_year === preset.to.toString() 
                        ? "default" 
                        : "outline"
                    }
                    size="sm"
                    className="h-9 text-xs font-medium transition-all duration-200"
                    onClick={() => handleYearRangePreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              {(filters.from_year || filters.to_year) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10"
                  onClick={() => onFiltersChange({
                    ...filters,
                    from_year: undefined,
                    to_year: undefined
                  })}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Year Range
                </Button>
              )}
            </div>

            <Separator />

            {/* Price Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-3 w-3" />
                Price Range (EUR)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Min price"
                  value={filters.buy_now_price_from || ''}
                  onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                  className="h-10 text-sm border-2 hover:border-primary/50 focus:border-primary transition-colors"
                />
                <Input
                  type="number"
                  placeholder="Max price"
                  value={filters.buy_now_price_to || ''}
                  onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                  className="h-10 text-sm border-2 hover:border-primary/50 focus:border-primary transition-colors"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Advanced Filters */}
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader 
          className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => toggleSection('advanced')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Advanced Filters</h4>
                <p className="text-xs text-muted-foreground">Color, fuel, transmission, and more</p>
              </div>
            </div>
            {(filters.color || filters.fuel_type || filters.transmission || filters.odometer_from_km || filters.odometer_to_km) && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                Active
              </Badge>
            )}
            {expandedSections.includes('advanced') ? 
              <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </CardHeader>

        {expandedSections.includes('advanced') && (
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Color */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-3 w-3" />
                  Color
                </Label>
                <AdaptiveSelect 
                  value={filters.color || 'all'} 
                  onValueChange={(value) => updateFilter('color', value)}
                  placeholder="Any color"
                  className="h-10 text-sm border-2 hover:border-primary/50 focus:border-primary transition-colors"
                  options={[
                    { value: 'all', label: 'Any color' },
                    ...Object.entries(COLOR_OPTIONS).map(([name, id]) => ({
                      value: id.toString(),
                      label: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
                    }))
                  ]}
                />
              </div>

              {/* Fuel Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Fuel className="h-3 w-3" />
                  Fuel Type
                </Label>
                <AdaptiveSelect 
                  value={filters.fuel_type || 'all'} 
                  onValueChange={(value) => updateFilter('fuel_type', value)}
                  placeholder="Any type"
                  className="h-10 text-sm border-2 hover:border-primary/50 focus:border-primary transition-colors"
                  options={[
                    { value: 'all', label: 'Any type' },
                    ...Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => ({
                      value: id.toString(),
                      label: name.charAt(0).toUpperCase() + name.slice(1)
                    }))
                  ]}
                />
              </div>

              {/* Transmission */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Cog className="h-3 w-3" />
                  Transmission
                </Label>
                <AdaptiveSelect 
                  value={filters.transmission || 'all'} 
                  onValueChange={(value) => updateFilter('transmission', value)}
                  placeholder="Any type"
                  className="h-10 text-sm border-2 hover:border-primary/50 focus:border-primary transition-colors"
                  options={[
                    { value: 'all', label: 'Any type' },
                    ...Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => ({
                      value: id.toString(),
                      label: name.charAt(0).toUpperCase() + name.slice(1)
                    }))
                  ]}
                />
              </div>

              {/* Mileage Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Mileage Range (km)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Min km"
                    value={filters.odometer_from_km || ''}
                    onChange={(e) => updateFilter('odometer_from_km', e.target.value)}
                    className="h-10 text-sm border-2 hover:border-primary/50 focus:border-primary transition-colors"
                  />
                  <Input
                    type="number"
                    placeholder="Max km"
                    value={filters.odometer_to_km || ''}
                    onChange={(e) => updateFilter('odometer_to_km', e.target.value)}
                    className="h-10 text-sm border-2 hover:border-primary/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
});

ModernFilterInterface.displayName = 'ModernFilterInterface';
export default ModernFilterInterface;