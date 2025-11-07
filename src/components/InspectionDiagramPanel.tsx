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

  // Enhanced position mapping with accurate coordinates and aliases
  const positionMap: Record<string, { panel: 'within' | 'out', x: number, y: number }> = {
    // ===== WITHIN PANEL (Top/Side View) =====
    
    // Front section
    'hood': { panel: 'within', x: 320, y: 130 },
    'bonnet': { panel: 'within', x: 320, y: 130 },
    'front_panel': { panel: 'within', x: 320, y: 95 },
    'front_bumper': { panel: 'within', x: 320, y: 75 },
    'radiator_support': { panel: 'within', x: 320, y: 105 },
    'cowl_panel': { panel: 'within', x: 320, y: 160 },
    
    // Left side (driver side in Korean cars)
    'front_left_fender': { panel: 'within', x: 180, y: 160 },
    'front_fender_left': { panel: 'within', x: 180, y: 160 },
    'left_fender': { panel: 'within', x: 180, y: 160 },
    'fender_left': { panel: 'within', x: 180, y: 160 },
    
    'front_left_door': { panel: 'within', x: 170, y: 240 },
    'front_door_left': { panel: 'within', x: 170, y: 240 },
    
    'rear_left_door': { panel: 'within', x: 170, y: 315 },
    'rear_door_left': { panel: 'within', x: 170, y: 315 },
    
    'left_quarter_panel': { panel: 'within', x: 175, y: 390 },
    'quarter_panel_left': { panel: 'within', x: 175, y: 390 },
    'left_quarter': { panel: 'within', x: 175, y: 390 },
    'quarter_left': { panel: 'within', x: 175, y: 390 },
    
    'side_sill_panel_left': { panel: 'within', x: 165, y: 275 },
    'side_sill_left': { panel: 'within', x: 165, y: 275 },
    'rocker_panel_left': { panel: 'within', x: 165, y: 275 },
    
    // Right side (passenger side)
    'front_right_fender': { panel: 'within', x: 460, y: 160 },
    'front_fender_right': { panel: 'within', x: 460, y: 160 },
    'right_fender': { panel: 'within', x: 460, y: 160 },
    'fender_right': { panel: 'within', x: 460, y: 160 },
    
    'front_right_door': { panel: 'within', x: 470, y: 240 },
    'front_door_right': { panel: 'within', x: 470, y: 240 },
    
    'rear_right_door': { panel: 'within', x: 470, y: 315 },
    'rear_door_right': { panel: 'within', x: 470, y: 315 },
    
    'right_quarter_panel': { panel: 'within', x: 465, y: 390 },
    'quarter_panel_right': { panel: 'within', x: 465, y: 390 },
    'right_quarter': { panel: 'within', x: 465, y: 390 },
    'quarter_right': { panel: 'within', x: 465, y: 390 },
    
    'side_sill_panel_right': { panel: 'within', x: 475, y: 275 },
    'side_sill_right': { panel: 'within', x: 475, y: 275 },
    'rocker_panel_right': { panel: 'within', x: 475, y: 275 },
    
    // Top/Roof
    'roof': { panel: 'within', x: 320, y: 250 },
    'roof_panel': { panel: 'within', x: 320, y: 250 },
    'sunroof': { panel: 'within', x: 320, y: 235 },
    
    // ===== OUT PANEL (Rear/Bottom View) =====
    
    // Rear section
    'trunk': { panel: 'out', x: 320, y: 385 },
    'trunk_lid': { panel: 'out', x: 320, y: 405 },
    'deck_lid': { panel: 'out', x: 320, y: 405 },
    'trunk_floor': { panel: 'out', x: 320, y: 355 },
    'luggage_floor': { panel: 'out', x: 320, y: 355 },
    
    'rear_panel': { panel: 'out', x: 320, y: 425 },
    'back_panel': { panel: 'out', x: 320, y: 425 },
    
    'rear_bumper': { panel: 'out', x: 320, y: 450 },
    'back_bumper': { panel: 'out', x: 320, y: 450 },
    
    // Wheel houses
    'rear_wheel_house_left': { panel: 'out', x: 215, y: 375 },
    'rear_wheelhouse_left': { panel: 'out', x: 215, y: 375 },
    
    'rear_wheel_house_right': { panel: 'out', x: 425, y: 375 },
    'rear_wheelhouse_right': { panel: 'out', x: 425, y: 375 },
    
    'front_wheel_house_left': { panel: 'out', x: 215, y: 175 },
    'front_wheelhouse_left': { panel: 'out', x: 215, y: 175 },
    
    'front_wheel_house_right': { panel: 'out', x: 425, y: 175 },
    'front_wheelhouse_right': { panel: 'out', x: 425, y: 175 },
    
    // Cross members and structural
    'front_cross_member': { panel: 'out', x: 320, y: 145 },
    'rear_cross_member': { panel: 'out', x: 320, y: 395 },
    'front_rail': { panel: 'out', x: 320, y: 130 },
    'rear_rail': { panel: 'out', x: 320, y: 410 },
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

    // Try to find position using improved matching algorithm
    const normalize = (s: string) =>
      (s || "")
        .toString()
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\(.*?\)/g, "") // remove anything in parentheses
        .replace(/[^a-z0-9\s]/g, "") // drop punctuation
        .replace(/\s+/g, " ")
        .trim();

    let bestMatch: string | null = null;
    let bestScore = 0;
    
    const normalizedTitle = normalize(typeTitle);
    const normalizedCode = normalize(typeCode);
    
    // Try exact match first (highest priority)
    for (const partKey of Object.keys(positionMap)) {
      const normalizedPartKey = normalize(partKey);
      
      // Exact match gets highest score
      if (normalizedPartKey === normalizedTitle || normalizedPartKey === normalizedCode) {
        bestMatch = partKey;
        bestScore = 1000;
        break;
      }
    }
    
    // If no exact match, try fuzzy matching
    if (!bestMatch) {
      for (const partKey of Object.keys(positionMap)) {
        const normalizedPartKey = normalize(partKey);
        
        // Check if one contains the other (prefer longer matches)
        if (normalizedTitle && normalizedPartKey) {
          if (normalizedTitle.includes(normalizedPartKey)) {
            const score = normalizedPartKey.length * 10;
            if (score > bestScore) {
              bestScore = score;
              bestMatch = partKey;
            }
          } else if (normalizedPartKey.includes(normalizedTitle)) {
            const score = normalizedTitle.length * 10;
            if (score > bestScore) {
              bestScore = score;
              bestMatch = partKey;
            }
          }
        }
        
        // Also check code matching
        if (normalizedCode && normalizedPartKey) {
          if (normalizedCode.includes(normalizedPartKey) || normalizedPartKey.includes(normalizedCode)) {
            const score = Math.min(normalizedCode.length, normalizedPartKey.length) * 8;
            if (score > bestScore) {
              bestScore = score;
              bestMatch = partKey;
            }
          }
        }
      }
    }

    if (bestMatch) {
      const pos = positionMap[bestMatch];
      
      // Check for collision with existing markers and offset if needed
      let finalX = pos.x;
      let finalY = pos.y;
      const collisionRadius = 25; // Minimum distance between markers
      
      const markersToCheck = pos.panel === 'within' ? withinMarkers : outMarkers;
      let hasCollision = true;
      let attempts = 0;
      const maxAttempts = 8; // Try 8 positions around the original
      
      while (hasCollision && attempts < maxAttempts) {
        hasCollision = false;
        
        for (const existingMarker of markersToCheck) {
          const distance = Math.sqrt(
            Math.pow(existingMarker.x - finalX, 2) + 
            Math.pow(existingMarker.y - finalY, 2)
          );
          
          if (distance < collisionRadius) {
            hasCollision = true;
            // Offset in a circular pattern
            const angle = (attempts * Math.PI * 2) / maxAttempts;
            finalX = pos.x + Math.cos(angle) * collisionRadius;
            finalY = pos.y + Math.sin(angle) * collisionRadius;
            break;
          }
        }
        
        attempts++;
      }
      
      const marker: DiagramMarker = {
        x: finalX,
        y: finalY,
        type: markerType,
        label: item?.type?.title || ''
      };

      console.log(`✅ Mapped "${item?.type?.title}" → ${bestMatch} (${pos.panel}), type: ${markerType}, position: (${finalX}, ${finalY})${finalX !== pos.x || finalY !== pos.y ? ' [offset for collision]' : ''}`);

      if (pos.panel === 'within') {
        withinMarkers.push(marker);
      } else {
        outMarkers.push(marker);
      }
    } else {
      console.warn(`❌ No position mapping found for: "${item?.type?.title}" (searched: ${normalizedTitle}, ${normalizedCode})`);
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
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <g 
          className="cursor-pointer hover:opacity-90 transition-opacity" 
          style={{ pointerEvents: 'all' }}
        >
          <circle
            cx={marker.x}
            cy={marker.y}
            r="18"
            fill={marker.type === 'N' ? '#ef4444' : '#3b82f6'}
            stroke="white"
            strokeWidth="3"
            className="transition-all"
          />
          <text
            x={marker.x}
            y={marker.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="15"
            fontWeight="bold"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {marker.type}
          </text>
        </g>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        sideOffset={8}
        className="bg-popover text-popover-foreground border-border shadow-lg max-w-xs z-50"
      >
        <div className="font-semibold text-sm">{marker.label}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {marker.type === 'N' ? 'Shift (Replacement)' : 'Repair'}
        </div>
      </TooltipContent>
    </Tooltip>
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
              style={{ pointerEvents: 'none' }}
            >
              <TooltipProvider delayDuration={0}>
                {within.map((marker, idx) => (
                  <DiagramMarkerWithTooltip key={idx} marker={marker} index={idx} />
                ))}
              </TooltipProvider>
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
              style={{ pointerEvents: 'none' }}
            >
              <TooltipProvider delayDuration={0}>
                {out.map((marker, idx) => (
                  <DiagramMarkerWithTooltip key={idx} marker={marker} index={idx} />
                ))}
              </TooltipProvider>
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
