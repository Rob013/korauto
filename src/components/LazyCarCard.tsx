import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { Car, Gauge, Settings, Fuel, Palette, Shield, Heart, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OptimizedCarImage } from "@/components/OptimizedCarImage";

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
  location?: string; // Add location prop
  drivetrain?: string; // Add drivetrain prop
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
  location, // Add location
  drivetrain, // Add drivetrain
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
      className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow duration-200 h-full flex flex-col"
      onClick={handleCardClick}
    >
      {/* Image Section - Fixed Height */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <OptimizedCarImage
          images={images && images.length > 0 ? images : undefined}
          image={image}
          alt={`${year} ${make} ${model}`}
          className="w-full h-full object-cover"
          fallbackIcon={<Car className="h-16 w-16 text-gray-400" />}
        />
        
        {/* Favorite Heart Icon - Top Right */}
        <button
          onClick={handleFavoriteToggle}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors z-10"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>

        {/* Status Badge */}
        {(status === 3 || sale_status === 'sold') && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg z-10">
            SOLD
          </div>
        )}
      </div>
      
      {/* Details Section - Flexible Height */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
          {year} {make} {model}
        </h3>

        {/* Key Specs */}
        <div className="space-y-1 mb-3 text-sm text-gray-600">
          {fuel && (
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="capitalize">{fuel}</span>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="capitalize">{transmission}</span>
            </div>
          )}
          {mileage && (
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{mileage}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{location || "Prishtinë, Kosovo"}</span>
          </div>
        </div>

        {/* Price - At Bottom */}
        <div className="mt-auto">
          <div className="text-2xl font-bold text-gray-900">
            €{price.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
});

LazyCarCard.displayName = 'LazyCarCard';

export default LazyCarCard;