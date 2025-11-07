import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit3, Save, X } from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import carDiagramFront from '@/assets/car-diagram-front-korean.png';
import carDiagramBack from '@/assets/car-diagram-back-korean.png';

type MarkerCategory =
  | 'exchange'
  | 'welding'
  | 'corrosion'
  | 'scratch'
  | 'uneven'
  | 'damage';

interface DiagramMarker {
  x: number;
  y: number;
  category: MarkerCategory;
  label: string;
}

const DIAGRAM_WIDTH = 640;
const DIAGRAM_HEIGHT = 606;

const CATEGORY_INFO: Record<MarkerCategory, { label: string; symbol: string; color: string }> = {
  exchange: {
    label: 'Exchange',
    symbol: 'X',
    color: '#FF3B30',
  },
  welding: {
    label: 'Sheet metal / welding',
    symbol: 'W',
    color: '#0A84FF',
  },
  corrosion: {
    label: 'Corrosion',
    symbol: 'C',
    color: '#FF9500',
  },
  scratch: {
    label: 'Scratches',
    symbol: 'S',
    color: '#FFD60A',
  },
  uneven: {
    label: 'Uneven',
    symbol: 'U',
    color: '#8E8E93',
  },
  damage: {
    label: 'Damage',
    symbol: 'D',
    color: '#FF2D55',
  },
};

const CATEGORY_ORDER: MarkerCategory[] = [
  'exchange',
  'welding',
  'corrosion',
  'scratch',
  'uneven',
  'damage',
];

const normalizeText = (value: unknown) =>
  (value ?? '')
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const determineMarkerCategory = (
  statusTypes: any[] = [],
  attributes: any[] = [],
  title: string = '',
  code: string = '',
): MarkerCategory | null => {
  const searchTokens = [normalizeText(title), normalizeText(code)];
  const codeTokens = new Set<string>();

  statusTypes.forEach((status) => {
    if (!status) return;
    const statusTitle = normalizeText(status.title);
    const statusCode = (status.code ?? '')
      .toString()
      .trim()
      .toUpperCase();

    if (statusTitle) {
      searchTokens.push(statusTitle);
    }
    if (statusCode) {
      codeTokens.add(statusCode);
      searchTokens.push(statusCode.toLowerCase());
    }
  });

  attributes.forEach((attr) => {
    const normalized = normalizeText(attr);
    if (normalized) {
      searchTokens.push(normalized);
    }
  });

  const hasToken = (...keywords: string[]) =>
    keywords.some((keyword) =>
      searchTokens.some((token) => token.includes(keyword.toLowerCase())),
    );

  if (
    codeTokens.has('X') ||
    codeTokens.has('N') ||
    hasToken('exchange', 'replacement', 'replaced', '교환')
  ) {
    return 'exchange';
  }

  if (
    codeTokens.has('W') ||
    hasToken('sheet metal', 'weld', 'welding', '용접')
  ) {
    return 'welding';
  }

  if (codeTokens.has('U') || codeTokens.has('K') || hasToken('corrosion', 'rust', '부식')) {
    return 'corrosion';
  }

  if (codeTokens.has('S') || hasToken('scratch', '흠집', 'scuff')) {
    return 'scratch';
  }

  if (hasToken('uneven', 'gap', 'panel gap', '단차')) {
    return 'uneven';
  }

  const hasHighRank = attributes.some((attr) =>
    typeof attr === 'string' && /RANK_(ONE|TWO|A|B|C)/i.test(attr),
  );

  if (
    hasHighRank ||
    codeTokens.has('A') ||
    codeTokens.has('R') ||
    hasToken('damage', 'dent', 'impact', '파손', '교정', '변형')
  ) {
    return 'damage';
  }

  return null;
};

