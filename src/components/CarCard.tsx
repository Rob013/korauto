import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { Car, Search, Gauge, Settings, Fuel, Palette, Hash, Heart, Cog, Truck, Key, Shield, Calendar, DollarSign, AlertTriangle, MapPin, FileText, Wrench, Award, Info, CheckCircle, XCircle } from "lucide-react";
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
    country?: { name: string; iso: string };
    city?: { name: string };
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
      type: { code: string; title: string };
      statusTypes: Array<{ code: string; title: string }>;
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
  insurance,
  insurance_v2,
  location,
  inspect,
  details
}: CarCardProps) => {
  const navigate = useNavigate();
  const { setPreviousPage } = useNavigation();
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
    // Save current page and any filter state before navigating
    setPreviousPage(window.location.pathname + window.location.search);
    // Open in new tab
    window.open(`/car/${lot}`, '_blank');
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
          {location?.city && <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="capitalize truncate">{location.city.name}</span>
            </div>}
          {cylinders && <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{cylinders} Cylinders</span>
            </div>}
        </div>

        {/* Insurance & Safety Info */}
        {(insurance_v2 || inspect || insurance) && (
          <div className="space-y-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Insurance & Safety Report
            </h4>
            <div className="space-y-1 text-xs">
              {insurance_v2?.accidentCnt !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Accident History:</span>
                  <Badge variant={insurance_v2.accidentCnt === 0 ? "secondary" : "destructive"} className="text-xs">
                    {insurance_v2.accidentCnt === 0 ? 'Clean Record' : `${insurance_v2.accidentCnt} accidents`}
                  </Badge>
                </div>
              )}
              {insurance_v2?.ownerChangeCnt !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Previous Owners:</span>
                  <span className="font-medium">{insurance_v2.ownerChangeCnt}</span>
                </div>
              )}
              {insurance_v2?.totalLossCnt !== undefined && insurance_v2.totalLossCnt > 0 && (
                <div className="flex items-center justify-between">
                  <span>Total Loss Claims:</span>
                  <Badge variant="destructive" className="text-xs">{insurance_v2.totalLossCnt}</Badge>
                </div>
              )}
              {insurance_v2?.floodTotalLossCnt !== undefined && insurance_v2.floodTotalLossCnt > 0 && (
                <div className="flex items-center justify-between">
                  <span>Flood Damage:</span>
                  <Badge variant="destructive" className="text-xs">{insurance_v2.floodTotalLossCnt}</Badge>
                </div>
              )}
              {inspect?.accident_summary?.accident && inspect.accident_summary.accident !== "doesn't exist" && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Inspection: {inspect.accident_summary.accident}</span>
                </div>
              )}
              {keys_available !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Keys Available:</span>
                  <Badge variant={keys_available ? "secondary" : "destructive"} className="text-xs">
                    {keys_available ? 'Yes' : 'No'}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vehicle Details */}
        {details && (
          <div className="space-y-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Info className="h-4 w-4" />
              Vehicle Details
            </h4>
            <div className="space-y-1 text-xs">
              {details.engine_volume && (
                <div className="flex items-center justify-between">
                  <span>Engine Volume:</span>
                  <span className="font-medium">{details.engine_volume}cc</span>
                </div>
              )}
              {details.original_price && (
                <div className="flex items-center justify-between">
                  <span>Original Price:</span>
                  <span className="font-medium">₩{details.original_price.toLocaleString()}</span>
                </div>
              )}
              {details.first_registration && (
                <div className="flex items-center justify-between">
                  <span>First Registration:</span>
                  <span className="font-medium">
                    {details.first_registration.year}-{String(details.first_registration.month).padStart(2, '0')}-{String(details.first_registration.day).padStart(2, '0')}
                  </span>
                </div>
              )}
              {details.badge && (
                <div className="flex items-center justify-between">
                  <span>Badge:</span>
                  <span className="font-medium">{details.badge}</span>
                </div>
              )}
              {details.seats_count && (
                <div className="flex items-center justify-between">
                  <span>Seats:</span>
                  <span className="font-medium">{details.seats_count}</span>
                </div>
              )}
              {details.sell_type && (
                <div className="flex items-center justify-between">
                  <span>Sale Type:</span>
                  <span className="font-medium capitalize">{details.sell_type}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Equipment & Options */}
        {details?.options && (
          <div className="space-y-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Equipment & Options
            </h4>
            <div className="space-y-1 text-xs">
              {details.options.standard && details.options.standard.length > 0 && (
                <div>
                  <span className="font-medium">Standard:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {details.options.standard.slice(0, 5).map((option, index) => (
                      <Badge key={index} variant="outline" className="text-xs">{option}</Badge>
                    ))}
                    {details.options.standard.length > 5 && (
                      <Badge variant="secondary" className="text-xs">+{details.options.standard.length - 5} more</Badge>
                    )}
                  </div>
                </div>
              )}
              {details.options.choice && details.options.choice.length > 0 && (
                <div>
                  <span className="font-medium">Optional:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {details.options.choice.slice(0, 3).map((option, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">{option}</Badge>
                    ))}
                    {details.options.choice.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{details.options.choice.length - 3} more</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inspection Report */}
        {details?.inspect_outer && details.inspect_outer.length > 0 && (
          <div className="space-y-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Inspection Report
            </h4>
            <div className="space-y-1 text-xs">
              {details.inspect_outer.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{item.type.title}:</span>
                  <div className="flex gap-1">
                    {item.statusTypes.map((status, i) => (
                      <Badge 
                        key={i} 
                        variant={status.code === 'X' ? "destructive" : status.code === 'W' ? "secondary" : "outline"} 
                        className="text-xs"
                      >
                        {status.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {details.inspect_outer.length > 3 && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs">+{details.inspect_outer.length - 3} more items</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Information */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="space-y-1">
            <span className="text-xl sm:text-2xl font-bold text-primary">
              €{price.toLocaleString()}
            </span>
            {bid && bid !== price && (
              <div className="text-sm text-muted-foreground">
                Current Bid: €{bid.toLocaleString()}
              </div>
            )}
            {estimate_repair_price && (
              <div className="text-sm text-amber-600">
                Est. Repair: €{estimate_repair_price.toLocaleString()}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            Deri ne portin e Durresit
          </span>
        </div>

        {/* Additional Pricing Info */}
        {(pre_accident_price || clean_wholesale_price || actual_cash_value) && (
          <div className="space-y-1 mb-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Market Values
            </h4>
            <div className="grid grid-cols-1 gap-1 text-xs">
              {pre_accident_price && (
                <div className="flex justify-between">
                  <span>Pre-Accident Value:</span>
                  <span className="font-medium">€{pre_accident_price.toLocaleString()}</span>
                </div>
              )}
              {clean_wholesale_price && (
                <div className="flex justify-between">
                  <span>Wholesale Value:</span>
                  <span className="font-medium">€{clean_wholesale_price.toLocaleString()}</span>
                </div>
              )}
              {actual_cash_value && (
                <div className="flex justify-between">
                  <span>Actual Cash Value:</span>
                  <span className="font-medium">€{actual_cash_value.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seller Information */}
        {(seller || domain) && (
          <div className="space-y-1 mb-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Source Information
            </h4>
            <div className="space-y-1 text-xs">
              {domain && (
                <div className="flex justify-between">
                  <span>Source:</span>
                  <span className="font-medium capitalize">{domain.replace('_', ' ')}</span>
                </div>
              )}
              {seller && (
                <div className="flex justify-between">
                  <span>Seller:</span>
                  <span className="font-medium">{seller}</span>
                </div>
              )}
              {external_id && (
                <div className="flex justify-between">
                  <span>External ID:</span>
                  <span className="font-medium">{external_id}</span>
                </div>
              )}
            </div>
          </div>
        )}


        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            KORAUTO Shërbim profesional i importit
          </p>
          {details?.comment && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {details.comment}
            </p>
          )}
        </div>
      </div>
    </div>;
};
export default CarCard;