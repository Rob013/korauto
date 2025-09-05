import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Filter,
  Shield,
  Camera,
  Award,
  AlertTriangle
} from 'lucide-react';
import { FilterState } from '@/hooks/useFiltersFromUrl';
import { validateFilters } from '@/utils/buildQueryParams';
import { cn } from '@/lib/utils';

interface FiltersData {
  brands: Array<{ id: string; name: string; count?: number }>;
  models: Array<{ id: string; name: string; brandId: string; count?: number }>;
  fuelTypes: Array<{ id: string; name: string; count?: number }>;
  transmissions: Array<{ id: string; name: string; count?: number }>;
  bodyTypes: Array<{ id: string; name: string; count?: number }>;
  colors: Array<{ id: string; name: string; count?: number }>;
  locations: Array<{ id: string; name: string; count?: number }>;
  
  // Enhanced filter data for old layout
  conditions: Array<{ id: string; name: string; count?: number }>;
  saleStatuses: Array<{ id: string; name: string; count?: number }>;
  drivetrains: Array<{ id: string; name: string; count?: number }>;
  doorCounts: Array<{ id: string; name: string; count?: number }>;
  
  // Range data
  yearRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  mileageRange: { min: number; max: number };
  engineSizeRange: { min: number; max: number }; // New range for engine size
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
  const [engineSizeRange, setEngineSizeRange] = useState([
    filters.engineSizeMin || data.engineSizeRange?.min || 1.0, 
    filters.engineSizeMax || data.engineSizeRange?.max || 6.0
  ]);
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
  const debouncedEngineSizeRange = useDebounce(engineSizeRange, 250);

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

  useEffect(() => {
    if (data.engineSizeRange && (debouncedEngineSizeRange[0] !== filters.engineSizeMin || debouncedEngineSizeRange[1] !== filters.engineSizeMax)) {
      onFiltersChange({
        engineSizeMin: debouncedEngineSizeRange[0] !== data.engineSizeRange.min ? debouncedEngineSizeRange[0] : undefined,
        engineSizeMax: debouncedEngineSizeRange[1] !== data.engineSizeRange.max ? debouncedEngineSizeRange[1] : undefined,
      });
    }
  }, [debouncedEngineSizeRange, filters.engineSizeMin, filters.engineSizeMax, data.engineSizeRange, onFiltersChange]);

  // Get available models based on selected brand
  const availableModels = useMemo(() => {
    if (!filters.brand) return [];
    return data.models.filter(model => model.brandId === filters.brand);
  }, [data.models, filters.brand]);

