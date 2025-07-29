import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Car, Search, Gauge, Settings, Fuel, Palette, Hash, Heart, Cog, Truck, Key, Shield, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface CarCardProps {
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
  status?: number; // 1 = active, 2 = pending, 3 = sold
  sale_status?: string; // 'active', 'pending', 'sold'
  final_price?: number; // Sale price if sold
  // Additional API fields
  generation?: string;
  body_type?: string;
  engine?: string;
  drive_wheel?: string;
  vehicle_type?: string;
  cylinders?: string;
  bid?: number;
  estimate_repair_price?: number;
  pre_accident_price?: number;
  clean_wholesale_price?: number;
  actual_cash_value?: number;
  sale_date?: string;
  seller?: string;
  seller_type?: string;
  detailed_title?: string;
  damage_main?: string;
  damage_second?: string;
  keys_available?: boolean;
  airbags?: string;
  grade_iaai?: string;
  domain?: string;
  external_id?: string;
}
const CarCard = ({
  id,
  make,
  model,
  year,
  price,
  image,
  vin,
  mileage,
  transmission,
  fuel,
  color,
  condition,
  lot,
  title,
  status,
  sale_status,
  final_price,
  generation,
  body_type,
  engine,
  drive_wheel,
  vehicle_type,
  cylinders,
  bid,
  estimate_repair_price,
  pre_accident_price,
  clean_wholesale_price,
  actual_cash_value,
  sale_date,
  seller,
  seller_type,
  detailed_title,
  damage_main,
  damage_second,
  keys_available,
  airbags,
  grade_iaai,
  domain,
  external_id
}: CarCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check if this car is already favorited
        const { data } = await supabase
          .from('favorite_cars')
          .select('id')
          .eq('user_id', user.id)
          .eq('car_id', id)
          .single();
        
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
  }, [id]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
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
        // Remove from favorites
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
        // Add to favorites
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
  };

  const handleCardClick = () => {
    navigate(`/car/${id}`);
  };
  return <div className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border cursor-pointer group touch-manipulation" onClick={handleCardClick}>
      <div className="relative h-48 sm:h-52 bg-muted overflow-hidden">
        {image ? <img src={image} alt={`${year} ${make} ${model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => {
        e.currentTarget.src = "/placeholder.svg";
      }} /> : <div className="w-full h-full flex items-center justify-center bg-muted">
            <Car className="h-16 w-16 text-muted-foreground" />
          </div>}
        {/* Sold Out Badge - Takes priority over lot number */}
        {(status === 3 || sale_status === 'sold') ? (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded text-xs font-bold shadow-lg z-10">
            SOLD OUT
          </div>
        ) : (
          lot && <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
            Kodi #{lot}
          </div>
        )}
        
        {/* Favorite Button - Mobile Optimized */}
        <button
          onClick={handleFavoriteToggle}
          className="absolute top-2 left-2 p-3 sm:p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all duration-200 hover:scale-110 touch-manipulation"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart 
            className={`h-5 w-5 sm:h-4 sm:w-4 transition-colors ${
              isFavorite 
                ? "fill-red-500 text-red-500" 
                : "text-gray-600 hover:text-red-500"
            }`} 
          />
        </button>
      </div>
      
      <div className="p-4 sm:p-5">
        <div className="mb-3">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground line-clamp-2">
            {year} {make} {model}
          </h3>
          {title && title !== `${make} ${model}` && <p className="text-sm text-muted-foreground mb-1 line-clamp-1">{title}</p>}
        </div>

        {/* Basic Vehicle Info */}
        <div className="space-y-2 mb-4 text-sm">
          {generation && <div className="flex items-center gap-2">
              <Cog className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">Generation: {generation}</span>
            </div>}
          {mileage && <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{mileage}</span>
            </div>}
          {transmission && <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate">{transmission}</span>
            </div>}
          {fuel && <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate">{fuel}</span>
            </div>}
          {color && <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate">{color}</span>
            </div>}
          {body_type && <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate">{String(body_type).replace('_', ' ')}</span>
            </div>}
        </div>

        {/* Pricing Information */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <span className="text-xl sm:text-2xl font-bold text-primary">
            €{price.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">
            Deri ne portin e Durresit
          </span>
        </div>

        {/* VIN */}
        {vin && (
          <div className="mb-4 text-xs border-t pt-3">
            <div className="flex items-center gap-2">
              <Hash className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="font-mono text-xs break-all">VIN: {vin}</span>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            KORAUTO Shërbim profesional i importit
          </p>
        </div>
      </div>
    </div>;
};
export default CarCard;