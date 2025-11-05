import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import carDiagramTop from '@/assets/car-diagram-top.jpeg';
import carDiagramBottom from '@/assets/car-diagram-bottom.webp';

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

  // Enhanced car parts mapped to the actual diagram image positions
  const carParts: CarPart[] = [
    // Hood (top center of car)
    {
      id: 'hood',
      name: 'Kapak',
      nameEn: 'Hood',
      path: 'M 240 60 L 400 60 Q 410 60 410 70 L 410 180 Q 410 190 400 190 L 240 190 Q 230 190 230 180 L 230 70 Q 230 60 240 60 Z',
      labelPos: { x: 320, y: 120 }
    },
    // Front Bumper
    {
      id: 'front_bumper',
      name: 'Bamper Para',
      nameEn: 'F. Bumper',
      path: 'M 220 20 L 420 20 Q 435 20 435 35 L 435 55 Q 435 60 420 60 L 220 60 Q 205 60 205 55 L 205 35 Q 205 20 220 20 Z',
      labelPos: { x: 320, y: 40 }
    },
    // Windshield
    {
      id: 'windshield',
      name: 'Xham Para',
      nameEn: 'Windshield',
      path: 'M 250 195 L 390 195 Q 400 195 400 205 L 400 235 L 250 235 Q 240 235 240 225 L 240 205 Q 240 195 250 195 Z',
      labelPos: { x: 320, y: 215 }
    },
    // Left Front Door
    {
      id: 'front_left_door',
      name: 'Derë Para Majtas',
      nameEn: 'L Front',
      path: 'M 150 195 L 235 195 L 235 310 L 150 310 Q 140 310 140 300 L 140 205 Q 140 195 150 195 Z',
      labelPos: { x: 185, y: 250 }
    },
    // Right Front Door
    {
      id: 'front_right_door',
      name: 'Derë Para Djathtas',
      nameEn: 'R Front',
      path: 'M 405 195 L 495 195 Q 505 195 505 205 L 505 300 Q 505 310 495 310 L 405 310 L 405 195 Z',
      labelPos: { x: 450, y: 250 }
    },
    // Roof
    {
      id: 'roof',
      name: 'Çati',
      nameEn: 'Roof',
      path: 'M 245 240 L 395 240 L 395 370 L 245 370 L 245 240 Z',
      labelPos: { x: 320, y: 305 }
    },
    // Left Rear Door
    {
      id: 'rear_left_door',
      name: 'Derë Prapa Majtas',
      nameEn: 'L Rear',
      path: 'M 140 315 L 235 315 L 235 430 L 140 430 Q 130 430 130 420 L 130 325 Q 130 315 140 315 Z',
      labelPos: { x: 185, y: 370 }
    },
    // Right Rear Door
    {
      id: 'rear_right_door',
      name: 'Derë Prapa Djathtas',
      nameEn: 'R Rear',
      path: 'M 405 315 L 510 315 Q 520 315 520 325 L 520 420 Q 520 430 510 430 L 405 430 L 405 315 Z',
      labelPos: { x: 455, y: 370 }
    },
    // Rear Glass
    {
      id: 'rear_glass',
      name: 'Xham Prapa',
      nameEn: 'R. Glass',
      path: 'M 245 375 L 395 375 L 395 415 Q 395 425 385 425 L 255 425 Q 245 425 245 415 L 245 375 Z',
      labelPos: { x: 320, y: 400 }
    },
    // Trunk
    {
      id: 'trunk',
      name: 'Bagazh',
      nameEn: 'Trunk',
      path: 'M 240 430 L 400 430 Q 410 430 410 440 L 410 540 Q 410 550 400 550 L 240 550 Q 230 550 230 540 L 230 440 Q 230 430 240 430 Z',
      labelPos: { x: 320, y: 485 }
    },
    // Rear Bumper
    {
      id: 'rear_bumper',
      name: 'Bamper Prapa',
      nameEn: 'R. Bumper',
      path: 'M 220 555 L 420 555 Q 435 555 435 570 L 435 590 Q 435 605 420 605 L 220 605 Q 205 605 205 590 L 205 570 Q 205 555 220 555 Z',
      labelPos: { x: 320, y: 580 }
    },
    // Left Front Fender
    {
      id: 'left_fender',
      name: 'Paranicë Majtas',
      nameEn: 'L Fender',
      path: 'M 140 70 L 225 70 L 225 185 L 140 185 Q 130 185 130 175 L 130 80 Q 130 70 140 70 Z',
      labelPos: { x: 175, y: 125 }
    },
    // Right Front Fender
    {
      id: 'right_fender',
      name: 'Paranicë Djathtas',
      nameEn: 'R Fender',
      path: 'M 415 70 L 510 70 Q 520 70 520 80 L 520 175 Q 520 185 510 185 L 415 185 L 415 70 Z',
      labelPos: { x: 465, y: 125 }
    },
    // Left Quarter Panel
    {
      id: 'left_quarter',
      name: 'Panel Prapa Majtas',
      nameEn: 'L Quarter',
      path: 'M 130 435 L 225 435 L 225 545 L 130 545 Q 120 545 120 535 L 120 445 Q 120 435 130 435 Z',
      labelPos: { x: 170, y: 490 }
    },
    // Right Quarter Panel
    {
      id: 'right_quarter',
      name: 'Panel Prapa Djathtas',
      nameEn: 'R Quarter',
      path: 'M 415 435 L 520 435 Q 530 435 530 445 L 530 535 Q 530 545 520 545 L 415 545 L 415 435 Z',
      labelPos: { x: 470, y: 490 }
    },
    // Front Left Wheel
    {
      id: 'fl_wheel',
      name: 'Rrota Para Majtas',
      nameEn: 'FL Wheel',
      path: 'M 30 90 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0',
      labelPos: { x: 30, y: 90 }
    },
    // Front Right Wheel
    {
      id: 'fr_wheel',
      name: 'Rrota Para Djathtas',
      nameEn: 'FR Wheel',
      path: 'M 610 90 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0',
      labelPos: { x: 610, y: 90 }
    },
    // Rear Left Wheel
    {
      id: 'rl_wheel',
      name: 'Rrota Prapa Majtas',
      nameEn: 'RL Wheel',
      path: 'M 30 510 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0',
      labelPos: { x: 30, y: 510 }
    },
    // Rear Right Wheel
    {
      id: 'rr_wheel',
      name: 'Rrota Prapa Djathtas',
      nameEn: 'RR Wheel',
      path: 'M 610 510 m -25, 0 a 25,25 0 1,0 50,0 a 25,25 0 1,0 -50,0',
      labelPos: { x: 610, y: 510 }
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

  const hasExchange = statuses.some(
    (s) => s.code === 'X' || s.title.includes('교환') || s.title.includes('exchange')
  );
  const hasWelding = statuses.some(
    (s) => s.code === 'W' || s.title.includes('용접') || s.title.includes('weld')
  );
  const hasRepair = statuses.some(
    (s) => s.code === 'A' || s.title.includes('수리') || s.title.includes('repair')
  );
  const hasCorrosion = statuses.some(
    (s) => s.code === 'U' || s.title.includes('부식') || s.title.includes('corr')
  );
  const hasScratch = statuses.some(
    (s) => s.code === 'S' || s.title.includes('흠집') || s.title.includes('scratch')
  );

  if (hasExchange) return 'hsl(0 84% 60%)'; // Red for replaced parts
  if (hasWelding) return 'hsl(217 91% 60%)'; // Blue for welded parts
  if (hasRepair) return 'hsl(25 95% 53%)'; // Orange
  if (hasCorrosion) return 'hsl(25 95% 53%)'; // Orange
  if (hasScratch) return 'hsl(48 96% 53%)'; // Yellow

  return 'hsl(142 76% 36%)'; // Green
};

const getStatusText = (statuses: Array<{ code: string; title: string }>) => {
  if (statuses.length === 0) return 'Pjesë normale';

  const hasExchange = statuses.some((s) => s.code === 'X');
  const hasWelding = statuses.some((s) => s.code === 'W');
  const hasRepair = statuses.some((s) => s.code === 'A');
  const hasCorrosion = statuses.some((s) => s.code === 'U');
  const hasScratch = statuses.some((s) => s.code === 'S');

  if (hasExchange) return 'Pjesë e zëvendësuar (Rreth i kuq)';
  if (hasWelding) return 'Saldim i kryer (Rreth blu)';
  if (hasRepair) return 'Pjesë e riparuar (Rreth portokalli)';
  if (hasCorrosion) return 'Ndryshk i vogël (Rreth portokalli)';
  if (hasScratch) return 'Gërvishje (Rreth i verdhë)';

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
          Zevendesuara
                  </span>
                  <Badge variant="destructive" className="font-mono text-xs">{issueCount.critical}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'hsl(25 95% 53% / 0.1)'}}>
                  <span className="text-xs lg:text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" style={{color: 'hsl(25 95% 53%)'}} />
          Riparuara
                  </span>
                  <Badge className="font-mono text-xs" style={{backgroundColor: 'hsl(25 95% 53%)', color: 'white'}}>{issueCount.major}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'hsl(48 96% 53% / 0.1)'}}>
                  <span className="text-xs lg:text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" style={{color: 'hsl(48 96% 53%)'}} />
          Gervishje
                  </span>
                  <Badge className="font-mono text-xs" style={{backgroundColor: 'hsl(48 96% 53%)', color: 'black'}}>{issueCount.minor}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'hsl(142 76% 36% / 0.1)'}}>
                  <span className="text-xs lg:text-sm flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" style={{color: 'hsl(142 76% 36%)'}} />
          Mire
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
                {[{
                  code: 'X',
                  label: 'Zëvendësuar',
                  color: 'hsl(0 84% 60%)',
                  textColor: 'white'
                }, {
                  code: 'W',
                  label: 'Salduar',
                  color: 'hsl(217 91% 60%)',
                  textColor: 'white'
                }, {
                  code: 'A',
                  label: 'Riparuar',
                  color: 'hsl(25 95% 53%)',
                  textColor: 'white'
                }, {
                  code: 'U',
                  label: 'Ndryshk',
                  color: 'hsl(25 95% 53%)',
                  textColor: 'white'
                }, {
                  code: 'S',
                  label: 'Gërvishje',
                  color: 'hsl(48 96% 53%)',
                  textColor: 'black'
                }, {
                  code: '',
                  label: 'Normal',
                  color: 'hsl(142 76% 36%)',
                  textColor: 'white'
                }].map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold"
                      style={{ backgroundColor: item.color, color: item.textColor }}
                    >
                      {item.code || '•'}
                    </div>
                    <span>
                      {item.code ? `${item.code} - ${item.label}` : item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center - Car Diagram */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-4 p-4">
          <div className="relative w-full max-w-md">
            <img src={carDiagramTop} alt="Car Top View" className="w-full h-auto rounded-lg" />
            <svg viewBox="0 0 640 630" className="absolute inset-0 w-full h-full"  style={{pointerEvents: 'none'}}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* Render clickable overlay parts */}
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
                      fillOpacity={statuses.length > 0 ? (isHovered || isSelected ? 0.7 : 0.5) : 0}
                      stroke={isSelected ? "hsl(var(--primary))" : statuses.length > 0 ? color : "transparent"}
                      strokeWidth={isSelected ? 4 : statuses.length > 0 ? 3 : 0}
                      className="cursor-pointer transition-all duration-200"
                      filter={statuses.length > 0 && (isHovered || isSelected) ? "url(#glow)" : "none"}
                      onMouseEnter={() => setHoveredPart(part.id)}
                      onMouseLeave={() => setHoveredPart(null)}
                      onClick={() => setSelectedPart(selectedPart === part.id ? null : part.id)}
                      style={{
                        pointerEvents: 'auto',
                        mixBlendMode: statuses.length > 0 ? 'multiply' : 'normal'
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
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-foreground/90 text-background px-3 py-1.5 rounded-lg text-xs shadow-lg backdrop-blur-sm z-10">
                {carParts.find(p => p.id === hoveredPart)?.name} - Kliko për detaje
              </div>
            )}
          </div>
          
          {/* Bottom view diagram */}
          <div className="relative w-full max-w-md">
            <img src={carDiagramBottom} alt="Car Bottom View" className="w-full h-auto rounded-lg" />
            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
              Pamja nga poshtë
            </div>
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
