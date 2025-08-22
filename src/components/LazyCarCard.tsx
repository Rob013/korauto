import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { Car, Gauge, Settings, Fuel, Palette, Shield, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OptimizedImage } from "@/components/OptimizedImage";

interface LazyCarCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
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
  mileage,
  transmission,
  fuel,
  color,
  lot,
  title,
  status,
  sale_status,
  insurance_v2,
  details,
  is_archived,
  archived_at,
  archive_reason
}: LazyCarCardProps) => {
  const navigate = useNavigate();
  const { setPreviousPage } = useNavigation();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Check if this sold car should be hidden (sold more than 24 hours ago)
  const shouldHideSoldCar = () => {
    if (!is_archived || !archived_at || archive_reason !== 'sold') {
      return false; // Not a sold car
    }
    
    try {
      const archivedTime = new Date(archived_at);
      
      // Check if date is valid
      if (isNaN(archivedTime.getTime())) {
        return true; // Hide cars with invalid dates as safety measure
      }
      
      const now = new Date();
      const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceArchived > 24; // Hide if sold more than 24 hours ago
    } catch (error) {
      // In case of any error, hide the car as a safety measure
      return true;
    }
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
    setPreviousPage(window.location.pathname + window.location.search);
    
    // Issue #1 FIXED: Save filter panel as closed when navigating to car details
    // This prevents the filter panel from reopening when user returns to catalog
    sessionStorage.setItem('mobile-filter-panel-state', JSON.stringify(false));
    
    navigate(`/car/${lot}`);
  }, [setPreviousPage, lot, navigate]);

  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviousPage(window.location.pathname + window.location.search);
    
    // Issue #1 FIXED: Save filter panel as closed when navigating to car details
    // This prevents the filter panel from reopening when user returns to catalog
    sessionStorage.setItem('mobile-filter-panel-state', JSON.stringify(false));
    
    navigate(`/car/${lot}`);
  }, [setPreviousPage, lot, navigate]);

  // Don't render content until intersection
  if (!isIntersecting) {
    return (
      <div 
        ref={cardRef}
        className="bg-card rounded-lg overflow-hidden shadow-md border border-border h-96"
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
    <article 
      ref={cardRef}
      className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-border cursor-pointer group touch-manipulation mobile-card-compact"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`${year} ${make} ${model} - $${price?.toLocaleString() || 'N/A'} - View details`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e as any);
        }
      }}
    >
      <div className="relative h-40 sm:h-52 lg:h-56 bg-muted overflow-hidden">
        {image ? (
          <OptimizedImage
            src={image}
            alt={`${year} ${make} ${model} car image`}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 mobile-optimized-image ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
            loading="lazy"
            decode="async"
            fetchPriority="auto"
            quality={85}
            format="auto"
            width={300}
            height={200}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted" aria-label="No image available">
            <Car className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
        
        {/* Status Badge - More compact on mobile */}
        {(status === 3 || sale_status === 'sold') ? (
          <div 
            className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-red-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs font-bold shadow-lg z-10"
            role="status"
            aria-label="This car is sold out"
          >
            SOLD OUT
          </div>
        ) : (
          lot && (
            <div 
              className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-primary text-primary-foreground px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-semibold"
              aria-label={`Lot number ${lot}`}
            >
              #{lot}
            </div>
          )
        )}

        {/* Favorite Button */}
        {user && (
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-1 sm:top-2 left-1 sm:left-2 p-1.5 sm:p-2 bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity z-10 enhanced-touch-target"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            type="button"
          >
            <Heart 
              className={`h-3 w-3 sm:h-4 sm:w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} 
              aria-hidden="true"
            />
          </button>
        )}
      </div>
      
      <div className="p-2 sm:p-3 lg:p-4">
        <div className="mb-1.5 sm:mb-2">
          <h3 className="card-title text-sm sm:text-base lg:text-lg font-semibold text-foreground line-clamp-2">
            {year} {make} {model}
          </h3>
          {title && title !== `${make} ${model}` && (
            <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{title}</p>
          )}
        </div>

        {/* Vehicle Info - More compact */}
        <div className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3 card-details text-xs">
          {mileage && (
            <div className="flex items-center gap-1">
              <Gauge className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span className="truncate" aria-label={`Mileage: ${mileage}`}>{mileage}</span>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-1">
              <Settings className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span className="capitalize truncate" aria-label={`Transmission: ${transmission}`}>{transmission}</span>
            </div>
          )}
          {fuel && (
            <div className="flex items-center gap-1">
              <Fuel className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span className="capitalize truncate" aria-label={`Fuel type: ${fuel}`}>{fuel}</span>
            </div>
          )}
          {color && (
            <div className="flex items-center gap-1">
              <Palette className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span className="capitalize truncate" aria-label={`Color: ${color}`}>{color}</span>
            </div>
          )}
        </div>

        {/* Status Indicators - More compact */}
        {insurance_v2?.accidentCnt === 0 && (
          <div className="mb-1.5 sm:mb-2">
            <Badge variant="secondary" className="text-xs px-1.5 sm:px-2 py-0" aria-label="Clean accident record">
              <Shield className="h-2 w-2 mr-1" aria-hidden="true" />
              Clean Record
            </Badge>
          </div>
        )}

        {/* Pricing - More compact */}
        <div className="flex flex-col gap-0.5 sm:gap-1 mb-1.5 sm:mb-2">
          <span className="card-price text-base sm:text-lg lg:text-xl font-bold text-primary" aria-label={`Price: ${price?.toLocaleString()} euros`}>
            €{price?.toLocaleString() || 'N/A'}
          </span>
          <span className="text-xs text-muted-foreground">
            Deri ne portin e Durresit
          </span>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            KORAUTO
          </p>
        </div>
      </div>
    </article>
  );
});

LazyCarCard.displayName = 'LazyCarCard';

export default LazyCarCard;