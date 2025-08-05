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

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      {/* Simple Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Raporti i Inspektimit</h3>
        <p className="text-gray-600 text-sm">Gjendja e përgjithshme e automjetit</p>
      </div>
      
      {/* Simple Car Icon with Status */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-4">
          <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 7h-3V6a3 3 0 00-3-3h-2a3 3 0 00-3 3v1H5a1 1 0 00-1 1v7a3 3 0 003 3h1a3 3 0 006 0h2a3 3 0 006 0h1a3 3 0 003-3V8a1 1 0 00-1-1zM10 6a1 1 0 011-1h2a1 1 0 011 1v1h-4V6zm-2 10a1 1 0 11-1-1 1 1 0 011 1zm8 0a1 1 0 11-1-1 1 1 0 011 1z"/>
          </svg>
        </div>
        
        {/* Overall Status */}
        <div className="mb-4">
          {issueCount.critical > 0 ? (
            <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Nevojiten riparime të rëndësishme
            </div>
          ) : issueCount.major > 0 ? (
            <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
              Nevojiten riparime
            </div>
          ) : issueCount.minor > 0 ? (
            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Riparime të vogla
            </div>
          ) : (
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Gjendje e mirë
            </div>
          )}
        </div>
      </div>

      {/* Simple Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{issueCount.good}</div>
          <div className="text-sm text-green-700">Në rregull</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{issueCount.minor}</div>
          <div className="text-sm text-yellow-700">Riparime të vogla</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{issueCount.major}</div>
          <div className="text-sm text-orange-700">Riparime të mëdha</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{issueCount.critical}</div>
          <div className="text-sm text-red-700">Kritike</div>
        </div>
      </div>

      {/* Simple Legend */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Legjenda</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Në rregull</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Riparim i vogël</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Riparim i madh</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Kritike</span>
          </div>
        </div>
      </div>

      {/* No data message */}
      {inspectionData.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📋</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Nuk ka të dhëna inspektimi</h4>
          <p className="text-sm text-gray-500">
            Të dhënat e inspektimit nuk janë të disponueshme për këtë automjet.
          </p>
        </div>
      )}
    </div>
  );
};

export default CarInspectionDiagram;