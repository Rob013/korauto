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
      className={`glass-card overflow-hidden cursor-pointer group touch-manipulation rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] ${
        viewMode === 'list' 
          ? 'flex flex-row items-start gap-3 p-3 mobile-card-compact' 
          : 'mobile-card-compact compact-modern-card'
      }`}
      onClick={handleCardClick}
    >
      {/* Image Section - 70% of card height */}
      <div className={`relative bg-muted overflow-hidden flex-shrink-0 rounded-lg ${
        viewMode === 'list' 
          ? 'w-28 h-20 sm:w-36 sm:h-24 lg:w-44 lg:h-28' 
          : 'h-44 sm:h-52 lg:h-60'
      }`}>
        {/* Always show single image - swipe functionality removed from car cards */}
        {(image || (images && images.length > 0)) ? (
          <img 
            src={image || images?.[0]} 
            alt={`${year} ${make} ${model}`} 
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
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
            className="absolute top-1 left-1 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 hover:bg-black/80"
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
        )}
      </div>
      
      {/* Content Section - 30% of card height, more compact */}
      <div className={`${viewMode === 'list' ? 'flex-1 min-w-0' : 'p-2 flex-1'}`}>
        <div className="mb-1">
          <h3 className="card-title text-sm font-bold text-foreground line-clamp-1 leading-tight">
            {year} {make} {model}
          </h3>
          {title && title !== `${make} ${model}` && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{title}</p>
          )}
        </div>

        {/* Vehicle Info - More compact layout */}
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

        {/* Status Indicators - More compact */}
        {insurance_v2?.accidentCnt === 0 && (
          <div className="mb-1">
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200">
              <Shield className="h-2 w-2 mr-1" />
              Clean
            </Badge>
          </div>
        )}

        {/* Pricing Section - Very compact */}
        <div className={`${viewMode === 'list' ? 'flex flex-col items-end justify-center' : 'mt-1'}`}>
          <div className="text-center">
            <span className="card-price text-base sm:text-lg font-bold text-primary block">
              €{price.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground block">
              Deri ne port
            </span>
          </div>
          
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

LazyCarCard.displayName = 'LazyCarCard';

export default LazyCarCard;