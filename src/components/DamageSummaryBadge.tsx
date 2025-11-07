import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InspectionItem {
  type: { code: string; title: string };
  statusTypes: Array<{ code: string; title: string }>;
  attributes: string[];
}

interface DamageSummaryBadgeProps {
  inspectionData?: InspectionItem[];
  className?: string;
}

export const DamageSummaryBadge: React.FC<DamageSummaryBadgeProps> = ({ 
  inspectionData = [], 
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count all types of issues from API data
  const damageCount = {
    replacements: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => s.code) || [];
      return (
        codes.includes('X') ||
        t.includes('exchange') || t.includes('replacement') || t.includes('교환')
      );
    }).length,
    welds: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => s.code) || [];
      return (
        codes.includes('W') ||
        t.includes('weld') || t.includes('sheet metal') || t.includes('용접')
      );
    }).length,
    repairs: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => s.code) || [];
      return (
        codes.includes('A') ||
        t.includes('repair') || t.includes('수리')
      );
    }).length,
    corrosion: inspectionData.filter(item => {
      const t = (item?.type?.title || '').toString().toLowerCase();
      const codes = item.statusTypes?.map(s => s.code) || [];
      return (
        codes.includes('U') ||
        t.includes('corr') || t.includes('부식')
      );
    }).length,
  };

  const totalDamage = damageCount.replacements + damageCount.welds + damageCount.repairs + damageCount.corrosion;
  const hasCriticalDamage = damageCount.replacements > 0 || damageCount.welds > 0;

  if (totalDamage === 0) {
    return null;
  }

  return (
    <Card className={`border-0 shadow-lg overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {/* Compact Summary Badge - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${hasCriticalDamage ? 'bg-destructive/10' : 'bg-orange-500/10'}`}>
              <AlertTriangle className={`h-5 w-5 ${hasCriticalDamage ? 'text-destructive' : 'text-orange-500'}`} />
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground text-sm">
                {totalDamage} Dëmtime të Raportuara
              </div>
              <div className="text-xs text-muted-foreground">
                {hasCriticalDamage ? 'Përfshin dëmtime kritike' : 'Kliko për detaje'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasCriticalDamage && (
              <Badge variant="destructive" className="font-bold">
                KRITIKE
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-border bg-muted/30 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2">
              {damageCount.replacements > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold">
                      N
                    </span>
                    <span className="text-sm font-medium">Ndërrime</span>
                  </div>
                  <Badge variant="destructive" className="font-mono">{damageCount.replacements}</Badge>
                </div>
              )}
              
              {damageCount.welds > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-600/10">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                      S
                    </span>
                    <span className="text-sm font-medium">Saldime</span>
                  </div>
                  <Badge className="font-mono" style={{backgroundColor: 'hsl(217 91% 60%)', color: 'white'}}>
                    {damageCount.welds}
                  </Badge>
                </div>
              )}
              
              {damageCount.repairs > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'hsl(25 95% 53% / 0.1)'}}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold" style={{backgroundColor: 'hsl(25 95% 53%)'}}>
                      R
                    </span>
                    <span className="text-sm font-medium">Riparime</span>
                  </div>
                  <Badge className="font-mono" style={{backgroundColor: 'hsl(25 95% 53%)', color: 'white'}}>
                    {damageCount.repairs}
                  </Badge>
                </div>
              )}
              
              {damageCount.corrosion > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'hsl(25 95% 53% / 0.1)'}}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold" style={{backgroundColor: 'hsl(25 95% 53%)'}}>
                      K
                    </span>
                    <span className="text-sm font-medium">Korrozion</span>
                  </div>
                  <Badge className="font-mono" style={{backgroundColor: 'hsl(25 95% 53%)', color: 'white'}}>
                    {damageCount.corrosion}
                  </Badge>
                </div>
              )}
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <p>
                  Simbolet (N=Ndërruar, S=Salduar, R=Riparuar, K=Korrozion) shfaqen në diagramin vizual më poshtë.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DamageSummaryBadge;
