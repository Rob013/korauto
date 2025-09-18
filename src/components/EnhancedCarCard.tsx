import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import {
  Car,
  Gauge,
  Settings,
  Fuel,
  Palette,
  Heart,
  Calendar,
  DollarSign,
  MapPin,
  Award,
  Info,
  CheckCircle,
  XCircle,
  Wrench,
  Shield,
  Key,
} from "lucide-react";
import { useState, useEffect, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OptimizedImage } from "@/components/OptimizedImage";
import { CarAPIsVehicle } from "@/types/carapis";

interface EnhancedCarCardProps {
  vehicle: CarAPIsVehicle;
  className?: string;
  priority?: boolean;
}

export const EnhancedCarCard = memo(({ vehicle, className = "", priority = false }: EnhancedCarCardProps) => {
  const navigate = useNavigate();
  const { setPreviousPage } = useNavigation();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);

  const lot = vehicle.lots?.[0];
  const images = lot?.images;
  const primaryImage = images?.normal?.[0] || images?.big?.[0];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check if this car is already favorited
        const { data } = await supabase
          .from("favorite_cars")
          .select("id")
          .eq("user_id", user.id)
          .eq("car_id", vehicle.id)
          .maybeSingle();
        setIsFavorite(!!data);
      }
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsFavorite(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [vehicle.id]);

  const handleFavoriteToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save favorite vehicles",
      });
      navigate("/auth");
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from("favorite_cars")
          .delete()
          .eq("user_id", user.id)
          .eq("car_id", vehicle.id);
        setIsFavorite(false);
        toast({
          title: "Removed from Favorites",
          description: "Vehicle removed from your favorites",
        });
      } else {
        await supabase.from("favorite_cars").insert({
          user_id: user.id,
          car_id: vehicle.id,
          car_make: vehicle.manufacturer.name,
          car_model: vehicle.model.name,
          car_year: vehicle.year,
          car_price: lot?.buy_now || 0,
          car_image: primaryImage,
        });
        setIsFavorite(true);
        toast({
          title: "Added to Favorites",
          description: "Vehicle saved to your favorites",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  }, [user, isFavorite, vehicle, lot, primaryImage, toast, navigate]);

  const handleCardClick = useCallback(() => {
    // Save current page and scroll position before navigating
    const scrollData = {
      scrollTop: window.scrollY,
      timestamp: Date.now(),
      url: window.location.pathname + window.location.search,
    };
    sessionStorage.setItem("encar-catalog-scroll", JSON.stringify(scrollData));

    console.log(`🚗 Clicked vehicle with ID: ${vehicle.id}, lot: ${lot?.lot}`);

    // Save current page for back navigation
    setPreviousPage(window.location.pathname + window.location.search);
    // Open car details in new tab
    window.open(`/car/${lot?.lot || vehicle.id}`, '_blank');
  }, [vehicle.id, lot?.lot, setPreviousPage]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (odometer: any) => {
    if (odometer?.km) {
      return `${odometer.km.toLocaleString()} km`;
    }
    if (odometer?.mi) {
      return `${odometer.mi.toLocaleString()} mi`;
    }
    return 'N/A';
  };

  return (
    <div
      className={`glass-card card-hover overflow-hidden cursor-pointer group touch-manipulation relative rounded-lg performance-card animation-120fps ${className}`}
      onClick={handleCardClick}
      style={{
        minHeight: '420px',
        aspectRatio: '280/420'
      }}
    >
      <div className="relative h-56 bg-muted overflow-hidden">
        {primaryImage ? (
          <OptimizedImage
            src={primaryImage}
            alt={`${vehicle.year} ${vehicle.manufacturer.name} ${vehicle.model.name}`}
            className="w-full h-full group-hover:scale-110 transition-transform duration-500 ease-out"
            width={280}
            priority={priority}
            enableLazyLoad={!priority}
            enableProgressiveLoad={true}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center bg-muted"
            style={{ aspectRatio: '280/192' }}
          >
            <Car className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Status Badge */}
        {lot?.status && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-bold shadow-lg z-10">
            {lot.status.name}
          </div>
        )}
        
        {/* Price Badge */}
        {lot?.buy_now && (
          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
            {formatPrice(lot.buy_now)}
          </div>
        )}
        
        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white/90 p-0"
          onClick={handleFavoriteToggle}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </Button>
      </div>

      <div className="p-4 flex flex-col flex-1" style={{ minHeight: '200px' }}>
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-foreground line-clamp-1" style={{ minHeight: '1.75rem' }}>
            {vehicle.year} {vehicle.manufacturer.name} {vehicle.model.name}
          </h3>
          {vehicle.generation?.name && (
            <p className="text-sm text-muted-foreground line-clamp-1" style={{ minHeight: '1.25rem' }}>
              {vehicle.generation.name}
            </p>
          )}
        </div>

        {/* Enhanced Vehicle Information Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm" style={{ minHeight: '4rem' }}>
          {lot?.odometer && (
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-muted-foreground">{formatMileage(lot.odometer)}</span>
            </div>
          )}
          {vehicle.transmission && (
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate text-muted-foreground">{vehicle.transmission.name}</span>
            </div>
          )}
          {vehicle.fuel && (
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate text-muted-foreground">{vehicle.fuel.name}</span>
            </div>
          )}
          {vehicle.color && (
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate text-muted-foreground">{vehicle.color.name}</span>
            </div>
          )}
        </div>

        {/* Enhanced Features */}
        <div className="space-y-2 text-xs">
          {vehicle.engine && (
            <div className="flex items-center gap-2">
              <Wrench className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {vehicle.engine.size} {vehicle.engine.horsepower && `• ${vehicle.engine.horsepower}hp`}
              </span>
            </div>
          )}
          
          {lot?.condition && (
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground capitalize">{lot.condition.name}</span>
            </div>
          )}
          
          {lot?.keys_available !== undefined && (
            <div className="flex items-center gap-2">
              <Key className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                Keys: {lot.keys_available ? 'Available' : 'Not Available'}
              </span>
            </div>
          )}
          
          {lot?.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground truncate">
                {lot.location.city}, {lot.location.country}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-3 flex gap-2">
          <Button 
            className="flex-1 h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            View Details
          </Button>
          {lot?.buy_now && (
            <Button 
              variant="outline" 
              className="flex-1 h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                // Handle buy now action
              }}
            >
              {formatPrice(lot.buy_now)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

EnhancedCarCard.displayName = 'EnhancedCarCard';