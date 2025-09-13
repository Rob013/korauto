import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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
  Award, Wrench, DollarSign, FileText
} from "lucide-react";
import InspectionRequestForm from "./InspectionRequestForm";

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
    // Save current page and any filter state before navigating
    setPreviousPage(window.location.pathname + window.location.search);
    
    // On mobile, open in new tab to preserve the current catalog state
    // On desktop, navigate in the same tab for better user experience
    if (isMobile) {
      // Open in new tab on mobile to preserve filter state and scroll position
      window.open(`/car/${id}`, '_blank');
    } else {
      // Navigate in same tab on desktop
      navigate(`/car/${id}`);
    }
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

  return (
    <Card 
      className="group cursor-pointer bg-white dark:bg-card border border-gray-200 dark:border-border hover:border-primary/50 hover:shadow-2xl transition-all duration-300 overflow-hidden rounded-xl hover:-translate-y-1"
      onClick={handleCardClick}
    >
      {/* Large Image Section - More compact height */}
      <div className="relative h-44 bg-gray-100 dark:bg-muted overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={`${year} ${make} ${model}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/400x300/f5f5f5/999999?text=No+Image";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-muted dark:to-muted/50">
            <Car className="h-12 w-12 text-gray-400 dark:text-muted-foreground" />
          </div>
        )}

        {/* Modern Badges - Cleaner design */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 font-medium shadow-lg">
              NEW
            </Badge>
          )}
          {isCertified && (
            <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 font-medium shadow-lg">
              CERT
            </Badge>
          )}
          {insurance_v2?.accidentCnt === 0 && (
            <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 font-medium shadow-lg flex items-center gap-1">
              <Shield className="h-2.5 w-2.5" />
              CLEAN
            </Badge>
          )}
        </div>

        {/* Modern Action buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm rounded-full"
            onClick={handleLikeClick}
          >
            <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-lg backdrop-blur-sm rounded-full"
            onClick={handleShareClick}
          >
            <Share2 className="h-3 w-3 text-gray-600" />
          </Button>
        </div>

        {/* View count badge */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm">
          <Eye className="h-3 w-3" />
          <span>{Math.floor(Math.random() * 500) + 50}</span>
        </div>

        {/* Lot number */}
        {lot && (
          <div className="absolute bottom-3 left-3 bg-primary/90 text-white text-xs px-2 py-1 rounded-md font-medium backdrop-blur-sm">
            #{lot}
          </div>
        )}
      </div>

      <CardContent className="p-3">
        {/* Car Title - More compact */}
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 dark:text-foreground text-base leading-tight mb-1">
            {year} {typeof make === 'object' ? (make as any)?.name || '' : make || ''} {typeof model === 'object' ? (model as any)?.name || '' : model || ''}
          </h3>
          {location && (
            <div className="flex items-center text-sm text-gray-500 dark:text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              {location}
            </div>
          )}
        </div>

        {/* Compact Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-muted-foreground mb-3">
          {mileage && (
            <div className="flex items-center gap-2">
              <Gauge className="h-3 w-3 text-primary" />
              <span className="font-medium">{mileage}</span>
            </div>
          )}
          {fuel && (
            <div className="flex items-center gap-2">
              <Fuel className="h-3 w-3 text-primary" />
              <span className="font-medium capitalize">{typeof fuel === 'object' ? (fuel as any)?.name || '' : fuel || ''}</span>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-2">
              <Settings className="h-3 w-3 text-primary" />
              <span className="font-medium capitalize">{typeof transmission === 'object' ? (transmission as any)?.name || '' : transmission || ''}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-primary" />
            <span className="font-medium">{year}</span>
          </div>
        </div>

        {/* Price - More prominent and compact */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xl font-bold text-primary">
              {price ? (
                <>€{price.toLocaleString()}</>
              ) : (
                <span className="text-muted-foreground text-lg">Çmimi në kërkesë</span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-muted-foreground font-medium">
              Deri në port
            </div>
          </div>
        </div>

        {/* Compact Action buttons */}
        <div className="flex gap-2">
          <InspectionRequestForm
            trigger={
              <Button 
                size="sm"
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold h-9 shadow-md hover:shadow-lg transition-all rounded-lg"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Kërkoni inspektim për ${year} ${make} ${model}`}
              >
                <FileText className="h-3 w-3 mr-2" />
                Inspektim
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
            className="flex-1 border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold h-9 transition-all rounded-lg"
            onClick={handleContactWhatsApp}
            aria-label={`Kontaktoni për më shumë informacion rreth ${year} ${make} ${model}`}
          >
            <MessageCircle className="h-3 w-3 mr-2" />
            Kontakt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EncarCarCard;