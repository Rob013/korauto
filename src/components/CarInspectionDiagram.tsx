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
    
    return '#16a34a'; // Green for good condition
  };

  return (
    <div className={`w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl shadow-lg ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Professional Vehicle Inspection Report</h3>
        <p className="text-slate-600">Detailed damage assessment and replacement history</p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Front View - Professional Car Diagram */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-center text-slate-700 bg-slate-200 py-2 rounded-lg">Front View (전방)</h4>
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-lg shadow-md p-4">
            <svg viewBox="0 0 400 500" className="w-full h-auto">
              {/* Professional Car Body Outline with better proportions */}
              <defs>
                <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
                <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#00000020"/>
                </filter>
              </defs>
              
              {/* Car Body - More realistic proportions */}
              <path
                d="M80 100 Q80 80 100 80 L300 80 Q320 80 320 100 L320 400 Q320 420 300 420 L100 420 Q80 420 80 400 Z"
                fill="url(#carBody)"
                stroke="#64748b"
                strokeWidth="2"
                filter="url(#dropShadow)"
              />
              
              {/* Front Bumper - with damage indication */}
              <rect x="90" y="50" width="220" height="30" 
                    fill={getStatusColor(getPartStatus('P001'))} 
                    stroke="#374151" strokeWidth="2" rx="15"
                    filter="url(#dropShadow)" />
              <text x="200" y="70" textAnchor="middle" className="text-xs font-medium fill-white">Front Bumper</text>
              
              {/* Hood */}
              <rect x="110" y="80" width="180" height="40" 
                    fill={getStatusColor(getPartStatus('P002'))} 
                    stroke="#374151" strokeWidth="2" rx="8"
                    filter="url(#dropShadow)" />
              <text x="200" y="105" textAnchor="middle" className="text-xs font-medium fill-white">Hood</text>
              
              {/* Windshield */}
              <rect x="120" y="120" width="160" height="50" 
                    fill={getStatusColor(getPartStatus('P003'))} 
                    stroke="#374151" strokeWidth="2" rx="8"
                    filter="url(#dropShadow)" />
              <text x="200" y="150" textAnchor="middle" className="text-xs font-medium fill-white">Windshield</text>
              
              {/* Left Front Fender */}
              <rect x="50" y="100" width="30" height="100" 
                    fill={getStatusColor(getPartStatus('P021'))} 
                    stroke="#374151" strokeWidth="2" rx="8"
                    filter="url(#dropShadow)" />
              <text x="65" y="155" textAnchor="middle" className="text-xs font-medium fill-white" transform="rotate(-90 65 155)">L Fender</text>
              
              {/* Right Front Fender */}
              <rect x="320" y="100" width="30" height="100" 
                    fill={getStatusColor(getPartStatus('P022'))} 
                    stroke="#374151" strokeWidth="2" rx="8"
                    filter="url(#dropShadow)" />
              <text x="335" y="155" textAnchor="middle" className="text-xs font-medium fill-white" transform="rotate(90 335 155)">R Fender</text>
              
              {/* Doors with realistic proportions */}
              {/* Left Front Door */}
              <rect x="60" y="170" width="60" height="100" 
                    fill={getStatusColor(getPartStatus('P011'))} 
                    stroke="#374151" strokeWidth="2" rx="8"
                    filter="url(#dropShadow)" />
              <text x="90" y="225" textAnchor="middle" className="text-xs font-medium fill-white">L Front Door</text>
              
              {/* Right Front Door */}
              <rect x="280" y="170" width="60" height="100" 
                    fill={getStatusColor(getPartStatus('P012'))} 
                    stroke="#374151" strokeWidth="2" rx="8"
                    filter="url(#dropShadow)" />
              <text x="310" y="225" textAnchor="middle" className="text-xs font-medium fill-white">R Front Door</text>
              
              {/* Left Rear Door */}
              <rect x="60" y="270" width="60" height="100" 
                    fill={getStatusColor(getPartStatus('P013'))} 
                    stroke="#374151" strokeWidth="2" rx="8"
                    filter="url(#dropShadow)" />
              <text x="90" y="325" textAnchor="middle" className="text-xs font-medium fill-white">L Rear Door</text>
              
              {/* Right Rear Door */}
              <rect x="280" y="270" width="60" height="100" 
                    fill={getStatusColor(getPartStatus('P014'))} 
                    stroke="#374151" strokeWidth="2" rx="8"
                    filter="url(#dropShadow)" />
              <text x="310" y="325" textAnchor="middle" className="text-xs font-medium fill-white">R Rear Door</text>
              
              {/* Trunk/Rear */}
              <rect x="110" y="370" width="180" height="40" 
                    fill={getStatusColor(getPartStatus('P004'))} 
                    stroke="#374151" strokeWidth="2" rx="8"
                    filter="url(#dropShadow)" />
              <text x="200" y="395" textAnchor="middle" className="text-xs font-medium fill-white">Trunk</text>
              
              {/* Rear Bumper */}
              <rect x="90" y="420" width="220" height="30" 
                    fill={getStatusColor(getPartStatus('P005'))} 
                    stroke="#374151" strokeWidth="2" rx="15"
                    filter="url(#dropShadow)" />
              <text x="200" y="440" textAnchor="middle" className="text-xs font-medium fill-white">Rear Bumper</text>
              
              {/* Professional Wheels */}
              <circle cx="120" cy="470" r="20" fill="#1f2937" stroke="#111827" strokeWidth="2" 
                      filter="url(#dropShadow)" />
              <circle cx="280" cy="470" r="20" fill="#1f2937" stroke="#111827" strokeWidth="2" 
                      filter="url(#dropShadow)" />
              <circle cx="120" cy="30" r="20" fill="#1f2937" stroke="#111827" strokeWidth="2" 
                      filter="url(#dropShadow)" />
              <circle cx="280" cy="30" r="20" fill="#1f2937" stroke="#111827" strokeWidth="2" 
                      filter="url(#dropShadow)" />
              
              {/* Professional tire treads */}
              <circle cx="120" cy="470" r="15" fill="none" stroke="#374151" strokeWidth="1" />
              <circle cx="280" cy="470" r="15" fill="none" stroke="#374151" strokeWidth="1" />
              <circle cx="120" cy="30" r="15" fill="none" stroke="#374151" strokeWidth="1" />
              <circle cx="280" cy="30" r="15" fill="none" stroke="#374151" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* Side View - Professional Structural Analysis */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-center text-slate-700 bg-slate-200 py-2 rounded-lg">Side View & Structure (측면)</h4>
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-lg shadow-md p-4">
            <svg viewBox="0 0 500 300" className="w-full h-auto">
              {/* Side car profile */}
              <path
                d="M50 150 Q50 120 80 120 L420 120 Q450 120 450 150 L450 200 Q450 230 420 230 L80 230 Q50 230 50 200 Z"
                fill="url(#carBody)"
                stroke="#64748b"
                strokeWidth="2"
                filter="url(#dropShadow)"
              />
              
              {/* Roof */}
              <rect x="100" y="100" width="300" height="20" 
                    fill={getStatusColor(getPartStatus('P031'))} 
                    stroke="#374151" strokeWidth="2" rx="10"
                    filter="url(#dropShadow)" />
              <text x="250" y="115" textAnchor="middle" className="text-xs font-medium fill-white">Roof</text>
              
              {/* A-Pillar */}
              <rect x="80" y="120" width="20" height="60" 
                    fill={getStatusColor(getPartStatus('P041'))} 
                    stroke="#374151" strokeWidth="2" rx="5"
                    filter="url(#dropShadow)" />
              
              {/* B-Pillar */}
              <rect x="240" y="120" width="20" height="60" 
                    fill={getStatusColor(getPartStatus('P042'))} 
                    stroke="#374151" strokeWidth="2" rx="5"
                    filter="url(#dropShadow)" />
              
              {/* C-Pillar */}
              <rect x="380" y="120" width="20" height="60" 
                    fill={getStatusColor(getPartStatus('P043'))} 
                    stroke="#374151" strokeWidth="2" rx="5"
                    filter="url(#dropShadow)" />
              
              {/* Frame sections */}
              <rect x="60" y="200" width="80" height="30" 
                    fill={getStatusColor(getPartStatus('P051'))} 
                    stroke="#374151" strokeWidth="2" rx="5"
                    filter="url(#dropShadow)" />
              <text x="100" y="220" textAnchor="middle" className="text-xs font-medium fill-white">Front Frame</text>
              
              <rect x="360" y="200" width="80" height="30" 
                    fill={getStatusColor(getPartStatus('P052'))} 
                    stroke="#374151" strokeWidth="2" rx="5"
                    filter="url(#dropShadow)" />
              <text x="400" y="220" textAnchor="middle" className="text-xs font-medium fill-white">Rear Frame</text>
              
              {/* Side panels */}
              <rect x="120" y="140" width="100" height="40" 
                    fill={getStatusColor(getPartStatus('P061'))} 
                    stroke="#374151" strokeWidth="2" rx="5"
                    filter="url(#dropShadow)" />
              
              <rect x="280" y="140" width="100" height="40" 
                    fill={getStatusColor(getPartStatus('P062'))} 
                    stroke="#374151" strokeWidth="2" rx="5"
                    filter="url(#dropShadow)" />
              
              {/* Professional wheels side view */}
              <circle cx="120" cy="250" r="25" fill="#1f2937" stroke="#111827" strokeWidth="2" 
                      filter="url(#dropShadow)" />
              <circle cx="380" cy="250" r="25" fill="#1f2937" stroke="#111827" strokeWidth="2" 
                      filter="url(#dropShadow)" />
              
              {/* Tire details */}
              <circle cx="120" cy="250" r="20" fill="none" stroke="#374151" strokeWidth="2" />
              <circle cx="380" cy="250" r="20" fill="none" stroke="#374151" strokeWidth="2" />
              <circle cx="120" cy="250" r="15" fill="none" stroke="#6b7280" strokeWidth="1" />
              <circle cx="380" cy="250" r="15" fill="none" stroke="#6b7280" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </div>

      {/* Enhanced Professional Legend */}
      <div className="mt-8 p-6 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl border border-slate-300">
        <h4 className="text-lg font-bold mb-4 text-slate-800 text-center">Damage Assessment Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
            <div className="w-6 h-6 bg-green-600 rounded-md shadow-sm" />
            <div>
              <span className="text-sm font-medium text-slate-700">Normal</span>
              <p className="text-xs text-slate-500">No damage</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
            <div className="w-6 h-6 bg-yellow-500 rounded-md shadow-sm" />
            <div>
              <span className="text-sm font-medium text-slate-700">Minor Repair</span>
              <p className="text-xs text-slate-500">Light damage</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
            <div className="w-6 h-6 bg-amber-600 rounded-md shadow-sm" />
            <div>
              <span className="text-sm font-medium text-slate-700">Sheet Metal</span>
              <p className="text-xs text-slate-500">Body work</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
            <div className="w-6 h-6 bg-orange-600 rounded-md shadow-sm" />
            <div>
              <span className="text-sm font-medium text-slate-700">Welding</span>
              <p className="text-xs text-slate-500">Major repair</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
            <div className="w-6 h-6 bg-red-600 rounded-md shadow-sm" />
            <div>
              <span className="text-sm font-medium text-slate-700">Replaced</span>
              <p className="text-xs text-slate-500">New part</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Inspection Details with Professional Layout */}
      {inspectionData.length > 0 && (
        <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200 shadow-lg">
          <h4 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            Detailed Inspection Results
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inspectionData.map((item, index) => {
              const hasExchange = item.statusTypes.some(s => s.code === 'X' || s.title.includes('교환') || s.title.includes('exchange'));
              const hasWelding = item.statusTypes.some(s => s.code === 'W' || s.title.includes('용접') || s.title.includes('weld'));
              const hasRepair = item.statusTypes.some(s => s.code === 'A' || s.title.includes('수리') || s.title.includes('repair'));
              
              return (
                <div key={index} 
                     className={`flex items-center justify-between p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${
                       hasExchange ? 'bg-red-50 border-red-500' : 
                       hasWelding ? 'bg-orange-50 border-orange-500' : 
                       hasRepair ? 'bg-yellow-50 border-yellow-500' : 
                       'bg-green-50 border-green-500'
                     }`}>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-700">{item.type.title}</span>
                    <p className="text-xs text-slate-500 mt-1">Part Code: {item.type.code}</p>
                  </div>
                  <div className="flex gap-2">
                    {item.statusTypes.map((status, i) => (
                      <Badge 
                        key={i} 
                        variant={
                          status.code === 'X' || status.title.includes('교환') ? "destructive" : 
                          status.code === 'W' || status.title.includes('용접') ? "secondary" : 
                          status.code === 'A' || status.title.includes('수리') ? "default" :
                          "outline"
                        }
                        className="text-xs font-medium shadow-sm"
                      >
                        {status.code === 'X' && '🔴 '}{status.code === 'W' && '🟠 '}{status.code === 'A' && '🟡 '}
                        {status.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Professional Summary */}
          <div className="mt-6 p-4 bg-slate-100 rounded-lg">
            <h5 className="text-sm font-semibold text-slate-700 mb-2">Inspection Summary</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {inspectionData.filter(item => 
                    !item.statusTypes.some(s => s.code === 'X' || s.code === 'W' || s.code === 'A')
                  ).length}
                </div>
                <div className="text-xs text-slate-600">Normal Parts</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">
                  {inspectionData.filter(item => 
                    item.statusTypes.some(s => s.code === 'A' || s.title.includes('수리'))
                  ).length}
                </div>
                <div className="text-xs text-slate-600">Repaired</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-lg font-bold text-orange-600">
                  {inspectionData.filter(item => 
                    item.statusTypes.some(s => s.code === 'W' || s.title.includes('용접'))
                  ).length}
                </div>
                <div className="text-xs text-slate-600">Welded</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {inspectionData.filter(item => 
                    item.statusTypes.some(s => s.code === 'X' || s.title.includes('교환'))
                  ).length}
                </div>
                <div className="text-xs text-slate-600">Replaced</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarInspectionDiagram;