import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Filter,
  RotateCcw,
  Car,
  Calendar,
  DollarSign,
  Gauge,
  Palette,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCarFilters, useFilterOptions, useCarCount } from '@/hooks/useCarFilters';
import { useCarFilterSelectors } from '@/store/carFilterStore';
import { useDebouncedCallback } from '@/hooks/useDebouncedValue';

interface FastCarFilterPanelProps {
  className?: string;
  compact?: boolean;
}

/**
 * High-performance car filter panel inspired by encar.com
 * Features:
 * - Fast debounced inputs
 * - Smart filter suggestions with counts
 * - Smooth UI interactions
 * - Optimized for mobile and desktop
 */
export function FastCarFilterPanel({ className, compact = false }: FastCarFilterPanelProps) {
  const {
    filters,
    activeFilterCount,
    hasActiveFilters,
    showAdvancedFilters,
    setFilter,
    clearFilters,
    clearFilter,
    setShowAdvancedFilters,
  } = useCarFilters();

  const { getFilteredModels, isFilterActive, getFilterDisplayValue } = useCarFilterSelectors();
  const { filterOptions, isLoading: isLoadingOptions } = useFilterOptions();
  const { count: totalCars, isLoading: isLoadingCount } = useCarCount();

  const [searchValue, setSearchValue] = useState(filters.query || '');
  const [priceRange, setPriceRange] = useState([
    filters.price?.min || filterOptions?.priceRange.min || 0,
    filters.price?.max || filterOptions?.priceRange.max || 100000,
  ]);
  const [yearRange, setYearRange] = useState([
    filters.year?.min || filterOptions?.yearRange.min || 2000,
    filters.year?.max || filterOptions?.yearRange.max || new Date().getFullYear(),
  ]);
  const [mileageRange, setMileageRange] = useState([
    filters.mileage?.min || filterOptions?.mileageRange.min || 0,
    filters.mileage?.max || filterOptions?.mileageRange.max || 500000,
  ]);

  // Debounced filter updates
  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    setFilter('query', value || undefined);
  }, 300);

  const debouncedSetPriceRange = useDebouncedCallback((range: number[]) => {
    const [min, max] = range;
    setFilter('price', {
      min: min !== (filterOptions?.priceRange.min || 0) ? min : undefined,
      max: max !== (filterOptions?.priceRange.max || 100000) ? max : undefined,
    });
  }, 500);

  const debouncedSetYearRange = useDebouncedCallback((range: number[]) => {
    const [min, max] = range;
    setFilter('year', {
      min: min !== (filterOptions?.yearRange.min || 2000) ? min : undefined,
      max: max !== (filterOptions?.yearRange.max || new Date().getFullYear()) ? max : undefined,
    });
  }, 500);

  const debouncedSetMileageRange = useDebouncedCallback((range: number[]) => {
    const [min, max] = range;
    setFilter('mileage', {
      min: min !== (filterOptions?.mileageRange.min || 0) ? min : undefined,
      max: max !== (filterOptions?.mileageRange.max || 500000) ? max : undefined,
    });
  }, 500);

  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSetQuery(value);
  }, [debouncedSetQuery]);

  // Handle range changes
  const handlePriceChange = useCallback((value: number[]) => {
    setPriceRange(value);
    debouncedSetPriceRange(value);
  }, [debouncedSetPriceRange]);

  const handleYearChange = useCallback((value: number[]) => {
    setYearRange(value);
    debouncedSetYearRange(value);
  }, [debouncedSetYearRange]);

  const handleMileageChange = useCallback((value: number[]) => {
    setMileageRange(value);
    debouncedSetMileageRange(value);
  }, [debouncedSetMileageRange]);

  // Handle make change (resets model)
  const handleMakeChange = useCallback((make: string) => {
    setFilter('make', make);
    if (filters.model) {
      setFilter('model', undefined);
    }
  }, [setFilter, filters.model]);

  // Get filtered models for selected make
  const availableModels = getFilteredModels();

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            车辆筛选
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                清除全部
              </Button>
            )}
          </div>
        </div>
        
        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {isLoadingCount ? (
            '加载中...'
          ) : (
            `找到 ${totalCars.toLocaleString()} 辆车`
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            搜索车辆
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="搜索品牌、型号、颜色..."
              value={searchValue}
              onChange={handleSearchChange}
              className="pl-10"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                onClick={() => {
                  setSearchValue('');
                  setFilter('query', undefined);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">已选筛选条件</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                
                const displayValue = getFilterDisplayValue(key as any);
                if (!displayValue) return null;

                const getLabelForKey = (k: string) => {
                  switch (k) {
                    case 'query': return '搜索';
                    case 'make': return '品牌';
                    case 'model': return '型号';
                    case 'fuel': return '燃料';
                    case 'transmission': return '变速箱';
                    case 'color': return '颜色';
                    case 'condition': return '状况';
                    case 'year': return '年份';
                    case 'price': return '价格';
                    case 'mileage': return '里程';
                    default: return k;
                  }
                };

                return (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    <span className="text-xs">
                      {getLabelForKey(key)}: {displayValue}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto w-auto p-0 hover:bg-transparent"
                      onClick={() => clearFilter(key as any)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Basic filters */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Make */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              品牌
            </Label>
            <Select value={filters.make || ''} onValueChange={handleMakeChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择品牌" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.makes.filter(make => make.count > 0).map((make) => (
                  <SelectItem key={make.value} value={make.value}>
                    {make.label} ({make.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              型号
            </Label>
            <Select 
              value={filters.model || ''} 
              onValueChange={(value) => setFilter('model', value)}
              disabled={!filters.make || availableModels.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={!filters.make ? "请先选择品牌" : "选择型号"} />
              </SelectTrigger>
              <SelectContent>
                {availableModels.filter(model => (model.count || 0) > 0).map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label} {model.count && `(${model.count})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            价格范围 (元)
          </Label>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={handlePriceChange}
              min={filterOptions?.priceRange.min || 0}
              max={filterOptions?.priceRange.max || 100000}
              step={1000}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>¥{priceRange[0].toLocaleString()}</span>
              <span>¥{priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Year Range */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            年份范围
          </Label>
          <div className="px-2">
            <Slider
              value={yearRange}
              onValueChange={handleYearChange}
              min={filterOptions?.yearRange.min || 2000}
              max={filterOptions?.yearRange.max || new Date().getFullYear()}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>{yearRange[0]}</span>
              <span>{yearRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Advanced filters toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="w-full flex items-center justify-center gap-2"
        >
          高级筛选
          {showAdvancedFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Advanced filters */}
        {showAdvancedFilters && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Fuel */}
              <div className="space-y-2">
                <Label>燃料类型</Label>
                <Select value={filters.fuel || ''} onValueChange={(value) => setFilter('fuel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择燃料类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions?.fuels.filter(fuel => fuel.count > 0).map((fuel) => (
                      <SelectItem key={fuel.value} value={fuel.value}>
                        {fuel.label} ({fuel.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transmission */}
              <div className="space-y-2">
                <Label>变速箱</Label>
                <Select value={filters.transmission || ''} onValueChange={(value) => setFilter('transmission', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择变速箱" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions?.transmissions.filter(transmission => transmission.count > 0).map((transmission) => (
                      <SelectItem key={transmission.value} value={transmission.value}>
                        {transmission.label} ({transmission.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  颜色
                </Label>
                <Select value={filters.color || ''} onValueChange={(value) => setFilter('color', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择颜色" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions?.colors.filter(color => color.count > 0).map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        {color.label} ({color.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label>车况</Label>
                <Select value={filters.condition || ''} onValueChange={(value) => setFilter('condition', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择车况" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions?.conditions.filter(condition => condition.count > 0).map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label} ({condition.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mileage Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                里程范围 (公里)
              </Label>
              <div className="px-2">
                <Slider
                  value={mileageRange}
                  onValueChange={handleMileageChange}
                  min={filterOptions?.mileageRange.min || 0}
                  max={filterOptions?.mileageRange.max || 500000}
                  step={10000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>{mileageRange[0].toLocaleString()} km</span>
                  <span>{mileageRange[1].toLocaleString()} km</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoadingOptions && (
          <div className="text-center text-sm text-muted-foreground py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            正在加载筛选选项...
          </div>
        )}
      </CardContent>
    </Card>
  );
}