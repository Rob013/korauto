// Shared car badges component to reduce duplication
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusText } from "@/types/car";
import { CarIcons } from "./CarIcons";

interface CarBadgesProps {
  status?: number;
  sale_status?: string;
  isNew?: boolean;
  isCertified?: boolean;
  accidentCount?: number;
  className?: string;
}

export const CarBadges = ({
  status,
  sale_status,
  isNew,
  isCertified,
  accidentCount,
  className = ""
}: CarBadgesProps) => {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {/* Status Badge */}
      <Badge 
        variant="secondary" 
        className={getStatusColor(status, sale_status)}
      >
        {getStatusText(status, sale_status)}
      </Badge>

      {/* New Car Badge */}
      {isNew && (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          New
        </Badge>
      )}

      {/* Certified Badge */}
      {isCertified && (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CarIcons.Shield className="w-3 h-3 mr-1" />
          Certified
        </Badge>
      )}

      {/* Accident History Badge */}
      {accidentCount !== undefined && accidentCount > 0 && (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <CarIcons.AlertTriangle className="w-3 h-3 mr-1" />
          {accidentCount} Accident{accidentCount > 1 ? 's' : ''}
        </Badge>
      )}

      {/* No Accidents Badge */}
      {accidentCount === 0 && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CarIcons.CheckCircle className="w-3 h-3 mr-1" />
          Clean History
        </Badge>
      )}
    </div>
  );
};