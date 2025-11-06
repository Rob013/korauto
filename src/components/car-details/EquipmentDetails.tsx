import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield } from "lucide-react";
import { getEquipmentIconName, loadIcon } from "./EquipmentIcons";
import type { LucideIcon } from "lucide-react";

interface EquipmentDetailsProps {
  options: {
    standard?: string[];
    choice?: string[];
    tuning?: string[];
  };
  features?: string[];
  safetyFeatures?: string[];
  comfortFeatures?: string[];
}

const EquipmentItem = memo(({ item, type }: { item: string; type: 'standard' | 'choice' | 'tuning' | 'feature' | 'safety' | 'comfort' }) => {
  const [Icon, setIcon] = useState<LucideIcon | null>(null);

  useEffect(() => {
    const iconName = getEquipmentIconName(item);
    loadIcon(iconName).then(setIcon);
  }, [item]);

  if (!Icon) return null;

  const styles = {
    standard: "bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/30 text-primary",
    choice: "bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20 hover:from-accent/10 hover:to-accent/15 hover:border-accent/30 text-accent",
    tuning: "bg-gradient-to-r from-destructive/5 to-destructive/10 border-destructive/20 hover:from-destructive/10 hover:to-destructive/15 hover:border-destructive/30 text-destructive",
    feature: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border-slate-200/60 dark:border-slate-700/60 hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 hover:border-blue-300/60 dark:hover:border-blue-600/60",
    safety: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200/60 dark:border-red-700/60 hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/30 dark:hover:to-red-700/30 hover:border-red-300/60 dark:hover:border-red-600/60",
    comfort: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200/60 dark:border-green-700/60"
  };

  return (
    <div className={`flex items-center gap-2 p-2 border rounded-md transition-all duration-200 group ${styles[type]}`}>
      <div className="flex-shrink-0">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-xs text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
        {item}
      </span>
    </div>
  );
});

EquipmentItem.displayName = 'EquipmentItem';

const EquipmentDetails = memo(({
  options,
  features,
  safetyFeatures,
  comfortFeatures
}: EquipmentDetailsProps) => {
  const [showAllStandard, setShowAllStandard] = useState(false);
  const [showAllChoice, setShowAllChoice] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [showAllSafety, setShowAllSafety] = useState(false);
  const [showAllComfort, setShowAllComfort] = useState(false);
  const INITIAL_SHOW_COUNT = 6;

  return (
    <div className="px-4 pb-4 space-y-6 animate-fade-in-up">
      {/* Standard Equipment */}
      {options.standard && options.standard.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <h5 className="text-base font-semibold text-foreground">Pajisje Standarde</h5>
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground font-medium">{options.standard.length} pajisje</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {(showAllStandard ? options.standard : options.standard.slice(0, INITIAL_SHOW_COUNT)).map((option, index) => (
              <EquipmentItem key={index} item={option} type="standard" />
            ))}
          </div>
          {options.standard.length > INITIAL_SHOW_COUNT && (
            <div className="flex justify-center pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAllStandard(!showAllStandard)} 
                className="h-9 px-4 text-sm text-primary hover:bg-primary/10 font-medium border-primary/30"
              >
                {showAllStandard ? `Më pak` : `Shiko të gjitha (${options.standard.length - INITIAL_SHOW_COUNT} më shumë)`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Optional Equipment */}
      {options.choice && options.choice.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <h5 className="text-base font-semibold text-foreground">Pajisje Opsionale</h5>
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground font-medium">{options.choice.length} opsione</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {(showAllChoice ? options.choice : options.choice.slice(0, INITIAL_SHOW_COUNT)).map((option, index) => (
              <EquipmentItem key={index} item={option} type="choice" />
            ))}
          </div>
          {options.choice.length > INITIAL_SHOW_COUNT && (
            <div className="flex justify-center pt-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAllChoice(!showAllChoice)} 
                className="h-10 px-6 text-sm font-semibold text-accent hover:bg-gradient-to-r hover:from-accent/50 hover:to-accent/100"
              >
                {showAllChoice ? "Më pak" : `Shiko të gjitha (${options.choice.length - INITIAL_SHOW_COUNT} më shumë)`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Safety Features */}
      {safetyFeatures && safetyFeatures.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <h5 className="text-base font-semibold text-foreground">Karakteristika të Sigurisë</h5>
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground font-medium">{safetyFeatures.length} siguri</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {(showAllSafety ? safetyFeatures : safetyFeatures.slice(0, INITIAL_SHOW_COUNT)).map((feature, index) => (
              <EquipmentItem key={index} item={feature} type="safety" />
            ))}
          </div>
          {safetyFeatures.length > INITIAL_SHOW_COUNT && (
            <div className="flex justify-center pt-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAllSafety(!showAllSafety)} 
                className="h-10 px-6 text-sm font-semibold"
              >
                {showAllSafety ? "Më pak" : `Shiko të gjitha (${safetyFeatures.length - INITIAL_SHOW_COUNT} më shumë)`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

EquipmentDetails.displayName = 'EquipmentDetails';

export default EquipmentDetails;
