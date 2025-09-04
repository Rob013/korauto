import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  X, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import LazyCarCard from '@/components/LazyCarCard';
import { fetchCarsWithKeyset, SortOption as CarsApiSortOption } from '@/services/carsApi';
import { useCurrencyAPI } from '@/hooks/useCurrencyAPI';

interface NewEncarCatalogProps {
  highlightCarId?: string | null;
  className?: string;
}

const SORT_OPTIONS: Array<{value: CarsApiSortOption, label: string}> = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Year: Newest First' },
  { value: 'year_asc', label: 'Year: Oldest First' },
  { value: 'mileage_asc', label: 'Mileage: Low to High' },
  { value: 'mileage_desc', label: 'Mileage: High to Low' },
  { value: 'make_asc', label: 'Make: A to Z' },
  { value: 'make_desc', label: 'Make: Z to A' },
];

export const NewEncarCatalog = ({ highlightCarId, className = '' }: NewEncarCatalogProps) => {
  const { toast } = useToast();
  const { convertUSDtoEUR } = useCurrencyAPI();
  
  // State for cars and pagination
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<CarsApiSortOption>('price_asc');
  const [showFilters, setShowFilters] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const ITEMS_PER_PAGE = 24;

  // Fetch cars with global sorting
  const fetchCars = useCallback(async (loadMore = false, cursor?: string) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const result = await fetchCarsWithKeyset({
        filters: {
          ...filters,
          ...(searchTerm ? { search: searchTerm } : {})
        },
        sort: sortBy,
        limit: ITEMS_PER_PAGE,
        cursor: cursor
      });

      if (loadMore) {
        setCars(prev => [...prev, ...result.items]);
      } else {
        setCars(result.items);
        setTotalCount(result.total);
      }
      
      setNextCursor(result.nextCursor);

    } catch (err) {
      console.error('Error fetching cars:', err);
      setError('Failed to load cars. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load cars. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters, searchTerm, sortBy, toast]);

  // Initial load and refresh when sort/filters change
  useEffect(() => {
    fetchCars();
  }, [sortBy, filters, searchTerm]);

  // Handle sort change
  const handleSortChange = useCallback((newSort: CarsApiSortOption) => {
    setSortBy(newSort);
    setNextCursor(undefined); // Reset pagination
  }, []);

  // Handle search
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setNextCursor(undefined); // Reset pagination
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
    setNextCursor(undefined); // Reset pagination
  }, []);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setNextCursor(undefined);
  }, []);

  // Load more cars
  const handleLoadMore = useCallback(() => {
    if (nextCursor && !isLoadingMore) {
      fetchCars(true, nextCursor);
    }
  }, [nextCursor, isLoadingMore, fetchCars]);

  const hasActiveFilters = Object.keys(filters).some(key => filters[key] !== undefined) || searchTerm;

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <div className="container mx-auto px-4 py-6">
        {/* Header with Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center mb-6">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cars..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Filters toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              {showFilters ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  Active
                </Badge>
              )}
            </Button>

            {/* Sort */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            {loading ? (
              'Loading...'
            ) : (
              `${totalCount.toLocaleString()} cars found • Globally sorted by ${SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}`
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 space-y-4">
              <div className="glass-card p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Quick Filters</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Make</label>
                    <Input
                      placeholder="e.g. BMW, Audi"
                      value={filters.make || ''}
                      onChange={(e) => handleFilterChange('make', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Model</label>
                    <Input
                      placeholder="e.g. A4, X3"
                      value={filters.model || ''}
                      onChange={(e) => handleFilterChange('model', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Min Year</label>
                      <Input
                        type="number"
                        placeholder="2010"
                        value={filters.yearMin || ''}
                        onChange={(e) => handleFilterChange('yearMin', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Year</label>
                      <Input
                        type="number"
                        placeholder="2024"
                        value={filters.yearMax || ''}
                        onChange={(e) => handleFilterChange('yearMax', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Min Price (€)</label>
                      <Input
                        type="number"
                        placeholder="5000"
                        value={filters.priceMin || ''}
                        onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Price (€)</label>
                      <Input
                        type="number"
                        placeholder="50000"
                        value={filters.priceMax || ''}
                        onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cars Grid */}
          <div className="flex-1">
            {loading && cars.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">{error}</p>
                <Button onClick={() => fetchCars()} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No cars found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {cars.map((car) => (
                    <LazyCarCard
                      key={car.id}
                      id={car.id}
                      make={car.make}
                      model={car.model}
                      year={car.year}
                      price={convertUSDtoEUR(car.price_cents ? Math.round(car.price_cents / 100) : car.price || 25000)}
                      image={car.images?.[0]}
                      images={car.images}
                      mileage={car.mileage}
                      transmission={car.transmission}
                      fuel={car.fuel}
                      color={car.color}
                      lot={car.id}
                      title={car.title || `${car.make} ${car.model} ${car.year}`}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {nextCursor && (
                  <div className="flex justify-center mt-8">
                    <Button 
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="flex items-center gap-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading More...
                        </>
                      ) : (
                        'Load More Cars'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};