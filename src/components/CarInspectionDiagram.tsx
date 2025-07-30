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

  return null;
};

export default CarInspectionDiagram;