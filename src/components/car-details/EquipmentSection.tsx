import { memo, useState, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Cog } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the heavy equipment components
const EquipmentDetails = lazy(() => import("./EquipmentDetails"));

interface EquipmentSectionProps {
  options: {
    standard?: string[];
    choice?: string[];
    tuning?: string[];
  };
  features?: string[];
  safetyFeatures?: string[];
  comfortFeatures?: string[];
}

const EquipmentSkeleton = () => (
  <div className="px-4 pb-4 space-y-6">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
);

export const EquipmentSection = memo(({
  options,
  features,
  safetyFeatures,
  comfortFeatures
}: EquipmentSectionProps) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="overflow-hidden bg-gradient-to-br from-background to-muted/20 rounded-xl border border-border/40 backdrop-blur-sm shadow-lg">
      <Button 
        onClick={() => setShowOptions(!showOptions)} 
        variant="ghost" 
        className="w-full justify-between p-4 h-auto group hover:bg-gradient-to-r hover:from-muted/20 hover:to-muted/10 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Cog className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground">
            {showOptions ? "Fsheh Pajisjet dhe Opsionet" : "Shfaq të Gjitha Pajisjet dhe Opsionet"}
          </span>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-all duration-300 ${showOptions ? "rotate-180 text-primary" : ""}`} />
      </Button>

      {showOptions && (
        <Suspense fallback={<EquipmentSkeleton />}>
          <EquipmentDetails
            options={options}
            features={features}
            safetyFeatures={safetyFeatures}
            comfortFeatures={comfortFeatures}
          />
        </Suspense>
      )}
    </div>
  );
});

EquipmentSection.displayName = 'EquipmentSection';
