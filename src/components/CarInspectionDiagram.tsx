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
  // Map part codes to inspection data and check if they need red markers (exchanged parts)
  const getPartStatus = (partCode: string) => {
    const part = inspectionData.find(item => 
      item.type.code === partCode || 
      item.type.title.toLowerCase().includes(partCode.toLowerCase()) ||
      item.type.code.includes(partCode)
    );
    return part?.statusTypes || [];
  };

  const isExchangedPart = (partCode: string) => {
    const statuses = getPartStatus(partCode);
    return statuses.some(s => s.code === 'X'); // X = Exchange/Replace
  };

  const getStatusColor = (statuses: Array<{ code: string; title: string }>) => {
    if (statuses.length === 0) return '#10b981'; // Default green
    const hasExchange = statuses.some(s => s.code === 'X');
    const hasWelding = statuses.some(s => s.code === 'W');
    
    if (hasExchange) return '#ef4444'; // Red for exchange
    if (hasWelding) return '#f59e0b'; // Orange for welding/repair
    return '#10b981'; // Green for good
  };

  // Red marker component
  const RedMarker = ({ x, y, size = 8 }: { x: number; y: number; size?: number }) => (
    <circle cx={x} cy={y} r={size} fill="#ef4444" stroke="#fff" strokeWidth="2" opacity="0.9" />
  );

  return (
    <div className={`w-full max-w-2xl mx-auto p-4 bg-card border border-border rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold text-center text-foreground mb-4">Vehicle Inspection Diagram</h3>
      
      {/* Simple Top-Down Car Diagram */}
      <div className="relative w-full max-w-lg mx-auto mb-6">
        <svg viewBox="0 0 300 400" className="w-full h-auto border border-border rounded">
          {/* Car Body Outline */}
          <path
            d="M75 50 Q75 30 95 30 L205 30 Q225 30 225 50 L225 350 Q225 370 205 370 L95 370 Q75 370 75 350 Z"
            fill="#f8fafc"
            stroke="#64748b"
            strokeWidth="2"
          />
          
          {/* Hood */}
          <rect x="100" y="50" width="100" height="40" 
                fill={getStatusColor(getPartStatus('P051'))} 
                stroke="#475569" strokeWidth="1" rx="5" />
          <text x="150" y="72" textAnchor="middle" fontSize="10" fill="#000">Hood</text>
          {isExchangedPart('P051') && <RedMarker x={150} y={65} />}
          
          {/* Front Bumper */}
          <rect x="85" y="30" width="130" height="20" 
                fill={getStatusColor(getPartStatus('front_bumper'))} 
                stroke="#475569" strokeWidth="1" rx="8" />
          <text x="150" y="42" textAnchor="middle" fontSize="9" fill="#000">Front Bumper</text>
          {isExchangedPart('front_bumper') && <RedMarker x={150} y={40} />}
          
          {/* Windshield */}
          <rect x="90" y="90" width="120" height="30" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="3" />
          <text x="150" y="107" textAnchor="middle" fontSize="9" fill="#000">Windshield</text>
          
          {/* Left Side Parts */}
          <rect x="50" y="100" width="25" height="50" 
                fill={getStatusColor(getPartStatus('P021'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="62" y="128" textAnchor="middle" fontSize="8" fill="#000">L Fender</text>
          {isExchangedPart('P021') && <RedMarker x={62} y={120} />}
          
          <rect x="50" y="150" width="25" height="60" 
                fill={getStatusColor(getPartStatus('P011'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="62" y="183" textAnchor="middle" fontSize="8" fill="#000">L F Door</text>
          {isExchangedPart('P011') && <RedMarker x={62} y={175} />}
          
          <rect x="50" y="210" width="25" height="60" 
                fill={getStatusColor(getPartStatus('P013'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="62" y="243" textAnchor="middle" fontSize="8" fill="#000">L R Door</text>
          {isExchangedPart('P013') && <RedMarker x={62} y={235} />}
          
          <rect x="50" y="270" width="25" height="50" 
                fill={getStatusColor(getPartStatus('P023'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="62" y="298" textAnchor="middle" fontSize="8" fill="#000">L Quarter</text>
          {isExchangedPart('P023') && <RedMarker x={62} y={290} />}
          
          {/* Right Side Parts */}
          <rect x="225" y="100" width="25" height="50" 
                fill={getStatusColor(getPartStatus('P022'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="237" y="128" textAnchor="middle" fontSize="8" fill="#000">R Fender</text>
          {isExchangedPart('P022') && <RedMarker x={237} y={120} />}
          
          <rect x="225" y="150" width="25" height="60" 
                fill={getStatusColor(getPartStatus('P012'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="237" y="183" textAnchor="middle" fontSize="8" fill="#000">R F Door</text>
          {isExchangedPart('P012') && <RedMarker x={237} y={175} />}
          
          <rect x="225" y="210" width="25" height="60" 
                fill={getStatusColor(getPartStatus('P014'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="237" y="243" textAnchor="middle" fontSize="8" fill="#000">R R Door</text>
          {isExchangedPart('P014') && <RedMarker x={237} y={235} />}
          
          <rect x="225" y="270" width="25" height="50" 
                fill={getStatusColor(getPartStatus('P024'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="237" y="298" textAnchor="middle" fontSize="8" fill="#000">R Quarter</text>
          {isExchangedPart('P024') && <RedMarker x={237} y={290} />}
          
          {/* Roof */}
          <rect x="90" y="120" width="120" height="160" 
                fill={getStatusColor(getPartStatus('roof'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="150" y="205" textAnchor="middle" fontSize="10" fill="#000">Roof</text>
          {isExchangedPart('roof') && <RedMarker x={150} y={195} />}
          
          {/* Rear Window */}
          <rect x="90" y="280" width="120" height="30" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="3" />
          <text x="150" y="297" textAnchor="middle" fontSize="9" fill="#000">Rear Window</text>
          
          {/* Trunk */}
          <rect x="100" y="310" width="100" height="40" 
                fill={getStatusColor(getPartStatus('trunk'))} 
                stroke="#475569" strokeWidth="1" rx="5" />
          <text x="150" y="332" textAnchor="middle" fontSize="10" fill="#000">Trunk</text>
          {isExchangedPart('trunk') && <RedMarker x={150} y={325} />}
          
          {/* Rear Bumper */}
          <rect x="85" y="350" width="130" height="20" 
                fill={getStatusColor(getPartStatus('rear_bumper'))} 
                stroke="#475569" strokeWidth="1" rx="8" />
          <text x="150" y="362" textAnchor="middle" fontSize="9" fill="#000">Rear Bumper</text>
          {isExchangedPart('rear_bumper') && <RedMarker x={150} y={360} />}
          
          {/* Wheels */}
          <circle cx="90" cy="130" r="15" fill="#475569" stroke="#334155" strokeWidth="2" />
          <circle cx="210" cy="130" r="15" fill="#475569" stroke="#334155" strokeWidth="2" />
          <circle cx="90" cy="270" r="15" fill="#475569" stroke="#334155" strokeWidth="2" />
          <circle cx="210" cy="270" r="15" fill="#475569" stroke="#334155" strokeWidth="2" />
        </svg>
      </div>

      {/* Legend */}
      <div className="mb-4 p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-semibold mb-3 text-foreground">Legend</h4>
        <div className="flex flex-wrap gap-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full" />
            <span className="text-sm text-muted-foreground">Exchanged/Replaced Parts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded" />
            <span className="text-sm text-muted-foreground">Windows</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-500 rounded" />
            <span className="text-sm text-muted-foreground">Car Body</span>
          </div>
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