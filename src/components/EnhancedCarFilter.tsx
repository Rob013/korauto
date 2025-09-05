import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  X, 
  Search,
  Car,
  Fuel,
  Settings,
  Palette,
  MapPin,
  Calendar,
  DollarSign,
  Gauge,
  Cog
} from 'lucide-react';
import type { CarFilters, FilterOptions } from '@/services/externalCarAPI';
import { externalCarAPI } from '@/services/externalCarAPI';

interface EnhancedCarFilterProps {
  filters: CarFilters;
  filterOptions: FilterOptions;
  onFiltersChange: (filters: CarFilters) => void;
  onResetFilters: () => void;
  loadingFilters?: boolean;
  totalResults?: number;
  className?: string;
}

interface FilterSection {
  key: string;
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
}

// Price presets similar to Encar.com
const PRICE_PRESETS = [
  { label: 'Under €10,000', min: 0, max: 10000 },
  { label: '€10,000 - €20,000', min: 10000, max: 20000 },
  { label: '€20,000 - €30,000', min: 20000, max: 30000 },
  { label: '€30,000 - €50,000', min: 30000, max: 50000 },
  { label: '€50,000 - €100,000', min: 50000, max: 100000 },
  { label: 'Over €100,000', min: 100000, max: 500000 }
];

// Mileage presets
const MILEAGE_PRESETS = [
  { label: 'Under 10,000 km', min: 0, max: 10000 },
  { label: '10,000 - 30,000 km', min: 10000, max: 30000 },
  { label: '30,000 - 50,000 km', min: 30000, max: 50000 },
  { label: '50,000 - 100,000 km', min: 50000, max: 100000 },
  { label: '100,000 - 150,000 km', min: 100000, max: 150000 },
  { label: 'Over 150,000 km', min: 150000, max: 500000 }
];

export const EnhancedCarFilter: React.FC<EnhancedCarFilterProps> = ({
  filters,
  filterOptions,
  onFiltersChange,
  onResetFilters,
  loadingFilters = false,
  totalResults = 0,
  className = ''
}) => {
  // State for dependent dropdowns
  const [selectedModels, setSelectedModels] = useState<any[]>([]);
  const [selectedGenerations, setSelectedGenerations] = useState<any[]>([]);
  const [selectedTrims, setSelectedTrims] = useState<any[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<any[]>([]);
  
  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['brand-model', 'price-range', 'year-generation'])
  );
  
  // Price range state
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.price_from || 0, 
    filters.price_to || 200000
  ]);
  
  // Year range state
  const [yearRange, setYearRange] = useState<[number, number]>([
    filters.year_from || 2000,
    filters.year_to || 2024
  ]);
  
  // Mileage range state
  const [mileageRange, setMileageRange] = useState<[number, number]>([
    filters.mileage_from || 0,
    filters.mileage_to || 300000
  ]);

  // Handle manufacturer change and load models
  const handleManufacturerChange = useCallback(async (manufacturerId: string) => {
    // Convert "all" to empty string for filters
    const actualId = manufacturerId === 'all' ? '' : manufacturerId;
    
    const newFilters = { ...filters };
    if (actualId) {
      newFilters.manufacturer_id = actualId;
    } else {
      delete newFilters.manufacturer_id;
    }
    delete newFilters.model_id;
    delete newFilters.generation_id;
    delete newFilters.trim;
    delete newFilters.grade;
    
    onFiltersChange(newFilters);
    
    if (actualId) {
      try {
        const models = await externalCarAPI.fetchModels(actualId);
        setSelectedModels(models);
        setSelectedGenerations([]);
        setSelectedTrims([]);
        setSelectedGrades([]);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    } else {
      setSelectedModels([]);
      setSelectedGenerations([]);
      setSelectedTrims([]);
      setSelectedGrades([]);
    }
  }, [filters, onFiltersChange]);

  // Handle model change and load generations/trims/grades
  const handleModelChange = useCallback(async (modelId: string) => {
    // Convert "all" to empty string for filters
    const actualId = modelId === 'all' ? '' : modelId;
    
    const newFilters = { ...filters };
    if (actualId) {
      newFilters.model_id = actualId;
    } else {
      delete newFilters.model_id;
    }
    delete newFilters.generation_id;
    delete newFilters.trim;
    delete newFilters.grade;
    
    onFiltersChange(newFilters);
    
    if (actualId) {
      try {
        const [generations, trims, grades] = await Promise.all([
          externalCarAPI.fetchGenerations(actualId),
          externalCarAPI.fetchTrims(actualId),
          externalCarAPI.fetchGrades(actualId)
        ]);
        
        setSelectedGenerations(generations);
        setSelectedTrims(trims);
        setSelectedGrades(grades);
      } catch (error) {
        console.error('Error loading model details:', error);
      }
    } else {
      setSelectedGenerations([]);
      setSelectedTrims([]);
      setSelectedGrades([]);
    }
  }, [filters, onFiltersChange]);

  // Toggle section expansion
  const toggleSection = useCallback((sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  }, []);

  // Handle price range change
  const handlePriceRangeChange = useCallback((range: [number, number]) => {
    setPriceRange(range);
    onFiltersChange({
      ...filters,
      price_from: range[0],
      price_to: range[1]
    });
  }, [filters, onFiltersChange]);

  // Handle year range change
  const handleYearRangeChange = useCallback((range: [number, number]) => {
    setYearRange(range);
    onFiltersChange({
      ...filters,
      year_from: range[0],
      year_to: range[1]
    });
  }, [filters, onFiltersChange]);

  // Handle mileage range change
  const handleMileageRangeChange = useCallback((range: [number, number]) => {
    setMileageRange(range);
    onFiltersChange({
      ...filters,
      mileage_from: range[0],
      mileage_to: range[1]
    });
  }, [filters, onFiltersChange]);

  // Apply price preset
  const applyPricePreset = useCallback((preset: typeof PRICE_PRESETS[0]) => {
    handlePriceRangeChange([preset.min, preset.max]);
  }, [handlePriceRangeChange]);

  // Apply mileage preset
  const applyMileagePreset = useCallback((preset: typeof MILEAGE_PRESETS[0]) => {
    handleMileageRangeChange([preset.min, preset.max]);
  }, [handleMileageRangeChange]);

  // Helper function to handle filter updates with "all" value conversion
  const updateFilter = useCallback((key: keyof CarFilters, value: string) => {
    const actualValue = value === 'all' ? '' : value;
    const newFilters = { ...filters };
    
    if (actualValue) {
      newFilters[key] = actualValue as any;
    } else {
      delete newFilters[key];
    }
    
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.manufacturer_id) count++;
    if (filters.model_id) count++;
    if (filters.generation_id) count++;
    if (filters.trim) count++;
    if (filters.grade) count++;
    if (filters.body_type) count++;
    if (filters.fuel_type) count++;
    if (filters.transmission) count++;
    if (filters.color) count++;
    if (filters.location) count++;
    if (filters.price_from !== undefined || filters.price_to !== undefined) count++;
    if (filters.year_from !== undefined || filters.year_to !== undefined) count++;
    if (filters.mileage_from !== undefined || filters.mileage_to !== undefined) count++;
    return count;
  }, [filters]);

  // Load initial data when manufacturer changes
  useEffect(() => {
    if (filters.manufacturer_id && selectedModels.length === 0) {
      handleManufacturerChange(filters.manufacturer_id);
    }
  }, [filters.manufacturer_id, selectedModels.length, handleManufacturerChange]);

  // Load model details when model changes
  useEffect(() => {
    if (filters.model_id && selectedGenerations.length === 0) {
      handleModelChange(filters.model_id);
    }
  }, [filters.model_id, selectedGenerations.length, handleModelChange]);

  return (
    <Card className={`w-full max-w-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filter Cars</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalResults.toLocaleString()} cars found
          </Badge>
        </div>
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-muted-foreground">
              {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Brand & Model Section */}
        <Collapsible
          open={expandedSections.has('brand-model')}
          onOpenChange={() => toggleSection('brand-model')}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                <span className="font-medium">Brand & Model</span>
              </div>
              {expandedSections.has('brand-model') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2">
            {/* Brand Selection */}
            <div>
              <Label className="text-sm font-medium">Brand</Label>
              <Select
                value={filters.manufacturer_id || 'all'}
                onValueChange={handleManufacturerChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {filterOptions.manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name} ({manufacturer.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Model Selection */}
            {selectedModels.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Model</Label>
                <Select
                  value={filters.model_id || 'all'}
                  onValueChange={(value) => handleModelChange(value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {selectedModels.map((model) => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        {model.name} ({model.cars_qty})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Generation Selection */}
            {selectedGenerations.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Generation</Label>
                <Select
                  value={filters.generation_id || 'all'}
                  onValueChange={(value) => {
                    const actualValue = value === 'all' ? '' : value;
                    const newFilters = { ...filters };
                    if (actualValue) {
                      newFilters.generation_id = actualValue;
                    } else {
                      delete newFilters.generation_id;
                    }
                    onFiltersChange(newFilters);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Generations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Generations</SelectItem>
                    {selectedGenerations.map((generation) => (
                      <SelectItem key={generation.id} value={generation.id.toString()}>
                        {generation.name} ({generation.from_year}-{generation.to_year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Price Range Section */}
        <Collapsible
          open={expandedSections.has('price-range')}
          onOpenChange={() => toggleSection('price-range')}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-medium">Price Range</span>
              </div>
              {expandedSections.has('price-range') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2">
            <div>
              <Label className="text-sm font-medium">Price Range</Label>
              <div className="mt-2">
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  max={200000}
                  min={0}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>€{priceRange[0].toLocaleString()}</span>
                  <span>€{priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Quick Presets</Label>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {PRICE_PRESETS.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPricePreset(preset)}
                    className="h-8 text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Year & Generation Section */}
        <Collapsible
          open={expandedSections.has('year-generation')}
          onOpenChange={() => toggleSection('year-generation')}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Year & Generation</span>
              </div>
              {expandedSections.has('year-generation') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2">
            {/* Year Range */}
            <div>
              <Label className="text-sm font-medium">Year Range</Label>
              <div className="mt-2">
                <Slider
                  value={yearRange}
                  onValueChange={handleYearRangeChange}
                  max={2024}
                  min={2000}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{yearRange[0]}</span>
                  <span>{yearRange[1]}</span>
                </div>
              </div>
            </div>
            
            {/* Mileage Range */}
            <div>
              <Label className="text-sm font-medium">Mileage Range</Label>
              <div className="mt-2">
                <Slider
                  value={mileageRange}
                  onValueChange={handleMileageRangeChange}
                  max={300000}
                  min={0}
                  step={5000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{mileageRange[0].toLocaleString()} km</span>
                  <span>{mileageRange[1].toLocaleString()} km</span>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Mileage Presets</Label>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {MILEAGE_PRESETS.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applyMileagePreset(preset)}
                    className="h-8 text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Technical Specs Section */}
        <Collapsible
          open={expandedSections.has('technical-specs')}
          onOpenChange={() => toggleSection('technical-specs')}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <Cog className="h-4 w-4 text-primary" />
                <span className="font-medium">Technical Specs</span>
              </div>
              {expandedSections.has('technical-specs') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2">
            <div>
              <Label className="text-sm font-medium">Body Type</Label>
              <Select
                value={filters.body_type || 'all'}
                onValueChange={(value) => updateFilter('body_type', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Body Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Body Types</SelectItem>
                  {filterOptions.bodyTypes.map((bodyType) => (
                    <SelectItem key={bodyType.id} value={bodyType.name}>
                      {bodyType.name} ({bodyType.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Fuel Type */}
            <div>
              <Label className="text-sm font-medium">Fuel Type</Label>
              <Select
                value={filters.fuel_type || 'all'}
                onValueChange={(value) => updateFilter('fuel_type', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Fuel Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fuel Types</SelectItem>
                  {filterOptions.fuelTypes.map((fuelType) => (
                    <SelectItem key={fuelType.id} value={fuelType.name}>
                      {fuelType.name} ({fuelType.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Transmission */}
            <div>
              <Label className="text-sm font-medium">Transmission</Label>
              <Select
                value={filters.transmission || 'all'}
                onValueChange={(value) => updateFilter('transmission', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Transmissions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transmissions</SelectItem>
                  {filterOptions.transmissions.map((transmission) => (
                    <SelectItem key={transmission.id} value={transmission.name}>
                      {transmission.name} ({transmission.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Trim & Grade */}
            {selectedTrims.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Trim Level</Label>
                <Select
                  value={filters.trim || 'all'}
                  onValueChange={(value) => updateFilter('trim', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Trims" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trims</SelectItem>
                    {selectedTrims.map((trim) => (
                      <SelectItem key={trim.id} value={trim.name}>
                        {trim.name} ({trim.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {selectedGrades.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Grade</Label>
                <Select
                  value={filters.grade || 'all'}
                  onValueChange={(value) => updateFilter('grade', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {selectedGrades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.name}>
                        {grade.name} ({grade.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Appearance Section */}
        <Collapsible
          open={expandedSections.has('appearance')}
          onOpenChange={() => toggleSection('appearance')}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <span className="font-medium">Appearance</span>
              </div>
              {expandedSections.has('appearance') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2">
            <div>
              <Label className="text-sm font-medium">Color</Label>
              <Select
                value={filters.color || 'all'}
                onValueChange={(value) => updateFilter('color', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Colors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colors</SelectItem>
                  {filterOptions.colors.map((color) => (
                    <SelectItem key={color.id} value={color.name}>
                      {color.name} ({color.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Location & Features Section */}
        <Collapsible
          open={expandedSections.has('location-features')}
          onOpenChange={() => toggleSection('location-features')}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Location & Features</span>
              </div>
              {expandedSections.has('location-features') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2">
            <div>
              <Label className="text-sm font-medium">Location</Label>
              <Select
                value={filters.location || 'all'}
                onValueChange={(value) => updateFilter('location', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {filterOptions.locations.map((location) => (
                    <SelectItem key={location.id} value={location.name}>
                      {location.name} ({location.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
