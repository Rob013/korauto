// Enhanced Car Filter Component matching Encar.com's comprehensive filtering system
import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AdaptiveSelect } from '@/components/ui/adaptive-select';
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
  DollarSign
} from 'lucide-react';
import { 
  PRICE_PRESETS, 
  MILEAGE_PRESETS,
  KOREAN_MANUFACTURERS,
  INTERNATIONAL_MANUFACTURERS
} from '@/constants/carOptions';
import type { CarFilters, FilterOptions } from '@/services/externalCarAPI';

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

export const EnhancedCarFilter: React.FC<EnhancedCarFilterProps> = ({
  filters,
  filterOptions,
  onFiltersChange,
  onResetFilters,
  loadingFilters = false,
  totalResults = 0,
  className = ''
}) => {
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'manufacturer', 'price', 'year'
  ]);

  // Filter sections configuration
  const filterSections: FilterSection[] = [
    {
      key: 'manufacturer',
      title: 'Brand & Model',
      icon: <Car className="w-4 h-4" />,
      expanded: expandedSections.includes('manufacturer')
    },
    {
      key: 'price',
      title: 'Price Range',
      icon: <DollarSign className="w-4 h-4" />,
      expanded: expandedSections.includes('price')
    },
    {
      key: 'year',
      title: 'Year & Generation',
      icon: <Calendar className="w-4 h-4" />,
      expanded: expandedSections.includes('year')
    },
    {
      key: 'technical',
      title: 'Technical Specs',
      icon: <Settings className="w-4 h-4" />,
      expanded: expandedSections.includes('technical')
    },
    {
      key: 'appearance',
      title: 'Appearance',
      icon: <Palette className="w-4 h-4" />,
      expanded: expandedSections.includes('appearance')
    },
    {
      key: 'location',
      title: 'Location & Features',
      icon: <MapPin className="w-4 h-4" />,
      expanded: expandedSections.includes('location')
    }
  ];

  // Toggle section expansion
  const toggleSection = useCallback((sectionKey: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionKey)
        ? prev.filter(key => key !== sectionKey)
        : [...prev, sectionKey]
    );
  }, []);

  // Update filter helper
  const updateFilter = useCallback((key: keyof CarFilters, value: any) => {
    const newFilters = { ...filters };
    
    if (value === '' || value === 'all' || value === undefined || value === null) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    // Reset dependent filters when parent changes
    if (key === 'manufacturer_id') {
      delete newFilters.model_id;
      delete newFilters.generation_id;
      delete newFilters.trim;
      delete newFilters.grade;
    } else if (key === 'model_id') {
      delete newFilters.generation_id;
      delete newFilters.trim;
      delete newFilters.grade;
    } else if (key === 'generation_id') {
      delete newFilters.trim;
      delete newFilters.grade;
    }
    
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Price range handlers
  const handlePriceRangeChange = useCallback((values: number[]) => {
    const newFilters = { ...filters };
    newFilters.price_from = values[0];
    newFilters.price_to = values[1];
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handlePricePreset = useCallback((preset: { min: number; max: number }) => {
    const newFilters = { ...filters };
    newFilters.price_from = preset.min;
    newFilters.price_to = preset.max;
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Mileage range handlers
  const handleMileageRangeChange = useCallback((values: number[]) => {
    const newFilters = { ...filters };
    newFilters.mileage_from = values[0];
    newFilters.mileage_to = values[1];
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleMileagePreset = useCallback((preset: { min: number; max: number }) => {
    const newFilters = { ...filters };
    newFilters.mileage_from = preset.min;
    newFilters.mileage_to = preset.max;
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Year range handlers
  const handleYearRangeChange = useCallback((values: number[]) => {
    const newFilters = { ...filters };
    newFilters.year_from = values[0];
    newFilters.year_to = values[1];
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== '' &&
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  }, [filters]);

  // Organized manufacturer options
  const manufacturerOptions = useMemo(() => {
    const allManufacturers = [...filterOptions.manufacturers];
    
    // Separate Korean and international brands
    const koreanBrands = allManufacturers.filter(m => 
      Object.values(KOREAN_MANUFACTURERS).some(km => km.name === m.name)
    );
    const internationalBrands = allManufacturers.filter(m => 
      Object.values(INTERNATIONAL_MANUFACTURERS).some(im => im.name === m.name)
    );
    const otherBrands = allManufacturers.filter(m => 
      !koreanBrands.some(kb => kb.id === m.id) && 
      !internationalBrands.some(ib => ib.id === m.id)
    );

    return [
      { value: 'all', label: 'All Brands' },
      ...(koreanBrands.length > 0 ? [
        { value: 'separator-korean', label: '── Korean Brands ──', disabled: true },
        ...koreanBrands.map(m => ({ value: m.id, label: `${m.name} (${m.count || 0})` }))
      ] : []),
      ...(internationalBrands.length > 0 ? [
        { value: 'separator-international', label: '── International Brands ──', disabled: true },
        ...internationalBrands.map(m => ({ value: m.id, label: `${m.name} (${m.count || 0})` }))
      ] : []),
      ...(otherBrands.length > 0 ? [
        { value: 'separator-other', label: '── Other Brands ──', disabled: true },
        ...otherBrands.map(m => ({ value: m.id, label: `${m.name} (${m.count || 0})` }))
      ] : [])
    ];
  }, [filterOptions.manufacturers]);

  // Model options
  const modelOptions = useMemo(() => [
    { value: 'all', label: 'All Models' },
    ...filterOptions.models.map(m => ({ 
      value: m.id, 
      label: `${m.name} (${m.count || 0})` 
    }))
  ], [filterOptions.models]);

  // Generation options
  const generationOptions = useMemo(() => [
    { value: 'all', label: 'All Generations' },
    ...filterOptions.generations.map(g => ({ 
      value: g.id, 
      label: `${g.name} (${g.from_year}-${g.to_year}) - ${g.count || 0} cars` 
    }))
  ], [filterOptions.generations]);

  // Categorized grade options
  const gradeOptions = useMemo(() => {
    const categorized = filterOptions.grades.reduce((acc, grade) => {
      const category = grade.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(grade);
      return acc;
    }, {} as { [category: string]: typeof filterOptions.grades });

    const result = [{ value: 'all', label: 'All Grades' }];
    
    Object.entries(categorized).forEach(([category, grades]) => {
      if (grades.length > 0) {
        result.push({ value: `separator-${category}`, label: `── ${category} ──`, disabled: true });
        result.push(...grades.map(g => ({ 
          value: g.id, 
          label: `${g.name} (${g.count || 0})` 
        })));
      }
    });

    return result;
  }, [filterOptions.grades]);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle className="text-lg">Filter Cars</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onResetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
        {totalResults > 0 && (
          <p className="text-sm text-muted-foreground">
            {totalResults.toLocaleString()} cars found
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {filterSections.map((section) => (
          <Collapsible
            key={section.key}
            open={section.expanded}
            onOpenChange={() => toggleSection(section.key)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full justify-between p-2 font-medium"
              >
                <div className="flex items-center gap-2">
                  {section.icon}
                  {section.title}
                </div>
                {section.expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-3 mt-2">
              {/* Brand & Model Section */}
              {section.key === 'manufacturer' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Brand</Label>
                    <AdaptiveSelect
                      value={filters.manufacturer_id || 'all'}
                      onValueChange={(value) => updateFilter('manufacturer_id', value)}
                      options={manufacturerOptions}
                      placeholder="Select brand..."
                      loading={loadingFilters}
                      className="mt-1"
                    />
                  </div>

                  {filters.manufacturer_id && filterOptions.models.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Model</Label>
                      <AdaptiveSelect
                        value={filters.model_id || 'all'}
                        onValueChange={(value) => updateFilter('model_id', value)}
                        options={modelOptions}
                        placeholder="Select model..."
                        loading={loadingFilters}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {filters.model_id && filterOptions.generations.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Generation</Label>
                      <AdaptiveSelect
                        value={filters.generation_id || 'all'}
                        onValueChange={(value) => updateFilter('generation_id', value)}
                        options={generationOptions}
                        placeholder="Select generation..."
                        loading={loadingFilters}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {filters.model_id && filterOptions.trims.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Trim Level</Label>
                      <AdaptiveSelect
                        value={filters.trim || 'all'}
                        onValueChange={(value) => updateFilter('trim', value)}
                        options={[
                          { value: 'all', label: 'All Trims' },
                          ...filterOptions.trims.map(t => ({ 
                            value: t.id, 
                            label: `${t.name} (${t.count || 0})` 
                          }))
                        ]}
                        placeholder="Select trim..."
                        loading={loadingFilters}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {filters.model_id && filterOptions.grades.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Grade / Engine</Label>
                      <AdaptiveSelect
                        value={filters.grade || 'all'}
                        onValueChange={(value) => updateFilter('grade', value)}
                        options={gradeOptions}
                        placeholder="Select grade..."
                        loading={loadingFilters}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Price Range Section */}
              {section.key === 'price' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Price Range</Label>
                    <div className="mt-2">
                      <Slider
                        value={[filters.price_from || 0, filters.price_to || 200000]}
                        onValueChange={handlePriceRangeChange}
                        max={200000}
                        step={1000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>€{(filters.price_from || 0).toLocaleString()}</span>
                        <span>€{(filters.price_to || 200000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {PRICE_PRESETS.map((preset, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePricePreset(preset)}
                          className="text-xs"
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Year & Generation Section */}
              {section.key === 'year' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Year Range</Label>
                    <div className="mt-2">
                      <Slider
                        value={[filters.year_from || 2000, filters.year_to || 2024]}
                        onValueChange={handleYearRangeChange}
                        min={2000}
                        max={2024}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{filters.year_from || 2000}</span>
                        <span>{filters.year_to || 2024}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Mileage Range</Label>
                    <div className="mt-2">
                      <Slider
                        value={[filters.mileage_from || 0, filters.mileage_to || 300000]}
                        onValueChange={handleMileageRangeChange}
                        max={300000}
                        step={5000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{(filters.mileage_from || 0).toLocaleString()} km</span>
                        <span>{(filters.mileage_to || 300000).toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Mileage Presets</Label>
                    <div className="grid grid-cols-1 gap-1 mt-2">
                      {MILEAGE_PRESETS.map((preset, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleMileagePreset(preset)}
                          className="text-xs justify-start"
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Specs Section */}
              {section.key === 'technical' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Body Type</Label>
                    <AdaptiveSelect
                      value={filters.body_type || 'all'}
                      onValueChange={(value) => updateFilter('body_type', value)}
                      options={[
                        { value: 'all', label: 'All Body Types' },
                        ...filterOptions.bodyTypes.map(bt => ({ 
                          value: bt.id, 
                          label: `${bt.name} (${bt.count || 0})` 
                        }))
                      ]}
                      placeholder="Select body type..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Fuel Type</Label>
                    <AdaptiveSelect
                      value={filters.fuel_type || 'all'}
                      onValueChange={(value) => updateFilter('fuel_type', value)}
                      options={[
                        { value: 'all', label: 'All Fuel Types' },
                        ...filterOptions.fuelTypes.map(ft => ({ 
                          value: ft.id, 
                          label: `${ft.name} (${ft.count || 0})` 
                        }))
                      ]}
                      placeholder="Select fuel type..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Transmission</Label>
                    <AdaptiveSelect
                      value={filters.transmission || 'all'}
                      onValueChange={(value) => updateFilter('transmission', value)}
                      options={[
                        { value: 'all', label: 'All Transmissions' },
                        ...filterOptions.transmissions.map(t => ({ 
                          value: t.id, 
                          label: `${t.name} (${t.count || 0})` 
                        }))
                      ]}
                      placeholder="Select transmission..."
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Appearance Section */}
              {section.key === 'appearance' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Color</Label>
                    <AdaptiveSelect
                      value={filters.color || 'all'}
                      onValueChange={(value) => updateFilter('color', value)}
                      options={[
                        { value: 'all', label: 'All Colors' },
                        ...filterOptions.colors.map(c => ({ 
                          value: c.id, 
                          label: `${c.name} (${c.count || 0})` 
                        }))
                      ]}
                      placeholder="Select color..."
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Location Section */}
              {section.key === 'location' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <AdaptiveSelect
                      value={filters.location || 'all'}
                      onValueChange={(value) => updateFilter('location', value)}
                      options={[
                        { value: 'all', label: 'All Locations' },
                        ...filterOptions.locations.map(l => ({ 
                          value: l.id, 
                          label: `${l.name} (${l.count || 0})` 
                        }))
                      ]}
                      placeholder="Select location..."
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </CollapsibleContent>

            {section.key !== 'location' && <Separator className="my-2" />}
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
};