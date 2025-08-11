import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Cog } from "lucide-react";

interface EngineSystemDemoProps {
  className?: string;
}

const EngineSystemDemo = ({ className = "" }: EngineSystemDemoProps) => {
  const [showEngineSection, setShowEngineSection] = useState(false);

  // Mock inspection data for demonstration
  const mockInspectionData = {
    engine_condition: "goodness",
    transmission: "proper",
    brake_system: "goodness", 
    exhaust_system: "proper",
    cooling_system: "goodness",
    electrical_system: "doesn't exist",
    suspension: "minor_wear",
    clutch: "goodness",
    fuel_system: "proper",
    belts_hoses: "needs_replacement"
  };

  return (
    <div className={`overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 inspection-section-black ${className}`}>
      <Button
        onClick={() => setShowEngineSection(!showEngineSection)}
        variant="ghost"
        className="w-full justify-between p-4 md:p-6 h-auto group hover:bg-blue-100/50 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
            <Cog className="h-4 w-4 md:h-6 md:w-6 text-white" />
          </div>
          <div className="text-left">
            <h5 className="text-lg md:text-xl font-bold text-foreground inspection-text-black">Motori dhe Sistemi Mekanik</h5>
            <p className="text-muted-foreground text-xs md:text-sm inspection-subtext-black">Kontrolli teknik i komponentëve kryesorë</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!showEngineSection && (
            <div className="flex gap-1">
              {Object.entries(mockInspectionData).slice(0, 3).map(([key, value], index) => {
                const isGood = value === "goodness" || value === "proper" || value === "doesn't exist";
                return (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${isGood ? 'bg-green-500' : 'bg-red-500'}`}
                    title={`${key}: ${value}`}
                  />
                );
              })}
              {Object.entries(mockInspectionData).length > 3 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{Object.entries(mockInspectionData).length - 3}
                </span>
              )}
            </div>
          )}
          <ChevronDown
            className={`h-4 w-4 md:h-5 md:w-5 text-muted-foreground transition-all duration-300 ${
              showEngineSection ? "rotate-180 text-primary" : ""
            }`}
          />
        </div>
      </Button>

      {showEngineSection && (
        <div className="px-3 md:px-6 pb-3 md:pb-6 space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-4">
            {Object.entries(mockInspectionData).map(
              ([key, value]: [string, any]) => {
                const isGood =
                  value === "goodness" ||
                  value === "proper" ||
                  value === "doesn't exist";
                const label = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase());

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-2 md:p-4 bg-card rounded-lg border transition-all hover:shadow-md ${
                      isGood ? 'border-green-200' : 'border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0 ${
                        isGood ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-xs md:text-sm font-medium text-foreground truncate">
                        {label}
                      </span>
                    </div>
                    <Badge
                      variant={isGood ? "default" : "destructive"}
                      className={`text-xs font-semibold flex-shrink-0 ml-2 ${
                        isGood ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {value === "goodness" && "✓ Mirë"}
                      {value === "proper" && "✓ Normal"}
                      {value === "doesn't exist" && "✓ Pa Probleme"}
                      {![
                        "goodness",
                        "proper", 
                        "doesn't exist",
                      ].includes(value) && `⚠ ${value}`}
                    </Badge>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineSystemDemo;