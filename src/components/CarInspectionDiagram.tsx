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
  className = "" 
}) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  // Define car parts with their positions in the SVG
  const carParts: CarPart[] = [
    // Front section
    { id: 'front_bumper', name: 'Bamper i përparmë', x: 220, y: 50, width: 160, height: 25, rx: 12 },
    { id: 'hood', name: 'Kapaku i motorit', x: 240, y: 75, width: 120, height: 60, rx: 8 },
    { id: 'windshield', name: 'Xhami i përparmë', x: 250, y: 135, width: 100, height: 50, rx: 5 },
    
    // Doors and sides
    { id: 'front_left_door', name: 'Dera e përparme e majtë', x: 180, y: 185, width: 25, height: 80, rx: 5 },
    { id: 'rear_left_door', name: 'Dera e pasme e majtë', x: 180, y: 265, width: 25, height: 80, rx: 5 },
    { id: 'front_right_door', name: 'Dera e përparme e djathtë', x: 395, y: 185, width: 25, height: 80, rx: 5 },
    { id: 'rear_right_door', name: 'Dera e pasme e djathtë', x: 395, y: 265, width: 25, height: 80, rx: 5 },
    
    // Roof and pillars
    { id: 'roof', name: 'Çatia', x: 250, y: 185, width: 100, height: 160, rx: 8 },
    
    // Rear section
    { id: 'rear_windshield', name: 'Xhami i pasëm', x: 250, y: 345, width: 100, height: 40, rx: 5 },
    { id: 'trunk', name: 'Bagazhi', x: 240, y: 385, width: 120, height: 50, rx: 8 },
    { id: 'rear_bumper', name: 'Bamper i pasëm', x: 220, y: 435, width: 160, height: 25, rx: 12 },
    
    // Wheels
    { id: 'front_left_wheel', name: 'Rrota e përparme e majtë', x: 200, y: 120, width: 40, height: 40, rx: 20 },
    { id: 'front_right_wheel', name: 'Rrota e përparme e djathtë', x: 360, y: 120, width: 40, height: 40, rx: 20 },
    { id: 'rear_left_wheel', name: 'Rrota e pasme e majtë', x: 200, y: 380, width: 40, height: 40, rx: 20 },
    { id: 'rear_right_wheel', name: 'Rrota e pasme e djathtë', x: 360, y: 380, width: 40, height: 40, rx: 20 },
    
    // Side panels
    { id: 'left_side_panel', name: 'Paneli i majtë', x: 205, y: 185, width: 45, height: 160, rx: 8 },
    { id: 'right_side_panel', name: 'Paneli i djathtë', x: 350, y: 185, width: 45, height: 160, rx: 8 },
  ];

  // Map Korean part names to our inspection data
  const getPartStatus = (partId: string) => {
    const part = inspectionData.find(item => 
      item.type.code === partId || 
      item.type.title.toLowerCase().includes(partId.toLowerCase()) ||
      // Map common Korean terms
      (partId.includes('front') && (item.type.title.includes('앞') || item.type.title.includes('전'))) ||
      (partId.includes('rear') && (item.type.title.includes('뒤') || item.type.title.includes('후'))) ||
      (partId.includes('left') && item.type.title.includes('좌')) ||
      (partId.includes('right') && item.type.title.includes('우')) ||
      (partId.includes('door') && item.type.title.includes('도어')) ||
      (partId.includes('hood') && item.type.title.includes('후드')) ||
      (partId.includes('bumper') && item.type.title.includes('범퍼'))
    );
    return part?.statusTypes || [];
  };

  const getStatusColor = (statuses: Array<{ code: string; title: string }>) => {
    if (statuses.length === 0) return '#10b981'; // Default green for good condition
    
    // Check for different damage types with priority
    const hasExchange = statuses.some(s => s.code === 'X' || s.title.includes('교환') || s.title.includes('exchange'));
    const hasWelding = statuses.some(s => s.code === 'W' || s.title.includes('용접') || s.title.includes('weld'));
    const hasRepair = statuses.some(s => s.code === 'A' || s.title.includes('수리') || s.title.includes('repair'));
    const hasSheetMetal = statuses.some(s => s.code === 'C' || s.title.includes('판금') || s.title.includes('sheet'));
    
    // Red for exchange/replacement - highest priority
    if (hasExchange) return '#dc2626'; // Bright red for critical issues
    // Orange for welding/major repair
    if (hasWelding) return '#ea580c'; // Orange-red for serious repairs
    // Yellow for sheet metal work
    if (hasSheetMetal) return '#d97706'; // Amber for moderate repairs
    // Light orange for general repair
    if (hasRepair) return '#f59e0b'; // Yellow for minor repairs
    
    return '#10b981'; // Green for good condition
  };

  const getStatusText = (statuses: Array<{ code: string; title: string }>) => {
    if (statuses.length === 0) return 'Në rregull';
    
    const hasExchange = statuses.some(s => s.code === 'X' || s.title.includes('교환') || s.title.includes('exchange'));
    const hasWelding = statuses.some(s => s.code === 'W' || s.title.includes('용접') || s.title.includes('weld'));
    const hasRepair = statuses.some(s => s.code === 'A' || s.title.includes('수리') || s.title.includes('repair'));
    const hasSheetMetal = statuses.some(s => s.code === 'C' || s.title.includes('판금') || s.title.includes('sheet'));
    
    if (hasExchange) return 'Nevojitet zëvendësim';
    if (hasWelding) return 'Riparim i madh (saldim)';
    if (hasSheetMetal) return 'Punë limarie';
    if (hasRepair) return 'Riparim i vogël';
    
    return 'Në rregull';
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
    <div className={`w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Diagrami i Inspektimit të Automjetit</h3>
        <p className="text-gray-600">Kliko mbi pjesët e makinës për më shumë detaje</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side - Statistics */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Përmbledhje e Gjendjes</h4>
          
          {/* Overall Status */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              {issueCount.critical > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-red-800">Gjendje Kritike</div>
                    <div className="text-sm text-gray-600">Nevojiten riparime të rëndësishme</div>
                  </div>
                </div>
              ) : issueCount.major > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-orange-800">Nevojiten Riparime</div>
                    <div className="text-sm text-gray-600">Disa probleme të rëndësishme</div>
                  </div>
                </div>
              ) : issueCount.minor > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-yellow-800">Riparime të Vogla</div>
                    <div className="text-sm text-gray-600">Probleme të lehta</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-green-800">Gjendje e Mirë</div>
                    <div className="text-sm text-gray-600">Automjeti në rregull</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{issueCount.good}</div>
                <div className="text-xs text-green-700">Në rregull</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{issueCount.minor}</div>
                <div className="text-xs text-yellow-700">Riparime të vogla</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">{issueCount.major}</div>
                <div className="text-xs text-orange-700">Riparime të mëdha</div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{issueCount.critical}</div>
                <div className="text-xs text-red-700">Kritike</div>
              </CardContent>
            </Card>
          </div>

          {/* Legend */}
          <Card>
            <CardContent className="p-4">
              <h5 className="text-sm font-semibold text-gray-700 mb-3">Legjenda</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Në rregull</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-600">Riparim i vogël</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-sm text-gray-600">Riparim i madh</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-600">Kritike / Zëvendësim</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center - Car Diagram */}
        <div className="lg:col-span-2 flex justify-center">
          <div className="relative">
            <svg 
              width="600" 
              height="500" 
              viewBox="0 0 600 500" 
              className="max-w-full h-auto border border-gray-200 rounded-lg bg-white shadow-inner"
            >
              {/* Car outline */}
              <rect x="200" y="40" width="200" height="420" rx="20" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="5,5"/>
              
              {/* Car parts */}
              {carParts.map((part) => {
                const statuses = getPartStatus(part.id);
                const color = getStatusColor(statuses);
                const isHovered = hoveredPart === part.id;
                const isSelected = selectedPart === part.id;
                
                return (
                  <rect
                    key={part.id}
                    x={part.x}
                    y={part.y}
                    width={part.width}
                    height={part.height}
                    rx={part.rx || 0}
                    fill={color}
                    stroke={isSelected ? "#374151" : isHovered ? "#6b7280" : color}
                    strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                    opacity={isHovered || isSelected ? 0.9 : 0.7}
                    className="cursor-pointer transition-all duration-200 hover:opacity-90"
                    onMouseEnter={() => handlePartHover(part.id)}
                    onMouseLeave={() => handlePartHover(null)}
                    onClick={() => handlePartClick(part.id)}
                  />
                );
              })}
              
              {/* Car center line */}
              <line x1="300" y1="50" x2="300" y2="450" stroke="#d1d5db" strokeWidth="1" strokeDasharray="3,3" opacity="0.5"/>
              
              {/* Direction indicator */}
              <polygon points="300,30 310,50 290,50" fill="#6b7280" opacity="0.6"/>
              <text x="320" y="45" className="text-xs fill-gray-600" fontSize="12">Përpara</text>
            </svg>
            
            {/* Hover tooltip */}
            {hoveredPart && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-10">
                {carParts.find(p => p.id === hoveredPart)?.name}
                <br />
                <span className="text-gray-300">
                  {getStatusText(getPartStatus(hoveredPart))}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected part details */}
      {selectedPart && (
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">
                  {carParts.find(p => p.id === selectedPart)?.name}
                </h5>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getStatusColor(getPartStatus(selectedPart)) }}
                    ></div>
                    <span className="text-sm text-gray-700">
                      {getStatusText(getPartStatus(selectedPart))}
                    </span>
                  </div>
                  {getPartStatus(selectedPart).length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm text-gray-600 mb-1">Detaje:</div>
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
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data message */}
      {inspectionData.length === 0 && (
        <Card className="mt-6 border-gray-200 bg-gray-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">🔍</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">Nuk ka të dhëna inspektimi</h4>
            <p className="text-sm text-gray-500">
              Diagrami do të shfaqë gjendjen e pjesëve kur të disponohen të dhënat e inspektimit.
              <br />
              Ngjyrat e pjesëve do të tregojnë gjendjen: e gjelbër (mirë), e verdhë (riparime të vogla),
              <br />
              portokalli (riparime të mëdha), dhe e kuqe (kritike/zëvendësim).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CarInspectionDiagram;