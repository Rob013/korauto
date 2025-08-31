import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, RefreshCw, Database, Globe, Zap } from "lucide-react";
import LoadingLogo from "@/components/LoadingLogo";
import LazyCarCard from "@/components/LazyCarCard";
import { useHybridCarsAPI } from "@/hooks/useHybridCarsAPI";

interface HybridCatalogProps {
  highlightCarId?: string | null;
}

const HybridCatalog = ({ highlightCarId }: HybridCatalogProps = {}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    cars,
    loading,
    error,
    dataSource,
    lastSync,
    fetchCars,
    refreshFromApi,
    getTotalCount
  } = useHybridCarsAPI({
    cacheFirst: true,
    cacheTimeout: 300000, // 5 minutes
    autoRefresh: true
  });

  const [totalCount, setTotalCount] = useState(0);

  // Get total count
  useEffect(() => {
    getTotalCount().then(setTotalCount);
  }, [getTotalCount]);

  // Handle search
  const handleSearch = () => {
    if (searchTerm.trim()) {
      fetchCars(1, { search: searchTerm.trim() });
      setCurrentPage(1);
    } else {
      fetchCars(1, {});
      setCurrentPage(1);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCars(page, searchTerm ? { search: searchTerm } : {});
  };

  // Handle manual refresh from API
  const handleRefreshFromApi = () => {
    refreshFromApi();
    toast({
      title: "Refreshing from API",
      description: "Fetching latest data and updating cache...",
    });
  };

  // Get data source icon and color
  const getSourceInfo = () => {
    switch (dataSource) {
      case 'cache':
        return { icon: Database, color: 'text-green-600', label: 'Cache' };
      case 'api':
        return { icon: Globe, color: 'text-blue-600', label: 'Live API' };
      case 'hybrid':
        return { icon: Zap, color: 'text-purple-600', label: 'Hybrid' };
      default:
        return { icon: Database, color: 'text-gray-600', label: 'Unknown' };
    }
  };

  const sourceInfo = getSourceInfo();
  const SourceIcon = sourceInfo.icon;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Cars</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchCars(1, {})} className="mr-2">
            Try Again
          </Button>
          <Button variant="outline" onClick={handleRefreshFromApi}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh from API
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Data Source Indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Car Catalog
          </h1>
          <div className="flex items-center gap-2">
            <SourceIcon className={`h-4 w-4 ${sourceInfo.color}`} />
            <span className={`text-sm ${sourceInfo.color} font-medium`}>
              {sourceInfo.label} Data
            </span>
            {lastSync && (
              <span className="text-xs text-muted-foreground">
                • Last updated: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {totalCount.toLocaleString()} cars
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshFromApi}
            disabled={loading}
          >
            <RefreshCw className={`mr-1 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search cars by make, model, or features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Auto-Save Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-blue-800 dark:text-blue-200">
            Smart Auto-Save System
          </span>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          All external API calls are automatically saved to our database for improved performance. 
          Data is cached for 5 minutes and refreshed automatically to ensure you always have the latest information.
        </p>
      </div>

      {/* Loading State */}
      {loading && cars.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingLogo />
          <p className="text-muted-foreground mt-4">
            Loading cars with auto-save...
          </p>
        </div>
      )}

      {/* Cars Grid */}
      {!loading && cars.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg mb-4">No cars found</div>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search criteria or refresh from the API
          </p>
          <Button onClick={handleRefreshFromApi} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh from API
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cars.map((car, index) => (
            <div key={car.id} className="relative">
              <LazyCarCard
                id={car.id}
                make={car.make}
                model={car.model}
                year={car.year}
                price={car.price}
                image={car.image_url || car.images?.[0]}
                images={car.images}
                mileage={car.mileage ? String(car.mileage) : undefined}
                fuel={car.fuel}
                transmission={car.transmission}
                color={car.color}
                title={`${car.make} ${car.model} ${car.year}`}
              />
              
              {/* Data source indicator */}
              <div className="absolute top-2 right-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${car.source === 'cache' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                >
                  {car.source === 'cache' ? '💾' : '🌐'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {cars.length > 0 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, Math.ceil(totalCount / 50)) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= Math.ceil(totalCount / 50) || loading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Loading indicator for page changes */}
      {loading && cars.length > 0 && (
        <div className="flex justify-center mt-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default HybridCatalog;