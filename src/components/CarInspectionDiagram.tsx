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
  // Map Korean part names to our inspection data
  const getPartStatus = (partCode: string) => {
    const part = inspectionData.find(item => 
      item.type.code === partCode || 
      item.type.title.toLowerCase().includes(partCode.toLowerCase())
    );
    return part?.statusTypes || [];
  };

  const getStatusColor = (statuses: Array<{ code: string; title: string }>) => {
    if (statuses.length === 0) return '#e2e8f0'; // Default gray
    const hasExchange = statuses.some(s => s.code === 'X');
    const hasWelding = statuses.some(s => s.code === 'W');
    
    if (hasExchange) return '#ef4444'; // Red for exchange
    if (hasWelding) return '#f59e0b'; // Orange for welding/repair
    return '#10b981'; // Green for good
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 bg-card border border-border rounded-lg ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Front View - 앞(전방) */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center text-foreground">앞 (전방)</h3>
          <div className="relative w-full max-w-md mx-auto">
            <svg viewBox="0 0 300 400" className="w-full h-auto">
              {/* Car Body Outline */}
              <path
                d="M50 80 Q50 60 70 60 L230 60 Q250 60 250 80 L250 320 Q250 340 230 340 L70 340 Q50 340 50 320 Z"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              
              {/* Windshield */}
              <rect x="80" y="80" width="140" height="60" 
                    fill={getStatusColor(getPartStatus('windshield'))} 
                    stroke="#64748b" strokeWidth="1" rx="5" />
              
              {/* Hood */}
              <rect x="90" y="50" width="120" height="30" 
                    fill={getStatusColor(getPartStatus('hood'))} 
                    stroke="#64748b" strokeWidth="1" rx="5" />
              
              {/* Front Bumper */}
              <rect x="70" y="20" width="160" height="30" 
                    fill={getStatusColor(getPartStatus('front_bumper'))} 
                    stroke="#64748b" strokeWidth="1" rx="10" />
              
              {/* Left Front Fender */}
              <rect x="20" y="60" width="30" height="80" 
                    fill={getStatusColor(getPartStatus('P021'))} 
                    stroke="#64748b" strokeWidth="1" rx="5" />
              
              {/* Right Front Fender */}
              <rect x="250" y="60" width="30" height="80" 
                    fill={getStatusColor(getPartStatus('P022'))} 
                    stroke="#64748b" strokeWidth="1" rx="5" />
              
              {/* Left Front Door */}
              <rect x="30" y="150" width="50" height="80" 
                    fill={getStatusColor(getPartStatus('front_door_left'))} 
                    stroke="#64748b" strokeWidth="1" rx="5" />
              
              {/* Right Front Door */}
              <rect x="220" y="150" width="50" height="80" 
                    fill={getStatusColor(getPartStatus('front_door_right'))} 
                    stroke="#64748b" strokeWidth="1" rx="5" />
              
              {/* Left Rear Door */}
              <rect x="30" y="240" width="50" height="80" 
                    fill={getStatusColor(getPartStatus('rear_door_left'))} 
                    stroke="#64748b" strokeWidth="1" rx="5" />
              
              {/* Right Rear Door */}
              <rect x="220" y="240" width="50" height="80" 
                    fill={getStatusColor(getPartStatus('rear_door_right'))} 
                    stroke="#64748b" strokeWidth="1" rx="5" />
              
              {/* Radiator Support */}
              <rect x="120" y="40" width="60" height="20" 
                    fill={getStatusColor(getPartStatus('P051'))} 
                    stroke="#64748b" strokeWidth="1" rx="3" />
              
              {/* Wheels */}
              <circle cx="80" cy="360" r="25" fill="#475569" stroke="#334155" strokeWidth="2" />
              <circle cx="220" cy="360" r="25" fill="#475569" stroke="#334155" strokeWidth="2" />
              <circle cx="80" cy="40" r="25" fill="#475569" stroke="#334155" strokeWidth="2" />
              <circle cx="220" cy="40" r="25" fill="#475569" stroke="#334155" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Rear View - 뒤(후방) */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center text-foreground">뒤 (후방)</h3>
          <div className="relative w-full max-w-md mx-auto">
            <svg viewBox="0 0 300 400" className="w-full h-auto">
              {/* Car Body Outline */}
              <path
                d="M50 80 Q50 60 70 60 L230 60 Q250 60 250 80 L250 320 Q250 340 230 340 L70 340 Q50 340 50 320 Z"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              
              {/* Rear Window */}
              <rect x="80" y="260" width="140" height="60" 
                    fill={getStatusColor(getPartStatus('rear_window'))} 
                    stroke="#64748b" strokeWidth="1" rx="5" />
              
              {/* Trunk */}
              <rect x="90" y="320" width="120" height="30" 
                    fill={getStatusColor(getPartStatus('trunk'))} 
                    stroke="#64748b" strokeWidth="1" rx="5" />
              
              {/* Rear Bumper */}
              <rect x="70" y="350" width="160" height="30" 
                    fill={getStatusColor(getPartStatus('rear_bumper'))} 
                    stroke="#64748b" strokeWidth="1" rx="10" />
              
              {/* Left Quarter Panel */}
              <rect x="20" y="220" width="30" height="80" 
                    fill={getStatusColor(getPartStatus('quarter_panel_left'))} 
                    stroke="#64748b" strokeWidth="1" rx="5" />
              
              {/* Right Quarter Panel */}
              <rect x="250" y="220" width="30" height="80" 
                    fill={getStatusColor(getPartStatus('quarter_panel_right'))} 
                    stroke="#64748b" strokeWidth="1" rx="5" />
              
              {/* Interior view */}
              <rect x="100" y="120" width="100" height="120" 
                    fill="#f1f5f9" 
                    stroke="#cbd5e1" strokeWidth="1" rx="5" />
              
              {/* Seats */}
              <rect x="110" y="140" width="35" height="30" 
                    fill="#64748b" stroke="#475569" strokeWidth="1" rx="5" />
              <rect x="155" y="140" width="35" height="30" 
                    fill="#64748b" stroke="#475569" strokeWidth="1" rx="5" />
              <rect x="110" y="190" width="35" height="30" 
                    fill="#64748b" stroke="#475569" strokeWidth="1" rx="5" />
              <rect x="155" y="190" width="35" height="30" 
                    fill="#64748b" stroke="#475569" strokeWidth="1" rx="5" />
              
              {/* Wheels */}
              <circle cx="80" cy="360" r="25" fill="#475569" stroke="#334155" strokeWidth="2" />
              <circle cx="220" cy="360" r="25" fill="#475569" stroke="#334155" strokeWidth="2" />
              <circle cx="80" cy="40" r="25" fill="#475569" stroke="#334155" strokeWidth="2" />
              <circle cx="220" cy="40" r="25" fill="#475569" stroke="#334155" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-semibold mb-3 text-foreground">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-xs text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded" />
            <span className="text-xs text-muted-foreground">Repair/Welding</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-xs text-muted-foreground">Exchange/Replace</span>
          </div>
        </div>
      </div>

      {/* Inspection Details */}
      {inspectionData.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3 text-foreground">Inspection Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inspectionData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                <span className="text-sm text-foreground">{item.type.title}</span>
                <div className="flex gap-1">
                  {item.statusTypes.map((status, i) => (
                    <Badge 
                      key={i} 
                      variant={status.code === 'X' ? "destructive" : status.code === 'W' ? "secondary" : "outline"}
                      className="text-xs"
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
    </div>
  );
};

export default CarInspectionDiagram;