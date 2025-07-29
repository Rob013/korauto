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

  // Red marker component
  const RedMarker = ({ x, y, size = 8 }: { x: number; y: number; size?: number }) => (
    <circle cx={x} cy={y} r={size} fill="#ef4444" stroke="#fff" strokeWidth="2" opacity="0.9" />
  );

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 bg-card border border-border rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold text-center text-foreground mb-6">Vehicle Inspection Diagram</h3>
      
      {/* Four-view layout in quadrants */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        
        {/* FRONT VIEW - Top Left Quadrant */}
        <div className="text-center">
          <h4 className="text-sm font-semibold mb-3 text-foreground">Front (Forward)</h4>
          <div className="relative w-full max-w-sm mx-auto">
            <svg viewBox="0 0 200 160" className="w-full h-auto border border-border rounded">
              {/* Car outline - front view */}
              <path
                d="M40 20 Q40 15 45 15 L155 15 Q160 15 160 20 L160 140 Q160 145 155 145 L45 145 Q40 145 40 140 Z"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
              />
              
              {/* Windshield */}
              <rect x="50" y="25" width="100" height="40" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="3" />
              
              {/* Headlights */}
              <ellipse cx="65" cy="135" rx="12" ry="8" fill="none" stroke="#64748b" strokeWidth="1" />
              <ellipse cx="135" cy="135" rx="12" ry="8" fill="none" stroke="#64748b" strokeWidth="1" />
              
              {/* Front grille */}
              <rect x="80" y="120" width="40" height="15" fill="none" stroke="#64748b" strokeWidth="1" rx="2" />
              
              {/* Hood line */}
              <line x1="60" y1="80" x2="140" y2="80" stroke="#64748b" strokeWidth="1" />
              
              {/* Front bumper */}
              <path d="M50 140 Q100 150 150 140" fill="none" stroke="#64748b" strokeWidth="2" />
              
              {/* Red markers for exchanged parts */}
              {isExchangedPart('P051') && <RedMarker x={100} y={50} />} {/* Hood */}
              {isExchangedPart('front_bumper') && <RedMarker x={100} y={140} />} {/* Front bumper */}
              {isExchangedPart('P021') && <RedMarker x={65} y={100} />} {/* Left front fender */}
              {isExchangedPart('P022') && <RedMarker x={135} y={100} />} {/* Right front fender */}
            </svg>
          </div>
        </div>

        {/* RIGHT VIEW - Top Right Quadrant */}
        <div className="text-center">
          <h4 className="text-sm font-semibold mb-3 text-foreground">Right (Right Side)</h4>
          <div className="relative w-full max-w-sm mx-auto">
            <svg viewBox="0 0 200 120" className="w-full h-auto border border-border rounded">
              {/* Car outline - right side view */}
              <path
                d="M20 80 L30 80 Q40 70 50 65 L60 60 Q70 55 80 55 L120 55 Q130 55 140 60 L150 65 Q160 70 170 80 L180 80 Q180 85 175 90 L25 90 Q20 85 20 80 Z"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
              />
              
              {/* Windows */}
              <rect x="55" y="35" width="30" height="20" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="2" />
              <rect x="90" y="35" width="30" height="20" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="2" />
              <rect x="125" y="35" width="30" height="20" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="2" />
              
              {/* Doors */}
              <line x1="85" y1="55" x2="85" y2="85" stroke="#64748b" strokeWidth="1" />
              <line x1="120" y1="55" x2="120" y2="85" stroke="#64748b" strokeWidth="1" />
              
              {/* Door handles */}
              <circle cx="80" cy="70" r="2" fill="none" stroke="#64748b" strokeWidth="1" />
              <circle cx="115" cy="70" r="2" fill="none" stroke="#64748b" strokeWidth="1" />
              <circle cx="150" cy="70" r="2" fill="none" stroke="#64748b" strokeWidth="1" />
              
              {/* Wheels */}
              <circle cx="45" cy="95" r="12" fill="none" stroke="#64748b" strokeWidth="2" />
              <circle cx="155" cy="95" r="12" fill="none" stroke="#64748b" strokeWidth="2" />
              
              {/* Red markers for exchanged parts */}
              {isExchangedPart('P012') && <RedMarker x={70} y={70} />} {/* Right front door */}
              {isExchangedPart('P014') && <RedMarker x={105} y={70} />} {/* Right rear door */}
              {isExchangedPart('P024') && <RedMarker x={140} y={70} />} {/* Right quarter panel */}
            </svg>
          </div>
        </div>

        {/* LEFT VIEW - Bottom Left Quadrant */}
        <div className="text-center">
          <h4 className="text-sm font-semibold mb-3 text-foreground">Left (Left Side)</h4>
          <div className="relative w-full max-w-sm mx-auto">
            <svg viewBox="0 0 200 120" className="w-full h-auto border border-border rounded">
              {/* Car outline - left side view (mirrored) */}
              <path
                d="M180 80 L170 80 Q160 70 150 65 L140 60 Q130 55 120 55 L80 55 Q70 55 60 60 L50 65 Q40 70 30 80 L20 80 Q20 85 25 90 L175 90 Q180 85 180 80 Z"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
              />
              
              {/* Windows */}
              <rect x="45" y="35" width="30" height="20" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="2" />
              <rect x="80" y="35" width="30" height="20" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="2" />
              <rect x="115" y="35" width="30" height="20" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="2" />
              
              {/* Doors */}
              <line x1="115" y1="55" x2="115" y2="85" stroke="#64748b" strokeWidth="1" />
              <line x1="80" y1="55" x2="80" y2="85" stroke="#64748b" strokeWidth="1" />
              
              {/* Door handles */}
              <circle cx="120" cy="70" r="2" fill="none" stroke="#64748b" strokeWidth="1" />
              <circle cx="85" cy="70" r="2" fill="none" stroke="#64748b" strokeWidth="1" />
              <circle cx="50" cy="70" r="2" fill="none" stroke="#64748b" strokeWidth="1" />
              
              {/* Wheels */}
              <circle cx="155" cy="95" r="12" fill="none" stroke="#64748b" strokeWidth="2" />
              <circle cx="45" cy="95" r="12" fill="none" stroke="#64748b" strokeWidth="2" />
              
              {/* Red markers for exchanged parts */}
              {isExchangedPart('P011') && <RedMarker x={130} y={70} />} {/* Left front door */}
              {isExchangedPart('P013') && <RedMarker x={95} y={70} />} {/* Left rear door */}
              {isExchangedPart('P023') && <RedMarker x={60} y={70} />} {/* Left quarter panel */}
            </svg>
          </div>
        </div>

        {/* REAR VIEW - Bottom Right Quadrant */}
        <div className="text-center">
          <h4 className="text-sm font-semibold mb-3 text-foreground">Rear (Backward)</h4>
          <div className="relative w-full max-w-sm mx-auto">
            <svg viewBox="0 0 200 160" className="w-full h-auto border border-border rounded">
              {/* Car outline - rear view */}
              <path
                d="M40 20 Q40 15 45 15 L155 15 Q160 15 160 20 L160 140 Q160 145 155 145 L45 145 Q40 145 40 140 Z"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
              />
              
              {/* Rear window */}
              <rect x="50" y="25" width="100" height="40" fill="#9ca3af" stroke="#64748b" strokeWidth="1" rx="3" />
              
              {/* Taillights */}
              <ellipse cx="65" cy="135" rx="12" ry="8" fill="none" stroke="#64748b" strokeWidth="1" />
              <ellipse cx="135" cy="135" rx="12" ry="8" fill="none" stroke="#64748b" strokeWidth="1" />
              
              {/* License plate area */}
              <rect x="85" y="120" width="30" height="12" fill="none" stroke="#64748b" strokeWidth="1" rx="1" />
              
              {/* Trunk line */}
              <line x1="60" y1="80" x2="140" y2="80" stroke="#64748b" strokeWidth="1" />
              
              {/* Rear bumper */}
              <path d="M50 140 Q100 150 150 140" fill="none" stroke="#64748b" strokeWidth="2" />
              
              {/* Red markers for exchanged parts */}
              {isExchangedPart('trunk') && <RedMarker x={100} y={50} />} {/* Trunk */}
              {isExchangedPart('rear_bumper') && <RedMarker x={100} y={140} />} {/* Rear bumper */}
              {isExchangedPart('P043') && <RedMarker x={65} y={100} />} {/* Left rear quarter */}
              {isExchangedPart('P044') && <RedMarker x={135} y={100} />} {/* Right rear quarter */}
            </svg>
          </div>
        </div>
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