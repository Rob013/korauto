import React, { useState } from 'react';
import { useAuctionsApiSupabase } from '@/hooks/useAuctionsApiSupabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Car, 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Download, 
  Brand, 
  List,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

export const AuctionsApiDemo: React.FC = () => {
  const [scrollTime, setScrollTime] = useState(10);
  const [limit, setLimit] = useState(1000);
  
  const {
    cars,
    isLoading,
    error,
    isScrolling,
    hasMoreData,
    totalCarsFetched,
    startScroll,
    continueScroll,
    endScroll,
    fetchAllCars,
    reset,
    brands,
    models,
    isLoadingBrands,
    isLoadingModels,
    fetchBrands,
    fetchModels
  } = useAuctionsApiSupabase({
    onError: (error) => {
      console.error('API Error:', error);
    },
    onProgress: (total, batch) => {
      console.log(`Progress: ${total} cars fetched, batch ${batch}`);
    }
  });

  const handleStartScroll = async () => {
    try {
      await startScroll(scrollTime, limit);
    } catch (error) {
      console.error('Failed to start scroll:', error);
    }
  };

  const handleContinueScroll = async () => {
    try {
      await continueScroll();
    } catch (error) {
      console.error('Failed to continue scroll:', error);
    }
  };

  const handleFetchAll = async () => {
    try {
      await fetchAllCars(scrollTime, limit);
    } catch (error) {
      console.error('Failed to fetch all cars:', error);
    }
  };

  const handleFetchBrands = async () => {
    try {
      await fetchBrands();
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    }
  };

  const handleFetchModels = async (brandId: number) => {
    try {
      await fetchModels(brandId);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Auctions API Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Scroll Time (minutes)</label>
              <input
                type="number"
                min="1"
                max="15"
                value={scrollTime}
                onChange={(e) => setScrollTime(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                disabled={isScrolling}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Limit per batch</label>
              <input
                type="number"
                min="1"
                max="2000"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                disabled={isScrolling}
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : error ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm">
                {isLoading ? 'Loading...' : error ? 'Error' : 'Ready'}
              </span>
            </div>
            
            {isScrolling && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Scrolling
              </Badge>
            )}
            
            {totalCarsFetched > 0 && (
              <Badge variant="secondary">
                {totalCarsFetched} cars fetched
              </Badge>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleStartScroll}
              disabled={isLoading || isScrolling}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Scroll
            </Button>
            
            <Button
              onClick={handleContinueScroll}
              disabled={!isScrolling || !hasMoreData || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Continue Scroll
            </Button>
            
            <Button
              onClick={endScroll}
              disabled={!isScrolling}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              End Scroll
            </Button>
            
            <Button
              onClick={handleFetchAll}
              disabled={isLoading || isScrolling}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Fetch All Cars
            </Button>
            
            <Button
              onClick={reset}
              disabled={isLoading}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Brands Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brand className="h-5 w-5" />
            Brands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={handleFetchBrands}
              disabled={isLoadingBrands}
              className="flex items-center gap-2"
            >
              <Brand className="h-4 w-4" />
              {isLoadingBrands ? 'Loading...' : 'Fetch Brands'}
            </Button>
          </div>
          
          {brands.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {brands.slice(0, 20).map((brand) => (
                <Button
                  key={brand.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleFetchModels(brand.id)}
                  className="justify-start"
                >
                  {brand.name}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Models Section */}
      {models.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {models.slice(0, 20).map((model) => (
                <div key={model.id} className="p-2 border rounded-md">
                  <div className="font-medium">{model.name}</div>
                  {model.generations.length > 0 && (
                    <div className="text-sm text-gray-500">
                      {model.generations.length} generations
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cars Display */}
      {cars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Cars ({cars.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.slice(0, 12).map((car) => (
                <div key={car.id} className="p-4 border rounded-lg">
                  <div className="font-medium">{car.brand} {car.model}</div>
                  <div className="text-sm text-gray-500">Year: {car.year}</div>
                  <div className="text-xs text-gray-400 mt-1">ID: {car.id}</div>
                </div>
              ))}
            </div>
            
            {cars.length > 12 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing first 12 of {cars.length} cars
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuctionsApiDemo;
