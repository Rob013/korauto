import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiltersFromUrl } from '@/hooks/useFiltersFromUrl';
import { useCarsQuery } from '@/hooks/useCarsQuery';
import CarsList from '@/components/CarsList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, RefreshCw } from 'lucide-react';

const SELECT_CLEAR_VALUE = '__select_clear__';

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Year: Newest' },
  { value: 'year_asc', label: 'Year: Oldest' },
  { value: 'mileage_asc', label: 'Mileage: Low' },
  { value: 'mileage_desc', label: 'Mileage: High' },
  { value: 'recently_added', label: 'Recently Added' },
  { value: 'oldest_first', label: 'Oldest First' },
  { value: 'popular', label: 'Most Popular' },
];

const NewCatalog = () => {
  const navigate = useNavigate();
  const { filters, updateFilter, updateFilters, clearFilters } = useFiltersFromUrl();
  const {
    cars,
    total,
    hasMore,
    isLoading,
    isFetching,
    error,
  } = useCarsQuery(filters);

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [fuelOptions, setFuelOptions] = useState<string[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      updateFilter('search', searchInput ? searchInput : undefined);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput, updateFilter]);

  // Fetch brand options once
  useEffect(() => {
    let isMounted = true;
    setFiltersLoading(true);
    supabase
      .from('cars_cache')
      .select('make')
      .order('make')
      .limit(1000)
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setBrandOptions([]);
          return;
        }
        const names = Array.from(
          new Set(
            data
              ?.map((row) => row.make)
              .filter((name): name is string => Boolean(name && name.trim())) ?? []
          )
        );
        setBrandOptions(names);
      })
      .finally(() => {
        if (isMounted) {
          setFiltersLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch model options when brand changes
  useEffect(() => {
    if (!filters.brand) {
      setModelOptions([]);
      return;
    }

    let isMounted = true;
    setFiltersLoading(true);
    supabase
      .from('cars_cache')
      .select('model')
      .eq('make', filters.brand)
      .order('model')
      .limit(1000)
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setModelOptions([]);
          return;
        }
        const names = Array.from(
          new Set(
            data
              ?.map((row) => row.model)
              .filter((name): name is string => Boolean(name && name.trim())) ?? []
          )
        );
        setModelOptions(names);
      })
      .finally(() => {
        if (isMounted) {
          setFiltersLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filters.brand]);

  // Fetch fuel options once
  useEffect(() => {
    let isMounted = true;
    supabase
      .from('cars_cache')
      .select('fuel')
      .not('fuel', 'is', null)
      .order('fuel')
      .limit(100)
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setFuelOptions([]);
          return;
        }
        const fuels = Array.from(
          new Set(
            data
              ?.map((row) => row.fuel)
              .filter((value): value is string => Boolean(value && value.trim())) ?? []
          )
        );
        setFuelOptions(fuels);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoadMore = () => {
    if (isLoading || !hasMore) return;
    const nextPage = (filters.page || 1) + 1;
    updateFilter('page', nextPage);
  };

  const handleCarClick = (car: { id: string }) => {
    navigate(`/car/${car.id}`);
  };

  const activeFiltersCount = useMemo(() => {
    const ignored = new Set(['page', 'pageSize', 'sort', 'search']);
    return Object.entries(filters).filter(
      ([key, value]) =>
        !ignored.has(key) && value !== undefined && value !== null && value !== ''
    ).length;
  }, [filters]);

  const totalCountDisplay = useMemo(() => {
    if (typeof total === 'number') {
      return total.toLocaleString();
    }
    return '—';
  }, [total]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container-responsive py-6 space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Premium Inventory
              </p>
              <h1 className="text-3xl font-bold tracking-tight">Car Catalog</h1>
            </div>
            <div className="flex items-center gap-2">
              {(isLoading || isFetching) && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateFilter('page', 1)}
                title="Refresh results"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            {total ? (
              <>
                Showing <span className="font-semibold">{cars.length}</span> of{' '}
                <span className="font-semibold">{totalCountDisplay}</span> cars
              </>
            ) : (
              'Browsing live inventory synced from our database'
            )}
          </p>
        </header>

        <section className="rounded-2xl border bg-card/60 backdrop-blur p-4 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by make, model, or keyword"
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              <Select
                value={filters.brand || SELECT_CLEAR_VALUE}
                onValueChange={(value) =>
                  updateFilters(
                    {
                      brand: value === SELECT_CLEAR_VALUE ? undefined : value,
                      model: undefined,
                      page: 1,
                    },
                    { replace: true }
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_CLEAR_VALUE}>All brands</SelectItem>
                  {brandOptions.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.model || SELECT_CLEAR_VALUE}
                onValueChange={(value) =>
                  updateFilters(
                    { model: value === SELECT_CLEAR_VALUE ? undefined : value, page: 1 },
                    { replace: true }
                  )
                }
                disabled={!filters.brand || modelOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_CLEAR_VALUE}>All models</SelectItem>
                  {modelOptions.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.fuel || SELECT_CLEAR_VALUE}
                onValueChange={(value) =>
                  updateFilters(
                    { fuel: value === SELECT_CLEAR_VALUE ? undefined : value, page: 1 },
                    { replace: true }
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All fuel types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_CLEAR_VALUE}>All fuel types</SelectItem>
                  {fuelOptions.map((fuel) => (
                    <SelectItem key={fuel} value={fuel}>
                      {fuel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {activeFiltersCount > 0 ? (
                <>
                  {activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}
                </>
              ) : (
                'No filters applied'
              )}
              {filtersLoading && <span className="ml-2 text-xs">Updating filters…</span>}
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={filters.sort || 'price_asc'}
                onValueChange={(value) => updateFilter('sort', value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort results" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <p className="font-semibold">Failed to load cars</p>
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        <CarsList
          cars={cars}
          isLoading={isLoading}
          error={error}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onCarClick={handleCarClick}
          totalCount={total}
          activeFiltersCount={activeFiltersCount}
        />
      </div>
    </div>
  );
};

export default NewCatalog;
