import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  ArrowLeft,
  ArrowUpDown,
  Car,
  X,
  PanelLeftOpen,
  PanelLeftClose,
  Lock,
  Unlock,
} from "lucide-react";
import LoadingLogo from "@/components/LoadingLogo";
import LazyCarCard from "@/components/LazyCarCard";
import { useSecureAuctionAPI, createFallbackManufacturers } from "@/hooks/useSecureAuctionAPI";
import EncarStyleFilter from "@/components/EncarStyleFilter";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useSearchParams } from "react-router-dom";
import { getEncarSortOptions, SortOption } from "@/hooks/useSortedCars";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useIsMobile } from "@/hooks/use-mobile";
import { CarFilters as ApiCarFilters, FrontendSortOption } from "@/services/carsApi";
import { filterOutTestCars } from "@/utils/testCarFilter";
import { fallbackCars } from "@/data/fallbackData";
import { useGlobalSorting } from "@/hooks/useGlobalSorting";
import {
  APIFilters,
  applyGradeFilter,
  filtersToURLParams,
} from "@/utils/catalog-filter";

interface EncarCatalogProps {
  highlightCarId?: string | null;
}

const NewEncarCatalog = ({ highlightCarId }: EncarCatalogProps = {}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Convert API filters to CarFilters format for global sorting
  const convertToCarFilters = useCallback((apiFilters: APIFilters): ApiCarFilters => {
    return {
      make: apiFilters.manufacturer_id && apiFilters.manufacturer_id !== 'all' ? apiFilters.manufacturer_id : undefined,
      model: apiFilters.model_id ? apiFilters.model_id : undefined,
      yearMin: apiFilters.from_year ? apiFilters.from_year.toString() : undefined,
      yearMax: apiFilters.to_year ? apiFilters.to_year.toString() : undefined,
      priceMin: apiFilters.buy_now_price_from ? apiFilters.buy_now_price_from.toString() : undefined,
      priceMax: apiFilters.buy_now_price_to ? apiFilters.buy_now_price_to.toString() : undefined,
      fuel: apiFilters.fuel_type ? apiFilters.fuel_type : undefined,
      search: apiFilters.search ? apiFilters.search : undefined,
    };
  }, []);
  
  // Global sorting hook - handles all car data with proper backend sorting
  const {
    cars: globalCars,
    loading,
    error,
    totalCount,
    hasNextPage,
    currentSort,
    applySort,
    applyFilters: applyGlobalFilters,
    loadNextPage,
  } = useGlobalSorting({
    initialSort: 'recently_added',
    pageSize: 24
  });
  
  const [filters, setFilters] = useState<APIFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>("recently_added");
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { convertUSDtoEUR } = useCurrencyAPI();

  // Apply grade filtering to global cars
  const filteredCars = useMemo(() => {
    const sourceCars = (error && globalCars.length === 0) ? fallbackCars : globalCars;
    const cleanedCars = filterOutTestCars(sourceCars || []);
    return applyGradeFilter(cleanedCars, filters?.grade_iaai) || [];
  }, [globalCars, filters?.grade_iaai, error]);

  // Handle sort changes with global sorting
  const handleSortChange = useCallback((newSort: SortOption) => {
    console.log(`🔄 Global sort change: ${sortBy} -> ${newSort}`);
    setSortBy(newSort);
    applySort(newSort as FrontendSortOption);
    
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('sort', newSort);
    setSearchParams(newSearchParams);
  }, [sortBy, applySort, searchParams, setSearchParams]);

  // Handle filter changes with global sorting
  const handleFiltersChange = useCallback(async (newFilters: APIFilters) => {
    console.log(`🔍 Applying filters with global sorting`, newFilters);
    setFilters(newFilters);
    
    const carFilters = convertToCarFilters(newFilters);
    applyGlobalFilters(carFilters);
    
    const searchParams = filtersToURLParams(newFilters);
    setSearchParams(searchParams);
  }, [convertToCarFilters, applyGlobalFilters, setSearchParams]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Car Catalog - Global Sorting</h1>
          
          <AdaptiveSelect
            value={sortBy}
            onValueChange={handleSortChange}
            options={getEncarSortOptions()}
            placeholder="Sort by..."
            className="min-w-[150px]"
          />
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground">
            {loading ? "Loading..." : `${totalCount.toLocaleString()} cars found`}
          </p>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" />
            Global sorting: {currentSort.replace('_', ' ')}
          </Badge>
        </div>

        {/* Cars grid */}
        {loading && filteredCars.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <LoadingLogo />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCars.map((car, index) => (
                <LazyCarCard
                  key={car.id || index}
                  id={String(car.id)}
                  make={(car.make as any)?.name || String(car.make) || 'Unknown'}
                  model={(car.model as any)?.name || String(car.model) || 'Unknown'}
                  year={Number(car.year) || 2000}
                  price={Number(car.price) || 0}
                  image={String(car.image_url || '')}
                  images={Array.isArray(car.images) ? car.images : []}
                  mileage={String(car.mileage || '0')}
                  transmission={(car.transmission as any)?.name || String(car.transmission) || 'Unknown'}
                  fuel={(car.fuel as any)?.name || String(car.fuel) || 'Unknown'}
                  color={(car.color as any)?.name || String(car.color) || 'Unknown'}
                  title={String(car.title || '')}
                  lot={String(car.id)}
                />
              ))}
            </div>

            {/* Load more button */}
            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadNextPage}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Car className="h-4 w-4" />
                      Load More Cars
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewEncarCatalog;