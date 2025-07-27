import React, { useState, useEffect } from 'react';
import { useDatabaseAPI } from '@/hooks/useDatabaseAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, RotateCcw, Car } from 'lucide-react';
import CarCard from '@/components/CarCard';
import { useInView } from 'react-intersection-observer';
import { useToast } from '@/hooks/use-toast';

const DatabaseCatalog = () => {
  const {
    cars,
    loading,
    error,
    pagination,
    loadCars,
    loadMoreCars,
    searchCars,
    triggerBulkSync,
    totalCarsCount
  } = useDatabaseAPI();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const { toast } = useToast();

  // Load more cars when scrolling to bottom
  useEffect(() => {
    if (inView && pagination.hasMore && !loading) {
      loadMoreCars();
    }
  }, [inView, pagination.hasMore, loading, loadMoreCars]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchCars(searchQuery);
  };

  const handleBulkSync = async () => {
    setIsSyncing(true);
    try {
      await triggerBulkSync();
      toast({
        title: "Sync Started",
        description: "Bulk sync of all cars has been initiated. This may take several minutes.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to start bulk sync. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = () => {
    loadCars();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Car Database Catalog
              </h1>
              <p className="text-xl text-muted-foreground">
                Browse all cars from the auction database
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={handleBulkSync}
                variant="default"
                size="sm"
                disabled={isSyncing || loading}
              >
                <Car className="w-4 h-4 mr-2" />
                {isSyncing ? 'Syncing...' : 'Sync All Cars'}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-6">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Total Cars: {totalCarsCount.toLocaleString()}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              Showing: {cars.length}
            </Badge>
            {pagination.hasMore && (
              <Badge variant="outline" className="text-sm px-3 py-1">
                More Available
              </Badge>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by make, model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              <Filter className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && cars.length === 0 && !error && (
          <Card className="text-center py-12">
            <CardContent>
              <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="mb-2">No Cars Found</CardTitle>
              <CardDescription className="mb-4">
                {totalCarsCount === 0
                  ? "The database is empty. Click 'Sync All Cars' to import data from the API."
                  : "No cars match your search criteria. Try a different search term."}
              </CardDescription>
              {totalCarsCount === 0 && (
                <Button onClick={handleBulkSync} disabled={isSyncing}>
                  <Car className="w-4 h-4 mr-2" />
                  {isSyncing ? 'Syncing...' : 'Import Cars from API'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cars Grid */}
        {cars.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cars.map((car) => (
              <CarCard
                key={car.id}
                id={car.id}
                make={car.make}
                model={car.model}
                year={car.year}
                price={car.price}
                image={car.image}
                vin={car.api_data?.vin}
                mileage={car.api_data?.mileage?.toString()}
                transmission={car.api_data?.transmission}
                fuel={car.api_data?.fuel}
                color={car.api_data?.color}
                condition={car.api_data?.condition}
                lot={car.api_data?.lot_number}
                title={car.api_data?.title}
              />
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && cars.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading cars...</p>
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {pagination.hasMore && !loading && cars.length > 0 && (
          <div ref={ref} className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading more cars...</p>
          </div>
        )}

        {/* End of Results */}
        {!pagination.hasMore && cars.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              You've reached the end of the results. Total: {cars.length} cars
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseCatalog;