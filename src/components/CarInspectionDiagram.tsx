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
  // Map part codes to inspection data
  const getPartStatus = (partCode: string) => {
    const part = inspectionData.find(item => 
      item.type.code === partCode || 
      item.type.title.toLowerCase().includes(partCode.toLowerCase())
    );
    return part?.statusTypes || [];
  };

  const getStatusColor = (statuses: Array<{ code: string; title: string }>) => {
    if (statuses.length === 0) return '#10b981'; // Default green
    const hasExchange = statuses.some(s => s.code === 'X');
    const hasWelding = statuses.some(s => s.code === 'W');
    
    if (hasExchange) return '#ef4444'; // Red for exchange
    if (hasWelding) return '#f59e0b'; // Orange for welding/repair
    return '#10b981'; // Green for good
  };

  return (
    <div className={`w-full max-w-2xl mx-auto p-4 bg-card border border-border rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold text-center text-foreground mb-4">Car Inspection Diagram</h3>
      
      {/* Simple Car Diagram */}
      <div className="relative w-full max-w-md mx-auto mb-6">
        <svg viewBox="0 0 400 200" className="w-full h-auto border border-border rounded">
          {/* Car Body */}
          <rect x="50" y="60" width="300" height="80" 
                fill="#f8fafc" 
                stroke="#64748b" strokeWidth="2" rx="10" />
          
          {/* Hood */}
          <rect x="280" y="40" width="60" height="40" 
                fill={getStatusColor(getPartStatus('hood'))} 
                stroke="#475569" strokeWidth="1" rx="5" />
          <text x="310" y="62" textAnchor="middle" fontSize="10" fill="#000">Hood</text>
          
          {/* Front Bumper */}
          <rect x="340" y="70" width="20" height="60" 
                fill={getStatusColor(getPartStatus('front_bumper'))} 
                stroke="#475569" strokeWidth="1" rx="5" />
          <text x="350" y="105" textAnchor="middle" fontSize="8" fill="#000">Front</text>
          
          {/* Rear Bumper */}
          <rect x="40" y="70" width="20" height="60" 
                fill={getStatusColor(getPartStatus('rear_bumper'))} 
                stroke="#475569" strokeWidth="1" rx="5" />
          <text x="50" y="105" textAnchor="middle" fontSize="8" fill="#000">Rear</text>
          
          {/* Left Front Door */}
          <rect x="220" y="50" width="50" height="30" 
                fill={getStatusColor(getPartStatus('P011'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="245" y="67" textAnchor="middle" fontSize="8" fill="#000">L.Front</text>
          
          {/* Right Front Door */}
          <rect x="220" y="120" width="50" height="30" 
                fill={getStatusColor(getPartStatus('P012'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="245" y="137" textAnchor="middle" fontSize="8" fill="#000">R.Front</text>
          
          {/* Left Rear Door */}
          <rect x="130" y="50" width="50" height="30" 
                fill={getStatusColor(getPartStatus('P013'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="155" y="67" textAnchor="middle" fontSize="8" fill="#000">L.Rear</text>
          
          {/* Right Rear Door */}
          <rect x="130" y="120" width="50" height="30" 
                fill={getStatusColor(getPartStatus('P014'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="155" y="137" textAnchor="middle" fontSize="8" fill="#000">R.Rear</text>
          
          {/* Trunk */}
          <rect x="70" y="40" width="60" height="40" 
                fill={getStatusColor(getPartStatus('trunk'))} 
                stroke="#475569" strokeWidth="1" rx="5" />
          <text x="100" y="62" textAnchor="middle" fontSize="10" fill="#000">Trunk</text>
          
          {/* Roof */}
          <rect x="120" y="90" width="160" height="20" 
                fill={getStatusColor(getPartStatus('roof'))} 
                stroke="#475569" strokeWidth="1" rx="3" />
          <text x="200" y="102" textAnchor="middle" fontSize="10" fill="#000">Roof</text>
          
          {/* Wheels */}
          <circle cx="90" cy="160" r="15" fill="#475569" stroke="#334155" strokeWidth="2" />
          <circle cx="310" cy="160" r="15" fill="#475569" stroke="#334155" strokeWidth="2" />
          <circle cx="90" cy="40" r="15" fill="#475569" stroke="#334155" strokeWidth="2" />
          <circle cx="310" cy="40" r="15" fill="#475569" stroke="#334155" strokeWidth="2" />
        </svg>
      </div>

      {/* Legend */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-semibold mb-2 text-foreground">Status Legend</h4>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-xs text-muted-foreground">Normal/Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded" />
            <span className="text-xs text-muted-foreground">Repaired/Welding</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-xs text-muted-foreground">Exchanged/Replaced</span>
          </div>
        </div>
      </div>

      {/* Real Inspection Data */}
      {inspectionData.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Inspection Report</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {inspectionData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-background border border-border rounded text-sm">
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
        <div className="text-center text-muted-foreground text-sm">
          No inspection data available
        </div>
      )}
    </div>
  );
};

export default CarInspectionDiagram;