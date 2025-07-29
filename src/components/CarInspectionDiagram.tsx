import React from 'react';
import { Badge } from "@/components/ui/badge";

interface InspectionItem {
  type: { code: string; title: string };
  statusTypes: Array<{ code: string; title: string }>;
  attributes: string[];
}

interface CarInspectionDiagramProps {
  inspectionData?: InspectionItem[];
  className?: string;
}

export const CarInspectionDiagram: React.FC<CarInspectionDiagramProps> = ({ 
  inspectionData = [], 
  className = "" 
}) => {
  // Helper functions to determine part status
  const getPartStatus = (partCode: string) => {
    const part = inspectionData.find(item => 
      item.type.code === partCode || 
      item.type.title.toLowerCase().includes(partCode.toLowerCase()) ||
      item.type.code.includes(partCode)
    );
    return part?.statusTypes || [];
  };

  const hasDamage = (partCode: string) => {
    const statuses = getPartStatus(partCode);
    return statuses.length > 0 && statuses.some(s => s.code === 'X' || s.code === 'W');
  };

  const getDamageColor = (partCode: string) => {
    const statuses = getPartStatus(partCode);
    if (statuses.length === 0) return "#e5e7eb"; // Default neutral gray
    
    const hasExchange = statuses.some(s => s.code === 'X');
    const hasWelding = statuses.some(s => s.code === 'W');
    
    if (hasExchange) return "#ef4444"; // Red for exchange/replacement
    if (hasWelding) return "#f59e0b"; // Orange for welding/repair
    return "#e5e7eb"; // Neutral gray for no damage
  };

  const getDamageMarker = (partCode: string, x: number, y: number) => {
    if (!hasDamage(partCode)) return null;
    return <circle cx={x} cy={y} r="6" fill="#dc2626" stroke="#fff" strokeWidth="2" opacity="0.9" />;
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 bg-card border border-border rounded-lg ${className}`}>
      <h3 className="text-xl font-semibold text-center text-foreground mb-6">Vehicle Damage Assessment</h3>
      
      {/* Professional Unfolded Car Diagram */}
      <div className="relative w-full max-w-3xl mx-auto mb-8">
        <svg viewBox="0 0 800 600" className="w-full h-auto border border-border rounded-lg bg-background">
          {/* Grid Lines for Reference */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="800" height="600" fill="url(#grid)" opacity="0.3"/>
          
          {/* FRONT VIEW (Top Center) */}
          <g transform="translate(300, 50)">
            <text x="100" y="-10" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">FRONT VIEW</text>
            
            {/* Front Bumper */}
            <rect x="20" y="20" width="160" height="25" 
                  fill={getDamageColor('P031')} 
                  stroke="#64748b" strokeWidth="1.5" rx="8"/>
            <text x="100" y="35" textAnchor="middle" fontSize="10" fill="#1f2937">Front Bumper</text>
            {getDamageMarker('P031', 100, 32)}
            
            {/* Hood */}
            <rect x="30" y="45" width="140" height="60" 
                  fill={getDamageColor('P051')} 
                  stroke="#64748b" strokeWidth="1.5" rx="5"/>
            <text x="100" y="78" textAnchor="middle" fontSize="11" fill="#1f2937">Hood</text>
            {getDamageMarker('P051', 100, 75)}
            
            {/* Windshield */}
            <rect x="35" y="105" width="130" height="40" 
                  fill="#9ca3af" stroke="#64748b" strokeWidth="1.5" rx="3"/>
            <text x="100" y="128" textAnchor="middle" fontSize="10" fill="#1f2937">Windshield</text>
            
            {/* Left Fender */}
            <rect x="0" y="45" width="30" height="60" 
                  fill={getDamageColor('P021')} 
                  stroke="#64748b" strokeWidth="1.5" rx="3"/>
            <text x="15" y="78" textAnchor="middle" fontSize="9" fill="#1f2937" transform="rotate(-90, 15, 78)">L Fender</text>
            {getDamageMarker('P021', 15, 75)}
            
            {/* Right Fender */}
            <rect x="170" y="45" width="30" height="60" 
                  fill={getDamageColor('P022')} 
                  stroke="#64748b" strokeWidth="1.5" rx="3"/>
            <text x="185" y="78" textAnchor="middle" fontSize="9" fill="#1f2937" transform="rotate(90, 185, 78)">R Fender</text>
            {getDamageMarker('P022', 185, 75)}
            
            {/* Headlights */}
            <ellipse cx="60" cy="35" rx="15" ry="8" fill="#f3f4f6" stroke="#64748b" strokeWidth="1"/>
            <ellipse cx="140" cy="35" rx="15" ry="8" fill="#f3f4f6" stroke="#64748b" strokeWidth="1"/>
          </g>
          
          {/* LEFT SIDE VIEW */}
          <g transform="translate(50, 200)">
            <text x="100" y="-10" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">LEFT SIDE</text>
            
            {/* Left Front Door */}
            <rect x="40" y="20" width="60" height="80" 
                  fill={getDamageColor('P011')} 
                  stroke="#64748b" strokeWidth="1.5" rx="5"/>
            <text x="70" y="63" textAnchor="middle" fontSize="10" fill="#1f2937">Front Door</text>
            {getDamageMarker('P011', 70, 60)}
            
            {/* Left Rear Door */}
            <rect x="100" y="20" width="60" height="80" 
                  fill={getDamageColor('P013')} 
                  stroke="#64748b" strokeWidth="1.5" rx="5"/>
            <text x="130" y="63" textAnchor="middle" fontSize="10" fill="#1f2937">Rear Door</text>
            {getDamageMarker('P013', 130, 60)}
            
            {/* Left Quarter Panel */}
            <rect x="160" y="30" width="40" height="70" 
                  fill={getDamageColor('P023')} 
                  stroke="#64748b" strokeWidth="1.5" rx="5"/>
            <text x="180" y="68" textAnchor="middle" fontSize="9" fill="#1f2937">Quarter</text>
            {getDamageMarker('P023', 180, 65)}
            
            {/* Side Windows */}
            <rect x="45" y="25" width="50" height="20" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="2"/>
            <rect x="105" y="25" width="50" height="20" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="2"/>
            
            {/* Door Handles */}
            <rect x="95" y="55" width="8" height="4" fill="#64748b" rx="2"/>
            <rect x="155" y="55" width="8" height="4" fill="#64748b" rx="2"/>
          </g>
          
          {/* RIGHT SIDE VIEW */}
          <g transform="translate(550, 200)">
            <text x="100" y="-10" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">RIGHT SIDE</text>
            
            {/* Right Front Door */}
            <rect x="40" y="20" width="60" height="80" 
                  fill={getDamageColor('P012')} 
                  stroke="#64748b" strokeWidth="1.5" rx="5"/>
            <text x="70" y="63" textAnchor="middle" fontSize="10" fill="#1f2937">Front Door</text>
            {getDamageMarker('P012', 70, 60)}
            
            {/* Right Rear Door */}
            <rect x="100" y="20" width="60" height="80" 
                  fill={getDamageColor('P014')} 
                  stroke="#64748b" strokeWidth="1.5" rx="5"/>
            <text x="130" y="63" textAnchor="middle" fontSize="10" fill="#1f2937">Rear Door</text>
            {getDamageMarker('P014', 130, 60)}
            
            {/* Right Quarter Panel */}
            <rect x="160" y="30" width="40" height="70" 
                  fill={getDamageColor('P024')} 
                  stroke="#64748b" strokeWidth="1.5" rx="5"/>
            <text x="180" y="68" textAnchor="middle" fontSize="9" fill="#1f2937">Quarter</text>
            {getDamageMarker('P024', 180, 65)}
            
            {/* Side Windows */}
            <rect x="45" y="25" width="50" height="20" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="2"/>
            <rect x="105" y="25" width="50" height="20" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="2"/>
            
            {/* Door Handles */}
            <rect x="95" y="55" width="8" height="4" fill="#64748b" rx="2"/>
            <rect x="155" y="55" width="8" height="4" fill="#64748b" rx="2"/>
          </g>
          
          {/* REAR VIEW (Bottom Center) */}
          <g transform="translate(300, 400)">
            <text x="100" y="-10" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">REAR VIEW</text>
            
            {/* Rear Window */}
            <rect x="35" y="20" width="130" height="40" 
                  fill="#9ca3af" stroke="#64748b" strokeWidth="1.5" rx="3"/>
            <text x="100" y="43" textAnchor="middle" fontSize="10" fill="#1f2937">Rear Window</text>
            
            {/* Trunk */}
            <rect x="30" y="60" width="140" height="60" 
                  fill={getDamageColor('P052')} 
                  stroke="#64748b" strokeWidth="1.5" rx="5"/>
            <text x="100" y="93" textAnchor="middle" fontSize="11" fill="#1f2937">Trunk</text>
            {getDamageMarker('P052', 100, 90)}
            
            {/* Rear Bumper */}
            <rect x="20" y="120" width="160" height="25" 
                  fill={getDamageColor('P032')} 
                  stroke="#64748b" strokeWidth="1.5" rx="8"/>
            <text x="100" y="135" textAnchor="middle" fontSize="10" fill="#1f2937">Rear Bumper</text>
            {getDamageMarker('P032', 100, 132)}
            
            {/* Taillights */}
            <ellipse cx="60" cy="132" rx="15" ry="8" fill="#fef3c7" stroke="#64748b" strokeWidth="1"/>
            <ellipse cx="140" cy="132" rx="15" ry="8" fill="#fef3c7" stroke="#64748b" strokeWidth="1"/>
          </g>
          
          {/* CENTER ROOF VIEW */}
          <g transform="translate(300, 200)">
            <rect x="35" y="20" width="130" height="120" 
                  fill={getDamageColor('P061')} 
                  stroke="#64748b" strokeWidth="1.5" rx="5"/>
            <text x="100" y="83" textAnchor="middle" fontSize="12" fill="#1f2937">Roof</text>
            {getDamageMarker('P061', 100, 80)}
            
            {/* Sunroof (if applicable) */}
            <rect x="60" y="45" width="80" height="30" 
                  fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="3" opacity="0.6"/>
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-semibold mb-3 text-foreground">How to Read This Diagram</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-300 border border-gray-400 rounded" />
              <span className="text-sm text-muted-foreground">Normal Part (No Damage)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-orange-400 border border-gray-400 rounded" />
              <span className="text-sm text-muted-foreground">Repaired/Welded Part</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-red-500 border border-gray-400 rounded" />
              <span className="text-sm text-muted-foreground">Exchanged/Replaced Part</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-400 border border-gray-500 rounded" />
              <span className="text-sm text-muted-foreground">Glass/Windows</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-600 border-2 border-white rounded-full" />
              <span className="text-sm text-muted-foreground">Damage Marker</span>
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground italic">
          Only damaged parts are highlighted. Normal parts remain uncolored.
        </div>
      </div>

      {/* Real Inspection Data */}
      {inspectionData.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Detailed Inspection Report</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {inspectionData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg text-sm">
                <span className="text-foreground font-medium">{item.type.title}</span>
                <div className="flex gap-1">
                  {item.statusTypes.map((status, i) => (
                    <Badge 
                      key={i} 
                      variant={
                        status.code === 'X' ? "destructive" : 
                        status.code === 'W' ? "secondary" : 
                        "outline"
                      }
                      className="text-xs px-2 py-1"
                    >
                      {status.title}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {inspectionData.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-4">
          No inspection data available for this vehicle
        </div>
      )}
    </div>
  );
};

export default CarInspectionDiagram;