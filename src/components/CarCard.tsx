import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Car, Search, Gauge, Settings, Fuel, Palette, Hash } from "lucide-react";
import InspectionRequestForm from "@/components/InspectionRequestForm";
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
  title
}: CarCardProps) => {
  const navigate = useNavigate();
  const handleCardClick = () => {
    navigate(`/car/${id}`);
  };
  return <div className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border cursor-pointer group" onClick={handleCardClick}>
      <div className="relative h-48 bg-muted overflow-hidden">
        {image ? <img src={image} alt={`${year} ${make} ${model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => {
        e.currentTarget.src = "/placeholder.svg";
      }} /> : <div className="w-full h-full flex items-center justify-center bg-muted">
            <Car className="h-16 w-16 text-muted-foreground" />
          </div>}
        {lot && <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
            Kodi #{lot}
          </div>}
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-foreground">
            {year} {make} {model}
          </h3>
          {title && title !== `${make} ${model}` && <p className="text-sm text-muted-foreground mb-1">{title}</p>}
        </div>

        <div className="space-y-2 mb-4 text-sm">
          {mileage && <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span>{mileage}</span>
            </div>}
          {transmission && <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{transmission}</span>
            </div>}
          {fuel && <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{fuel}</span>
            </div>}
          {color && <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{color}</span>
            </div>}
          {vin && <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-mono">{vin}</span>
            </div>}
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-primary">
            €{price.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">
            Deri ne portin e Durresit
          </span>
        </div>

        <InspectionRequestForm
          carId={id}
          carMake={make}
          carModel={model}
          carYear={year}
          trigger={
            <Button
              onClick={(e) => e.stopPropagation()}
              className="w-full"
              size="sm"
              aria-label={`Request inspection for ${year} ${make} ${model}`}
            >
              <Search className="h-3 w-3 mr-2" />
              Request Inspection
            </Button>
          }
        />
        
        <div className="mt-2 text-center">
          <p className="text-xs text-muted-foreground">
            KORAUTO Shërbim profesional i importit
          </p>
        </div>
      </div>
    </div>;
};
export default CarCard;