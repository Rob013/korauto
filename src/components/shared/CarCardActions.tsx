// Shared car card action buttons to reduce duplication
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { CarIcons } from "./CarIcons";
import InspectionRequestForm from "@/components/InspectionRequestForm";

interface CarCardActionsProps {
  carId: string;
  make: string;
  model: string;
  year: number;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export const CarCardActions = ({
  carId,
  make,
  model,
  year,
  className = "",
  size = "sm"
}: CarCardActionsProps) => {
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { preloadRoute } = useNavigation();

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Login Required",
          description: "Please log in to save favorites",
          variant: "destructive",
        });
        return;
      }

      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('car_id', carId);

        if (!error) {
          setIsFavorited(false);
          toast({
            title: "Removed from Favorites",
            description: "Car removed from your favorites",
          });
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([
            {
              user_id: session.user.id,
              car_id: carId,
              car_make: make,
              car_model: model,
              car_year: year
            }
          ]);

        if (!error) {
          setIsFavorited(true);
          toast({
            title: "Added to Favorites",
            description: "Car added to your favorites",
          });
        }
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

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    preloadRoute(`/car/${carId}`);
    navigate(`/car/${carId}`);
  };

  const handleInspectionRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInspectionForm(true);
  };

  return (
    <>
      <div className={`flex gap-2 ${className}`}>
        <Button
          variant="outline"
          size={size}
          onClick={handleFavoriteToggle}
          className="flex items-center gap-1"
        >
          <CarIcons.Heart 
            className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} 
          />
          {size !== "sm" && "Favorite"}
        </Button>
        
        <Button
          variant="outline"
          size={size}
          onClick={handleInspectionRequest}
          className="flex items-center gap-1"
        >
          <CarIcons.FileText className="h-4 w-4" />
          {size !== "sm" && "Inspect"}
        </Button>
        
        <Button
          size={size}
          onClick={handleViewDetails}
          className="flex items-center gap-1"
        >
          <CarIcons.Eye className="h-4 w-4" />
          {size !== "sm" && "View Details"}
        </Button>
      </div>

      {showInspectionForm && (
        <InspectionRequestForm
          isOpen={showInspectionForm}
          onClose={() => setShowInspectionForm(false)}
          carId={carId}
          carMake={make}
          carModel={model}
          carYear={year}
        />
      )}
    </>
  );
};