import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

interface InspectionItem {
  type: { code: string; title: string };
  statusTypes: Array<{ code: string; title: string }>;
  attributes: string[];
}

interface CarInspectionDiagramProps {
  inspectionData?: InspectionItem[];
  className?: string;
}

interface CarPart {
  id: string;
  name: string;
  nameEn: string;
  path: string;
  labelPos: { x: number; y: number };
}

export const CarInspectionDiagram: React.FC<CarInspectionDiagramProps> = ({ 
  inspectionData = [], 
  className = "" 
}) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  // Enhanced car parts with realistic SVG paths
  const carParts: CarPart[] = [
    // Hood
    {
      id: 'hood',
      name: 'Kapak',
      nameEn: 'Hood',
      path: 'M 180 80 L 320 80 Q 330 80 330 90 L 330 160 Q 330 165 325 165 L 175 165 Q 170 165 170 160 L 170 90 Q 170 80 180 80 Z',
      labelPos: { x: 250, y: 120 }
    },
    // Front Bumper
    {
      id: 'front_bumper',
      name: 'Bamper Para',
      nameEn: 'F. Bumper',
      path: 'M 160 40 L 340 40 Q 350 40 350 50 L 350 75 Q 350 80 340 80 L 160 80 Q 150 80 150 75 L 150 50 Q 150 40 160 40 Z',
      labelPos: { x: 250, y: 58 }
    },
    // Windshield
    {
      id: 'windshield',
      name: 'Xham Para',
      nameEn: 'Windshield',
      path: 'M 185 170 L 315 170 Q 325 170 325 180 L 325 210 L 175 210 Q 170 210 170 205 L 170 180 Q 170 170 185 170 Z',
      labelPos: { x: 250, y: 188 }
    },
    // Left Front Door
    {
      id: 'front_left_door',
      name: 'Derë Para Majtas',
      nameEn: 'L Front Door',
      path: 'M 120 170 L 165 170 L 165 260 L 120 260 Q 115 260 115 255 L 115 175 Q 115 170 120 170 Z',
      labelPos: { x: 140, y: 215 }
    },
    // Right Front Door
    {
      id: 'front_right_door',
      name: 'Derë Para Djathtas',
      nameEn: 'R Front Door',
      path: 'M 335 170 L 385 170 Q 390 170 390 175 L 390 255 Q 390 260 385 260 L 335 260 L 335 170 Z',
      labelPos: { x: 360, y: 215 }
    },
    // Roof
    {
      id: 'roof',
      name: 'Çati',
      nameEn: 'Roof',
      path: 'M 175 215 L 325 215 L 325 315 L 175 315 L 175 215 Z',
      labelPos: { x: 250, y: 265 }
    },
    // Left Rear Door
    {
      id: 'rear_left_door',
      name: 'Derë Prapa Majtas',
      nameEn: 'L Rear Door',
      path: 'M 115 265 L 165 265 L 165 355 L 115 355 Q 110 355 110 350 L 110 270 Q 110 265 115 265 Z',
      labelPos: { x: 138, y: 310 }
    },
    // Right Rear Door
    {
      id: 'rear_right_door',
      name: 'Derë Prapa Djathtas',
      nameEn: 'R Rear Door',
      path: 'M 335 265 L 390 265 Q 395 265 395 270 L 395 350 Q 395 355 390 355 L 335 355 L 335 265 Z',
      labelPos: { x: 362, y: 310 }
    },
    // Rear Glass
    {
      id: 'rear_glass',
      name: 'Xham Prapa',
      nameEn: 'Rear Glass',
      path: 'M 175 320 L 325 320 L 325 355 Q 325 360 315 360 L 185 360 Q 175 360 175 355 L 175 320 Z',
      labelPos: { x: 250, y: 338 }
    },
    // Trunk
    {
      id: 'trunk',
      name: 'Bagazh',
      nameEn: 'Trunk',
      path: 'M 180 365 L 320 365 Q 330 365 330 375 L 330 445 Q 330 450 325 450 L 175 450 Q 170 450 170 445 L 170 375 Q 170 365 180 365 Z',
      labelPos: { x: 250, y: 405 }
    },
    // Rear Bumper
    {
      id: 'rear_bumper',
      name: 'Bamper Prapa',
      nameEn: 'R. Bumper',
      path: 'M 160 455 L 340 455 Q 350 455 350 465 L 350 490 Q 350 500 340 500 L 160 500 Q 150 500 150 490 L 150 465 Q 150 455 160 455 Z',
      labelPos: { x: 250, y: 475 }
    },
    // Left Fender
    {
      id: 'left_fender',
      name: 'Paranicë Majtas',
      nameEn: 'L Fender',
      path: 'M 115 90 L 165 90 L 165 165 L 115 165 Q 110 165 110 160 L 110 95 Q 110 90 115 90 Z',
      labelPos: { x: 135, y: 125 }
    },
    // Right Fender
    {
      id: 'right_fender',
      name: 'Paranicë Djathtas',
      nameEn: 'R Fender',
      path: 'M 335 90 L 390 90 Q 395 90 395 95 L 395 160 Q 395 165 390 165 L 335 165 L 335 90 Z',
      labelPos: { x: 362, y: 125 }
    },
    // Left Quarter Panel
    {
      id: 'left_quarter',
      name: 'Panel Prapa Majtas',
      nameEn: 'L Quarter',
      path: 'M 110 360 L 165 360 L 165 450 L 110 450 Q 105 450 105 445 L 105 365 Q 105 360 110 360 Z',
      labelPos: { x: 135, y: 405 }
    },
    // Right Quarter Panel
    {
      id: 'right_quarter',
      name: 'Panel Prapa Djathtas',
      nameEn: 'R Quarter',
      path: 'M 335 360 L 395 360 Q 400 360 400 365 L 400 445 Q 400 450 395 450 L 335 450 L 335 360 Z',
      labelPos: { x: 365, y: 405 }
    },
  ];

  // Get part status from inspection data
  const getPartStatus = (partId: string) => {
    const part = inspectionData.find(item => {
      const typeTitle = item.type.title.toLowerCase();
      const partIdLower = partId.toLowerCase();
      
      // Direct match
      if (item.type.code === partId || typeTitle.includes(partIdLower)) return true;
      
      // Korean term matching
      if (partIdLower.includes('front') && (typeTitle.includes('앞') || typeTitle.includes('전'))) return true;
      if (partIdLower.includes('rear') && (typeTitle.includes('뒤') || typeTitle.includes('후'))) return true;
      if (partIdLower.includes('left') && typeTitle.includes('좌')) return true;
      if (partIdLower.includes('right') && typeTitle.includes('우')) return true;
      if (partIdLower.includes('door') && typeTitle.includes('도어')) return true;
      if (partIdLower.includes('hood') && typeTitle.includes('후드')) return true;
      if (partIdLower.includes('bumper') && typeTitle.includes('범퍼')) return true;
      if (partIdLower.includes('fender') && typeTitle.includes('펜더')) return true;
      if (partIdLower.includes('quarter') && typeTitle.includes('쿼터')) return true;
      if (partIdLower.includes('trunk') && typeTitle.includes('트렁크')) return true;
      if (partIdLower.includes('windshield') && typeTitle.includes('윈드')) return true;
      if (partIdLower.includes('glass') && typeTitle.includes('유리')) return true;
      if (partIdLower.includes('roof') && typeTitle.includes('루프')) return true;
      
      return false;
    });
    return part?.statusTypes || [];
  };

  const getStatusColor = (statuses: Array<{ code: string; title: string }>) => {
    if (statuses.length === 0) return 'hsl(142 76% 36%)'; // Green
    
    const hasExchange = statuses.some(s => s.code === 'X' || s.title.includes('교환') || s.title.includes('exchange'));
    const hasWelding = statuses.some(s => s.code === 'W' || s.title.includes('용접') || s.title.includes('weld'));
    const hasRepair = statuses.some(s => s.code === 'A' || s.title.includes('수리') || s.title.includes('repair'));
    const hasCorrosion = statuses.some(s => s.code === 'U' || s.title.includes('부식') || s.title.includes('corr'));
    const hasScratch = statuses.some(s => s.code === 'S' || s.title.includes('흠집') || s.title.includes('scratch'));
    
    if (hasExchange) return 'hsl(0 84% 60%)'; // Red
    if (hasWelding) return 'hsl(0 84% 60%)'; // Red
    if (hasRepair) return 'hsl(25 95% 53%)'; // Orange
    if (hasCorrosion) return 'hsl(25 95% 53%)'; // Orange
    if (hasScratch) return 'hsl(48 96% 53%)'; // Yellow
    
    return 'hsl(142 76% 36%)'; // Green
  };

  const getStatusText = (statuses: Array<{ code: string; title: string }>) => {
    if (statuses.length === 0) return 'Pjesë normale';
    
    const hasExchange = statuses.some(s => s.code === 'X');
    const hasWelding = statuses.some(s => s.code === 'W');
    const hasRepair = statuses.some(s => s.code === 'A');
    const hasCorrosion = statuses.some(s => s.code === 'U');
    const hasScratch = statuses.some(s => s.code === 'S');
    
    if (hasExchange) return 'Pjesë e zëvendësuar (E kuqe)';
    if (hasWelding) return 'Saldim i kryer (E kuqe)';
    if (hasRepair) return 'Pjesë e riparuar (Portokalli)';
    if (hasCorrosion) return 'Ndryshk i vogël (Portokalli)';
    if (hasScratch) return 'Gërvishje (E verdhë)';
    
    return 'Pjesë normale';
  };

  // Count issues
  const issueCount = {
    critical: inspectionData.filter(item => 
      item.statusTypes.some(s => ['X', 'W'].includes(s.code))
    ).length,
    major: inspectionData.filter(item => 
      item.statusTypes.some(s => ['A', 'U'].includes(s.code))
    ).length,
    minor: inspectionData.filter(item => 
      item.statusTypes.some(s => s.code === 'S')
    ).length,
    good: carParts.length - inspectionData.length
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Left - Statistics */}
        <div className="space-y-3">
          <Card className="border border-border">
            <CardContent className="p-3 lg:p-4">
              <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2 text-sm lg:text-base">
                <AlertTriangle className="h-4 w-4" />
                Statistika
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
                  <span className="text-xs lg:text-sm flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-destructive" />
                    Kritike
                  </span>
                  <Badge variant="destructive" className="font-mono text-xs">{issueCount.critical}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'hsl(25 95% 53% / 0.1)'}}>
                  <span className="text-xs lg:text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" style={{color: 'hsl(25 95% 53%)'}} />
                    Major
                  </span>
                  <Badge className="font-mono text-xs" style={{backgroundColor: 'hsl(25 95% 53%)', color: 'white'}}>{issueCount.major}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'hsl(48 96% 53% / 0.1)'}}>
                  <span className="text-xs lg:text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" style={{color: 'hsl(48 96% 53%)'}} />
                    Minor
                  </span>
                  <Badge className="font-mono text-xs" style={{backgroundColor: 'hsl(48 96% 53%)', color: 'black'}}>{issueCount.minor}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'hsl(142 76% 36% / 0.1)'}}>
                  <span className="text-xs lg:text-sm flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" style={{color: 'hsl(142 76% 36%)'}} />
                    Mirë
                  </span>
                  <Badge className="font-mono text-xs" style={{backgroundColor: 'hsl(142 76% 36%)', color: 'white'}}>{issueCount.good}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="border border-border">
            <CardContent className="p-3 lg:p-4">
              <h4 className="font-semibold mb-3 text-foreground text-sm lg:text-base">Kodet</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{backgroundColor: 'hsl(0 84% 60%)'}}></div>
                  <span>X - Zëvendësuar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{backgroundColor: 'hsl(0 84% 60%)'}}></div>
                  <span>W - Salduar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{backgroundColor: 'hsl(25 95% 53%)'}}></div>
                  <span>A - Riparuar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{backgroundColor: 'hsl(25 95% 53%)'}}></div>
                  <span>U - Ndryshk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{backgroundColor: 'hsl(48 96% 53%)'}}></div>
                  <span>S - Gërvishje</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{backgroundColor: 'hsl(142 76% 36%)'}}></div>
                  <span>Normal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center - Car Diagram */}
        <div className="lg:col-span-2 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <svg viewBox="0 0 500 540" className="w-full h-auto drop-shadow-lg">
              <defs>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                </filter>
                <linearGradient id="carBg" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: 'hsl(var(--muted))', stopOpacity: 0.2}} />
                  <stop offset="100%" style={{stopColor: 'hsl(var(--muted))', stopOpacity: 0.1}} />
                </linearGradient>
              </defs>
              
              {/* Car base outline */}
              <rect x="95" y="30" width="310" height="480" rx="20" fill="url(#carBg)" stroke="hsl(var(--border))" strokeWidth="2" opacity="0.4" />
              
              {/* Center line */}
              <line x1="250" y1="40" x2="250" y2="510" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4,4" opacity="0.3"/>
              
              {/* Direction indicators */}
              <g>
                <polygon points="250,20 260,35 240,35" fill="hsl(var(--primary))" opacity="0.6"/>
                <text x="265" y="30" className="text-[10px] font-medium fill-foreground">Front</text>
              </g>
              <g>
                <polygon points="250,520 240,505 260,505" fill="hsl(var(--muted-foreground))" opacity="0.4"/>
                <text x="265" y="518" className="text-[10px] fill-muted-foreground">Rear</text>
              </g>
              
              {/* Render all parts */}
              {carParts.map((part) => {
                const statuses = getPartStatus(part.id);
                const color = getStatusColor(statuses);
                const isHovered = hoveredPart === part.id;
                const isSelected = selectedPart === part.id;
                
                return (
                  <g key={part.id}>
                    <path
                      d={part.path}
                      fill={color}
                      fillOpacity={isHovered || isSelected ? 0.95 : 0.85}
                      stroke={isSelected ? "hsl(var(--primary))" : isHovered ? "hsl(var(--foreground))" : "hsl(var(--border))"}
                      strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                      className="cursor-pointer transition-all duration-200"
                      filter={isHovered || isSelected ? "url(#shadow)" : "none"}
                      onMouseEnter={() => setHoveredPart(part.id)}
                      onMouseLeave={() => setHoveredPart(null)}
                      onClick={() => setSelectedPart(selectedPart === part.id ? null : part.id)}
                      style={{
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        transformOrigin: `${part.labelPos.x}px ${part.labelPos.y}px`,
                      }}
                    />
                    {(isHovered || isSelected) && (
                      <text
                        x={part.labelPos.x}
                        y={part.labelPos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[9px] font-semibold pointer-events-none"
                        fill="hsl(var(--background))"
                        stroke="hsl(var(--foreground))"
                        strokeWidth="0.5"
                      >
                        {part.nameEn}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            
            {hoveredPart && !selectedPart && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-foreground/90 text-background px-3 py-1.5 rounded-lg text-xs shadow-lg backdrop-blur-sm">
                Kliko për detaje
              </div>
            )}
          </div>
        </div>

        {/* Right - Details */}
        <div className="space-y-3">
          {selectedPart ? (
            <Card className="border border-primary/50 bg-primary/5 animate-in slide-in-from-right-2 duration-200">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground text-sm lg:text-base">
                    {carParts.find(p => p.id === selectedPart)?.name}
                  </h4>
                  <button
                    onClick={() => setSelectedPart(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                {(() => {
                  const statuses = getPartStatus(selectedPart);
                  if (statuses.length === 0) {
                    return (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4" style={{color: 'hsl(142 76% 36%)'}} />
                        <span className="text-muted-foreground">Pjesë normale</span>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {statuses.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Badge variant="outline" className="font-mono text-xs">{s.code}</Badge>
                            <span className="text-xs text-muted-foreground">{s.title}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t text-xs text-muted-foreground flex items-start gap-2">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{getStatusText(statuses)}</span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border">
              <CardContent className="p-4 text-center">
                <p className="text-xs lg:text-sm text-muted-foreground">
                  Kliko një pjesë për detaje
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarInspectionDiagram;
