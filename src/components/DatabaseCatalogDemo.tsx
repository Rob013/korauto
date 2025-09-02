/**
 * Database Catalog Demo Component
 * 
 * Simple demo component to test the database-backed car catalog functionality
 */

import React, { useState, useEffect } from 'react';
import { useDatabaseCars } from '@/hooks/useDatabaseCars';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Car } from 'lucide-react';

const DatabaseCatalogDemo = () => {
  const {
    cars,
    loading,
    error,
    totalCount,
    hasMorePages,
    filters,
    fetchCars,
    loadMore,
    fetchManufacturers,
    fetchModels,
    setFilters,
    refreshCars
  } = useDatabaseCars();

  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load initial data
  useEffect(() => {
    fetchCars(1, { sort_by: 'price_low' }, true);
    loadManufacturers();
  }, []);

  const loadManufacturers = async () => {
    const manufacturerList = await fetchManufacturers();
    setManufacturers(manufacturerList);
  };

  const loadModels = async (manufacturerId: string) => {
    if (!manufacturerId) {
      setModels([]);
      return;
    }
    const modelList = await fetchModels(manufacturerId);
    setModels(modelList);
  };

  const handleManufacturerChange = (manufacturerId: string) => {
    setFilters({ ...filters, manufacturer_id: manufacturerId, model_id: undefined });
    loadModels(manufacturerId);
  };

  const handleModelChange = (modelId: string) => {
    setFilters({ ...filters, model_id: modelId });
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
    fetchCars(1, { sort_by: 'price_low' }, true);
  };

  const handleSortChange = (sortBy: string) => {
    fetchCars(1, { sort_by: sortBy }, true);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Database Car Catalog Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Search cars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Manufacturer Filter */}
            <Select value={filters.manufacturer_id || ''} onValueChange={handleManufacturerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Makes</SelectItem>
                {manufacturers.map((manufacturer) => (
                  <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                    {manufacturer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Model Filter */}
            <Select 
              value={filters.model_id || ''} 
              onValueChange={handleModelChange}
              disabled={!filters.manufacturer_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Models</SelectItem>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id.toString()}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="year_new">Year: Newest First</SelectItem>
                <SelectItem value="year_old">Year: Oldest First</SelectItem>
                <SelectItem value="recently_added">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-4">
            <Badge variant="secondary">
              Total Cars: {totalCount.toLocaleString()}
            </Badge>
            <Badge variant="secondary">
              Loaded: {cars.length}
            </Badge>
            {hasMorePages && (
              <Badge variant="outline">
                More Available
              </Badge>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">Error: {error}</p>
              <Button onClick={refreshCars} className="mt-2">
                Retry
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading cars...</p>
            </div>
          )}

          {/* Cars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cars.map((car) => (
              <Card key={car.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {/* Car Image */}
                  <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    {car.images && Array.isArray(car.images) && car.images.length > 0 ? (
                      <img
                        src={car.images[0]}
                        alt={car.title || `${car.make} ${car.model}`}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                        }}
                      />
                    ) : (
                      <Car className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  {/* Car Details */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {car.title || `${car.make} ${car.model} ${car.year}`}
                    </h3>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-xs">
                        {car.year}
                      </Badge>
                      <span className="font-bold text-primary">
                        €{(car.price + 2200).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>📍 {car.location || 'South Korea'}</div>
                      <div>⛽ {car.fuel || 'N/A'}</div>
                      <div>⚙️ {car.transmission || 'N/A'}</div>
                      {car.mileage && (
                        <div>🛣️ {car.mileage.toLocaleString()} km</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {hasMorePages && !loading && (
            <div className="text-center mt-6">
              <Button onClick={loadMore} variant="outline">
                Load More Cars
              </Button>
            </div>
          )}

          {/* No Results */}
          {!loading && cars.length === 0 && (
            <div className="text-center py-12">
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No cars found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search criteria or filters.
              </p>
              <Button onClick={refreshCars} className="mt-4">
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseCatalogDemo;