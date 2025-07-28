import { useState, useEffect } from 'react';
import { useEncarAPI } from '@/hooks/useEncarAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Grid, List, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CarFilters {
  make?: string[];
  model?: string[];
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  search?: string;
}

const EncarCatalog = () => {
  const { 
    cars, 
    loading, 
    error, 
    syncStatus, 
    totalCount, 
    fetchCars, 
    triggerSync, 
    getSyncStatus 
  } = useEncarAPI();
  
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<CarFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleSearch = async () => {
    const newFilters = {
      ...filters,
      search: searchTerm.trim() || undefined
    };
    setFilters(newFilters);
    setCurrentPage(1);
    await fetchCars(1, 20, newFilters);
  };

  const handleLoadMore = async () => {
    if (loadingMore || loading) return;
    
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    await fetchCars(nextPage, 20, filters);
    setCurrentPage(nextPage);
    setLoadingMore(false);
  };

  const handleSyncAction = async (type: 'full' | 'incremental' = 'incremental') => {
    try {
      await triggerSync(type);
      toast({
        title: "Data Refresh Started",
        description: `${type === 'full' ? 'Full' : 'Incremental'} data refresh has been initiated.`,
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to start data refresh. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage?: number) => {
    if (!mileage) return 'N/A';
    return new Intl.NumberFormat('en-US').format(mileage) + ' km';
  };

  const getStatusIcon = () => {
    if (!syncStatus) return <Clock className="h-4 w-4" />;
    
    switch (syncStatus.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusText = () => {
    if (!syncStatus) return 'No data refresh info';
    
    switch (syncStatus.status) {
      case 'completed':
        return `Last updated: ${new Date(syncStatus.last_updated).toLocaleString()}`;
      case 'failed':
        return `Failed: ${syncStatus.error_message || 'Unknown error'}`;
      case 'in_progress':
        return `Updating: ${syncStatus.synced_records}/${syncStatus.total_records} records`;
      default:
        return syncStatus.status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Encar Car Catalog
          </h1>
          <p className="text-muted-foreground mt-2">
            Browse {totalCount.toLocaleString()} authentic Korean cars from Encar.com
          </p>
        </div>
        
        {/* Refresh Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSyncAction('incremental')}
              disabled={loading || syncStatus?.status === 'in_progress'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Quick Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSyncAction('full')}
              disabled={loading || syncStatus?.status === 'in_progress'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Full Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="flex gap-2">
            <Input
              placeholder="Search cars by make, model, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && cars.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading cars...</span>
        </div>
      )}

      {/* Cars Grid/List */}
      {cars.length > 0 && (
        <>
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {cars.map((car) => (
              <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={car.image || car.photo_urls?.[0] || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'}
                      alt={car.title || `${car.make} ${car.model}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800';
                      }}
                    />
                    {car.condition && (
                      <Badge className="absolute top-2 left-2" variant="secondary">
                        {car.condition}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {car.title || `${car.make} ${car.model} ${car.year}`}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Year:</span>
                      <span className="font-medium">{car.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mileage:</span>
                      <span className="font-medium">{formatMileage(car.mileage)}</span>
                    </div>
                    {car.fuel && (
                      <div className="flex justify-between">
                        <span>Fuel:</span>
                        <span className="font-medium capitalize">{car.fuel}</span>
                      </div>
                    )}
                    {car.transmission && (
                      <div className="flex justify-between">
                        <span>Transmission:</span>
                        <span className="font-medium capitalize">{car.transmission}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-0">
                  <div className="w-full flex items-center justify-between">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(car.price)}
                    </div>
                    <Badge variant="outline">
                      {car.lot_number || 'Encar'}
                    </Badge>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {cars.length < totalCount && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                size="lg"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  `Load More (${cars.length} of ${totalCount.toLocaleString()})`
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && cars.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No cars found. Try adjusting your search or trigger a data refresh to load content.
          </p>
          <Button onClick={() => handleSyncAction('full')} className="mt-4">
            Start Full Refresh
          </Button>
        </div>
      )}
    </div>
  );
};

export default EncarCatalog;