import React, { memo, useMemo, useState, useCallback, useEffect } from "react";
import { useSecureAuctionAPI } from "@/hooks/useSecureAuctionAPI";
import { useAuctionsApiSupabase } from "@/hooks/useAuctionsApiSupabase";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Car, Calendar, Fuel, Gauge, Settings, ArrowRight, ArrowUpDown } from "lucide-react";
import { useCurrencyAPI } from "@/hooks/useCurrencyAPI";

interface CarCardProps {
  car: any;
}

const CarCard = memo(({ car }: CarCardProps) => {
  const { convertUSDtoEUR } = useCurrencyAPI();

  // Helper to safely extract string from potential object
  const getString = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.name) return value.name;
    return String(value);
  };

  const make = getString(car.make);
  const model = getString(car.model);
  const fuel = getString(car.fuel);
  const transmission = getString(car.transmission);
  const color = getString(car.color);

  const price = useMemo(() => {
    return convertUSDtoEUR(car.price || 0);
  }, [car.price, convertUSDtoEUR]);

  return (
    <div className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 group rounded-lg overflow-hidden bg-white dark:bg-gray-800 border">
      <div className="p-0">
        <div className="aspect-w-16 aspect-h-12 bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {car.image_url ? (
            <img
              src={car.image_url}
              alt={`${car.year} ${make} ${model}`}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center">
              <Car className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">
              {car.year} {make} {model}
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

          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Gauge className="h-4 w-4" />
              <span>{car.mileage ? `${Number(car.mileage).toLocaleString()} km` : 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{car.year}</span>
            </div>
            {fuel && (
              <div className="flex items-center space-x-1">
                <Fuel className="h-4 w-4" />
                <span className="capitalize">{fuel}</span>
              </div>
            )}
            {transmission && (
              <div className="flex items-center space-x-1">
                <Settings className="h-4 w-4" />
                <span className="capitalize">{transmission}</span>
              </div>
            )}
          </div>

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
      </div>
    </div>
  );
});

CarCard.displayName = "UnifiedCarCard";

const UnifiedCatalog = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [sortBy, setSortBy] = useState<'last_synced_at' | 'price' | 'year' | 'mileage'>('last_synced_at');

  // External API 1: Existing Auction APIs (secure)
  const {
    cars: secureCars,
    loading: secureLoading,
    error: secureError,
    totalCount: secureTotal,
    fetchCars: fetchSecureCars
  } = useSecureAuctionAPI();

  // External API 2: New Auctions API (scroll)
  const {
    cars: auctionsCars,
    isLoading: auctionsLoading,
    error: auctionsError,
    startScroll
  } = useAuctionsApiSupabase({ autoStart: false });

  // Initial loads
  useEffect(() => {
    // Fetch first page from secure API
    fetchSecureCars(1, { per_page: String(Math.max(50, pageSize)) }, true);
    // Fetch an initial batch from new Auctions API (no full scroll for responsiveness)
    startScroll(5, Math.max(200, pageSize));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transform Auctions API cars to a unified shape
  const transformedAuctionsCars = useMemo(() => {
    const getString = (value: any): string => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value.name) return value.name;
      return String(value);
    };

    return (auctionsCars || []).map((car: any) => ({
      id: car.id || `auction-${Math.random()}`,
      make: getString(car.brand || car.make),
      model: getString(car.model),
      year: car.year,
      price: car.price || 0,
      mileage: car.mileage || 0,
      title: car.title || `${getString(car.brand || car.make)} ${getString(car.model)} ${car.year || ''}`.trim(),
      image_url: car.image_url || (car.images?.[0] || undefined),
      fuel: getString(car.fuel),
      transmission: getString(car.transmission),
      color: getString(car.color),
      location: getString(car.location),
      lot_number: car.lot_number,
      source_api: 'auctions_api',
      domain_name: 'auctionsapi_com',
      is_active: true,
      is_archived: false,
      last_synced_at: car.last_synced_at || new Date().toISOString()
    }));
  }, [auctionsCars]);

  // Merge both external sources (avoid duplicates by id)
  const mergedCars = useMemo(() => {
    const result: any[] = [];
    const seen = new Set<string>();
    const add = (list: any[]) => {
      for (const c of list || []) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          result.push(c);
        }
      }
    };
    add(secureCars);
    add(transformedAuctionsCars);
    return result;
  }, [secureCars, transformedAuctionsCars]);

  // Client-side sort
  const sortedCars = useMemo(() => {
    const arr = [...mergedCars];
    switch (sortBy) {
      case 'price':
        return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'year':
        return arr.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'mileage':
        return arr.sort((a, b) => (a.mileage || Infinity) - (b.mileage || Infinity));
      case 'last_synced_at':
      default:
        return arr.sort((a, b) => new Date(b.last_synced_at || 0).getTime() - new Date(a.last_synced_at || 0).getTime());
    }
  }, [mergedCars, sortBy]);

  // Pagination
  const total = sortedCars.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedCars.slice(start, start + pageSize);
  }, [sortedCars, page, pageSize]);

  const loading = secureLoading || auctionsLoading;
  const error = secureError || auctionsError;

  const nextPage = useCallback(() => {
    setPage(p => Math.min(p + 1, Math.max(1, totalPages)));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1));
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Katalogu i makinave</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {loading ? 'Duke ngarkuar...' : `${total.toLocaleString()} makina nga të dy API-të`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Rendit sipas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_synced_at">Sapo shtuar</SelectItem>
                <SelectItem value="price">Çmimi (më i lartë)</SelectItem>
                <SelectItem value="year">Viti (më i ri)</SelectItem>
                <SelectItem value="mileage">Kilometrazhi (më i ulët)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Madhësia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 / faqe</SelectItem>
                <SelectItem value="48">48 / faqe</SelectItem>
                <SelectItem value="96">96 / faqe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded p-3 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(loading && paginated.length === 0) ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-white dark:bg-gray-800 h-64 animate-pulse" />
          ))
        ) : (
          paginated.map((car) => (
            <CarCard key={car.id} car={car} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button variant="outline" onClick={prevPage} disabled={page === 1 || loading}>
            Mbrapa
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Faqja {page} nga {totalPages}
          </span>
          <Button variant="outline" onClick={nextPage} disabled={page >= totalPages || loading}>
            Para <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default UnifiedCatalog;


