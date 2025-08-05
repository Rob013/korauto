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

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 bg-white border border-gray-200 rounded-xl shadow-lg ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Diagrami i Inspektimit të Automjetit</h3>
        <p className="text-gray-600 text-sm">Pamje e detajuar e gjendjes së makinës - Shiko të gjitha pikat e inspektimit</p>
      </div>
      
      {/* Clean and Modern Car Diagram */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <svg viewBox="0 0 500 300" className="w-full h-auto max-h-72">
          {/* Clean Car Outline - Top View */}
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#00000020"/>
            </filter>
          </defs>
          
          {/* Main Car Body - Clean Simple Outline */}
          <rect x="120" y="50" width="260" height="120" 
                fill="#fff" 
                stroke="#bbb" strokeWidth="2" rx="20"
                filter="url(#shadow)" />
          
          {/* Front Section */}
          <g>
            {/* Front Bumper */}
            <rect x="100" y="75" width="20" height="70" 
                  fill={getStatusColor(getPartStatus('front_bumper'))} 
                  stroke="#999" strokeWidth="1" rx="10" />
            <text x="110" y="115" textAnchor="middle" fontSize="8" fill="#333" fontWeight="500">
              Përpara
            </text>
            
            {/* Hood */}
            <rect x="120" y="50" width="80" height="30" 
                  fill={getStatusColor(getPartStatus('hood'))} 
                  stroke="#999" strokeWidth="1" rx="8" />
            <text x="160" y="68" textAnchor="middle" fontSize="8" fill="#333" fontWeight="500">
              Kapak
            </text>
          </g>

          {/* Left Side */}
          <g>
            {/* Left Front Door */}
            <rect x="120" y="80" width="60" height="40" 
                  fill={getStatusColor(getPartStatus('left_front_door'))} 
                  stroke="#999" strokeWidth="1" rx="5" />
            <text x="150" y="103" textAnchor="middle" fontSize="7" fill="#333" fontWeight="500">
              Majtas P.
            </text>
            
            {/* Left Rear Door */}
            <rect x="180" y="80" width="60" height="40" 
                  fill={getStatusColor(getPartStatus('left_rear_door'))} 
                  stroke="#999" strokeWidth="1" rx="5" />
            <text x="210" y="103" textAnchor="middle" fontSize="7" fill="#333" fontWeight="500">
              Majtas M.
            </text>
          </g>

          {/* Center/Roof */}
          <rect x="140" y="30" width="220" height="20" 
                fill={getStatusColor(getPartStatus('roof'))} 
                stroke="#999" strokeWidth="1" rx="10" />
          <text x="250" y="43" textAnchor="middle" fontSize="8" fill="#333" fontWeight="500">
            Çati
          </text>

          {/* Right Side */}
          <g>
            {/* Right Front Door */}
            <rect x="120" y="180" width="60" height="40" 
                  fill={getStatusColor(getPartStatus('right_front_door'))} 
                  stroke="#999" strokeWidth="1" rx="5" />
            <text x="150" y="203" textAnchor="middle" fontSize="7" fill="#333" fontWeight="500">
              Djathtas P.
            </text>
            
            {/* Right Rear Door */}
            <rect x="180" y="180" width="60" height="40" 
                  fill={getStatusColor(getPartStatus('right_rear_door'))} 
                  stroke="#999" strokeWidth="1" rx="5" />
            <text x="210" y="203" textAnchor="middle" fontSize="7" fill="#333" fontWeight="500">
              Djathtas M.
            </text>
          </g>

          {/* Rear Section */}
          <g>
            {/* Trunk */}
            <rect x="320" y="50" width="60" height="30" 
                  fill={getStatusColor(getPartStatus('trunk'))} 
                  stroke="#999" strokeWidth="1" rx="8" />
            <text x="350" y="68" textAnchor="middle" fontSize="8" fill="#333" fontWeight="500">
              Bagazh
            </text>
            
            {/* Rear Bumper */}
            <rect x="380" y="75" width="20" height="70" 
                  fill={getStatusColor(getPartStatus('rear_bumper'))} 
                  stroke="#999" strokeWidth="1" rx="10" />
            <text x="390" y="115" textAnchor="middle" fontSize="8" fill="#333" fontWeight="500">
              Prapa
            </text>
          </g>

          {/* Damage/Inspection Indicators */}
          {inspectionData.map((item, index) => {
            const hasIssue = item.statusTypes.some(s => 
              s.code === 'X' || s.code === 'W' || s.code === 'A' || 
              s.title.includes('교환') || s.title.includes('용접') || s.title.includes('수리')
            );
            
            if (!hasIssue) return null;
            
            // Position indicators based on part names
            let x = 250, y = 150; // default center
            const partName = item.type.title.toLowerCase();
            
            if (partName.includes('front') || partName.includes('앞')) {
              x = 110; y = hasIssue ? 110 : 150;
            } else if (partName.includes('rear') || partName.includes('뒤')) {
              x = 390; y = hasIssue ? 110 : 150;
            } else if (partName.includes('left') || partName.includes('좌')) {
              x = 150; y = 100;
            } else if (partName.includes('right') || partName.includes('우')) {
              x = 150; y = 200;
            } else if (partName.includes('hood') || partName.includes('후드')) {
              x = 160; y = 60;
            } else if (partName.includes('roof') || partName.includes('루프')) {
              x = 250; y = 40;
            }
            
            return (
              <g key={index}>
                {/* Red X for damage/inspection points */}
                <circle cx={x} cy={y} r="12" fill="#dc2626" stroke="#fff" strokeWidth="2" />
                <text x={x} y={y+2} textAnchor="middle" fontSize="14" fill="#fff" fontWeight="bold">
                  ✕
                </text>
              </g>
            );
          })}

          {/* Simple Wheels */}
          <circle cx="160" cy="250" r="15" fill="#333" stroke="#666" strokeWidth="2" />
          <circle cx="340" cy="250" r="15" fill="#333" stroke="#666" strokeWidth="2" />
        </svg>
      </div>

      {/* Modern and Clean Legend */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
        <h4 className="text-lg font-bold mb-4 text-gray-900 text-center">Legjenda e Gjendjes së Makinës</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border">
            <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-green-600" />
            <span className="text-sm font-medium text-gray-700">Në rregull</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border">
            <div className="w-5 h-5 bg-yellow-500 rounded-full border-2 border-yellow-600" />
            <span className="text-sm font-medium text-gray-700">Riparim</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border">
            <div className="w-5 h-5 bg-amber-600 rounded-full border-2 border-amber-700" />
            <span className="text-sm font-medium text-gray-700">Limari</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border">
            <div className="w-5 h-5 bg-orange-600 rounded-full border-2 border-orange-700" />
            <span className="text-sm font-medium text-gray-700">Saldim</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border">
            <div className="w-5 h-5 bg-red-600 rounded-full border-2 border-red-700" />
            <span className="text-sm font-medium text-gray-700">Ndërruar</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">✕</span>
            </div>
            <span className="text-sm font-medium">Tregon pikat me probleme ose që duhen inspektuar</span>
          </div>
        </div>
      </div>

      {/* Detailed Inspection Results - Modern Design */}
      {inspectionData.length > 0 && (
        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">📋</span>
            </div>
            Detajet e Inspektimit
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inspectionData.slice(0, 8).map((item, index) => {
              const hasExchange = item.statusTypes.some(s => s.code === 'X' || s.title.includes('교환') || s.title.includes('exchange'));
              const hasWelding = item.statusTypes.some(s => s.code === 'W' || s.title.includes('용접') || s.title.includes('weld'));
              const hasRepair = item.statusTypes.some(s => s.code === 'A' || s.title.includes('수리') || s.title.includes('repair'));
              
              return (
                <div key={index} 
                     className={`flex items-center justify-between p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${
                       hasExchange ? 'bg-red-50 border-red-500 hover:bg-red-100' : 
                       hasWelding ? 'bg-orange-50 border-orange-500 hover:bg-orange-100' : 
                       hasRepair ? 'bg-yellow-50 border-yellow-500 hover:bg-yellow-100' : 
                       'bg-green-50 border-green-500 hover:bg-green-100'
                     }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      hasExchange ? 'bg-red-500' : 
                      hasWelding ? 'bg-orange-500' : 
                      hasRepair ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-800">{item.type.title}</span>
                  </div>
                  <div className="flex gap-2">
                    {item.statusTypes.slice(0, 2).map((status, i) => (
                      <Badge 
                        key={i} 
                        variant={
                          status.code === 'X' || status.title.includes('교환') ? "destructive" : 
                          status.code === 'W' || status.title.includes('용접') ? "secondary" : 
                          status.code === 'A' || status.title.includes('수리') ? "default" :
                          "outline"
                        }
                        className="text-xs px-2 py-1"
                      >
                        {status.code === 'X' && '⚠️'}{status.code === 'W' && '🔧'}{status.code === 'A' && '🛠️'}
                        {status.code}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Summary Stats */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">Përmbledhje e Gjendjes</h5>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-xl font-bold text-green-600">
                  {inspectionData.filter(item => 
                    !item.statusTypes.some(s => s.code === 'X' || s.code === 'W' || s.code === 'A')
                  ).length}
                </div>
                <div className="text-xs text-gray-600 mt-1">Në rregull</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-xl font-bold text-yellow-600">
                  {inspectionData.filter(item => 
                    item.statusTypes.some(s => s.code === 'A' || s.title.includes('수리'))
                  ).length}
                </div>
                <div className="text-xs text-gray-600 mt-1">Riparuar</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-xl font-bold text-orange-600">
                  {inspectionData.filter(item => 
                    item.statusTypes.some(s => s.code === 'W' || s.title.includes('용접'))
                  ).length}
                </div>
                <div className="text-xs text-gray-600 mt-1">Salduar</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-xl font-bold text-red-600">
                  {inspectionData.filter(item => 
                    item.statusTypes.some(s => s.code === 'X' || s.title.includes('교환'))
                  ).length}
                </div>
                <div className="text-xs text-gray-600 mt-1">Ndërruar</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If no inspection data, show a clean informational message */}
      {inspectionData.length === 0 && (
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 text-xl">ℹ️</span>
            </div>
            <h4 className="text-lg font-semibold text-blue-900 mb-2">Informacione të Inspektimit</h4>
            <p className="text-sm text-blue-700">
              Të dhënat e detajuara të inspektimit nuk janë të disponueshme për këtë makinë. 
              Kontaktoni për më shumë informacion ose kërkoni inspektim të ri.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarInspectionDiagram;