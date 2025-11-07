import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import carDiagramFront from '@/assets/car-diagram-front-korean.png';
import carDiagramBack from '@/assets/car-diagram-back-korean.png';

interface DiagramMarker {
  x: number;
  y: number;
  type: 'N' | 'R'; // N = shift (replacement), R = Repair
  label: string;
}

interface InspectionDiagramPanelProps {
  outerInspectionData?: any[];
  className?: string;
}

// Map inspection items to diagram positions
const mapInspectionToMarkers = (inspectionData: any[]): { within: DiagramMarker[], out: DiagramMarker[] } => {
  const withinMarkers: DiagramMarker[] = [];
  const outMarkers: DiagramMarker[] = [];

  if (!inspectionData || inspectionData.length === 0) {
    return { within: withinMarkers, out: outMarkers };
  }

  // Enhanced position mapping for Korean car diagram with better coverage
  const positionMap: Record<string, { panel: 'within' | 'out', x: number, y: number }> = {
    // Within panel (top/side view) - left side parts
    'hood': { panel: 'within', x: 320, y: 120 },
    'bonnet': { panel: 'within', x: 320, y: 120 },
    'front_panel': { panel: 'within', x: 320, y: 90 },
    'front_bumper': { panel: 'within', x: 320, y: 70 },
    'radiator_support': { panel: 'within', x: 320, y: 100 },
    
    'front_left_door': { panel: 'within', x: 165, y: 230 },
    'front_door_left': { panel: 'within', x: 165, y: 230 },
    'rear_left_door': { panel: 'within', x: 165, y: 310 },
    'rear_door_left': { panel: 'within', x: 165, y: 310 },
    'left_quarter': { panel: 'within', x: 165, y: 385 },
    'quarter_panel_left': { panel: 'within', x: 165, y: 385 },
    'side_sill_left': { panel: 'within', x: 165, y: 270 },
    'side_sill_panel_left': { panel: 'within', x: 165, y: 270 },
    'left_fender': { panel: 'within', x: 165, y: 155 },
    'fender_left': { panel: 'within', x: 165, y: 155 },
    'roof': { panel: 'within', x: 320, y: 240 },
    'roof_panel': { panel: 'within', x: 320, y: 240 },
    
    // Within panel - right side (mirror positions)
    'front_right_door': { panel: 'within', x: 475, y: 230 },
    'front_door_right': { panel: 'within', x: 475, y: 230 },
    'rear_right_door': { panel: 'within', x: 475, y: 310 },
    'rear_door_right': { panel: 'within', x: 475, y: 310 },
    'right_quarter': { panel: 'within', x: 475, y: 385 },
    'quarter_panel_right': { panel: 'within', x: 475, y: 385 },
    'side_sill_right': { panel: 'within', x: 475, y: 270 },
    'side_sill_panel_right': { panel: 'within', x: 475, y: 270 },
    'right_fender': { panel: 'within', x: 475, y: 155 },
    'fender_right': { panel: 'within', x: 475, y: 155 },
    
    // Out panel (bottom/underside view)
    'trunk': { panel: 'out', x: 320, y: 380 },
    'trunk_lid': { panel: 'out', x: 320, y: 400 },
    'trunk_floor': { panel: 'out', x: 320, y: 350 },
    'rear_panel': { panel: 'out', x: 320, y: 420 },
    'rear_bumper': { panel: 'out', x: 320, y: 445 },
    'rear_wheel_house_left': { panel: 'out', x: 210, y: 370 },
    'rear_wheel_house_right': { panel: 'out', x: 430, y: 370 },
    'front_wheel_house_left': { panel: 'out', x: 210, y: 170 },
    'front_wheel_house_right': { panel: 'out', x: 430, y: 170 },
    'front_cross_member': { panel: 'out', x: 320, y: 140 },
    'rear_cross_member': { panel: 'out', x: 320, y: 390 },
  };

  console.log('🔍 Processing inspection data for diagram:', {
    totalItems: inspectionData.length,
    items: inspectionData.map(item => ({
      title: item?.type?.title,
      code: item?.type?.code,
      statusTypes: item?.statusTypes,
      attributes: item?.attributes
    }))
  });

  inspectionData.forEach((item, idx) => {
    const typeTitle = (item?.type?.title || '').toString().toLowerCase();
    const typeCode = (item?.type?.code || '').toString().toLowerCase();
    const statusTypes = item?.statusTypes || [];
    const attributes = item?.attributes || [];
    
    console.log(`📋 Processing item ${idx + 1}:`, {
      typeTitle,
      typeCode,
      statusTypes,
      attributes
    });
    
    // Determine marker type based on statusTypes and attributes
    let markerType: 'N' | 'R' = 'R';
    let hasIssue = false;
    
    // Check statusTypes for exchange/replacement (N) or repair (R)
    statusTypes.forEach((status: any) => {
      const statusTitle = (status?.title || '').toString().toLowerCase();
      const statusCode = (status?.code || '').toString().toUpperCase();
      
      if (statusCode === 'X' || statusCode === 'N' || 
          statusTitle.includes('exchange') || 
          statusTitle.includes('replacement') || 
          statusTitle.includes('교환')) {
        markerType = 'N';
        hasIssue = true;
      } else if (statusCode === 'A' || statusCode === 'R' || statusCode === 'W' ||
                 statusTitle.includes('repair') || 
                 statusTitle.includes('수리') || 
                 statusTitle.includes('weld') || 
                 statusTitle.includes('용접')) {
        markerType = 'R';
        hasIssue = true;
      }
    });

    // Check attributes for RANK indicators - if present, assume there's an issue
    const hasHighRank = attributes.some((attr: string) => 
      typeof attr === 'string' && (
        attr.includes('RANK_ONE') || 
        attr.includes('RANK_TWO') || 
        attr.includes('RANK_A') || 
        attr.includes('RANK_B')
      )
    );

    if (hasHighRank) {
      hasIssue = true;
      // Keep the markerType from statusTypes, or default to 'N' if no statusTypes found
      if (statusTypes.length === 0) {
        markerType = 'N';
      }
    }

    if (!hasIssue) {
      console.log(`⚠️ Skipping item ${idx + 1}: no issue detected`);
      return;
    }

    // Try to find position for this part using fuzzy matching
    let bestMatch: string | null = null;
    let bestScore = 0;
    
    const normalize = (s: string) =>
      (s || "")
        .toString()
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\(.*?\)/g, "") // remove anything in parentheses
        .replace(/[^a-z0-9\s]/g, "") // drop punctuation
        .replace(/\s+/g, " ")
        .trim();

    const searchTerms = [typeTitle, typeCode, typeTitle.replace(/_/g, ' ')]
      .map(normalize)
      .filter(Boolean);
    
    Object.keys(positionMap).forEach(partKey => {
      const partKeyNormalized = normalize(partKey);
      searchTerms.forEach(term => {
        if (term && (term.includes(partKeyNormalized) || partKeyNormalized.includes(term))) {
          const score = Math.min(term.length, partKeyNormalized.length);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = partKey;
          }
        }
      });
    });

    if (bestMatch) {
      const pos = positionMap[bestMatch];
      const marker: DiagramMarker = {
        x: pos.x,
        y: pos.y,
        type: markerType,
        label: item?.type?.title || ''
      };

      console.log(`✅ Mapped "${item?.type?.title}" → ${bestMatch} (${pos.panel}), type: ${markerType}, position: (${pos.x}, ${pos.y})`);

      if (pos.panel === 'within') {
        withinMarkers.push(marker);
      } else {
        outMarkers.push(marker);
      }
    } else {
      console.warn(`❌ No position mapping found for: "${item?.type?.title}" (searched: ${typeTitle}, ${typeCode})`);
    }
  });

  console.log(`\n🎯 Final diagram markers:`, {
    within: withinMarkers.length,
    out: outMarkers.length,
    withinItems: withinMarkers.map(m => m.label),
    outItems: outMarkers.map(m => m.label)
  });
  
  return { within: withinMarkers, out: outMarkers };
};

const DiagramMarkerWithTooltip: React.FC<{ marker: DiagramMarker; index: number }> = ({ marker, index }) => {
  return (
    <TooltipProvider key={index}>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <g className="cursor-pointer" style={{ pointerEvents: 'all' }}>
            <circle
              cx={marker.x}
              cy={marker.y}
              r="18"
              fill={marker.type === 'N' ? '#ef4444' : '#3b82f6'}
              stroke="white"
              strokeWidth="3"
              className="transition-all hover:r-20 hover:opacity-90"
            />
            <text
              x={marker.x}
              y={marker.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="15"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              {marker.type}
            </text>
          </g>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-popover text-popover-foreground border-border shadow-lg max-w-xs"
        >
          <div className="font-semibold text-sm">{marker.label}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {marker.type === 'N' ? 'Replacement/Exchange' : 'Repair'}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const InspectionDiagramPanel: React.FC<InspectionDiagramPanelProps> = ({ 
  outerInspectionData = [],
  className = ""
}) => {
  const { within, out } = mapInspectionToMarkers(outerInspectionData);
  
  const hasAnyMarkers = within.length > 0 || out.length > 0;
  const hasData = outerInspectionData && outerInspectionData.length > 0;

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Debug info banner */}
      {hasData && !hasAnyMarkers && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-sm">
          <p className="text-yellow-800 dark:text-yellow-200">
            ℹ️ Data received ({outerInspectionData.length} items) but no markers mapped. Check console for details.
          </p>
        </div>
      )}
      {!hasData && (
        <div className="bg-muted/50 border-b border-border px-4 py-2 text-sm">
          <p className="text-muted-foreground">
            No inspection data available for this vehicle.
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 border-b border-border">
        <div className="text-center py-3 border-r border-border bg-muted/30 font-semibold">
          within
        </div>
        <div className="text-center py-3 bg-muted/30 font-semibold">
          out
        </div>
      </div>
      
      <div className="grid grid-cols-2">
        {/* Within panel - interior/side view */}
        <div className="relative border-r border-border p-4 bg-white dark:bg-muted/5">
          <img 
            src={carDiagramFront} 
            alt="Car side/interior view" 
            className="w-full h-auto"
          />
          <svg 
            viewBox="0 0 640 600" 
            className="absolute inset-0 w-full h-full"
          >
            {within.map((marker, idx) => (
              <DiagramMarkerWithTooltip key={idx} marker={marker} index={idx} />
            ))}
          </svg>
        </div>

        {/* Out panel - underside/bottom view */}
        <div className="relative p-4 bg-white dark:bg-muted/5">
          <img 
            src={carDiagramBack} 
            alt="Car underside/bottom view" 
            className="w-full h-auto"
          />
          <svg 
            viewBox="0 0 640 600" 
            className="absolute inset-0 w-full h-full"
          >
            {out.map((marker, idx) => (
              <DiagramMarkerWithTooltip key={idx} marker={marker} index={idx} />
            ))}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-border bg-muted/10 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
            N
          </div>
          <span className="text-sm font-medium">shift (Replacement)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            R
          </div>
          <span className="text-sm font-medium">Repair</span>
        </div>
      </div>
    </Card>
  );
};