const makeMarkerKey = (panel: 'within' | 'out', label: string) =>
  `${panel}_${label
    .toLowerCase()
    .replace(/\((.*?)\)/g, '$1')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')}`;

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
    
    // Left side (driver side in Korean cars) - EXACT POSITIONS FROM REFERENCE IMAGE
    'front_left_fender': { panel: 'within', x: 170, y: 210 },
    'front_fender_left': { panel: 'within', x: 170, y: 210 },
    'left_fender': { panel: 'within', x: 170, y: 210 },
    'fender_left': { panel: 'within', x: 170, y: 210 },

    'front_left_door': { panel: 'within', x: 155, y: 260 },
    'front_door_left': { panel: 'within', x: 155, y: 260 },
    'door_front_left': { panel: 'within', x: 155, y: 260 },

    'rear_left_door': { panel: 'within', x: 165, y: 315 },
    'rear_door_left': { panel: 'within', x: 165, y: 315 },
    'door_rear_left': { panel: 'within', x: 165, y: 315 },

    'left_quarter_panel': { panel: 'within', x: 170, y: 375 },
    'quarter_panel_left': { panel: 'within', x: 170, y: 375 },
    'left_quarter': { panel: 'within', x: 170, y: 375 },
    'quarter_left': { panel: 'within', x: 170, y: 375 },
    'rear_fender_left': { panel: 'within', x: 170, y: 375 },
    'left_rear_fender': { panel: 'within', x: 170, y: 375 },

    'side_sill_panel_left': { panel: 'within', x: 140, y: 320 },
    'side_sill_left': { panel: 'within', x: 140, y: 320 },
    'rocker_panel_left': { panel: 'within', x: 140, y: 320 },
    'side_room_panel_left': { panel: 'within', x: 140, y: 320 },
    'side_panel_left': { panel: 'within', x: 140, y: 320 },
    
    // Right side (passenger side)
    'front_right_fender': { panel: 'within', x: 470, y: 210 },
    'front_fender_right': { panel: 'within', x: 470, y: 210 },
    'right_fender': { panel: 'within', x: 470, y: 210 },
    'fender_right': { panel: 'within', x: 470, y: 210 },

    'front_right_door': { panel: 'within', x: 485, y: 260 },
    'front_door_right': { panel: 'within', x: 485, y: 260 },

    'rear_right_door': { panel: 'within', x: 485, y: 315 },
    'rear_door_right': { panel: 'within', x: 485, y: 315 },
    'rear_door_(right)_-_replacement': { panel: 'within', x: 485, y: 315 },

    'right_quarter_panel': { panel: 'within', x: 470, y: 375 },
    'quarter_panel_right': { panel: 'within', x: 470, y: 375 },
    'right_quarter': { panel: 'within', x: 470, y: 375 },
    'quarter_right': { panel: 'within', x: 470, y: 375 },

    'side_sill_panel_right': { panel: 'within', x: 500, y: 320 },
    'side_sill_right': { panel: 'within', x: 500, y: 320 },
    'rocker_panel_right': { panel: 'within', x: 500, y: 320 },
    'side_room_panel_right': { panel: 'within', x: 500, y: 320 },
    'side_panel_right': { panel: 'within', x: 500, y: 320 },
    
    // Top/Roof
    'roof': { panel: 'within', x: 320, y: 250 },
    'roof_panel': { panel: 'within', x: 320, y: 250 },
    'sunroof': { panel: 'within', x: 320, y: 235 },
    
    // ===== OUT PANEL (Rear/Bottom View) =====
    
    // Rear section - EXACT POSITIONS FROM REFERENCE IMAGE
    'trunk': { panel: 'out', x: 320, y: 415 },
    'trunk_lid': { panel: 'out', x: 320, y: 405 },
    'deck_lid': { panel: 'out', x: 320, y: 405 },
    'trunk_floor': { panel: 'out', x: 320, y: 415 },
    'luggage_floor': { panel: 'out', x: 320, y: 415 },
    'floor_trunk': { panel: 'out', x: 320, y: 415 },
    
    'rear_panel': { panel: 'out', x: 320, y: 425 },
    'back_panel': { panel: 'out', x: 320, y: 425 },
    
    'rear_bumper': { panel: 'out', x: 320, y: 450 },
    'back_bumper': { panel: 'out', x: 320, y: 450 },
    
    // Wheel houses - EXACT POSITIONS FROM REFERENCE IMAGE
    'rear_wheel_house_left': { panel: 'out', x: 285, y: 565 },
    'rear_wheelhouse_left': { panel: 'out', x: 285, y: 565 },
    'wheel_house_rear_left': { panel: 'out', x: 285, y: 565 },
    'wheelhouse_rear_left': { panel: 'out', x: 285, y: 565 },
    
    'rear_wheel_house_right': { panel: 'out', x: 355, y: 565 },
    'rear_wheelhouse_right': { panel: 'out', x: 355, y: 565 },
    'wheel_house_rear_right': { panel: 'out', x: 355, y: 565 },
    'wheelhouse_rear_right': { panel: 'out', x: 355, y: 565 },
    
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
    const rawTitle = (item?.type?.title || '').toString();
    const rawCode = (item?.type?.code || '').toString();
    const typeTitle = rawTitle.toLowerCase();
    const typeCode = rawCode.toLowerCase();
    const statusTypes = Array.isArray(item?.statusTypes) ? item.statusTypes : [];
    const attributes = Array.isArray(item?.attributes) ? item.attributes : [];
    
    console.log(`📋 Processing item ${idx + 1}:`, {
      typeTitle,
      typeCode,
      statusTypes,
      attributes
    });
    
    const category = determineMarkerCategory(statusTypes, attributes, rawTitle, rawCode);

    if (!category) {
      console.log(`⚠️ Skipping item ${idx + 1}: no relevant status detected`);
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
      const collisionRadius = 32; // Minimum distance between markers for clean spacing
      
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
        category,
        label: rawTitle,
      };

      console.log(`✅ Mapped "${rawTitle}" → ${bestMatch} (${pos.panel}), category: ${category}, position: (${finalX}, ${finalY})${finalX !== pos.x || finalY !== pos.y ? ' [offset for collision]' : ''}`);

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

const DiagramMarkerWithTooltip: React.FC<{
  marker: DiagramMarker;
  index: number;
  editMode: boolean;
  onDrag?: (x: number, y: number) => void;
}> = ({ marker, index, editMode, onDrag }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLElement | null>(null);

  const leftPercent = (marker.x / DIAGRAM_WIDTH) * 100;
  const topPercent = (marker.y / DIAGRAM_HEIGHT) * 100;
  const categoryInfo = CATEGORY_INFO[marker.category];

  const baseClasses =
    "absolute -translate-x-1/2 -translate-y-1/2 w-[32px] h-[32px] rounded-full flex items-center justify-center text-[14px] font-bold border-[3px] pointer-events-auto transition-none text-white shadow-[0_8px_16px_rgba(0,0,0,0.18)]";
  const editModeClasses = editMode ? "cursor-move ring-2 ring-yellow-400" : "cursor-pointer";

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    setIsDragging(true);
    const button = e.currentTarget as HTMLElement;
    const container = button.closest('.diagram-container') as HTMLElement | null;
    containerRef.current = container;
    const rect = button.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !editMode || !onDrag) return;
    const parentElement = containerRef.current;
    if (!parentElement) return;
    
    const rect = parentElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * DIAGRAM_WIDTH;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * DIAGRAM_HEIGHT;

    // Clamp values to valid range
    const clampedX = Math.max(20, Math.min(DIAGRAM_WIDTH - 20, x));
    const clampedY = Math.max(20, Math.min(DIAGRAM_HEIGHT - 20, y));

    onDrag(clampedX, clampedY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    containerRef.current = null;
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        containerRef.current = null;
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <Tooltip delayDuration={editMode ? 999999 : 0}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`${marker.label} - ${categoryInfo.label}`}
          className={`${baseClasses} ${editModeClasses}`}
          style={{
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            backgroundColor: categoryInfo.color,
            borderColor: '#ffffff',
            color: '#ffffff',
          }}
          onMouseDown={handleMouseDown}
        >
          {categoryInfo.symbol}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={5}
        className="bg-popover text-popover-foreground border-border shadow-lg max-w-xs z-50"
      >
        <div className="font-semibold text-sm">{marker.label}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {categoryInfo.label}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export const InspectionDiagramPanel: React.FC<InspectionDiagramPanelProps> = ({ 
  outerInspectionData = [],
  className = ""
}) => {
  const { isAdmin } = useAdminCheck();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number; panel: string }>>({});
  const [editedMarkers, setEditedMarkers] = useState<Record<string, { x: number; y: number }>>({});
  
  const { within, out } = mapInspectionToMarkers(outerInspectionData);
  
  // Load custom positions from database
  useEffect(() => {
    const loadCustomPositions = async () => {
      const { data, error } = await supabase
        .from('inspection_marker_positions')
        .select('*');
      
      if (error) {
        console.error('Error loading custom positions:', error);
        return;
      }
      
      if (data) {
        const positions: Record<string, { x: number; y: number; panel: string }> = {};
        data.forEach((pos) => {
          positions[pos.part_key] = {
            x: Number(pos.x),
            y: Number(pos.y),
            panel: pos.panel,
          };
        });
        setCustomPositions(positions);
      }
    };
    
    loadCustomPositions();
  }, []);
  
  // Apply custom positions to markers
  const applyCustomPositions = (markers: DiagramMarker[], panel: 'within' | 'out') => {
    return markers.map((marker) => {
      const key = makeMarkerKey(panel, marker.label);
      const customPos = customPositions[key];
      const editedPos = editedMarkers[key];

      if (editedPos) {
        return { ...marker, x: editedPos.x, y: editedPos.y };
      }
      
      if (customPos && customPos.panel === panel) {
        return { ...marker, x: customPos.x, y: customPos.y };
      }
      
      return marker;
    });
  };
  
  const withinWithCustomPos = applyCustomPositions(within, 'within');
  const outWithCustomPos = applyCustomPositions(out, 'out');
  
  const handleMarkerDrag = (marker: DiagramMarker, panel: 'within' | 'out', x: number, y: number) => {
    const key = makeMarkerKey(panel, marker.label);
    setEditedMarkers(prev => ({
      ...prev,
      [key]: { x, y }
    }));
  };
  
  const handleSavePositions = async () => {
    try {
      const updates = Object.entries(editedMarkers).map(([key, pos]) => {
        const [panel] = key.split('_');
        return {
          part_key: key,
          panel,
          x: pos.x,
          y: pos.y,
        };
      });
      
      for (const update of updates) {
        const { error } = await supabase
          .from('inspection_marker_positions')
          .upsert(update, { onConflict: 'part_key' });
        
        if (error) throw error;
      }
      
      toast({
        title: "Positions saved",
        description: `Updated ${updates.length} marker position(s)`,
      });
      
      setEditedMarkers({});
      setEditMode(false);
      
      // Reload positions
      const { data } = await supabase
        .from('inspection_marker_positions')
        .select('*');
      
      if (data) {
        const positions: Record<string, { x: number; y: number; panel: string }> = {};
        data.forEach((pos) => {
          positions[pos.part_key] = {
            x: Number(pos.x),
            y: Number(pos.y),
            panel: pos.panel,
          };
        });
        setCustomPositions(positions);
      }
    } catch (error) {
      console.error('Error saving positions:', error);
      toast({
        title: "Error",
        description: "Failed to save marker positions",
        variant: "destructive",
      });
    }
  };
  
  const handleCancelEdit = () => {
    setEditedMarkers({});
    setEditMode(false);
  };
  
  const hasAnyMarkers = withinWithCustomPos.length > 0 || outWithCustomPos.length > 0;
  const hasData = outerInspectionData && outerInspectionData.length > 0;

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Admin Edit Controls */}
      {isAdmin && hasAnyMarkers && (
        <div className="bg-muted/50 border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="text-sm font-medium">
            {editMode ? (
              <span className="text-yellow-600 dark:text-yellow-500">
                🖱️ Edit Mode: Drag markers to reposition
              </span>
            ) : (
              <span>Diagram Editor</span>
            )}
          </div>
          <div className="flex gap-2">
            {!editMode ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditMode(true)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Positions
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePositions}
                  disabled={Object.keys(editedMarkers).length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save {Object.keys(editedMarkers).length > 0 && `(${Object.keys(editedMarkers).length})`}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      
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
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-border">
          <div className="text-center py-3 sm:border-r border-border bg-muted/30 font-semibold uppercase tracking-wide text-xs sm:text-sm">
            within
          </div>
          <div className="text-center py-3 bg-muted/30 font-semibold uppercase tracking-wide text-xs sm:text-sm">
            out
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Within panel - interior/side view */}
          <div className="relative border-b lg:border-b-0 lg:border-r border-border p-4 bg-white dark:bg-muted/5">
            <div className="relative mx-auto w-full max-w-[380px] aspect-[640/606] diagram-container">
              <img
                src={carDiagramFront}
                alt="Car side/interior view"
                className="absolute inset-0 w-full h-full object-contain"
              />
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                <TooltipProvider delayDuration={0}>
                  {withinWithCustomPos.map((marker, idx) => (
                    <DiagramMarkerWithTooltip
                      key={`${marker.label}-${idx}`}
                      marker={marker}
                      index={idx}
                      editMode={editMode}
                      onDrag={(x, y) => handleMarkerDrag(marker, 'within', x, y)}
                    />
                  ))}
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Out panel - underside/bottom view */}
          <div className="relative p-4 bg-white dark:bg-muted/5">
            <div className="relative mx-auto w-full max-w-[380px] aspect-[640/606] diagram-container">
              <img
                src={carDiagramBack}
                alt="Car underside/bottom view"
                className="absolute inset-0 w-full h-full object-contain"
              />
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                <TooltipProvider delayDuration={0}>
                  {outWithCustomPos.map((marker, idx) => (
                    <DiagramMarkerWithTooltip
                      key={`${marker.label}-${idx}`}
                      marker={marker}
                      index={idx}
                      editMode={editMode}
                      onDrag={(x, y) => handleMarkerDrag(marker, 'out', x, y)}
                    />
                  ))}
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-border bg-muted/10">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {CATEGORY_ORDER.map((category) => {
              const info = CATEGORY_INFO[category];
              return (
                <div key={category} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ backgroundColor: info.color }}
                  >
                    {info.symbol}
                  </div>
                  <span className="text-[11px] sm:text-sm font-medium whitespace-nowrap">{info.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
  );
};
