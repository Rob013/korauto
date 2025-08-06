import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Cog } from "lucide-react";

const TestCarDetails = () => {
  const [showEngineSection, setShowEngineSection] = useState(false);
  const [showFixedSection, setShowFixedSection] = useState(false);

  // Mock inspection data to demonstrate the issue
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Test Car Details - Mobile Layout Issue</h1>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Current Implementation (Has Layout Issue):</h2>
          
          {/* Current problematic implementation */}
          <div className="overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 inspection-section-black">
            <Button
              onClick={() => setShowEngineSection(!showEngineSection)}
              variant="ghost"
              className="w-full justify-between p-3 md:p-4 h-auto group hover:bg-blue-100/50 transition-all duration-300"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors flex-shrink-0">
                  <Cog className="h-4 w-4 text-white" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <h5 className="text-base md:text-lg font-bold text-foreground inspection-text-black">Motori dhe Sistemi Mekanik</h5>
                  <p className="text-muted-foreground text-xs inspection-subtext-black">Kontrolli teknik i komponentëve kryesorë</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
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
              <div className="px-3 pb-3 space-y-2 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
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
                          className={`flex items-center justify-between p-3 bg-card rounded-lg border transition-all hover:shadow-sm ${
                            isGood ? 'border-green-200' : 'border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isGood ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span className="text-sm font-medium text-foreground truncate">
                              {label}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-green-700">Fixed Implementation (Mobile Optimized):</h2>
          
          {/* Fixed mobile-optimized implementation */}
          <div className="overflow-hidden bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <Button
              onClick={() => setShowFixedSection(!showFixedSection)}
              variant="ghost"
              className="w-full justify-between p-3 md:p-4 h-auto group hover:bg-green-100/50 transition-all duration-300"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-700 transition-colors flex-shrink-0">
                  <Cog className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <h5 className="text-sm sm:text-base md:text-lg font-bold text-foreground leading-tight">Motori dhe Sistemi Mekanik</h5>
                  <p className="text-muted-foreground text-xs leading-tight hidden sm:block">Kontrolli teknik i komponentëve kryesorë</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {!showFixedSection && (
                  <div className="flex gap-0.5 sm:gap-1">
                    {Object.entries(mockInspectionData).slice(0, 3).map(([key, value], index) => {
                      const isGood = value === "goodness" || value === "proper" || value === "doesn't exist";
                      return (
                        <div
                          key={index}
                          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isGood ? 'bg-green-500' : 'bg-red-500'}`}
                          title={`${key}: ${value}`}
                        />
                      );
                    })}
                    {Object.entries(mockInspectionData).length > 3 && (
                      <span className="text-xs text-muted-foreground ml-0.5 sm:ml-1 hidden xs:inline">
                        +{Object.entries(mockInspectionData).length - 3}
                      </span>
                    )}
                  </div>
                )}
                <ChevronDown
                  className={`h-4 w-4 md:h-5 md:w-5 text-muted-foreground transition-all duration-300 flex-shrink-0 ${
                    showFixedSection ? "rotate-180 text-primary" : ""
                  }`}
                />
              </div>
            </Button>

            {showFixedSection && (
              <div className="px-3 pb-3 space-y-2 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
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
                          className={`flex items-center justify-between p-3 bg-card rounded-lg border transition-all hover:shadow-sm ${
                            isGood ? 'border-green-200' : 'border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isGood ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span className="text-sm font-medium text-foreground truncate">
                              {label}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Layout Issue Description:</h3>
          <p className="text-yellow-700 text-sm">
            On mobile devices, especially small screens (320px-375px), the text "Motori dhe Sistemi Mekanik" 
            and subtitle conflict with the green status dots and chevron icon on the right. The text may wrap 
            or get truncated improperly, causing layout issues.
          </p>
        </div>

        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Fix Implementation:</h3>
          <ul className="text-green-700 text-sm space-y-1">
            <li>• Reduced gaps between elements on mobile (gap-2 → gap-2 sm:gap-3)</li>
            <li>• Smaller icon container on mobile (w-7 h-7 sm:w-8 sm:h-8)</li>
            <li>• Smaller font size on mobile (text-sm sm:text-base)</li>
            <li>• Hide subtitle on mobile to save space (hidden sm:block)</li>
            <li>• Smaller status dots on mobile (w-1.5 h-1.5 sm:w-2 sm:h-2)</li>
            <li>• Hide counter text on very small screens (hidden xs:inline)</li>
            <li>• Added padding right to text container (pr-2)</li>
            <li>• Tighter line spacing (leading-tight)</li>
            <li>• Smaller gaps between status dots (gap-0.5 sm:gap-1)</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Test Instructions:</h3>
          <p className="text-blue-700 text-sm">
            1. Resize your browser to mobile width (375px or smaller)<br/>
            2. Compare the layout of the two sections above<br/>
            3. The green "Fixed Implementation" should show better mobile layout<br/>
            4. Notice how the subtitle disappears on mobile and elements are more compact
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestCarDetails;