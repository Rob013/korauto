import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { Car, Gauge, Settings, Fuel, Palette, Shield, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getStatusBadgeConfig } from "@/utils/statusBadgeUtils";
import { formatModelName } from "@/utils/modelNameFormatter";

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
  archive_reason
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
    
    // Open in new tab
    window.open(`/car/${lot}`, '_blank');
  }, [setCompletePageState, lot]);

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
    
    // Open in new tab
    window.open(`/car/${lot}`, '_blank');
  }, [setCompletePageState, lot]);

  // Don't render content until intersection
  if (!isIntersecting) {
    return (
      <div 
        ref={cardRef}
        className="glass-card rounded-lg overflow-hidden h-96"
        style={{
          willChange: 'contents',
          containIntrinsicSize: '280px 360px'
        }}
      >
          <div className="animate-pulse">
            <div className="h-72 bg-muted" />
            <div className="p-2 space-y-1">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-5 bg-muted rounded w-2/3" />
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
      className="glass-card overflow-hidden cursor-pointer touch-manipulation rounded-xl mobile-card-compact compact-modern-card animate-slide-in-up"
      onClick={handleCardClick}
      style={{
        willChange: 'transform, opacity',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        perspective: 1000,
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Image Section - Standard 4:3 aspect ratio like encar.com */}
      <div className="relative bg-muted overflow-hidden flex-shrink-0 rounded-lg aspect-[4/3] w-full">
        {/* Always show single image - swipe functionality removed from car cards */}
        {(image || (images && images.length > 0)) ? (
          <img 
            src={image || images?.[0]} 
            alt={`${year} ${make} ${model}`} 
            className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100 animate-image-reveal' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
              setImageLoaded(true);
            }}
            loading="lazy"
            style={{
              willChange: 'transform, opacity',
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Car className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
          </div>
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
            className="absolute top-1 left-1 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg z-10"
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
        )}
      </div>
      
      {/* Content Section - 30% of card height, more compact */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="mb-2">
          <h3 className="card-title text-sm font-bold text-foreground line-clamp-1 leading-tight">
            {make} {formatModelName(model, make)}
          </h3>
          {title && title !== `${make} ${model}` && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{title}</p>
          )}
        </div>

        {/* Vehicle Info - More compact layout */}
        <div className="mb-2 text-xs grid grid-cols-2 gap-x-2 gap-y-1">
          {mileage && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Gauge className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate font-medium text-foreground">{mileage}</span>
            </div>
          )}
          {year && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Car className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-foreground">{year}</span>
            </div>
          )}
          {fuel && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Fuel className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate text-foreground">{fuel}</span>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Settings className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate text-foreground">{transmission}</span>
            </div>
          )}
        </div>

        {/* Status Indicators - More compact */}
        {insurance_v2?.accidentCnt === 0 && (
          <div className="mb-2">
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200">
              <Shield className="h-2.5 w-2.5 mr-1" />
              Clean
            </Badge>
          </div>
        )}

        {/* Pricing Section - Better aligned */}
        <div className="mt-auto">
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="card-price text-lg font-bold text-primary">
                €{price.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground text-right flex-shrink-0">
                KORAUTO
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-tight">
              deri ne portin e Durrësit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

LazyCarCard.displayName = 'LazyCarCard';

export default LazyCarCard;