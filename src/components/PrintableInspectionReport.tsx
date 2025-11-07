import React from 'react';
import carDiagramTop from '@/assets/car-diagram-top.jpeg';
import carDiagramBottom from '@/assets/car-diagram-bottom.webp';

interface InspectionItem {
  type: { code: string; title: string };
  statusTypes: Array<{ code: string; title: string }>;
  attributes: string[];
  mappedPartId?: string | null;
}

interface CarInfo {
  make?: string;
  model?: string;
  year?: string;
  vin?: string;
  mileage?: string;
}

interface PrintableInspectionReportProps {
  inspectionData?: InspectionItem[];
  carInfo?: CarInfo;
  affectedParts: Array<{
    id: string;
    name: string;
    nameEn: string;
    badgeType: string;
    statuses: Array<{ code: string; title: string }>;
    isReplacement: boolean;
    isRepair: boolean;
    markerPos?: { x: number; y: number };
  }>;
}

export const PrintableInspectionReport: React.FC<PrintableInspectionReportProps> = ({
  inspectionData = [],
  carInfo = {},
  affectedParts = []
}) => {
  const replacements = affectedParts.filter(p => p.isReplacement);
  const repairs = affectedParts.filter(p => p.isRepair);

  return (
    <div className="print-report bg-white text-black p-8 max-w-4xl mx-auto">
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print-report { page-break-after: always; }
          .no-print { display: none !important; }
        }
        .print-section { margin-bottom: 2rem; }
        .print-header { border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 2rem; }
        .print-title { font-size: 1.75rem; font-weight: bold; margin-bottom: 0.5rem; }
        .print-subtitle { font-size: 1rem; color: #666; }
        .car-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .car-info-item { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
        .car-info-label { font-weight: bold; font-size: 0.875rem; color: #666; }
        .car-info-value { font-size: 1rem; margin-top: 0.25rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { padding: 1rem; border: 2px solid #ddd; border-radius: 8px; text-align: center; }
        .stat-card.replacement { border-color: #dc2626; background-color: #fee; }
        .stat-card.repair { border-color: #2563eb; background-color: #eff6ff; }
        .stat-number { font-size: 2rem; font-weight: bold; }
        .stat-label { font-size: 0.875rem; color: #666; margin-top: 0.5rem; }
        .diagram-section { position: relative; margin: 2rem 0; }
        .diagram-container { position: relative; display: inline-block; }
        .diagram-image { width: 100%; height: auto; display: block; }
        .damage-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
        .parts-list { margin-top: 2rem; }
        .parts-category { margin-bottom: 1.5rem; }
        .parts-category-title { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.75rem; padding: 0.5rem; border-radius: 4px; }
        .parts-category-title.replacement { background-color: #fee; color: #dc2626; }
        .parts-category-title.repair { background-color: #eff6ff; color: #2563eb; }
        .parts-items { list-style: none; padding: 0; }
        .parts-item { padding: 0.5rem; border-left: 3px solid #ddd; margin-bottom: 0.5rem; padding-left: 1rem; }
        .parts-item.replacement { border-left-color: #dc2626; }
        .parts-item.repair { border-left-color: #2563eb; }
        .part-name { font-weight: 600; }
        .part-name-en { color: #666; font-size: 0.875rem; margin-left: 0.5rem; }
        .badge-legend { display: flex; gap: 2rem; margin: 1rem 0; padding: 1rem; background: #f9fafb; border-radius: 8px; }
        .badge-legend-item { display: flex; align-items: center; gap: 0.5rem; }
        .badge-sample { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.875rem; }
        .badge-sample.replacement { background-color: #dc2626; color: white; }
        .badge-sample.repair { background-color: #2563eb; color: white; }
      `}</style>

      {/* Header */}
      <div className="print-header">
        <h1 className="print-title">Raport Inspektimi Makine / Car Inspection Report</h1>
        <p className="print-subtitle">Detailed inspection findings and damage assessment</p>
      </div>

      {/* Car Information */}
      {Object.keys(carInfo).length > 0 && (
        <div className="print-section">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Informacion Makine / Vehicle Information
          </h2>
          <div className="car-info-grid">
            {carInfo.make && (
              <div className="car-info-item">
                <div className="car-info-label">Marka / Make</div>
                <div className="car-info-value">{carInfo.make}</div>
              </div>
            )}
            {carInfo.model && (
              <div className="car-info-item">
                <div className="car-info-label">Modeli / Model</div>
                <div className="car-info-value">{carInfo.model}</div>
              </div>
            )}
            {carInfo.year && (
              <div className="car-info-item">
                <div className="car-info-label">Viti / Year</div>
                <div className="car-info-value">{carInfo.year}</div>
              </div>
            )}
            {carInfo.vin && (
              <div className="car-info-item">
                <div className="car-info-label">VIN</div>
                <div className="car-info-value">{carInfo.vin}</div>
              </div>
            )}
            {carInfo.mileage && (
              <div className="car-info-item">
                <div className="car-info-label">Kilometrazha / Mileage</div>
                <div className="car-info-value">{carInfo.mileage}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      <div className="print-section">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Përmbledhje / Summary
        </h2>
        <div className="stats-grid">
          <div className="stat-card replacement">
            <div className="stat-number" style={{ color: '#dc2626' }}>{replacements.length}</div>
            <div className="stat-label">Pjesë të Zëvendësuara (X)<br/>Replaced Parts</div>
          </div>
          <div className="stat-card repair">
            <div className="stat-number" style={{ color: '#2563eb' }}>{repairs.length}</div>
            <div className="stat-label">Pjesë të Ripara (W)<br/>Repaired/Welded Parts</div>
          </div>
        </div>
      </div>

      {/* Badge Legend */}
      <div className="badge-legend">
        <div className="badge-legend-item">
          <div className="badge-sample replacement">X</div>
          <span>교환 / Nderrim (Replacement/Exchange)</span>
        </div>
        <div className="badge-legend-item">
          <div className="badge-sample repair">W</div>
          <span>용접/판금 / Saldim/Riparim (Welding/Repair)</span>
        </div>
      </div>

      {/* Diagram with Damage Overlay - Top View */}
      <div className="print-section">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Diagram Dëmtimi / Damage Diagram - Pamje Sipër / Top View
        </h2>
        <div className="diagram-section">
          <div className="diagram-container">
            <img src={carDiagramTop} alt="Car Diagram Top" className="diagram-image" />
            <svg className="damage-overlay" viewBox="0 0 640 620" preserveAspectRatio="xMidYMid meet">
              {affectedParts.map((part) => {
                if (!part.markerPos) return null;
                const color = part.isReplacement ? '#dc2626' : '#2563eb';
                const badge = part.badgeType;
                
                return (
                  <g key={part.id}>
                    {/* Damage indicator circle */}
                    <circle
                      cx={part.markerPos.x}
                      cy={part.markerPos.y}
                      r="30"
                      fill={color}
                      fillOpacity="0.15"
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    {/* Badge */}
                    <circle
                      cx={part.markerPos.x}
                      cy={part.markerPos.y}
                      r="16"
                      fill={color}
                    />
                    <text
                      x={part.markerPos.x}
                      y={part.markerPos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      {badge}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Diagram - Bottom View */}
      <div className="print-section">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Diagram Dëmtimi / Damage Diagram - Pamje Poshtë / Bottom View
        </h2>
        <div className="diagram-section">
          <div className="diagram-container">
            <img src={carDiagramBottom} alt="Car Diagram Bottom" className="diagram-image" />
            <svg className="damage-overlay" viewBox="0 0 640 620" preserveAspectRatio="xMidYMid meet">
              {affectedParts.map((part) => {
                if (!part.markerPos) return null;
                const color = part.isReplacement ? '#dc2626' : '#2563eb';
                const badge = part.badgeType;
                
                return (
                  <g key={`bottom-${part.id}`}>
                    <circle
                      cx={part.markerPos.x}
                      cy={part.markerPos.y}
                      r="30"
                      fill={color}
                      fillOpacity="0.15"
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    <circle
                      cx={part.markerPos.x}
                      cy={part.markerPos.y}
                      r="16"
                      fill={color}
                    />
                    <text
                      x={part.markerPos.x}
                      y={part.markerPos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      {badge}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Detailed Parts List */}
      <div className="print-section parts-list">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Lista e Pjesëve të Dëmtuara / Affected Parts List
        </h2>

        {/* Replacements */}
        {replacements.length > 0 && (
          <div className="parts-category">
            <div className="parts-category-title replacement">
              ✕ Pjesë të Zëvendësuara / Replaced Parts (교환)
            </div>
            <ul className="parts-items">
              {replacements.map((part) => (
                <li key={`rep-${part.id}`} className="parts-item replacement">
                  <span className="part-name">{part.name}</span>
                  <span className="part-name-en">({part.nameEn})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Repairs */}
        {repairs.length > 0 && (
          <div className="parts-category">
            <div className="parts-category-title repair">
              ⚒ Pjesë të Ripara / Repaired/Welded Parts (용접/판금)
            </div>
            <ul className="parts-items">
              {repairs.map((part) => (
                <li key={`rep-${part.id}`} className="parts-item repair">
                  <span className="part-name">{part.name}</span>
                  <span className="part-name-en">({part.nameEn})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid #ddd', fontSize: '0.875rem', color: '#666' }}>
        <p>Ky raport është gjeneruar automatikisht bazuar në të dhënat e inspektimit.</p>
        <p>This report was automatically generated based on inspection data.</p>
        <p style={{ marginTop: '0.5rem' }}>Data: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};
