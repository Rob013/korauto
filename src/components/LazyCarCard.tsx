import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { Car, Gauge, Settings, Fuel, Palette, Shield, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getStatusBadgeConfig } from "@/utils/statusBadgeUtils";

interface LazyCarCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  images?: string[]; // New prop for multiple images
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
  // Archive information for sold cars
  is_archived?: boolean;
  archived_at?: string;
  archive_reason?: string;
  // View mode prop
  viewMode?: 'grid' | 'list';
}

const LazyCarCard = memo(({
  id,
  make,
  model,
  year,
  price,
  image,
  images, // New prop
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
  viewMode = 'grid' // Default to grid view
}: LazyCarCardProps) => {
  const navigate = useNavigate();
  const { setCompletePageState } = useNavigation();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Simplified logic: trust the database filtering, only hide in clear edge cases
  const shouldHideSoldCar = () => {
    // Only hide if it's definitively a sold car that's clearly old
    if (is_archived && archived_at && archive_reason === 'sold') {
      try {
        const archivedTime = new Date(archived_at);
        
        // Check if date is valid
        if (isNaN(archivedTime.getTime())) {
          return true; // Hide cars with invalid dates as safety measure
        }
        
        const now = new Date();
        const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
        
        // Only hide if clearly over 24 hours (with small buffer for timing differences)
        return hoursSinceArchived > 24.5; // 30-minute buffer to account for timing differences
      } catch (error) {
        // In case of any error, hide the car as a safety measure
        return true;
      }
    }
    
    // Default: show the car (trust database filtering)
    return false;
  };

  const hideSoldCar = shouldHideSoldCar();

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Optimized user data fetching
  useEffect(() => {
    let isMounted = true;
    
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;
        
        setUser(user);
        
        if (user) {
          const [{ data: favorite }, { data: userRole }] = await Promise.all([
            supabase
              .from('favorite_cars')
              .select('id')
              .eq('user_id', user.id)
              .eq('car_id', id)
              .maybeSingle(),
            supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .maybeSingle()
          ]);
          
          if (isMounted) {
            setIsFavorite(!!favorite);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    getUser();

    return () => {
      isMounted = false;
    };
  }, [id]);

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
      if (isFavorite) {
        await supabase
          .from('favorite_cars')
          .delete()
          .eq('user_id', user.id)
          .eq('car_id', id);
        
        setIsFavorite(false);
        toast({
          title: "Removed from favorites",
          description: "Car removed from your favorites",
        });
      } else {
        await supabase
          .from('favorite_cars')
          .insert({
            user_id: user.id,
            car_id: id,
            car_make: make,
            car_model: model,
            car_year: year,
            car_price: price,
            car_image: image
          });
        
        setIsFavorite(true);
        toast({
          title: "Added to favorites",
          description: "Car saved to your favorites",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  }, [user, isFavorite, id, make, model, year, price, image, toast, navigate]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Save complete page state including scroll position and filter panel state
    const currentFilterPanelState = sessionStorage.getItem('mobile-filter-panel-state');
    setCompletePageState({
      url: window.location.pathname + window.location.search,
      scrollPosition: window.scrollY,
      filterPanelState: currentFilterPanelState ? JSON.parse(currentFilterPanelState) : false,
      timestamp: Date.now()
    });
    
    // Close filter panel when navigating to car details (if it's open)
    sessionStorage.setItem('mobile-filter-panel-state', JSON.stringify(false));
    
    navigate(`/car/${lot}`);
  }, [setCompletePageState, lot, navigate]);

  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Save complete page state including scroll position and filter panel state
    const currentFilterPanelState = sessionStorage.getItem('mobile-filter-panel-state');
    setCompletePageState({
      url: window.location.pathname + window.location.search,
      scrollPosition: window.scrollY,
      filterPanelState: currentFilterPanelState ? JSON.parse(currentFilterPanelState) : false,
      timestamp: Date.now()
    });
    
    // Close filter panel when navigating to car details (if it's open)
    sessionStorage.setItem('mobile-filter-panel-state', JSON.stringify(false));
    
    navigate(`/car/${lot}`);
  }, [setCompletePageState, lot, navigate]);

  // Don't render content until intersection
  if (!isIntersecting) {
    return (
      <div 
        ref={cardRef}
        className="glass-card rounded-lg overflow-hidden h-96"
      >
          <div className="animate-pulse">
            <div className="h-52 bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-6 bg-muted rounded w-2/3" />
            </div>
          </div>
      </div>
    );
  }

  // Don't render the component if it should be hidden
  if (hideSoldCar) {
    return null;
  }

  return (
    <div 
      ref={cardRef}
      className={`glass-card overflow-hidden cursor-pointer group touch-manipulation rounded-xl card-touch-effect transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        viewMode === 'list' 
          ? 'flex flex-row items-start gap-3 p-3 mobile-card-compact' 
          : 'mobile-card-compact'
      }`}
      onClick={handleCardClick}
    >
      {/* Image Section - More compact */}
      <div className={`relative bg-muted overflow-hidden flex-shrink-0 rounded-lg ${
        viewMode === 'list' 
          ? 'w-28 h-20 sm:w-36 sm:h-24 lg:w-44 lg:h-28' 
          : 'h-36 sm:h-44 lg:h-48'
      }`}>
        {/* Always show single image - swipe functionality removed from car cards */}
        {(image || (images && images.length > 0)) ? (
          <img 
            src={image || images?.[0]} 
            alt={`${year} ${make} ${model}`} 
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
              setImageLoaded(true);
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Car className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Lot Number Badge - Modern style */}
        {lot && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-2 py-1 rounded-md text-xs font-medium shadow-md backdrop-blur-sm">
            {lot}
          </div>
        )}

        {/* Favorite Button - Modern style */}
        {user && (
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-2 left-2 p-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10 shadow-md"
          >
            <Heart className={`h-3 w-3 sm:h-4 sm:w-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}`} />
          </button>
        )}
      </div>
      
      {/* Content Section - More compact */}
      <div className={`${viewMode === 'list' ? 'flex-1 min-w-0 py-1' : 'p-3 sm:p-4'}`}>
        {/* Title Section - Compact */}
        <div className="mb-2">
          <h3 className="card-title text-sm sm:text-base font-semibold text-foreground line-clamp-2 leading-tight">
            {year} {make} {model}
          </h3>
          {title && title !== `${make} ${model}` && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{title}</p>
          )}
        </div>

        {/* Vehicle Info - Compact grid layout */}
        <div className={`mb-3 card-details text-xs ${
          viewMode === 'list' 
            ? 'grid grid-cols-2 gap-x-3 gap-y-1' 
            : 'grid grid-cols-2 gap-x-2 gap-y-1'
        }`}>
          {mileage && (
            <div className="flex items-center gap-1">
              <Gauge className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="truncate font-medium">{mileage}</span>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-1">
              <Settings className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="capitalize truncate font-medium">{transmission}</span>
            </div>
          )}
          {fuel && (
            <div className="flex items-center gap-1">
              <Fuel className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="capitalize truncate font-medium">{fuel}</span>
            </div>
          )}
          {color && (
            <div className="flex items-center gap-1">
              <Palette className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="capitalize truncate font-medium">{color}</span>
            </div>
          )}
        </div>

        {/* Status Indicators - More compact */}
        {insurance_v2?.accidentCnt === 0 && (
          <div className="mb-2">
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 text-green-800 border-0 rounded-md">
              <Shield className="h-2.5 w-2.5 mr-1" />
              Clean
            </Badge>
          </div>
        )}

        {/* Pricing Section - Modern layout */}
        <div className={`${viewMode === 'list' ? 'flex flex-col items-end mt-auto' : 'mt-auto'}`}>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="card-price text-lg sm:text-xl font-bold text-primary">
              €{price.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Deri në port
          </p>
          
          {viewMode === 'grid' && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground font-semibold text-center">
                KORAUTO
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

LazyCarCard.displayName = 'LazyCarCard';

export default LazyCarCard;