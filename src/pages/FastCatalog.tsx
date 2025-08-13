import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { DevelopmentModeBanner } from '@/components/DevelopmentModeBanner';
import { 
  Filter, 
  ArrowUpDown, 
  Grid3X3,
  List,
  X,
  Menu,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FastCarFilterPanel } from '@/components/FastCarFilterPanel';
import { FastCarList } from '@/components/FastCarList';
import { useCarFilters, useCarsQuery, useFilterOptions } from '@/hooks/useCarFilters';
import type { SortOption } from '@/store/carFilterStore';
import type { CarCacheRow } from '@/lib/carQuery';

// Optimized QueryClient for car operations
const carQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Sort options
const sortOptions: Array<{ value: string; label: string; field: SortOption['field']; direction: SortOption['direction'] }> = [
  { value: 'newest', label: '最新发布', field: 'created_at', direction: 'desc' },
  { value: 'oldest', label: '发布最早', field: 'created_at', direction: 'asc' },
  { value: 'price_low', label: '价格从低到高', field: 'price', direction: 'asc' },
  { value: 'price_high', label: '价格从高到低', field: 'price', direction: 'desc' },
  { value: 'year_new', label: '年份从新到旧', field: 'year', direction: 'desc' },
  { value: 'year_old', label: '年份从旧到新', field: 'year', direction: 'asc' },
  { value: 'mileage_low', label: '里程从低到高', field: 'mileage', direction: 'asc' },
  { value: 'mileage_high', label: '里程从高到低', field: 'mileage', direction: 'desc' },
  { value: 'make', label: '品牌A-Z', field: 'make', direction: 'asc' },
];

interface FastCatalogContentProps {
  onCarClick?: (car: CarCacheRow) => void;
}

function FastCatalogContent({ onCarClick }: FastCatalogContentProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const {
    filters,
    sort,
    activeFilterCount,
    hasActiveFilters,
    setSort,
    nextPage,
    clearFilters,
  } = useCarFilters();

  const {
    cars,
    totalCount,
    hasMore,
    isLoading,
    isFetching,
    currentPage,
    totalPages,
    prefetchNextPage,
  } = useCarsQuery();

  const { isLoading: isLoadingOptions } = useFilterOptions();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    // Add filters to URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          params.set(key, value);
        } else if (typeof value === 'object' && 'min' in value && 'max' in value) {
          if (value.min !== undefined) params.set(`${key}_min`, value.min.toString());
          if (value.max !== undefined) params.set(`${key}_max`, value.max.toString());
        }
      }
    });

    // Add sort to URL
    const sortValue = sortOptions.find(
      opt => opt.field === sort.field && opt.direction === sort.direction
    )?.value || 'newest';
    params.set('sort', sortValue);

    setSearchParams(params);
  }, [filters, sort, setSearchParams]);

  // Handle sort change
  const handleSortChange = useCallback((sortValue: string) => {
    const sortOption = sortOptions.find(opt => opt.value === sortValue);
    if (sortOption) {
      setSort(sortOption.field, sortOption.direction);
    }
  }, [setSort]);

  // Handle car click
  const handleCarClick = useCallback((car: CarCacheRow) => {
    if (onCarClick) {
      onCarClick(car);
    } else {
      navigate(`/car/${car.id}`);
    }
  }, [onCarClick, navigate]);

  // Handle car hover for prefetching
  const handleCarHover = useCallback((car: CarCacheRow) => {
    // Could prefetch car details here
  }, []);

  // Get current sort value
  const currentSortValue = sortOptions.find(
    opt => opt.field === sort.field && opt.direction === sort.direction
  )?.value || 'newest';

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block w-80 border-r bg-card/50 overflow-y-auto">
          <div className="sticky top-0 p-4">
            <FastCarFilterPanel />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回
                </Button>

                {/* Mobile filters button */}
                <div className="lg:hidden">
                  <Drawer open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                    <DrawerTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        筛选
                        {activeFilterCount > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="max-h-[90vh]">
                      <div className="p-4 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold">筛选条件</h2>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMobileFilters(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <FastCarFilterPanel compact />
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* View mode toggle */}
                <div className="hidden sm:flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="p-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="p-2"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <Select value={currentSortValue} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="排序方式" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Results summary */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                    车辆目录
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>共找到 {totalCount.toLocaleString()} 辆车</span>
                    <span>•</span>
                    <span>第 {currentPage} 页，共 {totalPages} 页</span>
                    {(isFetching || isLoadingOptions) && !isLoading && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                          加载中...
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    清除筛选
                  </Button>
                )}
              </div>
            </div>

            {/* Development Mode Banner */}
            <DevelopmentModeBanner />

            {/* Active filters display (mobile) */}
            {hasActiveFilters && (
              <div className="mb-6 lg:hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">已选条件:</span>
                  <Badge variant="outline">{activeFilterCount}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value) return null;
                    
                    const getDisplayValue = (k: string, v: any) => {
                      if (typeof v === 'string') return v;
                      if (typeof v === 'object' && 'min' in v && 'max' in v) {
                        return `${v.min || ''}-${v.max || ''}`;
                      }
                      return String(v);
                    };

                    const getLabel = (k: string) => {
                      const labels: Record<string, string> = {
                        query: '搜索',
                        make: '品牌',
                        model: '型号',
                        fuel: '燃料',
                        transmission: '变速箱',
                        color: '颜色',
                        condition: '状况',
                        year: '年份',
                        price: '价格',
                        mileage: '里程',
                      };
                      return labels[k] || k;
                    };

                    return (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {getLabel(key)}: {getDisplayValue(key, value)}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cars list */}
            <FastCarList
              cars={cars}
              isLoading={isLoading}
              hasMore={hasMore}
              onLoadMore={nextPage}
              onCarClick={handleCarClick}
              onCarHover={handleCarHover}
              className={viewMode === 'list' ? 'grid-cols-1 lg:grid-cols-2' : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Fast car catalog page with high-performance filtering
 * Inspired by encar.com with optimizations for Supabase
 */
export function FastCatalog() {
  return (
    <QueryClientProvider client={carQueryClient}>
      <FastCatalogContent />
    </QueryClientProvider>
  );
}

export default FastCatalog;