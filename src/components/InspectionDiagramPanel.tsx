import React from 'react';
import { Card } from '@/components/ui/card';
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

  // Enhanced position mapping for Korean car diagram
  const positionMap: Record<string, { panel: 'within' | 'out', x: number, y: number }> = {
    // Within panel (top/interior view) - left side parts
    'front_left_door': { panel: 'within', x: 145, y: 230 },
    'front_door_left': { panel: 'within', x: 145, y: 230 },
    'rear_left_door': { panel: 'within', x: 145, y: 310 },
    'rear_door_left': { panel: 'within', x: 145, y: 310 },
    'left_quarter': { panel: 'within', x: 145, y: 370 },
    'quarter_panel_left': { panel: 'within', x: 145, y: 370 },
    'side_sill_left': { panel: 'within', x: 145, y: 270 },
    'left_fender': { panel: 'within', x: 145, y: 150 },
    'fender_left': { panel: 'within', x: 145, y: 150 },
    
    // Within panel - right side (mirror positions)
    'front_right_door': { panel: 'within', x: 495, y: 230 },
    'front_door_right': { panel: 'within', x: 495, y: 230 },
    'rear_right_door': { panel: 'within', x: 495, y: 310 },
    'rear_door_right': { panel: 'within', x: 495, y: 310 },
    'right_quarter': { panel: 'within', x: 495, y: 370 },
    'quarter_panel_right': { panel: 'within', x: 495, y: 370 },
    'side_sill_right': { panel: 'within', x: 495, y: 270 },
    'right_fender': { panel: 'within', x: 495, y: 150 },
    'fender_right': { panel: 'within', x: 495, y: 150 },
    
    // Out panel (bottom/underside view)
    'trunk': { panel: 'out', x: 230, y: 330 },
    'trunk_floor': { panel: 'out', x: 270, y: 330 },
    'rear_panel': { panel: 'out', x: 230, y: 370 },
    'rear_wheel_house_left': { panel: 'out', x: 190, y: 350 },
    'rear_wheel_house_right': { panel: 'out', x: 450, y: 350 },
  };

  console.log('🔍 Processing inspection data for diagram:', inspectionData.length, 'items');

  inspectionData.forEach((item, idx) => {
    const typeTitle = (item?.type?.title || '').toString().toLowerCase();
    const typeCode = (item?.type?.code || '').toString().toLowerCase();
    const statusTypes = item?.statusTypes || [];
    const attributes = item?.attributes || [];
    
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

    // Check attributes for RANK indicators
    const hasHighRank = attributes.some((attr: string) => 
      typeof attr === 'string' && (
        attr.includes('RANK_ONE') || 
        attr.includes('RANK_TWO') || 
        attr.includes('RANK_A') || 
        attr.includes('RANK_B')
      )
    );

    if (hasHighRank && !hasIssue) {
      // If has high rank but no explicit status, infer from title
      if (typeTitle.includes('exchange') || typeTitle.includes('replacement')) {
        markerType = 'N';
        hasIssue = true;
      } else if (typeTitle.includes('repair') || typeTitle.includes('weld')) {
        markerType = 'R';
        hasIssue = true;
      }
    }

    if (!hasIssue) return;

    // Try to find position for this part using fuzzy matching
    let bestMatch: string | null = null;
    let bestScore = 0;
    
    const searchTerms = [typeTitle, typeCode, typeTitle.replace(/_/g, ' ')];
    
    Object.keys(positionMap).forEach(partKey => {
      const partKeyNormalized = partKey.replace(/_/g, ' ');
      searchTerms.forEach(term => {
        if (term.includes(partKeyNormalized) || partKeyNormalized.includes(term)) {
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

      console.log(`📍 Mapped ${typeTitle} → ${bestMatch} (${pos.panel}), type: ${markerType}`);

      if (pos.panel === 'within') {
        withinMarkers.push(marker);
      } else {
        outMarkers.push(marker);
      }
    } else {
      console.warn(`⚠️ No position mapping found for: ${typeTitle}`);
    }
  });

  console.log(`✅ Diagram markers: ${withinMarkers.length} within, ${outMarkers.length} out`);
  return { within: withinMarkers, out: outMarkers };
};

export const InspectionDiagramPanel: React.FC<InspectionDiagramPanelProps> = ({ 
  outerInspectionData = [],
  className = ""
}) => {
  const { within, out } = mapInspectionToMarkers(outerInspectionData);

  return (
    <Card className={`overflow-hidden ${className}`}>
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
        <div className="relative border-r border-border p-4 bg-white">
          <img 
            src={carDiagramFront} 
            alt="Car interior view" 
            className="w-full h-auto"
          />
          <svg 
            viewBox="0 0 640 600" 
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {within.map((marker, idx) => (
              <g key={idx}>
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r="16"
                  fill={marker.type === 'N' ? '#ef4444' : '#3b82f6'}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={marker.x}
                  y={marker.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {marker.type}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Out panel - underside/bottom view */}
        <div className="relative p-4 bg-white">
          <img 
            src={carDiagramBack} 
            alt="Car underside view" 
            className="w-full h-auto"
          />
          <svg 
            viewBox="0 0 640 600" 
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {out.map((marker, idx) => (
              <g key={idx}>
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r="16"
                  fill={marker.type === 'N' ? '#ef4444' : '#3b82f6'}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={marker.x}
                  y={marker.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {marker.type}
                </text>
              </g>
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
          <span className="text-sm font-medium">shift</span>
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
