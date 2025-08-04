import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DollarSign
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
  compact = false
}) => {
  const [grades, setGrades] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);

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

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const years = useMemo(() => Array.from({ length: 25 }, (_, i) => currentYear - i), [currentYear]);

  // Prioritized manufacturer sorting (German, Korean, Popular)
  const sortedManufacturers = useMemo(() => {
    return manufacturers
      .sort((a, b) => {
        const germanBrands = ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche', 'Opel'];
        const koreanBrands = ['Hyundai', 'Kia', 'Genesis'];
        const popularBrands = ['Toyota', 'Honda', 'Nissan', 'Ford', 'Chevrolet', 'Mazda', 'Subaru', 'Lexus'];
        
        const aIsGerman = germanBrands.includes(a.name);
        const bIsGerman = germanBrands.includes(b.name);
        const aIsKorean = koreanBrands.includes(a.name);
        const bIsKorean = koreanBrands.includes(b.name);
        const aIsPopular = popularBrands.includes(a.name);
        const bIsPopular = popularBrands.includes(b.name);
        
        if (aIsGerman && !bIsGerman) return -1;
        if (!aIsGerman && bIsGerman) return 1;
        if (aIsKorean && !bIsKorean && !bIsGerman) return -1;
        if (!aIsKorean && bIsKorean && !aIsGerman) return 1;
        if (aIsPopular && !bIsPopular && !bIsGerman && !bIsKorean) return -1;
        if (!aIsPopular && bIsPopular && !aIsGerman && !aIsKorean) return 1;
        
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

  // Homepage style - Encar-like with our theme and language
  if (isHomepage) {
    return (
      <Card className="p-6 bg-gradient-to-r from-card via-card/95 to-card border-border/50 shadow-lg">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Car className="h-4 w-4 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Kërko Makinën</h2>
            </div>
            {(filters.manufacturer_id || filters.model_id || filters.generation_id) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Pastro
              </Button>
            )}
          </div>
          
          {/* Main search filters - horizontal layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Manufacturer Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Marka</Label>
              <Select value={filters.manufacturer_id || 'all'} onValueChange={(value) => updateFilter('manufacturer_id', value)}>
                <SelectTrigger className="h-12 bg-background border-border hover:border-primary focus:border-primary transition-colors">
                  <SelectValue placeholder="Zgjidhni markën" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background border border-border shadow-lg">
                  <SelectItem value="all" className="hover:bg-muted">Të gjitha Markat</SelectItem>
                  {sortedManufacturers.map((manufacturer) => (
                    <SelectItem 
                      key={manufacturer.id} 
                      value={manufacturer.id.toString()}
                      className="hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        {manufacturer.image && (
                          <img src={manufacturer.image} alt={manufacturer.name} className="w-5 h-5 object-contain" />
                        )}
                        <span>{manufacturer.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">({manufacturer.cars_qty})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Modeli</Label>
              <Select 
                value={filters.model_id || 'all'} 
                onValueChange={(value) => updateFilter('model_id', value)}
                disabled={!filters.manufacturer_id}
              >
                <SelectTrigger className="h-12 bg-background border-border hover:border-primary focus:border-primary transition-colors disabled:opacity-50">
                  <SelectValue placeholder={filters.manufacturer_id ? "Zgjidhni modelin" : "Zgjidhni markën së pari"} />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background border border-border shadow-lg">
                  <SelectItem value="all" className="hover:bg-muted">Të gjithë Modelet</SelectItem>
                  {models.filter(model => model.cars_qty && model.cars_qty > 0).map((model) => (
                    <SelectItem 
                      key={model.id} 
                      value={model.id.toString()}
                      className="hover:bg-muted"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">({model.cars_qty})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generation Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Gjenerata</Label>
              <Select 
                value={filters.generation_id || 'all'} 
                onValueChange={(value) => updateFilter('generation_id', value)}
                disabled={!filters.model_id}
              >
                <SelectTrigger className="h-12 bg-background border-border hover:border-primary focus:border-primary transition-colors disabled:opacity-50">
                  <SelectValue placeholder={filters.model_id ? "Zgjidhni gjeneratën" : "Zgjidhni modelin së pari"} />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background border border-border shadow-lg">
                  <SelectItem value="all" className="hover:bg-muted">Të gjitha Gjeneratat</SelectItem>
                  {generations.filter(gen => gen.cars_qty && gen.cars_qty > 0).map((generation) => (
                    <SelectItem 
                      key={generation.id} 
                      value={generation.id.toString()}
                      className="hover:bg-muted"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{generation.name}</span>
                        <span className="text-xs text-muted-foreground">({generation.cars_qty})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground opacity-0">Kërko</Label>
              <Button 
                size="lg" 
                className="h-12 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
                onClick={() => {
                  if (filters.manufacturer_id || filters.model_id || filters.generation_id) {
                    // Trigger navigation to catalog with current filters
                    const searchParams = new URLSearchParams();
                    Object.entries(filters).forEach(([key, value]) => {
                      if (value && value !== '') {
                        searchParams.set(key, value);
                      }
                    });
                    window.location.href = `/catalog?${searchParams.toString()}`;
                  }
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Kërko Makina
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Catalog style - Vertical left sidebar layout like Encar
  return (
    <div className="w-full max-w-xs bg-card border border-border rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Filtrat</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters} 
            disabled={isLoading}
            className="text-xs h-7 px-2"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic Filters - Always visible */}
        <div className="space-y-4">
          {/* Manufacturer */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Car className="h-3 w-3" />
              Marka
            </Label>
            <Select value={filters.manufacturer_id || 'all'} onValueChange={(value) => updateFilter('manufacturer_id', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Zgjidhni markën" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">Të gjitha</SelectItem>
                {sortedManufacturers.map((manufacturer) => (
                  <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                    <div className="flex items-center gap-2">
                      {manufacturer.image && (
                        <img src={manufacturer.image} alt={manufacturer.name} className="w-4 h-4 object-contain" />
                      )}
                      <span className="text-xs">{manufacturer.name} ({manufacturer.cars_qty})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-3 w-3" />
              Modeli
            </Label>
            <Select 
              value={filters.model_id || 'all'} 
              onValueChange={(value) => updateFilter('model_id', value)}
              disabled={!filters.manufacturer_id}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={filters.manufacturer_id ? "Zgjidhni modelin" : "Marka së pari"} />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">Të gjithë</SelectItem>
                {models.filter(model => model.cars_qty && model.cars_qty > 0).map((model) => (
                  <SelectItem key={model.id} value={model.id.toString()}>
                    <span className="text-xs">{model.name} ({model.cars_qty})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generation */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Gjenerata
            </Label>
            <Select 
              value={filters.generation_id || 'all'} 
              onValueChange={(value) => updateFilter('generation_id', value)}
              disabled={!filters.model_id}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={filters.model_id ? "Zgjidhni gjeneratën" : "Modeli së pari"} />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">Të gjitha</SelectItem>
                {generations.filter(gen => gen.cars_qty && gen.cars_qty > 0).map((generation) => (
                  <SelectItem key={generation.id} value={generation.id.toString()}>
                    <span className="text-xs">{generation.name} ({generation.cars_qty})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grade/Variant */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Varianti</Label>
            <Select 
              value={filters.grade_iaai || 'all'} 
              onValueChange={(value) => updateFilter('grade_iaai', value)}
              disabled={!filters.generation_id || isLoadingGrades}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingGrades ? "Duke ngarkuar..." : "Zgjidhni variatin"} />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="all">Të gjithë</SelectItem>
                {grades.map((grade) => (
                  <SelectItem key={grade.value} value={grade.value}>
                    <span className="text-xs">{grade.label} {grade.count ? `(${grade.count})` : ''}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="pt-2 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => toggleSection('advanced')}
            className="w-full justify-between p-2 h-auto text-xs"
          >
            <span>Filtrat e avancuara</span>
            {expandedSections.includes('advanced') ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          {expandedSections.includes('advanced') && (
            <div className="mt-3 space-y-4">
              {/* Price Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-3 w-3" />
                  Çmimi (EUR)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Prej"
                    value={filters.buy_now_price_from || ''}
                    onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Deri"
                    value={filters.buy_now_price_to || ''}
                    onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Year Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Viti
                </Label>
                <div className="flex gap-2">
                  <Select value={filters.from_year || 'any'} onValueChange={(value) => updateFilter('from_year', value)}>
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Prej" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="any">Çdo vit</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filters.to_year || 'any'} onValueChange={(value) => updateFilter('to_year', value)}>
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Deri" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="any">Çdo vit</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-3 w-3" />
                  Ngjyra
                </Label>
                <Select value={filters.color || 'any'} onValueChange={(value) => updateFilter('color', value)}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Zgjidhni ngjyrën" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="any">Çdo ngjyrë</SelectItem>
                    {Object.entries(COLOR_OPTIONS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        <span className="text-xs capitalize">{key.replace('_', ' ')}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fuel Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Fuel className="h-3 w-3" />
                  Karburanti
                </Label>
                <Select value={filters.fuel_type || 'any'} onValueChange={(value) => updateFilter('fuel_type', value)}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Zgjidhni karburantin" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="any">Çdo karburant</SelectItem>
                    {Object.entries(FUEL_TYPE_OPTIONS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        <span className="text-xs capitalize">{key}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transmission */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  Transmisioni
                </Label>
                <Select value={filters.transmission || 'any'} onValueChange={(value) => updateFilter('transmission', value)}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Zgjidhni transmisionin" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="any">Çdo transmision</SelectItem>
                    {Object.entries(TRANSMISSION_OPTIONS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        <span className="text-xs capitalize">{key}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mileage Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Kilometrazhi
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Prej (km)"
                    value={filters.odometer_from_km || ''}
                    onChange={(e) => updateFilter('odometer_from_km', e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Deri (km)"
                    value={filters.odometer_to_km || ''}
                    onChange={(e) => updateFilter('odometer_to_km', e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

EncarStyleFilter.displayName = 'EncarStyleFilter';
export default EncarStyleFilter;