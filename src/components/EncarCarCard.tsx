import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
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
    navigate(`/car/${id}`);
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
      className="group cursor-pointer bg-white border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={`${year} ${make} ${model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/300x200/f5f5f5/999999?text=No+Image";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Car className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isNew && (
            <Badge className="bg-red-500 text-white text-xs px-2 py-1">
              NEW
            </Badge>
          )}
          {isCertified && (
            <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
              CERTIFIED
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            onClick={handleLikeClick}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            onClick={handleShareClick}
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* View count */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Eye className="h-3 w-3" />
          <span>{Math.floor(Math.random() * 500) + 50}</span>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Car Title */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-base leading-tight">
            {year} {make} {model}
          </h3>
          {location && (
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {location}
            </div>
          )}
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
          {mileage && (
            <div className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              <span>{mileage}</span>
            </div>
          )}
          {fuel && (
            <div className="flex items-center gap-1">
              <Fuel className="h-3 w-3" />
              <span className="capitalize">{fuel}</span>
            </div>
          )}
          {transmission && (
            <div className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              <span className="capitalize">{transmission}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{year}</span>
          </div>
        </div>

        {/* Quick Status Indicators */}
        <div className="flex flex-wrap gap-1 mb-3">
          {insurance_v2?.accidentCnt === 0 && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              <Shield className="h-3 w-3 mr-1" />
              Clean
            </Badge>
          )}
          {lot && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              Lot: {lot}
            </Badge>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold text-primary">
            €{price.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            KORAUTO Price
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <InspectionRequestForm
              trigger={
                <Button 
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs h-6"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Kërkoni inspektim për ${year} ${make} ${model}`}
                >
                  Inspektim (€50)
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
              className="flex-1 text-xs h-6 border-primary text-primary hover:bg-primary hover:text-white"
              onClick={handleContactWhatsApp}
              aria-label={`Kontaktoni për më shumë informacion rreth ${year} ${make} ${model}`}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Kontakt
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EncarCarCard;