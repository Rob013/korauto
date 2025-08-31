import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { Loader2, Search, Car, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingLogo from "@/components/LoadingLogo";
import LazyCarCard from "@/components/LazyCarCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface DatabaseCatalogProps {
  highlightCarId?: string | null;
}

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: string;
  fuel?: string;
  transmission?: string;
  color?: string;
  images?: any;
  created_at?: string;
}

const sortOptions = [
  { value: 'created_at_desc', label: 'Recently Added' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_asc', label: 'Year: Old to New' },
  { value: 'year_desc', label: 'Year: New to Old' },
];

export const DatabaseCatalog = ({ highlightCarId }: DatabaseCatalogProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for cars and loading
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedMake, setSelectedMake] = useState(searchParams.get('make') || '');
  const [selectedModel, setSelectedModel] = useState(searchParams.get('model') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at_desc');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  
  // UI state
  const [showFilters, setShowFilters] = useState(!isMobile);

  // Pagination
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Load all cars from database
  const loadAllCars = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('cars_cache')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading cars:', error);
        toast({
          title: "Error loading cars",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const carsData: Car[] = data?.map(car => ({
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price || 0,
        mileage: car.mileage,
        fuel: car.fuel,
        transmission: car.transmission,
        color: car.color,
        images: car.images,
        created_at: car.created_at
      })) || [];

      setCars(carsData);
      
    } catch (error) {
      console.error('Error in loadAllCars:', error);
      toast({
        title: "Error loading cars", 
        description: "Failed to load cars from database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Apply filters to cars
  const applyFilters = useCallback(() => {
    let filtered = [...cars];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(car =>
        car.make?.toLowerCase().includes(searchLower) ||
        car.model?.toLowerCase().includes(searchLower)
      );
    }

    // Make filter  
    if (selectedMake && selectedMake !== 'all') {
      filtered = filtered.filter(car => car.make === selectedMake);
    }

    // Model filter
    if (selectedModel && selectedModel !== 'all') {
      filtered = filtered.filter(car => car.model === selectedModel);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'year_asc':
          return a.year - b.year;
        case 'year_desc':
          return b.year - a.year;
        case 'created_at_desc':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    setFilteredCars(filtered);
    setTotalCount(filtered.length);
    setCurrentPage(1); // Reset to first page when filters change
  }, [cars, searchTerm, selectedMake, selectedModel, sortBy]);

  // Get paginated cars for display
  const paginatedCars = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredCars.slice(startIndex, endIndex);
  }, [filteredCars, currentPage]);

  // Get available makes and models
  const availableMakes = useMemo(() => {
    const makes = [...new Set(cars.map(car => car.make).filter(Boolean))].sort();
    return makes.map(make => ({
      value: make,
      label: `${make} (${cars.filter(car => car.make === make).length})`
    }));
  }, [cars]);

  const availableModels = useMemo(() => {
    if (!selectedMake || selectedMake === 'all') return [];
    const models = [...new Set(
      cars.filter(car => car.make === selectedMake)
        .map(car => car.model)
        .filter(Boolean)
    )].sort();
    
    return models.map(model => ({
      value: model,
      label: `${model} (${cars.filter(car => car.make === selectedMake && car.model === model).length})`
    }));
  }, [cars, selectedMake]);

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const newParams = new URLSearchParams();
    
    if (searchTerm) newParams.set('q', searchTerm);
    if (selectedMake && selectedMake !== 'all') newParams.set('make', selectedMake);
    if (selectedModel && selectedModel !== 'all') newParams.set('model', selectedModel);
    if (sortBy !== 'created_at_desc') newParams.set('sort', sortBy);
    if (currentPage > 1) newParams.set('page', currentPage.toString());

    setSearchParams(newParams);
  }, [searchTerm, selectedMake, selectedModel, sortBy, currentPage, setSearchParams]);

  // Effects
  useEffect(() => {
    loadAllCars();
  }, [loadAllCars]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleMakeChange = (make: string) => {
    setSelectedMake(make);
    setSelectedModel(''); // Reset model when make changes
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMake('');
    setSelectedModel('');
    setSortBy('created_at_desc');
    setCurrentPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedMake && selectedMake !== 'all') count++;
    if (selectedModel && selectedModel !== 'all') count++;
    return count;
  }, [searchTerm, selectedMake, selectedModel]);

  return (
    <div className="container-responsive py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cars Catalog</h1>
          <Badge variant="secondary">
            {totalCount.toLocaleString()} cars
          </Badge>
        </div>

        {/* Mobile filter toggle */}
        {isMobile && (
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
            )}
          </Button>
        )}

        {/* Filters */}
        <div className={cn(
          "grid gap-4",
          isMobile ? (showFilters ? 'grid-cols-1' : 'hidden') : 'grid-cols-1 md:grid-cols-5'
        )}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cars..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Make filter */}
          <AdaptiveSelect
            value={selectedMake}
            onValueChange={handleMakeChange}
            placeholder="All Makes"
            options={[
              { value: 'all', label: 'All Makes' },
              ...availableMakes,
            ]}
          />

          {/* Model filter */}
          <AdaptiveSelect
            value={selectedModel}
            onValueChange={handleModelChange}
            placeholder="All Models"
            disabled={!selectedMake || selectedMake === 'all'}
            options={[
              { value: 'all', label: 'All Models' },
              ...availableModels,
            ]}
          />

          {/* Sort */}
          <AdaptiveSelect
            value={sortBy}
            onValueChange={handleSortChange}
            placeholder="Sort by"
            options={sortOptions}
          />

          {/* Clear filters */}
          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active filters display */}
        {(selectedMake || selectedModel || searchTerm) && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary">
                Search: {searchTerm}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleSearch('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedMake && selectedMake !== 'all' && (
              <Badge variant="secondary">
                Make: {selectedMake}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleMakeChange('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedModel && selectedModel !== 'all' && (
              <Badge variant="secondary">
                Model: {selectedModel}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleModelChange('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingLogo />
          <p className="text-muted-foreground mt-4">Loading cars...</p>
        </div>
      )}

      {/* Cars grid */}
      {!isLoading && paginatedCars.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {paginatedCars.map((car) => (
              <LazyCarCard
                key={car.id}
                id={car.id}
                make={car.make}
                model={car.model}
                year={car.year}
                price={car.price}
                mileage={car.mileage}
                image={car.images && car.images.length > 0 ? 
                  (typeof car.images[0] === 'string' ? car.images[0] : car.images[0]?.url) : 
                  undefined
                }
                title={`${car.year} ${car.make} ${car.model}`}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, currentPage - 2) + i;
                  if (page > totalPages) return null;
                  
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* No results */}
      {!isLoading && paginatedCars.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Car className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No cars found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Try adjusting your filters to find more results.
          </p>
          <Button onClick={clearFilters}>Clear All Filters</Button>
        </div>
      )}
    </div>
  );
};