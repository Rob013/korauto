import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import {
  Car,
  Search,
  Gauge,
  Settings,
  Fuel,
  Palette,
  Hash,
  Heart,
  Cog,
  Truck,
  Key,
  Shield,
  Calendar,
  DollarSign,
  AlertTriangle,
  MapPin,
  FileText,
  Wrench,
  Award,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import InspectionRequestForm from "@/components/InspectionRequestForm";
import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getStatusBadgeConfig } from "@/utils/statusBadgeUtils";
import { preloadCarDetailsPage, prefetchCarDetails } from "@/services/carPrefetch";
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
  cylinders?: number;
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
  // Archive information for sold cars
  is_archived?: boolean;
  archived_at?: string;
  archive_reason?: string;
  // Insurance information
  insurance?: {
    accident_history?: string;
    repair_count?: string;
    total_loss?: string;
    repair_cost?: string;
    flood_damage?: string;
    own_damage?: string;
    other_damage?: string;
    car_info?: {
      make?: string;
      accident_history?: string;
      repair_count?: string;
      total_loss?: string;
      repair_cost?: string;
      flood_damage?: string;
    };
    general_info?: {
      model?: string;
      year?: string;
      usage_type?: string;
      insurance_start_date?: string;
    };
    usage_history?: Array<{
      description: string;
      value: string;
    }>;
    owner_changes?: Array<{
      date: string;
      change_type: string;
      previous_number?: string;
      usage_type: string;
    }>;
    special_accident_history?: Array<{
      type: string;
      value: string;
    }>;
  };
  insurance_v2?: {
    regDate?: string;
    year?: number;
    maker?: string;
    displacement?: number;
    firstDate?: string;
    model?: string;
    myAccidentCnt?: number;
    otherAccidentCnt?: number;
    ownerChangeCnt?: number;
    robberCnt?: number;
    totalLossCnt?: number;
    floodTotalLossCnt?: number;
    government?: number;
    business?: number;
    loan?: number;
    carNoChangeCnt?: number;
    myAccidentCost?: number;
    otherAccidentCost?: number;
    carInfoChanges?: Array<{
      date: string;
      carNo: string;
    }>;
    carInfoUse1s?: string[];
    carInfoUse2s?: string[];
    ownerChanges?: any[];
    accidentCnt?: number;
    accidents?: any[];
  };
  // Location details
  location?: {
    country?: {
      name: string;
      iso: string;
    };
    city?: {
      name: string;
    };
    state?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    postal_code?: string;
    is_offsite?: boolean;
    raw?: string;
    offsite?: string;
  };
  // Inspection details
  inspect?: {
    accident_summary?: {
      main_framework?: string;
      exterior1rank?: string;
      exterior2rank?: string;
      simple_repair?: string;
      accident?: string;
    };
    outer?: Record<string, string[]>;
    inner?: Record<string, string>;
  };
  // Vehicle details from lots
  details?: {
    engine_volume?: number;
    original_price?: number;
    year?: number;
    month?: number;
    first_registration?: {
      year: number;
      month: number;
      day: number;
    };
    badge?: string;
    comment?: string;
    description_ko?: string;
    description_en?: string;
    is_leasing?: boolean;
    sell_type?: string;
    equipment?: any;
    options?: {
      type?: string;
      standard?: string[];
      etc?: string[];
      choice?: string[];
      tuning?: string[];
    };
    inspect_outer?: Array<{
      type: {
        code: string;
        title: string;
      };
      statusTypes: Array<{
        code: string;
        title: string;
      }>;
      attributes: string[];
    }>;
    seats_count?: number;
  };
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
  external_id,
  is_archived,
  archived_at,
  archive_reason,
  insurance,
  insurance_v2,
  location,
  inspect,
  details,
}: CarCardProps) => {
  const navigate = useNavigate();
  const { setPreviousPage } = useNavigation();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Check if user is admin
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        setIsAdmin(userRole?.role === "admin");

        // Check if this car is already favorited
        const { data } = await supabase
          .from("favorite_cars")
          .select("id")
          .eq("user_id", user.id)
          .eq("car_id", id)
          .maybeSingle();
        setIsFavorite(!!data);
      }
    };
    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsFavorite(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [id]);
  const handleFavoriteToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Identifikimi i nevojshëm",
        description: "Ju lutem identifikohuni për të ruajtur makinat e preferuara",
      });
      navigate("/auth");
      return;
    }
    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from("favorite_cars")
          .delete()
          .eq("user_id", user.id)
          .eq("car_id", id);
        setIsFavorite(false);
        toast({
          title: "Hequr nga të preferuarat",
          description: "Makina u hoq nga të preferuarat tuaja",
        });
      } else {
        // Add to favorites
        await supabase.from("favorite_cars").insert({
          user_id: user.id,
          car_id: id,
          car_make: make,
          car_model: model,
          car_year: year,
          car_price: price,
          car_image: image,
        });
        setIsFavorite(true);
        toast({
          title: "Shtuar në të preferuarat",
          description: "Makina u ruajt në të preferuarat tuaja",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Gabim",
        description: "Dështoi përditësimi i të preferuarave",
        variant: "destructive",
      });
    }
  }, [user, isFavorite, id, make, model, year, price, image, toast, navigate]);

  const prefetchDetails = useCallback(() => {
    const identifier = lot ?? id;
    if (!identifier) {
      return;
    }

    void preloadCarDetailsPage();
    void prefetchCarDetails(identifier);
  }, [id, lot]);

  const handleCardClick = useCallback(() => {
    // Save current page and scroll position before navigating
    const scrollData = {
      scrollTop: window.scrollY,
      timestamp: Date.now(),
      url: window.location.pathname + window.location.search,
    };
    sessionStorage.setItem("encar-catalog-scroll", JSON.stringify(scrollData));

    console.log(
      `🚗 Clicked car with ID: ${id}, lot: ${lot}, saved scroll: ${window.scrollY}px`
    );

    // Preload car details data for faster navigation
    prefetchDetails();

    // Save current page for back navigation
    setPreviousPage(window.location.pathname + window.location.search);
    // Open car details in new tab (fallback to id if lot is unavailable)
    window.open(`/car/${lot ?? id}`, '_blank');
  }, [id, lot, prefetchDetails, setPreviousPage]);

  const statusBadge = useMemo(() => getStatusBadgeConfig({ status, sale_status }), [status, sale_status]);

  // Don't render the component if it should be hidden
  if (hideSoldCar) {
    return null;
  }

  return (
    <div
      className="glass-card card-hover overflow-hidden cursor-pointer group touch-manipulation relative rounded-lg performance-card animation-120fps car-card-container"
      onClick={handleCardClick}
      onMouseEnter={prefetchDetails}
      onFocus={prefetchDetails}
      onTouchStart={prefetchDetails}
      style={{
        // Prevent layout shifts by setting fixed dimensions
        minHeight: '360px',
        aspectRatio: '280/360',
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}
    >
      <div className="car-image-wrapper">
        {image ? (
          <OptimizedImage
            src={image}
            alt={`${year} ${make} ${model}`}
            className="car-image transition-transform duration-300 ease-out"
            width={280}
            priority={false}
            enableLazyLoad={true}
            enableProgressiveLoad={true}
          />
        ) : (
          <div 
            className="car-image flex items-center justify-center bg-muted"
            style={{ aspectRatio: '280/192' }}
          >
            <Car className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        {/* Status & accident badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          {statusBadge.show && (
            <div className={`${statusBadge.className} px-3 py-1 rounded text-xs font-bold shadow-lg`}>{statusBadge.text}</div>
          )}
          {insurance_v2?.accidentCnt === 0 && (
            <Badge variant="success" className="shadow-lg">
              Accident free
            </Badge>
          )}
        </div>

        {/* Lot badge when status badge is not displayed */}
        {!statusBadge.show && lot && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
            Kodi #{lot}
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1" style={{ minHeight: '168px' }}>
        <div className="mb-2">
          <h3 className="text-base font-semibold text-foreground line-clamp-1" style={{ minHeight: '1.5rem' }}>
            {year} {make} {model}
          </h3>
          {title && title !== `${make} ${model}` && (
            <p className="text-xs text-muted-foreground line-clamp-1" style={{ minHeight: '1rem' }}>
              {title}
            </p>
          )}
        </div>

        {/* Compact Vehicle Info - Grid Layout with fixed heights */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs" style={{ minHeight: '3rem' }}>
          {mileage && (
            <div className="flex items-center gap-1">
              <Gauge className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-muted-foreground">{mileage}</span>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-1">
              <Settings className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate text-muted-foreground">{transmission}</span>
            </div>
          )}
          {fuel && (
            <div className="flex items-center gap-1">
              <Fuel className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate text-muted-foreground">{fuel}</span>
            </div>
          )}
          {color && (
            <div className="flex items-center gap-1">
              <Palette className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate text-muted-foreground">{color}</span>
            </div>
          )}
        </div>

        {/* Compact Pricing and Action - Push to bottom */}
        <div className="space-y-2 mt-auto">
          {/* Favorite button row */}
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleFavoriteToggle}
              className="h-8 w-8 p-0 hover:bg-muted touch-target interactive-element transition-all duration-200"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <Heart
                className={`h-4 w-4 transition-all duration-200 ${
                  isFavorite ? "fill-red-500 text-red-500" : "hover:text-red-400"
                }`}
              />
            </Button>
          </div>
          {/* Price on bottom left with text on the right */}
          <div className="flex items-end justify-between">
            <span className="text-lg font-bold text-primary">
              {typeof price === 'number' && isFinite(price) ? `€${price.toLocaleString()}` : 'Çmimi në kërkesë'}
            </span>
            <p className="text-xs text-muted-foreground">deri ne portin e Durrësit</p>
          </div>
        </div>

        <div className="text-center pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground font-medium">KORAUTO</p>
        </div>
      </div>
    </div>
  );
};
export default memo(CarCard);