  // Validate filters
  const validationErrors = useMemo(() => validateFilters(filters), [filters]);
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

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
    <div className={cn('space-y-2 sm:space-y-3 lg:space-y-4', className)}>
      {/* Header with active filters count - Enhanced mobile responsiveness */}
      <div className="flex items-center justify-between gap-2 p-2 sm:p-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold truncate">Filtrat e Kërkimit</h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1">{activeFiltersCount}</Badge>
          )}
          <Button variant="outline" size="sm" onClick={onClearFilters} className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 touch-target">
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden xs:inline">Pastro të gjitha</span>
            <span className="xs:hidden">Pastro</span>
          </Button>
        </div>
      </div>

      {/* Selected filters chips - Enhanced mobile responsiveness */}
      {selectedFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-16 sm:max-h-20 lg:max-h-none overflow-y-auto p-1 sm:p-0">
          {selectedFilters.map((chip) => (
            <Badge key={chip.key} variant="default" className="flex items-center gap-1 text-xs sm:text-sm px-2 py-1 max-w-[140px] sm:max-w-[180px] lg:max-w-none touch-target">
              <span className="truncate">{chip.label}: {chip.value}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-0.5 hover:bg-transparent ml-1 touch-target rounded-full"
                onClick={() => removeFilter(chip.key)}
              >
                <X className="h-3 w-3 flex-shrink-0" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search - Enhanced mobile experience */}
      <div className="space-y-1.5 sm:space-y-2 p-2 sm:p-0">
        <Label htmlFor="search" className="flex items-center gap-2 text-sm sm:text-base font-medium">
          <Search className="h-3 w-3 sm:h-4 sm:w-4" />
          Kërko
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            type="text"
            placeholder="Kërko makinat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 sm:h-11 text-sm sm:text-base touch-target"
          />
        </div>
      </div>

      {/* Basic Filters Section - Enhanced mobile layout */}
      <div className="space-y-2 sm:space-y-3">
        <Button
          variant="ghost"
          onClick={() => toggleSection('basic')}
          className="w-full justify-between p-3 h-auto hover:bg-muted/50 touch-target"
        >
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="font-medium text-sm sm:text-base">Filtrat Bazë</span>
          </div>
          {expandedSections.includes('basic') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {expandedSections.includes('basic') && (
          <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
            {/* Brand - Enhanced touch target */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm sm:text-base font-medium">
                <Car className="h-4 w-4" />
                Marka
              </Label>
              <Select value={filters.brand || ''} onValueChange={handleBrandChange}>
                <SelectTrigger className="h-10 sm:h-11 touch-target">
                  <SelectValue placeholder="Zgjidhni markën" />
                </SelectTrigger>
                <SelectContent>
                  {data.brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id} className="touch-target">
                      {brand.name} {brand.count && `(${brand.count})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model (dependent on brand) - Enhanced touch target */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm sm:text-base font-medium">
                <Settings className="h-4 w-4" />
                Modeli
              </Label>
              <Select 
                value={filters.model || ''} 
                onValueChange={(value) => onFiltersChange({ model: value })}
                disabled={!filters.brand || availableModels.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!filters.brand ? "Zgjidhni markën së pari" : "Zgjidhni modelin"} />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} {model.count && `(${model.count})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {/* Fuel Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                Lloji i Karburantit
              </Label>
              <Select value={filters.fuel || ''} onValueChange={(value) => onFiltersChange({ fuel: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidhni karburantin" />
                </SelectTrigger>
                <SelectContent>
                  {data.fuelTypes.map((fuel) => (
                    <SelectItem key={fuel.id} value={fuel.id}>
                      {fuel.name} {fuel.count && `(${fuel.count})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transmission */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Transmisioni
              </Label>
              <Select value={filters.transmission || ''} onValueChange={(value) => onFiltersChange({ transmission: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidhni transmisionin" />
                </SelectTrigger>
                <SelectContent>
                  {data.transmissions.map((transmission) => (
                    <SelectItem key={transmission.id} value={transmission.id}>
                      {transmission.name} {transmission.count && `(${transmission.count})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Select value={filters.bodyType || ''} onValueChange={(value) => onFiltersChange({ bodyType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidhni llojin e trupit" />
                </SelectTrigger>
                <SelectContent>
                  {data.bodyTypes.map((bodyType) => (
                    <SelectItem key={bodyType.id} value={bodyType.id}>
                      {bodyType.name} {bodyType.count && `(${bodyType.count})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Ngjyra
              </Label>
              <Select value={filters.color || ''} onValueChange={(value) => onFiltersChange({ color: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidhni ngjyrën" />
                </SelectTrigger>
                <SelectContent>
                  {data.colors.map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      {color.name} {color.count && `(${color.count})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Vendndodhja
              </Label>
              <Select value={filters.location || ''} onValueChange={(value) => onFiltersChange({ location: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidhni vendndodhjen" />
                </SelectTrigger>
                <SelectContent>
                  {data.locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} {location.count && `(${location.count})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Enhanced Filters for Old Layout */}
            
            {/* Car Condition */}
            {data.conditions && data.conditions.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Gjendja
                </Label>
                <Select value={filters.condition || ''} onValueChange={(value) => onFiltersChange({ condition: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zgjidhni gjendjen" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.conditions.map((condition) => (
                      <SelectItem key={condition.id} value={condition.id}>
                        {condition.name} {condition.count && `(${condition.count})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sale Status */}
            {data.saleStatuses && data.saleStatuses.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Statusi i Shitjes
                </Label>
                <Select value={filters.saleStatus || ''} onValueChange={(value) => onFiltersChange({ saleStatus: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zgjidhni statusin" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.saleStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name} {status.count && `(${status.count})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Drivetrain */}
            {data.drivetrains && data.drivetrains.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Sistemi i Nxitjes
                </Label>
                <Select value={filters.drivetrain || ''} onValueChange={(value) => onFiltersChange({ drivetrain: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zgjidhni sistemin" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.drivetrains.map((drivetrain) => (
                      <SelectItem key={drivetrain.id} value={drivetrain.id}>
                        {drivetrain.name} {drivetrain.count && `(${drivetrain.count})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Doors Count */}
            {data.doorCounts && data.doorCounts.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Numri i Dyerve
                </Label>
                <Select value={filters.doors || ''} onValueChange={(value) => onFiltersChange({ doors: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zgjidhni numrin e dyerve" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.doorCounts.map((door) => (
                      <SelectItem key={door.id} value={door.id}>
                        {door.name} {door.count && `(${door.count})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Engine Size Range */}
            {data.engineSizeRange && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Vëllimi i Motorrit (L)
                </Label>
                <div className="px-2">
                  <Slider
                    value={engineSizeRange}
                    onValueChange={setEngineSizeRange}
                    min={data.engineSizeRange.min}
                    max={data.engineSizeRange.max}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{engineSizeRange[0].toFixed(1)}L</span>
                    <span>{engineSizeRange[1].toFixed(1)}L</span>
                  </div>
                </div>
              </div>
            )}

            {/* Boolean Filters */}
            <div className="space-y-3 border-t pt-3">
              <Label className="text-sm font-medium text-foreground">Filtrat e Përshtatur</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hasImages"
                  checked={filters.hasImages || false}
                  onCheckedChange={(checked) => onFiltersChange({ hasImages: checked ? true : undefined })}
                />
                <Label htmlFor="hasImages" className="flex items-center gap-2 text-sm cursor-pointer">
                  <Camera className="h-4 w-4" />
                  Vetëm me fotografi
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isCertified"
                  checked={filters.isCertified || false}
                  onCheckedChange={(checked) => onFiltersChange({ isCertified: checked ? true : undefined })}
                />
                <Label htmlFor="isCertified" className="flex items-center gap-2 text-sm cursor-pointer">
                  <Award className="h-4 w-4" />
                  Vetëm të certifikuara
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="noAccidents"
                  checked={filters.noAccidents || false}
                  onCheckedChange={(checked) => onFiltersChange({ noAccidents: checked ? true : undefined })}
                />
                <Label htmlFor="noAccidents" className="flex items-center gap-2 text-sm cursor-pointer">
                  <Shield className="h-4 w-4" />
                  Pa aksidente
                </Label>
              </div>
            </div>

            {/* Accident Count Filter */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Maksimum {filters.accidentCountMax || 0} aksidente
              </Label>
              <div className="px-2">
                <Slider
                  value={[filters.accidentCountMax || 0]}
                  onValueChange={([value]) => onFiltersChange({ accidentCountMax: value })}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>0 aksidente</span>
                  <span>10+ aksidente</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-md bg-destructive/10 p-3">
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
        <div className="text-center text-sm text-muted-foreground">
          Duke përditësuar filtrat...
        </div>
      )}
    </div>
  );
};

export default FiltersPanel;