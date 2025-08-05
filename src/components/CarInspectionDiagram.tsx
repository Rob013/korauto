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
    <div className={`w-full max-w-4xl mx-auto p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl shadow-lg ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-slate-800 mb-1">🚗 Raporti i Gjendjes së Makinës</h3>
        <p className="text-slate-600 text-sm">Diagrama e detajuar e inspektimit profesional</p>
      </div>
      
      {/* Simple and Clear Car Diagram */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <svg viewBox="0 0 600 400" className="w-full h-auto max-h-80">
          {/* Professional Car Body with better proportions */}
          <defs>
            <linearGradient id="carBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <filter id="carShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="#00000025"/>
            </filter>
          </defs>
          
          {/* Main Car Body */}
          <rect x="100" y="100" width="400" height="200" 
                fill="url(#carBodyGradient)" 
                stroke="#64748b" strokeWidth="3" rx="20"
                filter="url(#carShadow)" />
          
          {/* Front Section */}
          <g>
            {/* Front Bumper */}
            <rect x="70" y="140" width="30" height="120" 
                  fill={getStatusColor(getPartStatus('front_bumper'))} 
                  stroke="#374151" strokeWidth="2" rx="15"
                  filter="url(#carShadow)" />
            <text x="85" y="205" textAnchor="middle" className="text-xs font-medium fill-white">Front</text>
            
            {/* Hood */}
            <rect x="100" y="100" width="100" height="50" 
                  fill={getStatusColor(getPartStatus('hood'))} 
                  stroke="#374151" strokeWidth="2" rx="10"
                  filter="url(#carShadow)" />
            <text x="150" y="130" textAnchor="middle" className="text-xs font-medium fill-white">Hood</text>
            
            {/* Windshield */}
            <rect x="120" y="120" width="80" height="40" 
                  fill={getStatusColor(getPartStatus('windshield'))} 
                  stroke="#374151" strokeWidth="2" rx="8"
                  filter="url(#carShadow)" />
            <text x="160" y="145" textAnchor="middle" className="text-xs font-medium fill-white">Glass</text>
          </g>

          {/* Left Side */}
          <g>
            {/* Left Front Fender */}
            <rect x="80" y="120" width="20" height="60" 
                  fill={getStatusColor(getPartStatus('left_front_fender'))} 
                  stroke="#374151" strokeWidth="2" rx="8"
                  filter="url(#carShadow)" />
            
            {/* Left Front Door */}
            <rect x="100" y="150" width="80" height="80" 
                  fill={getStatusColor(getPartStatus('left_front_door'))} 
                  stroke="#374151" strokeWidth="2" rx="8"
                  filter="url(#carShadow)" />
            <text x="140" y="195" textAnchor="middle" className="text-xs font-medium fill-white">L Front</text>
            
            {/* Left Rear Door */}
            <rect x="180" y="150" width="80" height="80" 
                  fill={getStatusColor(getPartStatus('left_rear_door'))} 
                  stroke="#374151" strokeWidth="2" rx="8"
                  filter="url(#carShadow)" />
            <text x="220" y="195" textAnchor="middle" className="text-xs font-medium fill-white">L Rear</text>
          </g>

          {/* Center/Roof */}
          <rect x="120" y="80" width="280" height="20" 
                fill={getStatusColor(getPartStatus('roof'))} 
                stroke="#374151" strokeWidth="2" rx="10"
                filter="url(#carShadow)" />
          <text x="260" y="95" textAnchor="middle" className="text-xs font-medium fill-white">Roof</text>

          {/* Right Side */}
          <g>
            {/* Right Front Door */}
            <rect x="340" y="150" width="80" height="80" 
                  fill={getStatusColor(getPartStatus('right_front_door'))} 
                  stroke="#374151" strokeWidth="2" rx="8"
                  filter="url(#carShadow)" />
            <text x="380" y="195" textAnchor="middle" className="text-xs font-medium fill-white">R Front</text>
            
            {/* Right Rear Door */}
            <rect x="420" y="150" width="80" height="80" 
                  fill={getStatusColor(getPartStatus('right_rear_door'))} 
                  stroke="#374151" strokeWidth="2" rx="8"
                  filter="url(#carShadow)" />
            <text x="460" y="195" textAnchor="middle" className="text-xs font-medium fill-white">R Rear</text>
            
            {/* Right Front Fender */}
            <rect x="500" y="120" width="20" height="60" 
                  fill={getStatusColor(getPartStatus('right_front_fender'))} 
                  stroke="#374151" strokeWidth="2" rx="8"
                  filter="url(#carShadow)" />
          </g>

          {/* Rear Section */}
          <g>
            {/* Trunk */}
            <rect x="400" y="100" width="100" height="50" 
                  fill={getStatusColor(getPartStatus('trunk'))} 
                  stroke="#374151" strokeWidth="2" rx="10"
                  filter="url(#carShadow)" />
            <text x="450" y="130" textAnchor="middle" className="text-xs font-medium fill-white">Trunk</text>
            
            {/* Rear Bumper */}
            <rect x="500" y="140" width="30" height="120" 
                  fill={getStatusColor(getPartStatus('rear_bumper'))} 
                  stroke="#374151" strokeWidth="2" rx="15"
                  filter="url(#carShadow)" />
            <text x="515" y="205" textAnchor="middle" className="text-xs font-medium fill-white">Rear</text>
          </g>

          {/* Wheels - More realistic */}
          <circle cx="150" cy="320" r="30" fill="#1f2937" stroke="#111827" strokeWidth="3" 
                  filter="url(#carShadow)" />
          <circle cx="450" cy="320" r="30" fill="#1f2937" stroke="#111827" strokeWidth="3" 
                  filter="url(#carShadow)" />
          
          {/* Tire details */}
          <circle cx="150" cy="320" r="25" fill="none" stroke="#374151" strokeWidth="2" />
          <circle cx="450" cy="320" r="25" fill="none" stroke="#374151" strokeWidth="2" />
          <circle cx="150" cy="320" r="20" fill="none" stroke="#6b7280" strokeWidth="1" />
          <circle cx="450" cy="320" r="20" fill="none" stroke="#6b7280" strokeWidth="1" />
        </svg>
      </div>

      {/* Enhanced Professional Legend - Simplified */}
      <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg border border-slate-300 mb-4">
        <h4 className="text-base font-bold mb-3 text-slate-800 text-center">🔍 Legjenda e Gjendjes</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="flex items-center gap-2 p-2 bg-white rounded-md shadow-sm">
            <div className="w-4 h-4 bg-green-500 rounded border" />
            <span className="text-xs font-medium text-slate-700">✅ Mirë</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded-md shadow-sm">
            <div className="w-4 h-4 bg-yellow-500 rounded border" />
            <span className="text-xs font-medium text-slate-700">🔧 Riparim</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded-md shadow-sm">
            <div className="w-4 h-4 bg-amber-600 rounded border" />
            <span className="text-xs font-medium text-slate-700">🔨 Limari</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded-md shadow-sm">
            <div className="w-4 h-4 bg-orange-600 rounded border" />
            <span className="text-xs font-medium text-slate-700">⚡ Saldim</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded-md shadow-sm">
            <div className="w-4 h-4 bg-red-600 rounded border" />
            <span className="text-xs font-medium text-slate-700">🔄 Ndërruar</span>
          </div>
        </div>
      </div>

      {/* Detailed Inspection Results - Simplified */}
      {inspectionData.length > 0 && (
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
          <h4 className="text-base font-bold mb-3 text-slate-800 flex items-center gap-2">
            📋 Detajet e Inspektimit
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {inspectionData.slice(0, 8).map((item, index) => {
              const hasExchange = item.statusTypes.some(s => s.code === 'X' || s.title.includes('교환') || s.title.includes('exchange'));
              const hasWelding = item.statusTypes.some(s => s.code === 'W' || s.title.includes('용접') || s.title.includes('weld'));
              const hasRepair = item.statusTypes.some(s => s.code === 'A' || s.title.includes('수리') || s.title.includes('repair'));
              
              return (
                <div key={index} 
                     className={`flex items-center justify-between p-2 rounded border-l-4 transition-all ${
                       hasExchange ? 'bg-red-50 border-red-500' : 
                       hasWelding ? 'bg-orange-50 border-orange-500' : 
                       hasRepair ? 'bg-yellow-50 border-yellow-500' : 
                       'bg-green-50 border-green-500'
                     }`}>
                  <span className="text-xs font-medium text-slate-700 truncate">{item.type.title}</span>
                  <div className="flex gap-1">
                    {item.statusTypes.slice(0, 2).map((status, i) => (
                      <Badge 
                        key={i} 
                        variant={
                          status.code === 'X' || status.title.includes('교환') ? "destructive" : 
                          status.code === 'W' || status.title.includes('용접') ? "secondary" : 
                          status.code === 'A' || status.title.includes('수리') ? "default" :
                          "outline"
                        }
                        className="text-xs px-1 py-0"
                      >
                        {status.code === 'X' && '🔴'}{status.code === 'W' && '🟠'}{status.code === 'A' && '🟡'}
                        {status.code}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Quick Summary */}
          <div className="mt-3 p-3 bg-slate-50 rounded-md">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2 rounded">
                <div className="text-sm font-bold text-green-600">
                  {inspectionData.filter(item => 
                    !item.statusTypes.some(s => s.code === 'X' || s.code === 'W' || s.code === 'A')
                  ).length}
                </div>
                <div className="text-xs text-slate-600">Normal</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-sm font-bold text-yellow-600">
                  {inspectionData.filter(item => 
                    item.statusTypes.some(s => s.code === 'A' || s.title.includes('수리'))
                  ).length}
                </div>
                <div className="text-xs text-slate-600">Riparuar</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-sm font-bold text-orange-600">
                  {inspectionData.filter(item => 
                    item.statusTypes.some(s => s.code === 'W' || s.title.includes('용접'))
                  ).length}
                </div>
                <div className="text-xs text-slate-600">Salduar</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-sm font-bold text-red-600">
                  {inspectionData.filter(item => 
                    item.statusTypes.some(s => s.code === 'X' || s.title.includes('교환'))
                  ).length}
                </div>
                <div className="text-xs text-slate-600">Ndërruar</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If no inspection data, show a simple default diagram */}
      {inspectionData.length === 0 && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <h4 className="text-sm font-medium text-blue-800 mb-2">ℹ️ Informacion i Inspektimit</h4>
            <p className="text-xs text-blue-600">
              Të dhënat e detajuara të inspektimit nuk janë të disponueshme për këtë makinë. 
              Kontaktoni për më shumë informacion.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarInspectionDiagram;