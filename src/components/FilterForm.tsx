import React, { useState, memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter, X, Loader2, Search, Sparkles, Lightbulb, ChevronDown, ChevronUp, Settings2, Car, DollarSign, Calendar, Palette } from "lucide-react";
import { COLOR_OPTIONS, FUEL_TYPE_OPTIONS, TRANSMISSION_OPTIONS } from '@/hooks/useAuctionAPI';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAICarSearch } from "@/hooks/useAICarSearch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

// Debounce utility function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface Manufacturer {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?:number;
  image?:string;
  
}

interface Model {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?:number;
}

interface Generation {
  cars_qty?:number;
  from_year?:number;
  id:number;
  manufacturer_id?:number;
  model_id?:number;
  name:string;
  to_year?:number;
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

interface FilterFormProps {
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
}

const FilterForm = memo<FilterFormProps>(({
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
  onFetchGrades
}) => {
  const [grades, setGrades] = useState<{ value: string; label: string; count?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [gradeLoading, setGradeLoading] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const latestGradeRequest = useRef(0);

  // Enhanced UI state management
  const [expandedSections, setExpandedSections] = useState({
    vehicle: true,
    specifications: false,
    price: false,
    condition: false
  });

  // AI Search state
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [maxAccidents, setMaxAccidents] = useState<string>('all');
  const { searchWithAI, isSearching, suggestions, clearSuggestions } = useAICarSearch();

  const updateFilter = useCallback((key: string, value: string) => {
    // Handle special "all" values by converting them to undefined
    const actualValue = value === 'all' || value === 'any' ? undefined : value;
    
    // Set loading state for better UX
    setIsLoading(true);
    
    // Handle cascading filters
    if (key === 'manufacturer_id') {
      onManufacturerChange?.(actualValue || '');
      onFiltersChange({
        ...filters,
        [key]: actualValue,
        model_id: undefined,
        generation_id: undefined,
        grade_iaai: undefined // Clear grade when manufacturer changes
      });
    } else if (key === 'model_id') {
      onModelChange?.(actualValue || '');
      onFiltersChange({
        ...filters,
        [key]: actualValue,
        generation_id: undefined,
        grade_iaai: undefined // Clear grade when model changes
      });
    } else {
      // For other filters, preserve existing values but update the changed one
      const updatedFilters = { ...filters, [key]: actualValue };
      
      // If generation changes, clear grade filter
      if (key === 'generation_id') {
        updatedFilters.grade_iaai = undefined;
      }
      
      onFiltersChange(updatedFilters);
    }
    
    // Clear loading state after a short delay
    setTimeout(() => setIsLoading(false), 50);
  }, [filters, onFiltersChange, onManufacturerChange, onModelChange]);

  const handleBrandChange = async (value: string) => {
    setModelLoading(true);
    setModelError(null);
    updateFilter('manufacturer_id', value);
    // Clear models immediately
    if (onModelChange) onModelChange('');
    // Set a timeout for error
    const timeout = setTimeout(() => {
      setModelError('Model loading timed out. Please try again.');
      setModelLoading(false);
    }, 5000);
    try {
      await onManufacturerChange?.(value);
      clearTimeout(timeout);
      setModelLoading(false);
    } catch (e) {
      setModelError('Failed to load models.');
      setModelLoading(false);
      clearTimeout(timeout);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const years = useMemo(() => Array.from({ length: 25 }, (_, i) => currentYear - i), [currentYear]);

  // Memoize sorted manufacturers to prevent unnecessary re-renders
  const sortedManufacturers = useMemo(() => {
    return manufacturers
      .sort((a, b) => {
        // German cars priority
        const germanBrands = ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche', 'Opel'];
        // Korean cars priority  
        const koreanBrands = ['Hyundai', 'Kia', 'Genesis'];
        // Other popular cars
        const popularBrands = ['Toyota', 'Honda', 'Nissan', 'Ford', 'Chevrolet', 'Mazda', 'Subaru', 'Lexus'];
        
        const aIsGerman = germanBrands.includes(a.name);
        const bIsGerman = germanBrands.includes(b.name);
        const aIsKorean = koreanBrands.includes(a.name);
        const bIsKorean = koreanBrands.includes(b.name);
        const aIsPopular = popularBrands.includes(a.name);
        const bIsPopular = popularBrands.includes(b.name);
        
        // German brands first
        if (aIsGerman && !bIsGerman) return -1;
        if (!aIsGerman && bIsGerman) return 1;
        
        // Korean brands second
        if (aIsKorean && !bIsKorean && !bIsGerman) return -1;
        if (!aIsKorean && bIsKorean && !aIsGerman) return 1;
        
        // Popular brands third
        if (aIsPopular && !bIsPopular && !bIsGerman && !bIsKorean) return -1;
        if (!aIsPopular && bIsPopular && !aIsGerman && !aIsKorean) return 1;
        
        // Alphabetical within same category
        return a.name.localeCompare(b.name);
      })
      .filter((m) => m.cars_qty && m.cars_qty > 0);
  }, [manufacturers]);

  const getFallbackGrades = (manufacturerId: string) => {
    const fallbacks = {
      '9': ['320d', '320i', '325d', '330d', '330i', '335d', '335i', 'M3', 'M5', 'X3', 'X5'], // BMW
      '16': ['220d', '250', '300', '350', '400', '450', '500', 'AMG'], // Mercedes-Benz
      '1': ['30 TDI', '35 TDI', '40 TDI', '45 TDI', '50 TDI', '55 TFSI', '30 TFSI', '35 TFSI', '40 TFSI', '45 TFSI', '30', '35', '40', '45', '50', '55', 'RS', 'S'], // Audi
      '147': ['1.4 TSI', '1.6 TDI', '1.8 TSI', '2.0 TDI', '2.0 TSI', 'GTI', 'R'], // Volkswagen
      '2': ['Civic', 'Accord', 'CR-V', 'HR-V'], // Honda
      '3': ['Corolla', 'Camry', 'RAV4', 'Highlander'], // Toyota
      '4': ['Altima', 'Maxima', 'Rogue', 'Murano'], // Nissan
      '5': ['Focus', 'Fiesta', 'Mondeo', 'Kuga'], // Ford
      '6': ['Cruze', 'Malibu', 'Equinox', 'Tahoe'], // Chevrolet
    };
    return (fallbacks[manufacturerId] || []).map(grade => ({ value: grade, label: grade }));
  };

  // Fetch grades when manufacturer, model, or generation changes
  useEffect(() => {
    let cancelled = false;
    if (filters.manufacturer_id && onFetchGrades) {
      // Set fallback immediately for instant response
      const fallback = getFallbackGrades(filters.manufacturer_id);
      setGrades(fallback);
      setIsLoadingGrades(true);
      
      const requestId = Date.now();
      latestGradeRequest.current = requestId;
      
      onFetchGrades(filters.manufacturer_id, filters.model_id, filters.generation_id)
        .then(gradesData => {
          // Only update if this is the latest request and we have better data
          if (!cancelled && latestGradeRequest.current === requestId && Array.isArray(gradesData)) {
            // If we got real data with more variety than fallback, use it
            if (gradesData.length > fallback.length || 
                (gradesData.length > 0 && gradesData.some(g => g.count && g.count > 0))) {
              setGrades(gradesData);
            }
            // If gradesData is empty or worse than fallback, keep fallback
          }
          setIsLoadingGrades(false);
        })
        .catch((err) => {
          console.error('Grade fetch error:', err);
          setIsLoadingGrades(false);
          // Keep fallback on error
        });
    } else {
      setGrades([]);
      setIsLoadingGrades(false);
    }
    return () => { cancelled = true; };
  }, [filters.manufacturer_id, filters.model_id, filters.generation_id, onFetchGrades]);

  // AI Search handlers
  const handleAISearch = async () => {
    if (!aiSearchQuery.trim()) return;
    
    const result = await searchWithAI(aiSearchQuery);
    if (result) {
      // Apply AI-generated filters
      const aiFilters = { ...filters, ...result.filters };
      onFiltersChange(aiFilters);
      setShowSuggestions(true);
    }
  };

  const applySuggestion = async (suggestion: string) => {
    setAiSearchQuery(suggestion);
    const result = await searchWithAI(suggestion);
    if (result) {
      const aiFilters = { ...filters, ...result.filters };
      onFiltersChange(aiFilters);
    }
    setShowSuggestions(false);
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value && value !== 'all' && value !== 'any').length;
  }, [filters]);

  useEffect(() => {
    console.log(`[FilterForm] Rendering model dropdown. Models available: ${models.length}, disabled: ${!filters.manufacturer_id || isLoading}`);
  }, [models, filters.manufacturer_id, isLoading]);

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
      {/* Enhanced Header with Active Filter Count */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Smart Filter System</h3>
              <p className="text-sm text-muted-foreground">
                {activeFiltersCount > 0 ? `${activeFiltersCount} filters active` : 'Find your perfect car'}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters} 
            disabled={isLoading || activeFiltersCount === 0}
            className="text-xs"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <X className="h-3 w-3 mr-1" />
            )}
            Clear All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI-Powered Search Section */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">AI-Powered Search</Label>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 'Audi A6 2015 low mileage' or 'BMW diesel under €25,000'"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAISearch()}
                  className="h-9 text-sm"
                />
                <Button 
                  onClick={handleAISearch}
                  disabled={isSearching || !aiSearchQuery.trim()}
                  size="sm"
                  className="h-9 px-3 bg-primary hover:bg-primary/90"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* AI Suggestions */}
              {suggestions.length > 0 && showSuggestions && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-3 w-3 text-secondary" />
                    <span className="text-xs font-medium text-muted-foreground">Suggestions</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 text-xs"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Selection Section */}
        <Collapsible 
          open={expandedSections.vehicle} 
          onOpenChange={() => toggleSection('vehicle')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-auto">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                <span className="font-medium">Vehicle Selection</span>
              </div>
              {expandedSections.vehicle ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Primary Vehicle Filters - 2x2 Grid for better hierarchy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="manufacturer" className="text-sm font-medium flex items-center gap-2">
                  <span>Brand</span>
                  {filters.manufacturer_id && (
                    <Badge variant="secondary" className="text-xs">Selected</Badge>
                  )}
                </Label>
                <Select value={filters.manufacturer_id || 'all'} onValueChange={handleBrandChange} disabled={isLoading}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={isLoading ? "Loading..." : "Select Brand"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">All Brands</SelectItem>
                     {sortedManufacturers.length > 0 ? (
                       sortedManufacturers.map((manufacturer) => {
                         const count = filterCounts?.manufacturers[manufacturer.id.toString()];
                         return (
                           <SelectItem 
                             key={manufacturer.id} 
                             value={manufacturer.id.toString()}
                           >
                             <div className="flex items-center gap-2">
                               {manufacturer?.image && (
                                 <img
                                   src={manufacturer?.image}
                                   alt={manufacturer.name}
                                   className="w-5 h-5 object-contain"
                                 />
                               )}
                               <span>{manufacturer.name} ({manufacturer.cars_qty})</span>
                             </div>
                           </SelectItem>
                         );
                       })
                     ) : (
                       <SelectItem value="loading" disabled>
                         {isLoading ? "Loading..." : "No brands found"}
                       </SelectItem>
                     )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm font-medium flex items-center gap-2">
                  <span>Model</span>
                  {filters.model_id && (
                    <Badge variant="secondary" className="text-xs">Selected</Badge>
                  )}
                </Label>
                <Select 
                  value={filters.model_id || 'all'} 
                  onValueChange={(value) => updateFilter('model_id', value)}
                  disabled={!filters.manufacturer_id || isLoading}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={isLoading ? "Loading..." : (filters.manufacturer_id ? "Select Model" : "Select Brand First")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">All Models</SelectItem>
                    {models && models.length > 0 ? (
                      models
                        .filter((model) => model.cars_qty && model.cars_qty > 0)
                        .map((model) => (
                          <SelectItem 
                            key={model.id} 
                            value={model.id.toString()}
                          >
                            {model.name} ({model.cars_qty})
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        {isLoading ? "Loading..." : (filters.manufacturer_id ? "No models found" : "Select brand first")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="generation" className="text-sm font-medium flex items-center gap-2">
                  <span>Generation</span>
                  {filters.generation_id && (
                    <Badge variant="secondary" className="text-xs">Selected</Badge>
                  )}
                </Label>
                <Select
                  value={filters.generation_id || 'all'} 
                  onValueChange={(value) => {
                    if (onGenerationChange) {
                      onGenerationChange(value);
                    } else {
                      updateFilter('generation_id', value);
                    }
                  }}
                  disabled={!filters.manufacturer_id || !filters.model_id}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={filters.manufacturer_id ? "Select Generation" : "Select Brand First"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">
                      {filters.model_id ? "All Generations" : "All Generations (all models)"}
                    </SelectItem>
                  {generations && generations.length > 0 ? (
                    generations.map((generation) => {
                      const displayCount = generation.cars_qty || 0;
                      
                      return (
                        <SelectItem 
                          key={generation.id} 
                          value={generation.id.toString()}
                        >
                          {generation.name} 
                          {generation.from_year && generation.to_year ? ` (${generation.from_year}–${generation.to_year})` : ''}
                          {displayCount > 0 ? ` (${displayCount})` : ''}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-generations" disabled>
                      {filters.model_id ? "No generations found" : "Select model first"}
                    </SelectItem>
                  )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade" className="text-sm font-medium flex items-center gap-2">
                  <span>Grade/Engine</span>
                  {filters.grade_iaai && (
                    <Badge variant="secondary" className="text-xs">Selected</Badge>
                  )}
                </Label>
                <Select 
                  value={filters.grade_iaai || 'all'} 
                  onValueChange={(value) => updateFilter('grade_iaai', value)}
                  disabled={!filters.manufacturer_id || isLoading}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={filters.manufacturer_id ? "Select Grade" : "Select Brand First"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.length === 0 && isLoadingGrades ? (
                      <SelectItem value="loading" disabled>
                        Loading grades...
                      </SelectItem>
                    ) : grades.length === 0 && filters.manufacturer_id ? (
                      <SelectItem value="no-grades" disabled>
                        No grades found
                      </SelectItem>
                    ) : (
                      grades.map((grade) => (
                        <SelectItem key={grade.value} value={grade.value}>
                          {grade.label} {grade.count ? `(${grade.count})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Advanced Filters - Organized in Collapsible Sections */}
        <div className="space-y-3">
          {/* Specifications Section */}
          <Collapsible 
            open={expandedSections.specifications} 
            onOpenChange={() => toggleSection('specifications')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">Specifications</span>
                </div>
                {expandedSections.specifications ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-sm font-medium">Color</Label>
                  <Select value={filters.color || 'all'} onValueChange={(value) => updateFilter('color', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Colors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Colors</SelectItem>
                      {Object.entries(COLOR_OPTIONS).map(([name, id]) => {
                        return (
                          <SelectItem 
                            key={id} 
                            value={id.toString()}
                          >
                            {name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuel_type" className="text-sm font-medium">Fuel Type</Label>
                  <Select value={filters.fuel_type || 'all'} onValueChange={(value) => updateFilter('fuel_type', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(FUEL_TYPE_OPTIONS).map(([name, id]) => {
                        return (
                          <SelectItem 
                            key={id} 
                            value={id.toString()}
                          >
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transmission" className="text-sm font-medium">Transmission</Label>
                  <Select value={filters.transmission || 'all'} onValueChange={(value) => updateFilter('transmission', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(TRANSMISSION_OPTIONS).map(([name, id]) => {
                        return (
                          <SelectItem 
                            key={id} 
                            value={id.toString()}
                          >
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seats" className="text-sm font-medium">Seats</Label>
                  <Select value={filters.seats_count || 'all'} onValueChange={(value) => updateFilter('seats_count', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="2">2 Seats</SelectItem>
                      <SelectItem value="4">4 Seats</SelectItem>
                      <SelectItem value="5">5 Seats</SelectItem>
                      <SelectItem value="7">7 Seats</SelectItem>
                      <SelectItem value="8">8 Seats</SelectItem>
                      <SelectItem value="9">9+ Seats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from_year" className="text-sm font-medium">From Year</Label>
                  <Select value={filters.from_year || 'any'} onValueChange={(value) => updateFilter('from_year', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Any year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any year</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to_year" className="text-sm font-medium">To Year</Label>
                  <Select value={filters.to_year || 'any'} onValueChange={(value) => updateFilter('to_year', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Any year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any year</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Price Section */}
          <Collapsible 
            open={expandedSections.price} 
            onOpenChange={() => toggleSection('price')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium">Price & Mileage</span>
                </div>
                {expandedSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Price Range (Buy Now)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      className="h-10"
                      value={filters.buy_now_price_from || ''}
                      onChange={(e) => updateFilter('buy_now_price_from', e.target.value)}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      className="h-10"
                      value={filters.buy_now_price_to || ''}
                      onChange={(e) => updateFilter('buy_now_price_to', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mileage Range (km)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      className="h-10"
                      value={filters.odometer_from_km || ''}
                      onChange={(e) => updateFilter('odometer_from_km', e.target.value)}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      className="h-10"
                      value={filters.odometer_to_km || ''}
                      onChange={(e) => updateFilter('odometer_to_km', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Condition Section */}
          <Collapsible 
            open={expandedSections.condition} 
            onOpenChange={() => toggleSection('condition')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Condition</span>
                </div>
                {expandedSections.condition ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label htmlFor="max_accidents" className="text-sm font-medium">Maximum Accidents</Label>
                <Select value={maxAccidents} onValueChange={(value) => {
                  setMaxAccidents(value);
                  updateFilter('max_accidents', value);
                }}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="0">No accidents</SelectItem>
                    <SelectItem value="1">Maximum 1 accident</SelectItem>
                    <SelectItem value="2">Maximum 2 accidents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </div>
  );
});

FilterForm.displayName = 'FilterForm';

export default FilterForm;