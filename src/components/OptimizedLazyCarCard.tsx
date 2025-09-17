import React, { memo, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { Car, Gauge, Settings, Fuel, Palette, Shield, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLazyImageLoading } from "@/hooks/useOptimizedIntersection";

interface OptimizedLazyCarCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  images?: string[];
  vin?: string;
  mileage?: string;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot?: string;
  title?: string;
  status?: number;
  sale_status?: string;
  final_price?: number;
  insurance_v2?: {
    accidentCnt?: number;
  };
  details?: {
    seats_count?: number;
  };
  is_archived?: boolean;
  archived_at?: string;
  archive_reason?: string;
  viewMode?: 'grid' | 'list';
  user?: any; // Pass user from parent to avoid duplicate fetches
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
}

const OptimizedLazyCarCard = memo(({
  id,
  make,
  model,
  year,
  price,
  image,
  images,
  mileage,
  transmission,
  fuel,
  color,
  lot,
  title,
  status,
  sale_status,
  final_price,
  insurance_v2,
  details,
  is_archived,
  archived_at,
  archive_reason,
  viewMode = 'grid',
  user,
  isFavorite: initialIsFavorite = false,
  onFavoriteToggle
}: OptimizedLazyCarCardProps) => {
  const navigate = useNavigate();
  const { setCompletePageState } = useNavigation();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  // Use optimized image loading
  const imageUrl = image || images?.[0];
  const {
    targetRef,
    imageSrc,
    imageLoaded,
    imageError,
    handleLoad,
    handleError,
    shouldShowPlaceholder
  } = useLazyImageLoading(imageUrl);

  // Memoized visibility check
  const shouldHide = useMemo(() => {
    if (is_archived && archived_at && archive_reason === 'sold') {
      try {
        const archivedTime = new Date(archived_at);
        if (isNaN(archivedTime.getTime())) return true;
        
        const now = new Date();
        const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
        return hoursSinceArchived > 24.5;
      } catch {
        return true;
      }
    }
    return false;
  }, [is_archived, archived_at, archive_reason]);

  const handleFavoriteToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to save favorite cars",
      });
      navigate('/auth');
      return;
    }

    try {
      const newFavoriteState = !isFavorite;
      
      if (newFavoriteState) {
        await supabase
          .from('favorite_cars')
          .insert({
            user_id: user.id,
            car_id: id,
            car_make: make,
            car_model: model,
            car_year: year,
            car_price: price,
            car_image: imageUrl
          });
        
        toast({
          title: "Added to favorites",
          description: "Car saved to your favorites",
        });
      } else {
        await supabase
          .from('favorite_cars')
          .delete()
          .eq('user_id', user.id)
          .eq('car_id', id);
        
        toast({
          title: "Removed from favorites",
          description: "Car removed from your favorites",
        });
      }
      
      setIsFavorite(newFavoriteState);
      onFavoriteToggle?.(id, newFavoriteState);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  }, [user, isFavorite, id, make, model, year, price, imageUrl, toast, navigate, onFavoriteToggle]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentFilterPanelState = sessionStorage.getItem('mobile-filter-panel-state');
    setCompletePageState({
      url: window.location.pathname + window.location.search,
      scrollPosition: window.scrollY,
      filterPanelState: currentFilterPanelState ? JSON.parse(currentFilterPanelState) : false,
      timestamp: Date.now()
    });
    
    sessionStorage.setItem('mobile-filter-panel-state', JSON.stringify(false));
    navigate(`/car/${lot}`);
  }, [setCompletePageState, lot, navigate]);

  // Don't render if should hide
  if (shouldHide) {
    return null;
  }

  return (
    <div 
      ref={targetRef}
      className={`glass-card overflow-hidden cursor-pointer group touch-manipulation rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] will-change-transform ${
        viewMode === 'list' 
          ? 'flex flex-row items-start gap-3 p-3 mobile-card-compact' 
          : 'mobile-card-compact compact-modern-card'
      }`}
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className={`relative bg-muted overflow-hidden flex-shrink-0 rounded-lg ${
        viewMode === 'list' 
          ? 'w-32 h-24 sm:w-40 sm:h-28 lg:w-48 lg:h-32' 
          : 'h-52 sm:h-60 lg:h-72'
      }`}>
        {/* Optimized image with better loading */}
        {shouldShowPlaceholder && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <Car className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        {imageSrc && (
          <img 
            src={imageSrc}
            alt={`${year} ${make} ${model}`} 
            className={`w-full h-full object-cover transition-all duration-300 ${
              imageLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            decoding="async"
            style={{ 
              backgroundColor: 'hsl(var(--muted))',
              willChange: imageLoaded ? 'transform' : 'auto'
            }}
          />
        )}
        
        {/* Lot Number Badge */}
        {lot && (
          <div className="absolute top-1 right-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-2 py-0.5 rounded-md text-xs font-bold shadow-md backdrop-blur-sm">
            {lot}
          </div>
        )}

        {/* Favorite Button */}
        {user && (
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-1 left-1 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 hover:bg-black/80"
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
        )}
      </div>
      
      {/* Content Section */}
      <div className={`${viewMode === 'list' ? 'flex-1 min-w-0' : 'p-2 flex-1'}`}>
        <div className="mb-1">
          <h3 className="card-title text-sm font-bold text-foreground line-clamp-1 leading-tight">
            {year} {make} {model}
          </h3>
          {title && title !== `${make} ${model}` && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{title}</p>
          )}
        </div>

        {/* Vehicle Info - Optimized layout */}
        <div className={`mb-1 text-xs space-y-0.5 ${
          viewMode === 'list' 
            ? 'grid grid-cols-2 gap-x-3 gap-y-0.5' 
            : 'grid grid-cols-2 gap-x-2 gap-y-0.5'
        }`}>
          {mileage && (
            <div className="flex items-center gap-1.5">
              <Gauge className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate font-medium">{mileage}</span>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-1.5">
              <Settings className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate">{transmission}</span>
            </div>
          )}
          {fuel && (
            <div className="flex items-center gap-1.5">
              <Fuel className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate">{fuel}</span>
            </div>
          )}
          {color && (
            <div className="flex items-center gap-1.5">
              <Palette className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate">{color}</span>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        {insurance_v2?.accidentCnt === 0 && (
          <div className="mb-1">
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200">
              <Shield className="h-2 w-2 mr-1" />
              Clean
            </Badge>
          </div>
        )}

        {/* Pricing Section */}
        <div className={`${viewMode === 'list' ? 'flex flex-col items-end justify-center' : 'mt-1'}`}>
          {viewMode === 'list' ? (
            <div className="text-center">
              <span className="card-price text-base sm:text-lg font-bold text-primary block">
                €{Math.round(price).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground block">
                deri ne portin e Durrësit
              </span>
            </div>
          ) : (
            <div className="flex items-end justify-between">
              <span className="card-price text-base sm:text-lg font-bold text-primary">
                €{Math.round(price).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                deri ne portin e Durrësit
              </span>
            </div>
          )}
          
          {viewMode === 'grid' && (
            <div className="text-center mt-0.5">
              <p className="text-xs text-muted-foreground font-medium">
                KORAUTO
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

OptimizedLazyCarCard.displayName = 'OptimizedLazyCarCard';

export default OptimizedLazyCarCard;