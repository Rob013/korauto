import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Fuel,
  Settings2
} from 'lucide-react';
import LazyCarCard from '@/components/LazyCarCard';
import { catalogDummyData, filterOptions } from '@/data/dummyCatalogData';

interface FilterState {
  search: string;
  manufacturer: string[];
  model: string[];
  fuelType: string[];
  drivetrain: string[];
  yearMin: number;
  yearMax: number;
  priceMin: number;
  priceMax: number;
}

interface SortOption {
  value: string;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Year: Newest First' },
  { value: 'year_asc', label: 'Year: Oldest First' },
  { value: 'mileage_asc', label: 'Mileage: Low to High' },
  { value: 'mileage_desc', label: 'Mileage: High to Low' },
];

const EnhancedCarCatalog: React.FC = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState('price_asc');
  const [expandedSections, setExpandedSections] = useState<string[]>(['manufacturer', 'fuel']);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    manufacturer: [],
    model: [],
    fuelType: [],
    drivetrain: [],
    yearMin: filterOptions.yearRange.min,
    yearMax: filterOptions.yearRange.max,
    priceMin: filterOptions.priceRange.min,
    priceMax: filterOptions.priceRange.max,
  });

  // Filter and sort cars
  const filteredAndSortedCars = useMemo(() => {
    let result = [...catalogDummyData];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(car => 
        car.make.toLowerCase().includes(searchLower) ||
        car.model.toLowerCase().includes(searchLower) ||
        car.title.toLowerCase().includes(searchLower)
      );
    }

    if (filters.manufacturer.length > 0) {
      result = result.filter(car => filters.manufacturer.includes(car.make));
    }

    if (filters.model.length > 0) {
      result = result.filter(car => filters.model.includes(car.model));
    }

    if (filters.fuelType.length > 0) {
      result = result.filter(car => filters.fuelType.includes(car.fuel));
    }

    if (filters.drivetrain.length > 0) {
      result = result.filter(car => filters.drivetrain.includes(car.drivetrain));
    }

    // Year range
    result = result.filter(car => 
      car.year >= filters.yearMin && car.year <= filters.yearMax
    );

    // Price range
    result = result.filter(car => 
      car.price >= filters.priceMin && car.price <= filters.priceMax
    );

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'year_desc':
          return b.year - a.year;
        case 'year_asc':
          return a.year - b.year;
        case 'mileage_asc':
          return parseInt(a.mileage.replace(/[^\d]/g, '')) - parseInt(b.mileage.replace(/[^\d]/g, ''));
        case 'mileage_desc':
          return parseInt(b.mileage.replace(/[^\d]/g, '')) - parseInt(a.mileage.replace(/[^\d]/g, ''));
        default:
          return 0;
      }
    });

    return result;
  }, [filters, sortBy]);

  const handleFilterChange = (key: keyof FilterState, value: string | string[] | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      manufacturer: [],
      model: [],
      fuelType: [],
      drivetrain: [],
      yearMin: filterOptions.yearRange.min,
      yearMax: filterOptions.yearRange.max,
      priceMin: filterOptions.priceRange.min,
      priceMax: filterOptions.priceRange.max,
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return value !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (key === 'yearMin') return value !== filterOptions.yearRange.min;
    if (key === 'yearMax') return value !== filterOptions.yearRange.max;
    if (key === 'priceMin') return value !== filterOptions.priceRange.min;
    if (key === 'priceMax') return value !== filterOptions.priceRange.max;
    return false;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Car Catalog</h1>
          <p className="text-gray-600">{filteredAndSortedCars.length} cars available</p>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary">{activeFiltersCount}</Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="w-full mb-4">
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}

                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search make, model..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Manufacturer */}
                  <div>
                    <button
                      onClick={() => toggleSection('manufacturer')}
                      className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                    >
                      Manufacturer
                      {expandedSections.includes('manufacturer') ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </button>
                    {expandedSections.includes('manufacturer') && (
                      <div className="space-y-2">
                        {filterOptions.manufacturers.map((manufacturer) => (
                          <div key={manufacturer} className="flex items-center space-x-2">
                            <Checkbox
                              id={`manufacturer-${manufacturer}`}
                              checked={filters.manufacturer.includes(manufacturer)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleFilterChange('manufacturer', [...filters.manufacturer, manufacturer]);
                                } else {
                                  handleFilterChange('manufacturer', filters.manufacturer.filter(m => m !== manufacturer));
                                }
                              }}
                            />
                            <label
                              htmlFor={`manufacturer-${manufacturer}`}
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              {manufacturer}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <button
                      onClick={() => toggleSection('fuel')}
                      className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4" />
                        Fuel Type
                      </div>
                      {expandedSections.includes('fuel') ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </button>
                    {expandedSections.includes('fuel') && (
                      <div className="space-y-2">
                        {filterOptions.fuelTypes.map((fuel) => (
                          <div key={fuel} className="flex items-center space-x-2">
                            <Checkbox
                              id={`fuel-${fuel}`}
                              checked={filters.fuelType.includes(fuel)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleFilterChange('fuelType', [...filters.fuelType, fuel]);
                                } else {
                                  handleFilterChange('fuelType', filters.fuelType.filter(f => f !== fuel));
                                }
                              }}
                            />
                            <label
                              htmlFor={`fuel-${fuel}`}
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              {fuel}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Drivetrain */}
                  <div>
                    <button
                      onClick={() => toggleSection('drivetrain')}
                      className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Drivetrain
                      </div>
                      {expandedSections.includes('drivetrain') ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </button>
                    {expandedSections.includes('drivetrain') && (
                      <div className="space-y-2">
                        {filterOptions.drivetrains.map((drivetrain) => (
                          <div key={drivetrain} className="flex items-center space-x-2">
                            <Checkbox
                              id={`drivetrain-${drivetrain}`}
                              checked={filters.drivetrain.includes(drivetrain)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleFilterChange('drivetrain', [...filters.drivetrain, drivetrain]);
                                } else {
                                  handleFilterChange('drivetrain', filters.drivetrain.filter(d => d !== drivetrain));
                                }
                              }}
                            />
                            <label
                              htmlFor={`drivetrain-${drivetrain}`}
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              {drivetrain}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Year Range */}
                  <div>
                    <button
                      onClick={() => toggleSection('year')}
                      className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                    >
                      Year Range
                      {expandedSections.includes('year') ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </button>
                    {expandedSections.includes('year') && (
                      <div className="space-y-3">
                        <Slider
                          value={[filters.yearMin, filters.yearMax]}
                          onValueChange={([min, max]) => {
                            handleFilterChange('yearMin', min);
                            handleFilterChange('yearMax', max);
                          }}
                          min={filterOptions.yearRange.min}
                          max={filterOptions.yearRange.max}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{filters.yearMin}</span>
                          <span>{filters.yearMax}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price Range */}
                  <div>
                    <button
                      onClick={() => toggleSection('price')}
                      className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                    >
                      Price Range (€)
                      {expandedSections.includes('price') ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </button>
                    {expandedSections.includes('price') && (
                      <div className="space-y-3">
                        <Slider
                          value={[filters.priceMin, filters.priceMax]}
                          onValueChange={([min, max]) => {
                            handleFilterChange('priceMin', min);
                            handleFilterChange('priceMax', max);
                          }}
                          min={filterOptions.priceRange.min}
                          max={filterOptions.priceRange.max}
                          step={1000}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>€{filters.priceMin.toLocaleString()}</span>
                          <span>€{filters.priceMax.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Top Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                {!showFilters && (
                  <Button variant="outline" onClick={() => setShowFilters(true)}>
                    <Filter className="h-4 w-4 mr-2" />
                    Show Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-gray-500" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Cars Grid */}
            {filteredAndSortedCars.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No cars found matching your criteria.</p>
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedCars.map((car) => (
                  <LazyCarCard
                    key={car.id}
                    id={car.id}
                    make={car.make}
                    model={car.model}
                    year={car.year}
                    price={car.price}
                    image={car.images?.[0]}
                    images={car.images}
                    mileage={car.mileage}
                    transmission={car.transmission}
                    fuel={car.fuel}
                    color={car.color}
                    location={car.location}
                    drivetrain={car.drivetrain}
                    lot={car.id}
                    title={car.title}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCarCatalog;