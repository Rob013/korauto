import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  Grid,
  List,
  ArrowLeft,
  ArrowUpDown,
  Car,
  Filter,
  X,
  PanelLeftOpen,
  PanelLeftClose,
  Sparkles,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart3
} from "lucide-react";
import LazyCarCard from "@/components/LazyCarCard";
import ModernFilterInterface from "@/components/ModernFilterInterface";
import { useSecureAuctionAPI, createFallbackManufacturers } from "@/hooks/useSecureAuctionAPI";
import { useSearchParams } from "react-router-dom";
import {
  useSortedCars,
  getSortOptions,
  SortOption,
} from "@/hooks/useSortedCars";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface APIFilters {
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
  search?: string;
  seats_count?: string;
}

interface ModernEncarCatalogProps {
  highlightCarId?: string | null;
}

const ModernEncarCatalog = ({ highlightCarId }: ModernEncarCatalogProps = {}) => {
  const { toast } = useToast();
  const {
    cars,
    setCars,
    loading,
    error,
    totalCount,
    hasMorePages,
    fetchCars,
    filters,
    setFilters,
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchFilterCounts,
    fetchGrades,
    loadMore,
  } = useSecureAuctionAPI();
  
  const { convertUSDtoEUR } = useCurrencyAPI();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("price_low");
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allCarsForSorting, setAllCarsForSorting] = useState<any[]>([]);
  const [isSortingGlobal, setIsSortingGlobal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isMobile = useIsMobile();

  const [manufacturers, setManufacturers] = useState<
    {
      id: number;
      name: string;
      car_count?: number;
      cars_qty?: number;
      image?: string;
    }[]
  >(createFallbackManufacturers());

  const [models, setModels] = useState<
    {
      id: number;
      name: string;
      car_count?: number;
      cars_qty?: number;
    }[]
  >([]);

  const [generations, setGenerations] = useState<
    {
      id: number;
      name: string;
      manufacturer_id?: number;
      model_id?: number;
      from_year?: number;
      to_year?: number;
      cars_qty?: number;
    }[]
  >([]);
  
  const [filterCounts, setFilterCounts] = useState<any>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [highlightedCarId, setHighlightedCarId] = useState<string | null>(null);
  const [loadedPages, setLoadedPages] = useState(1);
  const [isRestoringState, setIsRestoringState] = useState(false);

  // Ref for the main container to handle scroll restoration
  const containerRef = useRef<HTMLDivElement>(null);
  const SCROLL_STORAGE_KEY = "modern-catalog-scroll";

  // Save current scroll position
  const saveScrollPosition = () => {
    if (containerRef.current) {
      const scrollData = {
        scrollTop: window.scrollY,
        timestamp: Date.now(),
        filters: filters,
        loadedPages: loadedPages,
      };
      sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(scrollData));
    }
  };

  // Enhanced client-side grade filtering for better performance
  const filteredCars = useMemo(() => {
    if (!filters.grade_iaai || filters.grade_iaai === 'all') {
      return cars;
    }

    const filterGrade = filters.grade_iaai.toLowerCase().trim();
    
    return cars.filter((car) => {
      const carGrades: string[] = [];
      
      // Extract grades from lots (primary source)
      if (car.lots && Array.isArray(car.lots)) {
        car.lots.forEach((lot: any) => {
          if (lot.grade_iaai) carGrades.push(lot.grade_iaai.trim().toLowerCase());
        });
      }
      
      // Extract grades from title and engine
      if (car.title) {
        const titleGrades = extractGradesFromTitle(car.title);
        carGrades.push(...titleGrades.map(g => g.toLowerCase()));
      }
      
      if (car.engine && car.engine.name) {
        carGrades.push(car.engine.name.trim().toLowerCase());
      }
      
      // More comprehensive matching for grades
      return carGrades.some(grade => {
        return grade === filterGrade || 
               grade.includes(filterGrade) || 
               filterGrade.includes(grade);
      });
    });
  }, [cars, filters.grade_iaai]);

  // Helper function to extract grades from title
  const extractGradesFromTitle = useCallback((title: string): string[] => {
    const grades: string[] = [];
    const patterns = [
      /\b(\d+\.?\d*\s?(?:TDI|TFSI|FSI|TSI|CDI|T|D|I|E|H))\b/gi,
      /\b(\d+\.?\d*)\s*l?i?t?e?r?\s*(?:TDI|TFSI|FSI|TSI|CDI|T|D|I|E|H)\b/gi,
      /\b(\d+\.?\d*[iIdDeEhH])\b/gi,
      /\b(\d+\.?\d*)\s*(?:hybrid|electric|diesel|petrol|gasoline)\b/gi,
    ];
    
    patterns.forEach(pattern => {
      const matches = title.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim();
          if (cleaned && !grades.includes(cleaned)) {
            grades.push(cleaned);
          }
        });
      }
    });
    
    return grades;
  }, []);

  // Memoized cars for sorting
  const carsForSorting = useMemo(() => {
    return filteredCars.map((car) => ({
      ...car,
      status: String(car.status || ""),
      lot_number: String(car.lot_number || ""),
      cylinders: Number(car.cylinders || 0),
    }));
  }, [filteredCars]);
  
  const carsToSort = useMemo(() => {
    return isSortingGlobal && allCarsForSorting.length > 0 ? allCarsForSorting : carsForSorting;
  }, [isSortingGlobal, allCarsForSorting, carsForSorting]);
  
  const sortedCars = useSortedCars(carsToSort, sortBy);
  
  const carsForCurrentPage = useMemo(() => {
    return isSortingGlobal && allCarsForSorting.length > 0 
      ? sortedCars.slice((currentPage - 1) * 50, currentPage * 50)
      : sortedCars;
  }, [isSortingGlobal, allCarsForSorting.length, sortedCars, currentPage]);

  const handleFiltersChange = useCallback((newFilters: APIFilters, shouldAutoSearch = false) => {
    setFilters(newFilters);
    setCurrentPage(1);
    
    // Reset global sorting when filters change
    setIsSortingGlobal(false);
    setAllCarsForSorting([]);
    
    // Update URL with all non-empty filter values
    const paramsToSet: any = {};
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        paramsToSet[key] = key === 'grade_iaai' ? encodeURIComponent(value) : value;
      }
    });
    paramsToSet.page = "1";
    setSearchParams(paramsToSet);

    if (shouldAutoSearch) {
      setCars([]);
      
      const filtersWithPagination = {
        ...newFilters,
        per_page: "50"
      };
      
      fetchCars(1, filtersWithPagination, true);
    }
  }, [fetchCars, setSearchParams, setCars]);

  // Enhanced manual search function
  const handleManualSearch = useCallback(() => {
    setCars([]);
    
    const filtersWithPagination = {
      ...filters,
      per_page: "50"
    };
    
    fetchCars(1, filtersWithPagination, true);
    
    // Auto-hide filters on mobile after searching
    if (isMobile) {
      setShowFilters(false);
    }
  }, [filters, fetchCars, setCars, isMobile, setShowFilters]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setLoadedPages(1);
    setModels([]);
    setGenerations([]);
    handleFiltersChange({}, true);
  }, [handleFiltersChange]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    
    const filtersWithPagination = {
      ...filters,
      per_page: "50"
    };
    
    fetchCars(page, filtersWithPagination, true);
    
    // Update URL with new page
    const currentParams = Object.fromEntries(searchParams.entries());
    currentParams.page = page.toString();
    setSearchParams(currentParams);
  }, [filters, fetchCars, setSearchParams]);

  const handleManufacturerChange = async (manufacturerId: string) => {
    setIsLoading(true);
    setModels([]);
    setGenerations([]);
    
    try {
      if (manufacturerId) {
        const modelData = await fetchModels(manufacturerId);
        setModels(modelData);
      }
      
      const newFilters: APIFilters = {
        manufacturer_id: manufacturerId,
        model_id: undefined,
        generation_id: undefined,
        grade_iaai: undefined,
        color: filters.color,
        fuel_type: filters.fuel_type,
        transmission: filters.transmission,
        odometer_from_km: filters.odometer_from_km,
        odometer_to_km: filters.odometer_to_km,
        from_year: filters.from_year,
        to_year: filters.to_year,
        buy_now_price_from: filters.buy_now_price_from,
        buy_now_price_to: filters.buy_now_price_to,
        seats_count: filters.seats_count,
        search: filters.search,
      };
      
      setLoadedPages(1);
      handleFiltersChange(newFilters, false);
    } catch (error) {
      console.error('Error changing manufacturer:', error);
      setModels([]);
      setGenerations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = async (modelId: string) => {
    setIsLoading(true);
    setGenerations([]);
    
    try {
      if (!modelId) {
        const newFilters: APIFilters = {
          ...filters,
          model_id: undefined,
          generation_id: undefined,
          grade_iaai: undefined,
        };
        setLoadedPages(1);
        handleFiltersChange(newFilters, false);
        setIsLoading(false);
        return;
      }
      
      const generationData = await fetchGenerations(modelId);
      setGenerations(generationData);
      
      const newFilters: APIFilters = {
        ...filters,
        model_id: modelId,
        generation_id: undefined,
        grade_iaai: undefined,
      };
      
      setLoadedPages(1);
      handleFiltersChange(newFilters, false);
    } catch (error) {
      setGenerations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerationChange = async (generationId: string) => {
    setIsLoading(true);
    
    try {
      if (!generationId) {
        const newFilters: APIFilters = {
          ...filters,
          generation_id: undefined,
          grade_iaai: undefined,
        };
        setLoadedPages(1);
        handleFiltersChange(newFilters, false);
        setIsLoading(false);
        return;
      }
      
      const newFilters: APIFilters = {
        ...filters,
        generation_id: generationId,
        grade_iaai: undefined,
      };
      
      setLoadedPages(1);
      handleFiltersChange(newFilters, false);
    } catch (error) {
      console.error('Error changing generation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize filters from URL params on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsRestoringState(true);
      setIsInitialLoad(true);

      const urlFilters: APIFilters = {};
      let urlLoadedPages = 1;

      for (const [key, value] of searchParams.entries()) {
        if (key === "loadedPages") {
          urlLoadedPages = parseInt(value) || 1;
        } else if (value && key !== "loadedPages") {
          let decodedValue = value;
          try {
            decodedValue = decodeURIComponent(value);
            if (decodedValue.includes('%')) {
              decodedValue = decodeURIComponent(decodedValue);
            }
          } catch (e) {
            decodedValue = value;
          }
          urlFilters[key as keyof APIFilters] = decodedValue;
        }
      }

      // Set default manufacturer_id=9 if no filters in URL
      if (Object.keys(urlFilters).length === 0) {
        urlFilters.manufacturer_id = "9";
      }

      setFilters(urlFilters);
      setLoadedPages(urlLoadedPages);

      // Load data in parallel for faster loading
      const loadPromises = [
        fetchManufacturers().then(setManufacturers)
      ];

      if (urlFilters.manufacturer_id) {
        loadPromises.push(
          fetchModels(urlFilters.manufacturer_id).then(setModels)
        );
      }

      if (urlFilters.model_id) {
        loadPromises.push(
          fetchGenerations(urlFilters.model_id).then(setGenerations)
        );
      }

      await Promise.all(loadPromises);

      const initialFilters = {
        ...urlFilters,
        per_page: "50"
      };
      
      await handleFiltersChange(urlFilters, true);

      setIsRestoringState(false);
      setIsInitialLoad(false);
    };

    loadInitialData();
  }, []); // Only run on mount

  // Save scroll position when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        saveScrollPosition();
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [filters, loadedPages]);

  // Calculate total pages when totalCount changes
  useEffect(() => {
    let effectiveTotal = totalCount;
    let effectivePages = Math.ceil(totalCount / 50);
    
    if (filters.grade_iaai && filters.grade_iaai !== 'all' && filteredCars.length > 0) {
      effectiveTotal = filteredCars.length;
      effectivePages = Math.ceil(filteredCars.length / 50);
    }
    
    setTotalPages(effectivePages);
  }, [totalCount, filteredCars, filters.grade_iaai]);

  // Effect to highlight and scroll to specific car by lot number
  useEffect(() => {
    if (highlightCarId && cars.length > 0) {
      setTimeout(() => {
        const targetCar = cars.find(
          (car) =>
            car.lot_number === highlightCarId || car.id === highlightCarId
        );

        if (targetCar) {
          const lotNumber =
            targetCar.lot_number || targetCar.lots?.[0]?.lot || "";
          setHighlightedCarId(lotNumber || targetCar.id);

          const carElement = document.getElementById(`car-${targetCar.id}`);
          if (carElement) {
            carElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }

          setTimeout(() => {
            setHighlightedCarId(null);
          }, 3000);
        }
      }, 1000);
    }
  }, [highlightCarId, cars]);

  // Check if we should show cars (brand and model selected)
  const shouldShowCars = filters.manufacturer_id && filters.model_id;
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background/98 to-background/95">
      {/* Modern Filter Sidebar */}
      <div className={`
        fixed lg:relative z-40 bg-gradient-to-br from-card via-card/98 to-card/95 border-r border-border/50 transition-all duration-300 ease-in-out backdrop-blur-sm
        ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isMobile ? 'inset-0 w-full h-full' : 'w-full sm:w-96 lg:w-80 xl:w-96 h-full'} 
        overflow-y-auto lg:shadow-none shadow-2xl
        ${isMobile ? 'safe-area-inset' : ''}
      `}>
        <div className={`sticky top-0 z-10 p-4 border-b border-border/50 backdrop-blur-sm ${isMobile ? 'bg-primary text-primary-foreground' : 'bg-card/80'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isMobile ? 'bg-primary-foreground/20' : 'bg-primary/10'}`}>
                <Filter className={`h-5 w-5 ${isMobile ? 'text-primary-foreground' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${isMobile ? 'text-primary-foreground' : 'text-foreground'}`}>
                  Smart Filters
                </h3>
                <p className={`text-xs ${isMobile ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {hasActiveFilters ? `${Object.values(filters).filter(Boolean).length} filters active` : 'No filters applied'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(false)}
              className={`h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors ${isMobile ? 'text-primary-foreground' : 'text-muted-foreground'}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <ModernFilterInterface
            filters={filters}
            manufacturers={manufacturers}
            models={models}
            generations={generations}
            filterCounts={filterCounts}
            loadingCounts={loadingCounts}
            onFiltersChange={(newFilters) => handleFiltersChange(newFilters, false)}
            onClearFilters={handleClearFilters}
            onManufacturerChange={handleManufacturerChange}
            onModelChange={handleModelChange}
            onGenerationChange={handleGenerationChange}
            onFetchGrades={fetchGrades}
            enableManualSearch={true}
            onManualSearch={handleManualSearch}
            isCompact={true}
          />
        </div>
      </div>

      {/* Overlay for mobile */}
      {showFilters && (
        <div 
          className={`fixed inset-0 z-30 lg:hidden transition-opacity duration-300 ${
            isMobile ? 'bg-black/70 backdrop-blur-md' : 'bg-black/50 backdrop-blur-sm'
          }`}
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 transition-all duration-300">
        <div className="container-responsive py-4 lg:py-6">
          {/* Enhanced Header Section */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Top Navigation Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors h-12 px-4 rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden xs:inline">Back</span>
                </Button>
                
                {/* Enhanced Filter Toggle Button */}
                <Button
                  variant={showFilters ? "default" : hasActiveFilters ? "default" : "outline"}
                  size="lg"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 h-12 px-6 font-semibold text-sm flex-1 sm:flex-initial rounded-xl transition-all duration-200 ${
                    hasActiveFilters 
                      ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg"
                      : "bg-card hover:bg-primary hover:text-primary-foreground border-2 border-primary/20 hover:border-primary shadow-sm"
                  }`}
                >
                  {showFilters ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                  <span className="hidden xs:inline">
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </span>
                  <span className="xs:hidden">Filters</span>
                  {hasActiveFilters && !showFilters && (
                    <Badge variant="secondary" className="ml-1 bg-primary-foreground/20 text-primary-foreground">
                      {Object.values(filters).filter(Boolean).length}
                    </Badge>
                  )}
                </Button>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleClearFilters}
                    className="flex items-center gap-2 h-12 px-4 font-semibold text-sm transition-all duration-200 hover:bg-destructive/90 flex-shrink-0 rounded-xl"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear All</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                )}
              </div>
              
              {/* View Controls */}
              <div className="flex gap-2 items-center justify-end w-full sm:w-auto">
                {/* Sort Control */}
                <div className="relative flex-1 sm:flex-initial min-w-0">
                  <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 h-12">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-transparent text-sm font-medium border-none outline-none flex-1 min-w-0"
                    >
                      {getSortOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* View Mode Toggle */}
                <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-10 w-10 p-0 rounded-lg"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-10 w-10 p-0 rounded-lg"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Title and Stats Row */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                    Car Catalog
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <BarChart3 className="h-4 w-4" />
                    <span>
                      {totalCount.toLocaleString()} cars available
                      {filters.grade_iaai && filters.grade_iaai !== 'all' && ` • ${filteredCars.length} match current filters`}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Status Bar */}
              <Card className="bg-gradient-to-r from-card via-card/95 to-card/90 border-primary/10">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          Page {currentPage} of {totalPages} • Showing {carsForCurrentPage.length} cars
                        </span>
                      </div>
                      {shouldShowCars && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          Ready to browse
                        </Badge>
                      )}
                    </div>
                    
                    {error && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.reload()}
                          className="flex items-center gap-2 text-xs hover:bg-primary hover:text-primary-foreground"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enhanced Error State */}
          {error && (
            <Card className="bg-destructive/5 border-destructive/20 mb-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive mb-1">Connection Error</h3>
                    <p className="text-sm text-destructive/80 mb-3">
                      Unable to connect to the car database. This might be due to network issues.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Loading State */}
          {(loading && cars.length === 0) || isRestoringState || isInitialLoad ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {isRestoringState ? "Restoring your session..." : isInitialLoad ? "Loading catalog..." : "Searching cars..."}
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {isRestoringState 
                  ? "We're bringing back your previous search results and position."
                  : isInitialLoad 
                  ? "Setting up the car catalog with the latest inventory."
                  : "Finding the perfect cars that match your criteria."
                }
              </p>
            </div>
          ) : null}

          {/* Enhanced No Selection State */}
          {!shouldShowCars && !loading && !isRestoringState && !isInitialLoad && (
            <Card className="text-center py-16 bg-gradient-to-br from-card via-card/95 to-card/90 border-primary/10">
              <CardContent className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <Car className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">Select Your Dream Car</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Choose a brand and model to explore our collection of high-quality vehicles with professional inspection services.
                  </p>
                </div>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setShowFilters(true)}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-8 rounded-xl"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Open Smart Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Enhanced No Results State */}
          {shouldShowCars && !loading && !isRestoringState && !isInitialLoad && cars.length === 0 && (
            <Card className="text-center py-16 bg-gradient-to-br from-card via-card/95 to-card/90 border-orange-200">
              <CardContent className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <Search className="h-12 w-12 text-orange-600" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">No Cars Found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    We couldn't find any cars matching your current filters. Try adjusting your search criteria or clearing some filters.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="rounded-xl"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => setShowFilters(true)}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Adjust Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Cars Grid/List */}
          {shouldShowCars && cars.length > 0 && (
            <>
              <div
                ref={containerRef}
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 px-2 sm:px-0"
                    : "space-y-4"
                }
              >
                {carsForCurrentPage.map((car) => {
                  const lot = car.lots?.[0];
                  const usdPrice = lot?.buy_now || 25000;
                  const price = convertUSDtoEUR(Math.round(usdPrice + 2200));
                  const lotNumber = car.lot_number || lot?.lot || "";

                  return (
                    <div
                      key={car.id}
                      id={`car-${car.id}`}
                      data-lot-id={`car-lot-${lotNumber}`}
                      className={`
                        transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                        ${highlightedCarId === lotNumber || highlightedCarId === car.id
                          ? "ring-2 ring-primary ring-offset-2 shadow-xl scale-[1.02]"
                          : ""
                        }
                      `}
                    >
                      <LazyCarCard
                        id={car.id}
                        make={car.manufacturer?.name || "Unknown"}
                        model={car.model?.name || "Unknown"}
                        year={car.year}
                        price={price}
                        image={lot?.images?.normal?.[0] || lot?.images?.big?.[0]}
                        vin={car.vin}
                        mileage={
                          lot?.odometer?.km
                            ? `${lot.odometer.km.toLocaleString()} km`
                            : undefined
                        }
                        transmission={car.transmission?.name}
                        fuel={car.fuel?.name}
                        color={car.color?.name}
                        lot={car.lot_number || lot?.lot || ""}
                        title={car.title || ""}
                        status={Number(car.status || lot?.status || 1)}
                        sale_status={car.sale_status || lot?.sale_status}
                        final_price={car.final_price || lot?.final_price}
                        insurance_v2={(lot as any)?.insurance_v2}
                        details={(lot as any)?.details}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <Card className="mt-8 bg-gradient-to-r from-card via-card/95 to-card/90 border-primary/10">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Page {currentPage} of {totalPages}</span>
                        <span>•</span>
                        <span>{totalCount.toLocaleString()} total cars</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1 || loading}
                          variant="outline"
                          size="sm"
                          className="h-10 px-4 rounded-xl"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
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
                                className="w-10 h-10 rounded-xl"
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
                          className="h-10 px-4 rounded-xl"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernEncarCatalog;