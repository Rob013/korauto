import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { Car, Gauge, Settings, Fuel, Palette, Shield, Heart } from "lucide-react";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  details
}: LazyCarCardProps) => {
  const navigate = useNavigate();
  const { setPreviousPage } = useNavigation();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const handleCardClick = useCallback(() => {
    setPreviousPage(window.location.pathname + window.location.search);
    window.open(`/car/${lot}`, '_blank');
  }, [setPreviousPage, lot]);

  // Don't render content until intersection
  if (!isIntersecting) {
    return (
      <div 
        ref={cardRef}
        className="bg-card rounded-lg overflow-hidden shadow-lg border border-border h-96"
      >
        <div className="animate-pulse">
          <div className="h-48 bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={cardRef}
      className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border cursor-pointer group touch-manipulation"
      onClick={handleCardClick}
    >
      <div className="relative h-48 sm:h-52 bg-muted overflow-hidden">
        {image ? (
          <img 
            src={image} 
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
            <Car className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Status Badge */}
        {(status === 3 || sale_status === 'sold') ? (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded text-xs font-bold shadow-lg z-10">
            SOLD OUT
          </div>
        ) : (
          lot && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
              Kodi #{lot}
            </div>
          )
        )}

        {/* Favorite Button */}
        {user && (
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-2 left-2 p-2 bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
        )}
      </div>
      
      <div className="p-4 sm:p-5">
        <div className="mb-3">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground line-clamp-2">
            {year} {make} {model}
          </h3>
          {title && title !== `${make} ${model}` && (
            <p className="text-sm text-muted-foreground mb-1 line-clamp-1">{title}</p>
          )}
        </div>

        {/* Vehicle Info */}
        <div className="space-y-2 mb-4 text-sm">
          {mileage && (
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{mileage}</span>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate">{transmission}</span>
            </div>
          )}
          {fuel && (
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate">{fuel}</span>
            </div>
          )}
          {color && (
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate">{color}</span>
            </div>
          )}
          {details?.seats_count && (
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{details.seats_count} Seats</span>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-2 mb-4">
          {insurance_v2?.accidentCnt === 0 && (
            <Badge variant="secondary" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Clean Record
            </Badge>
          )}
        </div>

        {/* Pricing */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <span className="text-xl sm:text-2xl font-bold text-primary">
            €{price.toLocaleString()}
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
    </div>
  );
});

LazyCarCard.displayName = 'LazyCarCard';

export default LazyCarCard;