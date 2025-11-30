import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useNavigation } from "@/contexts/NavigationContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Car, MapPin, Gauge, Fuel, Calendar, Eye,
  Heart, Share2, ArrowRight, MessageCircle, Shield, 
  AlertTriangle, Key, Settings, Palette, Hash, Info,
  Award, Wrench, DollarSign, FileText, ShieldCheck
} from "lucide-react";
import InspectionRequestForm from "./InspectionRequestForm";
import { openCarDetailsInNewTab } from "@/utils/navigation";
import { localizeFuel } from "@/utils/fuel";

interface EncarCarCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  mileage?: string;
  fuel?: string;
  location?: string;
  isNew?: boolean;
  isCertified?: boolean;
  // Enhanced fields from API
  vin?: string;
  transmission?: string;
  color?: string;
  condition?: string;
  lot?: string;
  cylinders?: number;
  // Insurance information
  insurance?: {
    accident_history?: string;
    repair_count?: string;
    total_loss?: string;
    repair_cost?: string;
    flood_damage?: string;
    own_damage?: string;
    other_damage?: string;
  };
  insurance_v2?: {
    myAccidentCnt?: number;
    otherAccidentCnt?: number;
    ownerChangeCnt?: number;
    robberCnt?: number;
    totalLossCnt?: number;
    floodTotalLossCnt?: number;
    accidentCnt?: number;
  };
  // Location details
  locationDetails?: {
    country?: { name: string; iso: string };
    city?: { name: string };
    state?: string;
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

const EncarCarCard = ({ 
  id, make, model, year, price, image, mileage, fuel, location, isNew, isCertified,
  vin, transmission, color, condition, lot, cylinders, insurance, insurance_v2, 
  locationDetails, inspect, details
}: EncarCarCardProps) => {
  const navigate = useNavigate();
  const { setPreviousPage } = useNavigation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLiked, setIsLiked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setIsAdmin(userRole?.role === 'admin');
      }
    };
    
    checkAdminStatus();
  }, []);

    const handleCardClick = () => {
    // Save current page and any filter state before opening the new tab
    setPreviousPage(window.location.pathname + window.location.search);
    openCarDetailsInNewTab(id);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Link Copied",
      description: "Car listing link copied to clipboard",
    });
  };

  const handleContactWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Përshëndetje! Jam i interesuar për ${year} ${make} ${model}. A mund të më jepni më shumë informacion?`;
    const whatsappUrl = `https://wa.me/38348181116?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

    const fuelDisplay = useMemo(() => localizeFuel(fuel, "sq"), [fuel]);

  return (
    <Card 
      className="group cursor-pointer bg-white border border-gray-200 transition-all duration-300 overflow-hidden rounded-xl compact-card car-card-container"
      onClick={handleCardClick}
    >
      {/* Large Image Section - Enhanced for mobile with bigger thumbnail */}
      <div className="car-image-wrapper">
        {image ? (
          <img
            src={image}
            alt={`${year} ${make} ${model}`}
            className="car-image object-center transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/400x300/f5f5f5/999999?text=No+Image";
            }}
          />
        ) : (
          <div className="car-image flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Car className="h-16 w-16 text-gray-400" />
          </div>
        )}

        {/* Modern Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <Badge className="bg-red-600 text-white text-xs px-3 py-1 font-semibold shadow-lg">
              NEW
            </Badge>
          )}
          {isCertified && (
            <Badge className="bg-blue-600 text-white text-xs px-3 py-1 font-semibold shadow-lg">
              CERTIFIED
            </Badge>
          )}
        </div>

        {/* Accident Badge - Small Circle on Right */}
        {insurance_v2 && typeof insurance_v2.accidentCnt === 'number' && insurance_v2.accidentCnt === 0 && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
        )}

        {/* Modern Action buttons */}
        <div className="absolute top-12 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            size="sm"
            variant="secondary"
            className="h-9 w-9 p-0 bg-white/95 shadow-lg backdrop-blur-sm"
            onClick={handleLikeClick}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-9 w-9 p-0 bg-white/95 shadow-lg backdrop-blur-sm"
            onClick={handleShareClick}
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* View count badge */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
          <Eye className="h-3 w-3" />
          <span>{Math.floor(Math.random() * 500) + 50}</span>
        </div>

        {/* Lot number */}
        {lot && (
          <div className="absolute bottom-3 left-3 bg-primary/90 text-white text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-sm">
            Lot #{lot}
          </div>
        )}
      </div>

      <CardContent className="p-3 sm:p-4">
        {/* Car Title - More compact */}
        <div className="mb-2">
          <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight mb-1 line-clamp-1">
            {year} {typeof make === 'object' ? (make as any)?.name || '' : make || ''} {typeof model === 'object' ? (model as any)?.name || '' : model || ''}
          </h3>
          {location && (
            <div className="flex items-center text-xs sm:text-sm text-gray-500">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>

        {/* Compact Specs Grid - More organized */}
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600 mb-3">
          {mileage && (
            <div className="flex items-center gap-1.5 truncate">
              <Gauge className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="font-medium truncate">{mileage}</span>
            </div>
          )}
            {fuelDisplay && (
            <div className="flex items-center gap-1.5 truncate">
              <Fuel className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="font-medium truncate">{fuelDisplay}</span>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-1.5 truncate">
              <Settings className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="font-medium capitalize truncate">{typeof transmission === 'object' ? (transmission as any)?.name || '' : transmission || ''}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <span className="font-medium">{year}</span>
          </div>
        </div>

        {/* Price - More compact but still prominent */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {price ? (
                <>€{price.toLocaleString()}</>
              ) : (
                <span className="text-muted-foreground text-base sm:text-lg">Çmimi në kërkesë</span>
              )}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              Çmimi KORAUTO
            </div>
          </div>
        </div>

        {/* Compact Action buttons */}
        <div className="flex gap-2">
          <InspectionRequestForm
            trigger={
              <Button 
                size="sm"
                className="flex-1 bg-primary text-white font-semibold h-9 text-xs sm:text-sm shadow-md transition-all"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Kërkoni inspektim për ${year} ${make} ${model}`}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Inspektim </span>€50
              </Button>
            }
            carId={id}
            carMake={make}
            carModel={model}
            carYear={year}
          />
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-2 border-primary text-primary font-semibold h-9 text-xs sm:text-sm transition-all"
            onClick={handleContactWhatsApp}
            aria-label={`Kontaktoni për më shumë informacion rreth ${year} ${make} ${model}`}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            Kontakt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EncarCarCard;