import React, { useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  Gauge, 
  DollarSign, 
  Eye,
  Heart,
  Share2,
  MoreVertical,
  MapPin,
  Fuel,
  Settings,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CarCacheRow } from '@/lib/carQuery';

interface FastCarListProps {
  cars: CarCacheRow[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onCarClick?: (car: CarCacheRow) => void;
  onCarHover?: (car: CarCacheRow) => void;
  className?: string;
}

interface CarCardProps {
  car: CarCacheRow;
  onClick?: (car: CarCacheRow) => void;
  onHover?: (car: CarCacheRow) => void;
  className?: string;
}

/**
 * Fast car card component optimized for performance
 */
function FastCarCard({ car, onClick, onHover, className }: CarCardProps) {
  // Parse car data for additional information
  const carData = useMemo(() => {
    try {
      return typeof car.car_data === 'string' ? JSON.parse(car.car_data) : car.car_data;
    } catch {
      return {};
    }
  }, [car.car_data]);

  // Parse images
  const images = useMemo(() => {
    try {
      const imgs = typeof car.images === 'string' ? JSON.parse(car.images) : car.images;
      return Array.isArray(imgs) ? imgs : [];
    } catch {
      return [];
    }
  }, [car.images]);

  const primaryImage = images[0] || '/placeholder-car.jpg';

  // Format price
  const formattedPrice = useMemo(() => {
    if (!car.price) return '面议';
    const price = typeof car.price === 'string' ? parseFloat(car.price) : car.price;
    if (price < 10000) {
      return `¥${price.toLocaleString()}`;
    } else {
      return `¥${(price / 10000).toFixed(1)}万`;
    }
  }, [car.price]);

  // Format mileage
  const formattedMileage = useMemo(() => {
    if (!car.mileage) return '-';
    const mileage = typeof car.mileage === 'string' ? parseInt(car.mileage, 10) : car.mileage;
    if (isNaN(mileage)) return '-';
    
    if (mileage < 10000) {
      return `${mileage.toLocaleString()}km`;
    } else {
      return `${(mileage / 10000).toFixed(1)}万km`;
    }
  }, [car.mileage]);

  const handleClick = useCallback(() => {
    onClick?.(car);
  }, [onClick, car]);

  const handleMouseEnter = useCallback(() => {
    onHover?.(car);
  }, [onHover, car]);

  return (
    <Card 
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
          <img
            src={primaryImage}
            alt={`${car.make} ${car.model}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Overlay actions */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* Status badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {car.condition && (
              <Badge variant="secondary" className="text-xs">
                {car.condition}
              </Badge>
            )}
            {images.length > 1 && (
              <Badge variant="outline" className="text-xs bg-black/20 text-white border-white/20">
                {images.length} 图片
              </Badge>
            )}
          </div>

          {/* Price tag */}
          <div className="absolute bottom-2 left-2">
            <Badge variant="default" className="text-sm font-bold">
              {formattedPrice}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-lg leading-tight">
              {car.year} {car.make} {car.model}
            </h3>
            {car.vin && (
              <p className="text-xs text-muted-foreground mt-1">
                VIN: {car.vin.slice(-8)}
              </p>
            )}
          </div>

          {/* Key specs */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">年份:</span>
              <span className="font-medium">{car.year}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Gauge className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">里程:</span>
              <span className="font-medium">{formattedMileage}</span>
            </div>

            {car.fuel && (
              <div className="flex items-center gap-1">
                <Fuel className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">燃料:</span>
                <span className="font-medium">{car.fuel}</span>
              </div>
            )}

            {car.transmission && (
              <div className="flex items-center gap-1">
                <Settings className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">变速:</span>
                <span className="font-medium">{car.transmission}</span>
              </div>
            )}

            {car.color && (
              <div className="flex items-center gap-1">
                <Palette className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">颜色:</span>
                <span className="font-medium">{car.color}</span>
              </div>
            )}

            {car.lot_number && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">批次:</span>
                <span className="font-medium">{car.lot_number}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              {car.created_at && new Date(car.created_at).toLocaleDateString()}
            </div>
            
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              查看详情
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for car cards
 */
function CarCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * High-performance car list with virtual scrolling capability
 */
export function FastCarList({
  cars,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onCarClick,
  onCarHover,
  className,
}: FastCarListProps) {
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore && onLoadMore) {
      onLoadMore();
    }
  }, [isLoading, hasMore, onLoadMore]);

  // Show loading skeletons
  if (isLoading && cars.length === 0) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <CarCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (!isLoading && cars.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="text-center space-y-4">
          <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">未找到匹配的车辆</h3>
            <p className="text-muted-foreground">请尝试调整筛选条件或扩大搜索范围</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cars grid */}
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
        {cars.map((car) => (
          <FastCarCard
            key={car.id}
            car={car}
            onClick={onCarClick}
            onHover={onCarHover}
          />
        ))}
        
        {/* Loading more cars */}
        {isLoading && cars.length > 0 && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <CarCardSkeleton key={`loading-${i}`} />
            ))}
          </>
        )}
      </div>

      {/* Load more button */}
      {hasMore && !isLoading && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="min-w-32"
          >
            加载更多
          </Button>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && cars.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b border-current"></div>
            正在加载更多车辆...
          </div>
        </div>
      )}
    </div>
  );
}