import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, AlertCircle, Filter, Search, Grid, List, SlidersHorizontal, X, Eye, Heart, Car } from "lucide-react";
import { useEncarAPI, type Car as EncarCar, type Manufacturer } from "@/hooks/useEncarAPI";
import { useInView } from "react-intersection-observer";
import CarCard from "./CarCard";

const EnhancedCatalog = () => {
  const {
    cars,
    allCars,
    manufacturers,
    loading,
    error,
    totalPages,
    currentPage,
    hasMore,
    loadAllCars,
    loadMoreCars,
    filterCars
  } = useEncarAPI();

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearRange, setYearRange] = useState<[number, number]>([2015, 2024]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [mileageRange, setMileageRange] = useState<[number, number]>([0, 300000]);
  const [selectedFuel, setSelectedFuel] = useState<string>('');
  const [selectedTransmission, setSelectedTransmission] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [sortBy, setSortBy] = useState<'price' | 'year' | 'mileage' | 'make'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  // Load more cars when scrolling to bottom
  useEffect(() => {
    if (inView && hasMore && !loading && cars.length > 0) {
      loadMoreCars(50);
    }
  }, [inView, hasMore, loading, cars.length, loadMoreCars]);

  // Initial load
  useEffect(() => {
    loadAllCars();
  }, [loadAllCars]);

  // Apply filters when they change
  useEffect(() => {
    if (allCars.length > 0) {
      const filters = {
        make: selectedMakes,
        yearRange,
        priceRange,
        mileageRange,
        fuel: selectedFuel,
        transmission: selectedTransmission,
        condition: selectedCondition
      };
      filterCars(filters);
    }
  }, [
    selectedMakes,
    yearRange,
    priceRange,
    mileageRange,
    selectedFuel,
    selectedTransmission,
    selectedCondition,
    allCars.length,
    filterCars
  ]);

  // Search functionality
  const searchedCars = useMemo(() => {
    if (!searchQuery.trim()) return cars;
    
    const query = searchQuery.toLowerCase();
    return cars.filter(car => 
      car.make.toLowerCase().includes(query) ||
      car.model.toLowerCase().includes(query) ||
      car.year.toString().includes(query) ||
      car.vin?.toLowerCase().includes(query)
    );
  }, [cars, searchQuery]);

  // Sort cars
  const sortedCars = useMemo(() => {
    const sorted = [...searchedCars].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'year':
          comparison = a.year - b.year;
          break;
        case 'mileage':
          if (typeof a.mileage === 'number' && typeof b.mileage === 'number') {
            comparison = a.mileage - b.mileage;
          }
          break;
        case 'make':
          comparison = a.make.localeCompare(b.make);
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }, [searchedCars, sortBy, sortOrder]);

  // Get unique values for filters
  const uniqueFuels = useMemo(() => 
    [...new Set(allCars.map(car => car.fuel).filter(Boolean))].sort(),
    [allCars]
  );

  const uniqueTransmissions = useMemo(() => 
    [...new Set(allCars.map(car => car.transmission).filter(Boolean))].sort(),
    [allCars]
  );

  const uniqueConditions = useMemo(() => 
    [...new Set(allCars.map(car => car.condition).filter(Boolean))].sort(),
    [allCars]
  );

  // Premium brand filter (Audi, BMW, Mercedes-Benz, Volkswagen 2015+)
  const applyPremiumFilter = useCallback(() => {
    setSelectedMakes(['Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen']);
    setYearRange([2015, 2024]);
    setSelectedCondition('Good');
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedMakes([]);
    setSearchQuery('');
    setYearRange([2015, 2024]);
    setPriceRange([0, 200000]);
    setMileageRange([0, 300000]);
    setSelectedFuel('');
    setSelectedTransmission('');
    setSelectedCondition('');
    setSortBy('price');
    setSortOrder('asc');
  }, []);

  const toggleMake = useCallback((make: string) => {
    setSelectedMakes(prev => 
      prev.includes(make) 
        ? prev.filter(m => m !== make)
        : [...prev, make]
    );
  }, []);

  // Transform EncarCar to CarCard format
  const transformCarForCard = useCallback((car: EncarCar) => ({
    id: car.id,
    make: car.make,
    model: car.model,
    year: car.year,
    price: car.price,
    image: car.imageUrl,
    vin: car.vin,
    mileage: typeof car.mileage === 'number' ? `${car.mileage.toLocaleString()} km` : car.mileage,
    transmission: car.transmission,
    fuel: car.fuel,
    color: car.color,
    condition: car.condition,
    lot: car.lot,
    title: car.title
  }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-8xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Premium Car Catalog
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover our extensive collection of premium vehicles. Browse over 10,000+ cars with advanced filtering and real-time updates.
          </p>
          
          {/* Stats Bar */}
          <div className="flex justify-center items-center gap-6 mt-6 flex-wrap">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Car className="h-4 w-4 mr-2" />
              {sortedCars.length.toLocaleString()} cars available
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <Eye className="h-4 w-4 mr-2" />
              Real-time updates
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <Heart className="h-4 w-4 mr-2" />
              Premium quality
            </Badge>
          </div>
        </div>

        {/* Search and Quick Actions */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by make, model, year, or VIN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={applyPremiumFilter}
                  className="shadow-sm"
                >
                  Premium Brands 2015+
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="shadow-sm"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="shadow-sm"
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-8 shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Advanced Filters
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Make Filter */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Make</label>
                  <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-3 bg-muted/20">
                    {manufacturers.map(manufacturer => (
                      <label key={manufacturer.id} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 rounded p-1">
                        <input
                          type="checkbox"
                          checked={selectedMakes.includes(manufacturer.name)}
                          onChange={() => toggleMake(manufacturer.name)}
                          className="rounded"
                        />
                        <span className="text-sm">{manufacturer.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Year Range */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Year Range: {yearRange[0]} - {yearRange[1]}
                  </label>
                  <Slider
                    value={yearRange}
                    onValueChange={(value) => setYearRange(value as [number, number])}
                    min={1990}
                    max={2024}
                    step={1}
                    className="mt-4"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Price Range: €{priceRange[0].toLocaleString()} - €{priceRange[1].toLocaleString()}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    min={0}
                    max={500000}
                    step={5000}
                    className="mt-4"
                  />
                </div>

                {/* Mileage Range */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Mileage Range: {mileageRange[0].toLocaleString()} - {mileageRange[1].toLocaleString()} km
                  </label>
                  <Slider
                    value={mileageRange}
                    onValueChange={(value) => setMileageRange(value as [number, number])}
                    min={0}
                    max={500000}
                    step={10000}
                    className="mt-4"
                  />
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Fuel Type</label>
                  <Select value={selectedFuel} onValueChange={setSelectedFuel}>
                    <SelectTrigger>
                      <SelectValue placeholder="All fuel types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All fuel types</SelectItem>
                      {uniqueFuels.map(fuel => (
                        <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Transmission */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Transmission</label>
                  <Select value={selectedTransmission} onValueChange={setSelectedTransmission}>
                    <SelectTrigger>
                      <SelectValue placeholder="All transmissions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All transmissions</SelectItem>
                      {uniqueTransmissions.map(transmission => (
                        <SelectItem key={transmission} value={transmission}>{transmission}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Condition */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Condition</label>
                  <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="All conditions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All conditions</SelectItem>
                      {uniqueConditions.map(condition => (
                        <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Sort By</label>
                  <div className="space-y-2">
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                        <SelectItem value="mileage">Mileage</SelectItem>
                        <SelectItem value="make">Make</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Low to High</SelectItem>
                        <SelectItem value="desc">High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800">
                  API connection issue: {error}. Showing demo data with full inspection service available.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              {sortedCars.length.toLocaleString()} Results
            </h2>
            {selectedMakes.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selectedMakes.map(make => (
                  <Badge key={make} variant="secondary" className="px-3 py-1">
                    {make}
                    <button
                      onClick={() => toggleMake(make)}
                      className="ml-2 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <Button variant="outline" onClick={() => loadAllCars()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Car Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCars.map(car => (
              <CarCard key={car.id} {...transformCarForCard(car)} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCars.map(car => (
              <Card key={car.id} className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <img
                      src={car.imageUrl}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      className="w-32 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">
                        {car.year} {car.make} {car.model}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>Price: €{car.price.toLocaleString()}</div>
                        <div>Mileage: {typeof car.mileage === 'number' ? car.mileage.toLocaleString() : car.mileage} km</div>
                        <div>Fuel: {car.fuel}</div>
                        <div>Transmission: {car.transmission}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Loading more cars...</span>
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {hasMore && !loading && (
          <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
            <span className="text-muted-foreground">Scroll for more...</span>
          </div>
        )}

        {/* End of Results */}
        {!hasMore && !loading && sortedCars.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">You've reached the end of the results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCatalog;