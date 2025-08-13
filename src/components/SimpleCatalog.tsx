import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  Search,
  ArrowLeft,
  ArrowUpDown,
  Car,
  Filter,
  X,
  PanelLeftOpen,
  PanelLeftClose,
  RotateCcw,
} from "lucide-react";
import LazyCarCard from "@/components/LazyCarCard";
import { useEncarAPI } from "@/hooks/useEncarAPI";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface CarFilters {
  make?: string[];
  model?: string[];
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  search?: string;
}

interface SimpleCatalogProps {
  highlightCarId?: string | null;
}

type SortOption = "price_low" | "price_high" | "year_new" | "year_old" | "mileage_low" | "mileage_high";

const SORT_OPTIONS = [
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "year_new", label: "Year: Newest First" },
  { value: "year_old", label: "Year: Oldest First" },
  { value: "mileage_low", label: "Mileage: Low to High" },
  { value: "mileage_high", label: "Mileage: High to Low" },
];

const SimpleCatalog = ({ highlightCarId }: SimpleCatalogProps = {}) => {
  const { toast } = useToast();
  const {
    cars,
    loading,
    error,
    totalCount,
    isUsingFallbackData,
    fetchCars,
    triggerSync,
    getSyncStatus,
    syncStatus
  } = useEncarAPI();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("price_low");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<CarFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  // Initialize from URL params
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('sort') as SortOption || "price_low";
    const search = searchParams.get('search') || "";
    
    setCurrentPage(page);
    setSortBy(sort);
    setSearchTerm(search);
    
    // Build filters from URL
    const urlFilters: CarFilters = {};
    if (search) urlFilters.search = search;
    
    setFilters(urlFilters);
  }, [searchParams]);

  // Fetch cars when filters change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      await fetchCars(currentPage, 50, filters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [currentPage, filters, fetchCars]);

  // Auto-trigger a full sync if no cars are present
  useEffect(() => {
    if (!loading && totalCount === 0) {
      triggerSync('full').catch(() => {});
    }
  }, [loading, totalCount, triggerSync]);

  // Sort cars client-side for now (later optimize with server-side sorting)
  const sortedCars = useMemo(() => {
    if (!cars || cars.length === 0) return [];
    
    const sorted = [...cars].sort((a, b) => {
      switch (sortBy) {
        case "price_low":
          return (a.price || 0) - (b.price || 0);
        case "price_high":
          return (b.price || 0) - (a.price || 0);
        case "year_new":
          return (b.year || 0) - (a.year || 0);
        case "year_old":
          return (a.year || 0) - (b.year || 0);
        case "mileage_low":
          return (a.mileage || 0) - (b.mileage || 0);
        case "mileage_high":
          return (b.mileage || 0) - (a.mileage || 0);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [cars, sortBy]);

  const handleSearch = useCallback(() => {
    const newFilters = {
      ...filters,
      search: searchTerm.trim() || undefined,
    };
    setFilters(newFilters);
    setCurrentPage(1);
    
    // Update URL
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    params.set('sort', sortBy);
    params.set('page', '1');
    setSearchParams(params);
  }, [filters, searchTerm, sortBy, setSearchParams]);

  const handleSortChange = useCallback((newSort: string) => {
    setSortBy(newSort as SortOption);
    
    // Update URL
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    
    // Update URL
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm("");
    setCurrentPage(1);
    setSearchParams({});
  }, [setSearchParams]);

  const handleSync = useCallback(async () => {
    try {
      await triggerSync('incremental');
      toast({
        title: "Sync Started",
        description: "Car data sync has been initiated. This may take a few minutes.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to start car data sync. Please try again.",
        variant: "destructive",
      });
    }
  }, [triggerSync, toast]);

  const totalPages = Math.ceil(totalCount / 50);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Filter Sidebar - Mobile only when shown */}
      {(showFilters || !isMobile) && (
        <div className={`
          ${isMobile ? 'fixed inset-0 z-50 bg-background' : 'w-80 border-r bg-card'}
        `}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Filters</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <RotateCcw className="h-4 w-4" />
                  Clear
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSync}>
                  Sync
                </Button>
                {isMobile && (
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Search cars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sync Controls */}
            <div className="border-t pt-4">
              <label className="text-sm font-medium">Data Sync</label>
              <div className="mt-2 space-y-2">
                <Button onClick={handleSync} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sync Car Data
                </Button>
                {syncStatus && (
                  <div className="text-xs text-muted-foreground">
                    Status: {syncStatus.status}
                    {syncStatus.records_processed && (
                      <span> - {syncStatus.records_processed} records processed</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                {isMobile && (
                  <Button
                    variant="default"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    {showFilters ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                    Filters
                  </Button>
                )}
              </div>

              {/* Sort Control */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-48">
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
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold">Car Catalog</h1>
              <p className="text-muted-foreground">
                {totalCount.toLocaleString()} cars available • Page {currentPage} of {totalPages}
                {isUsingFallbackData && (
                  <span className="ml-2 text-blue-600 text-sm">• Development Mode</span>
                )}
              </p>
            </div>
          </div>

          {/* Error State - Only show if not using fallback data AND no cars are loaded */}
          {error && !isUsingFallbackData && cars.length === 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-destructive font-medium">Error: {error}</p>
            </div>
          )}

          {/* Development Mode Notice */}
          {isUsingFallbackData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <p className="text-blue-800 font-medium">Development Mode</p>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                Using sample car data for development. To use live data, configure Supabase environment variables.
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && cars.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading cars...</span>
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && cars.length === 0 && !isUsingFallbackData && (
            <div className="text-center py-12">
              <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cars found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or sync more data.
              </p>
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}

          {/* Cars Grid */}
          {cars.length > 0 && (
            <div>
              <div className="car-grid grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {sortedCars.map((car) => (
                  <div key={car.id} className="mobile-card-compact optimized-image">
                    <LazyCarCard
                      id={car.id}
                      make={car.make || "Unknown"}
                      model={car.model || "Unknown"}
                      year={car.year}
                      price={car.price}
                      image={car.image_url}
                      vin={car.vin}
                      mileage={car.mileage ? `${car.mileage.toLocaleString()} km` : undefined}
                      transmission={car.transmission}
                      fuel={car.fuel}
                      color={car.color}
                      lot={car.lot_number || ""}
                      title={car.title || ""}
                      status={1} // Active status
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-10 h-8"
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleCatalog;