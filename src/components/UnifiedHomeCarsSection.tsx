import React, { memo, useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useUnifiedCars, UnifiedCarsFilters } from "@/hooks/useUnifiedCars";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";
import { useInView } from "@/hooks/useInView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { calculateFinalPriceEUR } from "@/utils/carPricing";
import { formatMileage } from "@/utils/mileageFormatter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Calendar, Gauge, Fuel, Settings } from "lucide-react";

interface CarCardProps {
  car: any;
  onCarClick: (carId: string) => void;
}

const CarCard = memo(({ car, onCarClick }: CarCardProps) => {
  const { convertUSDtoEUR, exchangeRate } = useCurrencyAPI();
  
  const handleClick = () => {
    onCarClick(car.id);
  };

  const price = useMemo(() => {
    return convertUSDtoEUR(car.price || 0, exchangeRate.rate);
  }, [car.price, convertUSDtoEUR, exchangeRate.rate]);

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 group"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Car Image */}
        <div className="aspect-w-16 aspect-h-12 bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
          {car.image_url ? (
            <img
              src={car.image_url}
              alt={`${car.year} ${car.make} ${car.model}`}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center">
              <Car className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Car Info */}
        <div className="p-4 space-y-3">
          {/* Title and Price */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">
              {car.year} {car.make} {car.model}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                €{price.toLocaleString()}
              </span>
              {car.is_live && (
                <Badge variant="destructive" className="animate-pulse">
                  Live
                </Badge>
              )}
            </div>
          </div>

          {/* Car Details */}
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Gauge className="h-4 w-4" />
              <span>{car.mileage ? formatMileage(car.mileage) : 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{car.year}</span>
            </div>
            {car.fuel && (
              <div className="flex items-center space-x-1">
                <Fuel className="h-4 w-4" />
                <span className="capitalize">{car.fuel}</span>
              </div>
            )}
            {car.transmission && (
              <div className="flex items-center space-x-1">
                <Settings className="h-4 w-4" />
                <span className="capitalize">{car.transmission}</span>
              </div>
            )}
          </div>

          {/* Source Badge */}
          {car.source_api && (
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {car.source_api === 'auctions_api' ? 'Auctions API' : 
                 car.source_api === 'auctionapis' ? 'Auction APIs' :
                 car.source_api === 'encar' ? 'Encar' : car.source_api}
              </Badge>
              {car.lot_number && (
                <span className="text-xs text-gray-500">#{car.lot_number}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

CarCard.displayName = "CarCard";

const UnifiedHomeCarsSection = memo(() => {
  const navigate = useNavigate();
  const { ref, isInView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  // State
  const [sortBy, setSortBy] = useState('recently_added');
  const [showAllCars, setShowAllCars] = useState(false);

  // Unified cars hook
  const {
    cars,
    loading,
    error,
    total
  } = useUnifiedCars({
    page: 1,
    pageSize: showAllCars ? 24 : 8,
    sortBy: sortBy === 'recently_added' ? 'last_synced_at' : sortBy,
    sortOrder: 'desc'
  });

  // Handle car click
  const handleCarClick = (carId: string) => {
    navigate(`/car/${carId}`);
  };

  // Handle view all cars
  const handleViewAllCars = () => {
    navigate('/catalog');
  };

  // Sort options
  const sortOptions = [
    { value: 'recently_added', label: 'Sapo shtuar' },
    { value: 'price', label: 'Çmimi (më i lartë)' },
    { value: 'year', label: 'Viti (më i ri)' },
    { value: 'mileage', label: 'Kilometrazhi (më i ulët)' }
  ];

  return (
    <section ref={ref} className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Makina të Reja në Stok
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Zbuloni koleksionin tonë të ri të makinave të importuara nga Koreja e Jugut, 
            të zgjedhura me kujdes për cilësinë dhe vlerën e tyre.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rendit sipas:
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {total > 0 ? `${total.toLocaleString()} makina në total` : 'Duke ngarkuar...'}
            </span>
            <Button
              onClick={handleViewAllCars}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Shiko të gjitha
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Gabim në ngarkim
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Provo përsëri
            </Button>
          </div>
        )}

        {/* Cars Grid */}
        {!error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 8 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-0">
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              cars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  onCarClick={handleCarClick}
                />
              ))
            )}
          </div>
        )}

        {/* Show More Button */}
        {!showAllCars && !loading && cars.length > 0 && (
          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAllCars(true)}
              className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Shfaq më shumë makina
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Stats */}
        {!loading && cars.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {total.toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Makina në Stok
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {cars.filter(car => car.is_live).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Live Tani
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {new Set(cars.map(car => car.make)).size}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Marka të Ndryshme
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

UnifiedHomeCarsSection.displayName = "UnifiedHomeCarsSection";

export default UnifiedHomeCarsSection;
