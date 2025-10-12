import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface InspectionItem {
  type: { code: string; title: string };
  statusTypes: Array<{ code: string; title: string }>;
  attributes: string[];
}

interface CarInspectionDiagramProps {
  inspectionData?: InspectionItem[];
  className?: string;
  backgroundImageUrl?: string; // Optional custom background diagram
}

interface CarPart {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  path?: string;
}

export const CarInspectionDiagram: React.FC<CarInspectionDiagramProps> = ({ 
  inspectionData = [], 
  className = "",
  backgroundImageUrl
}) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  // Define car parts with their positions in the SVG
  const carParts: CarPart[] = [
    // Front section
    { id: 'front_bumper', name: 'Bamper i përparmë', x: 220, y: 50, width: 160, height: 25, rx: 12 },
    { id: 'hood', name: 'Kapaku i motorit', x: 240, y: 75, width: 120, height: 60, rx: 8 },
    { id: 'windshield', name: 'Xhami i përparmë', x: 250, y: 135, width: 100, height: 50, rx: 5 },
    { id: 'front_left_fender', name: 'Parafango i majtë', x: 180, y: 85, width: 35, height: 85, rx: 8 },
    { id: 'front_right_fender', name: 'Parafango i djathtë', x: 385, y: 85, width: 35, height: 85, rx: 8 },
    
    // Doors and sides
    { id: 'front_left_door', name: 'Dera e përparme e majtë', x: 180, y: 185, width: 25, height: 80, rx: 5 },
    { id: 'rear_left_door', name: 'Dera e pasme e majtë', x: 180, y: 265, width: 25, height: 80, rx: 5 },
    { id: 'front_right_door', name: 'Dera e përparme e djathtë', x: 395, y: 185, width: 25, height: 80, rx: 5 },
    { id: 'rear_right_door', name: 'Dera e pasme e djathtë', x: 395, y: 265, width: 25, height: 80, rx: 5 },
    { id: 'left_a_pillar', name: 'A-pillar majtas', x: 235, y: 165, width: 10, height: 40, rx: 4 },
    { id: 'left_b_pillar', name: 'B-pillar majtas', x: 235, y: 225, width: 10, height: 60, rx: 4 },
    { id: 'left_c_pillar', name: 'C-pillar majtas', x: 235, y: 305, width: 10, height: 40, rx: 4 },
    { id: 'right_a_pillar', name: 'A-pillar djathtas', x: 355, y: 165, width: 10, height: 40, rx: 4 },
    { id: 'right_b_pillar', name: 'B-pillar djathtas', x: 355, y: 225, width: 10, height: 60, rx: 4 },
    { id: 'right_c_pillar', name: 'C-pillar djathtas', x: 355, y: 305, width: 10, height: 40, rx: 4 },
    
    // Roof and pillars
    { id: 'roof', name: 'Çatia', x: 250, y: 185, width: 100, height: 160, rx: 8 },
    
    // Rear section
    { id: 'rear_windshield', name: 'Xhami i pasëm', x: 250, y: 345, width: 100, height: 40, rx: 5 },
    { id: 'trunk', name: 'Bagazhi', x: 240, y: 385, width: 120, height: 50, rx: 8 },
    { id: 'rear_bumper', name: 'Bamper i pasëm', x: 220, y: 435, width: 160, height: 25, rx: 12 },
    { id: 'left_quarter_panel', name: 'Quarter panel majtas', x: 200, y: 305, width: 35, height: 60, rx: 8 },
    { id: 'right_quarter_panel', name: 'Quarter panel djathtas', x: 365, y: 305, width: 35, height: 60, rx: 8 },
    
    // Wheels
    { id: 'front_left_wheel', name: 'Rrota e përparme e majtë', x: 200, y: 120, width: 40, height: 40, rx: 20 },
    { id: 'front_right_wheel', name: 'Rrota e përparme e djathtë', x: 360, y: 120, width: 40, height: 40, rx: 20 },
    { id: 'rear_left_wheel', name: 'Rrota e pasme e majtë', x: 200, y: 380, width: 40, height: 40, rx: 20 },
    { id: 'rear_right_wheel', name: 'Rrota e pasme e djathtë', x: 360, y: 380, width: 40, height: 40, rx: 20 },
    
    // Side panels
    { id: 'left_side_panel', name: 'Paneli i majtë', x: 205, y: 185, width: 45, height: 160, rx: 8 },
    { id: 'right_side_panel', name: 'Paneli i djathtë', x: 350, y: 185, width: 45, height: 160, rx: 8 },
  ];

  // Map Korean/English part names to our internal part IDs and read inspection data
  const getPartStatus = (partId: string) => {
    const normalize = (s: string) => s.toLowerCase().trim();
    const titleIncludes = (t: string, ...needles: string[]) => needles.some(n => t.includes(n));
    const part = inspectionData.find(item => {
      const title = item.type.title || "";
      const code = item.type.code || "";
      const t = normalize(title);
      const c = normalize(code);
      if (c === partId) return true;
      if (t.includes(partId.replace(/_/g, ' '))) return true;
      // Language-aware mappings
      switch (partId) {
        case 'front_bumper': return titleIncludes(t, 'front bumper') || title.includes('앞') && title.includes('범퍼');
        case 'rear_bumper': return titleIncludes(t, 'rear bumper') || title.includes('뒤') && title.includes('범퍼');
        case 'hood': return titleIncludes(t, 'hood', 'bonnet') || title.includes('후드');
        case 'trunk': return titleIncludes(t, 'trunk', 'tailgate', 'boot') || title.includes('트렁크');
        case 'windshield': return titleIncludes(t, 'windshield', 'front glass') || title.includes('앞유리');
        case 'rear_windshield': return titleIncludes(t, 'rear glass', 'back glass') || title.includes('뒷유리');
        case 'front_left_door': return titleIncludes(t, 'front left door') || (title.includes('앞') && title.includes('좌') && title.includes('도어'));
        case 'rear_left_door': return titleIncludes(t, 'rear left door') || (title.includes('뒤') && title.includes('좌') && title.includes('도어'));
        case 'front_right_door': return titleIncludes(t, 'front right door') || (title.includes('앞') && title.includes('우') && title.includes('도어'));
        case 'rear_right_door': return titleIncludes(t, 'rear right door') || (title.includes('뒤') && title.includes('우') && title.includes('도어'));
        case 'front_left_fender': return titleIncludes(t, 'front left fender') || (title.includes('앞') && titleIncludes(title, '좌', '휀다', '펜더'));
        case 'front_right_fender': return titleIncludes(t, 'front right fender') || (title.includes('앞') && titleIncludes(title, '우', '휀다', '펜더'));
        case 'left_quarter_panel': return titleIncludes(t, 'left quarter', 'left quarter panel') || (titleIncludes(title, '좌', '쿼터'));
        case 'right_quarter_panel': return titleIncludes(t, 'right quarter', 'right quarter panel') || (titleIncludes(title, '우', '쿼터'));
        case 'left_a_pillar': return titleIncludes(t, 'a pillar left') || (title.includes('a') && title.includes('필러') && title.includes('좌'));
        case 'left_b_pillar': return titleIncludes(t, 'b pillar left') || (title.includes('b') && title.includes('필러') && title.includes('좌'));
        case 'left_c_pillar': return titleIncludes(t, 'c pillar left') || (title.includes('c') && title.includes('필러') && title.includes('좌'));
        case 'right_a_pillar': return titleIncludes(t, 'a pillar right') || (title.includes('a') && title.includes('필러') && title.includes('우'));
        case 'right_b_pillar': return titleIncludes(t, 'b pillar right') || (title.includes('b') && title.includes('필러') && title.includes('우'));
        case 'right_c_pillar': return titleIncludes(t, 'c pillar right') || (title.includes('c') && title.includes('필러') && title.includes('우'));
        case 'roof': return titleIncludes(t, 'roof') || title.includes('루프');
        case 'left_side_panel': return titleIncludes(t, 'left side', 'left side panel');
        case 'right_side_panel': return titleIncludes(t, 'right side', 'right side panel');
        default: return false;
      }
    });
    return part?.statusTypes || [];
  };

  const getStatusColor = (statuses: Array<{ code: string; title: string }>) => {
    if (statuses.length === 0) return '#10b981'; // Default green for good condition
    
    // Check for different damage types with priority
    const hasExchange = statuses.some(s => s.code === 'X' || s.title.includes('교환') || s.title.includes('exchange'));
    const hasWelding = statuses.some(s => s.code === 'W' || s.title.includes('용접') || s.title.includes('weld'));
    const hasRepair = statuses.some(s => s.code === 'A' || s.title.includes('수리') || s.title.includes('repair'));
    const hasSheetMetal = statuses.some(s => s.code === 'C' || s.title.includes('판금') || s.title.includes('sheet'));
    
    // Red for exchange/replacement - highest priority (as required)
    if (hasExchange) return '#dc2626'; // Bright red for replaced parts
    // Orange for welding/major repair 
    if (hasWelding) return '#ea580c'; // Orange for major repairs
    // Orange for general repair (as required - changed from yellow)
    if (hasRepair) return '#ea580c'; // Orange for repaired parts
    // Amber for sheet metal work
    if (hasSheetMetal) return '#d97706'; // Amber for moderate repairs
    
    return '#10b981'; // Green for good condition
  };

  const getStatusText = (statuses: Array<{ code: string; title: string }>) => {
    if (statuses.length === 0) return 'Në gjendje të mirë';
    
    const hasExchange = statuses.some(s => s.code === 'X' || s.title.includes('교환') || s.title.includes('exchange'));
    const hasWelding = statuses.some(s => s.code === 'W' || s.title.includes('용접') || s.title.includes('weld'));
    const hasRepair = statuses.some(s => s.code === 'A' || s.title.includes('수리') || s.title.includes('repair'));
    const hasSheetMetal = statuses.some(s => s.code === 'C' || s.title.includes('판금') || s.title.includes('sheet'));
    
    if (hasExchange) return 'Pjesa e zëvendësuar (e kuqe)';
    if (hasWelding) return 'Saldim / riparim strukturor (portokalli)';
    if (hasSheetMetal) return 'Punime llamarine (kafe)';
    if (hasRepair) return 'E riparuar (portokalli)';
    
    return 'Në gjendje të mirë';
  };

  // Count issues by type
  const issueCount = {
    critical: inspectionData.filter(item => 
      item.statusTypes.some(s => s.code === 'X' || s.title.includes('교환') || s.title.includes('exchange'))
    ).length,
    major: inspectionData.filter(item => 
      item.statusTypes.some(s => s.code === 'W' || s.title.includes('용접') || s.title.includes('weld'))
    ).length,
    minor: inspectionData.filter(item => 
      item.statusTypes.some(s => s.code === 'A' || s.title.includes('수리') || s.title.includes('repair'))
    ).length,
    good: inspectionData.filter(item => 
      !item.statusTypes.some(s => s.code === 'X' || s.code === 'W' || s.code === 'A')
    ).length
  };

  const handlePartHover = (partId: string | null) => {
    setHoveredPart(partId);
  };

  const handlePartClick = (partId: string) => {
    setSelectedPart(selectedPart === partId ? null : partId);
  };

  return (
    <div className={`w-full max-w-6xl mx-auto p-6 bg-card border border-border rounded-2xl shadow-lg inspection-section-black ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-3 inspection-text-black">Diagrami i Inspektimit të Automjetit</h3>
        <p className="text-muted-foreground">Kliko mbi pjesët e makinës për më shumë detaje</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side - Statistics */}
        <div className="space-y-4">
          {selectedPart && (
            <>
              <h4 className="text-lg font-semibold text-foreground mb-4">Përmbledhje e Gjendjes</h4>
              
              {/* Overall Status */}
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  {issueCount.critical > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-destructive rounded-full"></div>
                      <div>
                        <div className="font-semibold text-destructive">Gjendja</div>
                        <div className="text-sm text-muted-foreground">Ka pjesë të zëvendësuara (të kuqe)</div>
                      </div>
                    </div>
                  ) : issueCount.major > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <div>
                        <div className="font-semibold text-orange-700 dark:text-orange-400">RIPARIME</div>
                        <div className="text-sm text-muted-foreground">riparime</div>
                      </div>
                    </div>
                  ) : issueCount.minor > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <div>
                        <div className="font-semibold text-orange-700 dark:text-orange-400">RIPARIME</div>
                        <div className="text-sm text-muted-foreground">Disa pjesë janë riparuar (portokalli)</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-semibold text-green-700 dark:text-green-400">Gjendje e Shkëlqyer</div>
                        <div className="text-sm text-muted-foreground">Automjeti në gjendje perfekte</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Stats Cards - Removed as per requirements */}

          {/* Legend */}
          <Card>
            <CardContent className="p-4">
              <h5 className="text-sm font-semibold text-foreground mb-3">Legjenda e Ngjyrave</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🟢</span>
                  <span className="text-sm text-muted-foreground">Green parts: Components in good condition</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">🟠</span>
                  <span className="text-sm text-muted-foreground">Orange parts: Components that have been repaired</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔴</span>
                  <span className="text-sm text-muted-foreground">Red parts: Components that have been completely replaced</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center - Car Diagram */}
        <div className="lg:col-span-2 flex justify-center">
          <div className="relative w-full max-w-2xl">
              <svg 
              width="100%" 
              height="500" 
              viewBox="0 0 600 500" 
              className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-2xl"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Optional custom background */}
              {backgroundImageUrl ? (
                <image href={backgroundImageUrl} x="0" y="0" width="600" height="500" preserveAspectRatio="xMidYMid meet" opacity="0.95" />
              ) : (
                <>
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.2"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </>
              )}
              
              {/* Car shadow */}
              <ellipse cx="300" cy="470" rx="120" ry="20" fill="rgba(0,0,0,0.1)" />
              
              {/* Car main outline if no background provided */}
              {!backgroundImageUrl && (
                <path 
                  d="M 220 60 L 380 60 Q 390 60 390 70 L 390 430 Q 390 440 380 440 L 220 440 Q 210 440 210 430 L 210 70 Q 210 60 220 60 Z" 
                  fill="none" 
                  stroke="hsl(var(--border))" 
                  strokeWidth="3" 
                  strokeDasharray="8,4"
                  opacity="0.6"
                />
              )}
              
              {/* Car parts with improved positioning */}
              {carParts.map((part) => {
                const statuses = getPartStatus(part.id);
                const color = getStatusColor(statuses);
                const isHovered = hoveredPart === part.id;
                const isSelected = selectedPart === part.id;
                
                return (
                  <g key={part.id}>
                    {/* Part shadow for depth */}
                    <rect
                      x={part.x + 2}
                      y={part.y + 2}
                      width={part.width}
                      height={part.height}
                      rx={part.rx || 0}
                      fill="rgba(0,0,0,0.1)"
                      opacity="0.3"
                    />
                    {/* Main part */}
                    <rect
                      x={part.x}
                      y={part.y}
                      width={part.width}
                      height={part.height}
                      rx={part.rx || 0}
                      fill={color}
                      stroke={isSelected ? "hsl(var(--foreground))" : isHovered ? "hsl(var(--ring))" : "white"}
                      strokeWidth={isSelected ? 4 : isHovered ? 3 : 2}
                      opacity={isHovered || isSelected ? 0.95 : 0.8}
                      className="cursor-pointer transition-all duration-300 hover:opacity-95 drop-shadow-sm"
                      onMouseEnter={() => handlePartHover(part.id)}
                      onMouseLeave={() => handlePartHover(null)}
                      onClick={() => handlePartClick(part.id)}
                    />
                    {/* Part label for better identification */}
                    {(isHovered || isSelected) && (
                      <text
                        x={part.x + part.width / 2}
                        y={part.y + part.height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="8"
                        fill="white"
                        fontWeight="bold"
                        className="pointer-events-none drop-shadow-sm"
                      >
                        {part.name.split(' ')[0]}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Enhanced center line (only if no background) */}
              {!backgroundImageUrl && (
                <line x1="300" y1="60" x2="300" y2="440" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="6,4" opacity="0.4"/>
              )}
              
              {/* Direction indicators (hidden when background provided) */}
              {!backgroundImageUrl && (
                <>
                  <g>
                    <polygon points="300,35 315,55 285,55" fill="hsl(var(--primary))" opacity="0.8"/>
                    <text x="325" y="50" className="text-sm font-semibold fill-primary" fontSize="14">Përpara</text>
                  </g>
                  <g>
                    <polygon points="300,465 285,445 315,445" fill="hsl(var(--muted-foreground))" opacity="0.6"/>
                    <text x="325" y="460" className="text-sm fill-muted-foreground" fontSize="12">Prapa</text>
                  </g>
                </>
              )}
              
              {/* Car brand/model placeholder (hide when background provided) */}
              {!backgroundImageUrl && (
                <text x="300" y="250" textAnchor="middle" className="text-xs fill-muted-foreground" fontSize="10" opacity="0.5">
                  Model Automjeti
                </text>
              )}
            </svg>
            
            {/* Enhanced hover tooltip */}
            {hoveredPart && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-4 py-3 rounded-xl text-sm shadow-xl z-10 border border-border">
                <div className="font-semibold">{carParts.find(p => p.id === hoveredPart)?.name}</div>
                <div className="text-xs opacity-90 mt-1">
                  {getStatusText(getPartStatus(hoveredPart))}
                </div>
                <div className="text-xs opacity-70 mt-1">Kliko për detaje të plota</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected part details */}
      {selectedPart && (
        <Card className="mt-6 border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="font-semibold text-foreground mb-2">
                  {carParts.find(p => p.id === selectedPart)?.name}
                </h5>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getStatusColor(getPartStatus(selectedPart)) }}
                    ></div>
                    <span className="text-sm text-muted-foreground">
                      {getStatusText(getPartStatus(selectedPart))}
                    </span>
                  </div>
                  {getPartStatus(selectedPart).length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm text-muted-foreground mb-1">Detaje:</div>
                      <div className="flex flex-wrap gap-1">
                        {getPartStatus(selectedPart).map((status, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {status.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedPart(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data message */}
      {inspectionData.length === 0 && (
        <Card className="mt-6 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-blue-500 dark:text-blue-400 text-3xl">🔍</span>
            </div>
            <h4 className="text-xl font-bold text-foreground mb-3">Nuk ka të dhëna inspektimi disponibla</h4>
            <p className="text-muted-foreground max-w-md mx-auto">
              Diagrami do të shfaqë gjendjen e pjesëve të automjetit kur të disponohen të dhënat e inspektimit.
            </p>
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-lg mx-auto">
              <h5 className="font-semibold text-foreground mb-2">Kodi i ngjyrave:</h5>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span>🟢</span>
                  <span>Green parts: Components in good condition</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🟠</span>
                  <span>Orange parts: Components that have been repaired</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🔴</span>
                  <span>Red parts: Components that have been completely replaced</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CarInspectionDiagram;